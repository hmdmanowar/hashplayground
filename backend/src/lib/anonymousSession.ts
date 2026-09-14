import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CookieSerializeOptions } from '@fastify/cookie'
import { env } from '../env.js'

export const ANON_COOKIE_NAME = 'jarvis_anon_id'
const ANON_COOKIE_TTL_MS = 180 * 24 * 60 * 60 * 1000 // 180 days — long-lived, but resets for free if they clear cookies

// Same secure/sameSite split as lib/session.ts's real login cookie — plain
// http in local dev can't set a Secure cookie, cross-site Render domains in
// production need SameSite=None.
function cookieOptions(): CookieSerializeOptions {
  const base: Pick<CookieSerializeOptions, 'httpOnly' | 'secure' | 'sameSite' | 'path'> =
    env.NODE_ENV === 'production'
      ? { httpOnly: true, secure: true, sameSite: 'none', path: '/' }
      : { httpOnly: true, secure: false, sameSite: 'lax', path: '/' }
  return { ...base, maxAge: ANON_COOKIE_TTL_MS / 1000 }
}

// Reads the anonymous-visitor id from its cookie, creating and setting one
// on first use — this is the only identity a not-logged-in /jarvis visitor
// has, purely so their free-message count (see jarvisAssistant.service.ts)
// can be enforced server-side instead of trusted from the client.
export function getOrCreateAnonId(request: FastifyRequest, reply: FastifyReply): string {
  const existing = request.cookies[ANON_COOKIE_NAME]
  if (existing) return existing

  const id = randomUUID()
  reply.setCookie(ANON_COOKIE_NAME, id, cookieOptions())
  return id
}
