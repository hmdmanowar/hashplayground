import { randomBytes, createHash } from 'node:crypto'
import type { User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { hashPassword, verifyPasswordHash } from '../../lib/password.js'
import { createSession, revokeAllSessionsForUser } from '../../lib/session.js'
import { sendPasswordResetEmail } from '../../lib/email.js'
import type { GoogleProfile } from '../../lib/googleOAuth.js'
import type { GithubProfile } from '../../lib/githubOAuth.js'
import type { LinkedInProfile } from '../../lib/linkedinOAuth.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { env } from '../../env.js'

export interface AuthUserDto {
  username: string
  role: 'admin' | 'user'
  name?: string
  email?: string
  phone?: string
  joinedAt: string
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function toAuthUser(user: Pick<User, 'username' | 'role' | 'name' | 'email' | 'phone' | 'joinedAt'>): AuthUserDto {
  return {
    username: user.username,
    role: user.role,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    joinedAt: user.joinedAt.toISOString(),
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function signup(
  username: string,
  password: string,
): Promise<{ user: AuthUserDto; token: string; expiresAt: Date }> {
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) throw new ApiError(409, 'Username is already taken')

  const passwordHash = await hashPassword(password)
  // Role is always forced to 'user' here — never trusted from the request body.
  const user = await prisma.user.create({ data: { username, passwordHash, role: 'user' } })
  const { token, expiresAt } = await createSession(username)
  return { user: toAuthUser(user), token, expiresAt }
}

// `identifier` may be either a username or a phone number — login accepts
// either, checked against the same password.
export async function login(
  identifier: string,
  password: string,
): Promise<{ user: AuthUserDto; token: string; expiresAt: Date }> {
  const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { phone: identifier }] } })
  if (!user) throw new ApiError(401, 'Invalid username or password')

  // A Google-only account (never set a password) has no hash to check against.
  if (!user.passwordHash) throw new ApiError(401, 'Invalid username or password')

  const valid = await verifyPasswordHash(password, user.passwordHash)
  if (!valid) throw new ApiError(401, 'Invalid username or password')

  if (user.blocked) throw new ApiError(403, 'This account has been blocked', 'blocked')

  const { token, expiresAt } = await createSession(user.username)
  return { user: toAuthUser(user), token, expiresAt }
}

export async function getAuthUser(username: string): Promise<AuthUserDto> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new ApiError(401, 'Not authenticated')
  return toAuthUser(user)
}

// Deliberately never reveals whether `email` actually matches an account —
// the caller always gets the same generic response either way. Only sends a
// real email (and only creates a token row) when a match is found.
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { email } })
  if (!user) return

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await prisma.passwordResetToken.create({
    data: { id: hashToken(token), username: user.username, expiresAt },
  })

  const resetUrl = `${env.CORS_ORIGIN.split(',')[0].trim()}/reset-password?token=${token}`
  try {
    await sendPasswordResetEmail(email, resetUrl)
  } catch (error) {
    // A delivery failure (provider outage, sandbox restriction, etc.) must
    // never surface to the caller — same "reveal nothing" principle as the
    // unmatched-email case above. Still logged server-side for debugging.
    console.error('Failed to send password reset email:', error)
  }
}

// `preferredBase` is whatever the provider offers as a natural handle — an
// email's local-part, or (nicer when available) the provider's own username
// like GitHub's `login`.
async function generateUniqueUsername(preferredBase: string): Promise<string> {
  const base = preferredBase.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user'
  let candidate = base
  let suffix = 0
  // Collision loop is fine here — usernames are short, and a clash on a
  // freshly-derived base is rare enough that a handful of retries is cheap
  // compared to the complexity of a reservation scheme.
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1
    candidate = `${base}${suffix}`
  }
  return candidate
}

// Strict, no-exceptions policy: an email already on file — under ANY
// account, from ANY signup method — blocks a *new* account from claiming it.
// Deliberately never auto-links a matching email to an existing account
// (even a verified OAuth email) — that would let a verified identity from
// one provider silently take over an account whose email field was only
// ever self-entered, unverified text. The account already on file keeps
// exclusive ownership; the newcomer is told to use their original method.
async function assertEmailNotTaken(email: string): Promise<void> {
  const existing = await prisma.user.findFirst({ where: { email } })
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists — log in using your original method instead.', 'email_taken')
  }
}

// Finds the account for this Google identity (a returning user), or creates
// a fresh one — never links onto a different, already-existing account.
export async function loginOrSignupWithGoogle(
  profile: GoogleProfile,
): Promise<{ user: AuthUserDto; token: string; expiresAt: Date }> {
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } })

  if (!user) {
    await assertEmailNotTaken(profile.email)
    const username = await generateUniqueUsername(profile.email.split('@')[0])
    user = await prisma.user.create({
      data: {
        username,
        role: 'user',
        googleId: profile.sub,
        email: profile.emailVerified ? profile.email : undefined,
        name: profile.name,
      },
    })
  }

  if (user.blocked) throw new ApiError(403, 'This account has been blocked', 'blocked')

  const { token, expiresAt } = await createSession(user.username)
  return { user: toAuthUser(user), token, expiresAt }
}

// Same shape as loginOrSignupWithGoogle, preferring the GitHub handle as the
// new username's base since it's a more natural fit than an email local-part.
export async function loginOrSignupWithGithub(
  profile: GithubProfile,
): Promise<{ user: AuthUserDto; token: string; expiresAt: Date }> {
  let user = await prisma.user.findUnique({ where: { githubId: profile.id } })

  if (!user) {
    await assertEmailNotTaken(profile.email)
    const username = await generateUniqueUsername(profile.login)
    user = await prisma.user.create({
      data: {
        username,
        role: 'user',
        githubId: profile.id,
        email: profile.emailVerified ? profile.email : undefined,
        name: profile.name,
      },
    })
  }

  if (user.blocked) throw new ApiError(403, 'This account has been blocked', 'blocked')

  const { token, expiresAt } = await createSession(user.username)
  return { user: toAuthUser(user), token, expiresAt }
}

// Same shape as loginOrSignupWithGoogle — LinkedIn's OIDC profile has the
// same "sub"/email/name shape Google's does.
export async function loginOrSignupWithLinkedIn(
  profile: LinkedInProfile,
): Promise<{ user: AuthUserDto; token: string; expiresAt: Date }> {
  let user = await prisma.user.findUnique({ where: { linkedinId: profile.sub } })

  if (!user) {
    await assertEmailNotTaken(profile.email)
    const username = await generateUniqueUsername(profile.email.split('@')[0])
    user = await prisma.user.create({
      data: {
        username,
        role: 'user',
        linkedinId: profile.sub,
        email: profile.emailVerified ? profile.email : undefined,
        name: profile.name,
      },
    })
  }

  if (user.blocked) throw new ApiError(403, 'This account has been blocked', 'blocked')

  const { token, expiresAt } = await createSession(user.username)
  return { user: toAuthUser(user), token, expiresAt }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { id: hashToken(token) } })
  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new ApiError(400, 'This reset link is invalid or has expired')
  }

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { username: resetToken.username }, data: { passwordHash } })
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
  // A password reset is a credible sign the old credential may be
  // compromised — force every existing session to re-authenticate.
  await revokeAllSessionsForUser(resetToken.username)
}
