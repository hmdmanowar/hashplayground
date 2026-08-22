import { randomBytes, createHash } from 'node:crypto'
import type { User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { hashPassword, verifyPasswordHash } from '../../lib/password.js'
import { createSession, revokeAllSessionsForUser } from '../../lib/session.js'
import { sendPasswordResetEmail } from '../../lib/email.js'
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
