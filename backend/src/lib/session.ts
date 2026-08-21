import { randomBytes, createHash } from 'node:crypto'
import type { CookieSerializeOptions } from '@fastify/cookie'
import { prisma } from './prisma.js'
import { env } from '../env.js'

export const SESSION_COOKIE_NAME = 'hash_playground_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days, matching today's "stays logged in until logout" behavior

// `Secure` cookies are silently dropped by the browser over plain http, so
// local dev (talking to the backend through Vite's same-origin /api proxy,
// over http://localhost) needs secure:false + sameSite:'lax'. Only
// production — real cross-site https between the Render static site and
// Render web service — needs the stricter secure:true + sameSite:'none'.
function baseCookieOptions(): Pick<CookieSerializeOptions, 'httpOnly' | 'secure' | 'sameSite' | 'path'> {
  return env.NODE_ENV === 'production'
    ? { httpOnly: true, secure: true, sameSite: 'none', path: '/' }
    : { httpOnly: true, secure: false, sameSite: 'lax', path: '/' }
}

export function sessionCookieOptions(expiresAt: Date): CookieSerializeOptions {
  return { ...baseCookieOptions(), expires: expiresAt }
}

export function clearedSessionCookieOptions(): CookieSerializeOptions {
  return baseCookieOptions()
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(username: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await prisma.session.create({
    data: { id: hashToken(token), username, expiresAt },
  })
  return { token, expiresAt }
}

// Resolves a raw cookie token to the still-active username, transparently
// cleaning up an expired row rather than just rejecting it.
export async function resolveSessionUsername(token: string | undefined): Promise<string | null> {
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { id: hashToken(token) } })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session.username
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => {})
}

// Used when blocking/deleting a user — must take effect immediately, not
// wait for their existing session(s) to expire naturally.
export async function revokeAllSessionsForUser(username: string): Promise<void> {
  await prisma.session.deleteMany({ where: { username } })
}
