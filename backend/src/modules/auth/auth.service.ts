import type { User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { hashPassword, verifyPasswordHash } from '../../lib/password.js'
import { createSession } from '../../lib/session.js'
import { ApiError } from '../../middleware/errorHandler.js'

export interface AuthUserDto {
  username: string
  role: 'admin' | 'user'
  name?: string
  email?: string
  joinedAt: string
}

function toAuthUser(user: Pick<User, 'username' | 'role' | 'name' | 'email' | 'joinedAt'>): AuthUserDto {
  return {
    username: user.username,
    role: user.role,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    joinedAt: user.joinedAt.toISOString(),
  }
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

export async function login(
  username: string,
  password: string,
): Promise<{ user: AuthUserDto; token: string; expiresAt: Date }> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new ApiError(401, 'Invalid username or password')

  const valid = await verifyPasswordHash(password, user.passwordHash)
  if (!valid) throw new ApiError(401, 'Invalid username or password')

  if (user.blocked) throw new ApiError(403, 'This account has been blocked', 'blocked')

  const { token, expiresAt } = await createSession(username)
  return { user: toAuthUser(user), token, expiresAt }
}

export async function getAuthUser(username: string): Promise<AuthUserDto> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new ApiError(401, 'Not authenticated')
  return toAuthUser(user)
}
