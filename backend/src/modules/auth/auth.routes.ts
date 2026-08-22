import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import {
  signup,
  login,
  getAuthUser,
  requestPasswordReset,
  resetPassword,
  loginOrSignupWithGoogle,
  loginOrSignupWithGithub,
  loginOrSignupWithLinkedIn,
} from './auth.service.js'
import { requireAuth } from '../../middleware/auth.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } from '../../lib/password.js'
import { buildGoogleAuthUrl, exchangeCodeForProfile } from '../../lib/googleOAuth.js'
import { buildGithubAuthUrl, exchangeCodeForGithubProfile } from '../../lib/githubOAuth.js'
import { buildLinkedInAuthUrl, exchangeCodeForLinkedInProfile } from '../../lib/linkedinOAuth.js'
import { env } from '../../env.js'
import {
  revokeSession,
  sessionCookieOptions,
  clearedSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../lib/session.js'

const GOOGLE_STATE_COOKIE_NAME = 'hash_playground_google_state'
const GITHUB_STATE_COOKIE_NAME = 'hash_playground_github_state'
const LINKEDIN_STATE_COOKIE_NAME = 'hash_playground_linkedin_state'

function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60,
  }
}

function frontendUrl(path: string): string {
  return `${env.CORS_ORIGIN.split(',')[0].trim()}${path}`
}

// Maps a thrown error to a provider-prefixed reason code for the frontend's
// `?error=` query param — keyed on ApiError.code, not string-matching the
// message, so it stays correct if wording ever changes.
function oauthErrorReason(provider: string, error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'blocked') return `${provider}_account_blocked`
    if (error.code === 'email_taken') return `${provider}_email_taken`
  }
  return `${provider}_auth_failed`
}

const authUserResponseSchema = z.object({
  username: z.string(),
  role: z.enum(['admin', 'user']),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  joinedAt: z.string(),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/signup',
    {
      schema: {
        body: z.object({
          username: z.string().trim().min(1),
          password: z.string().regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
        }),
        response: { 201: z.object({ user: authUserResponseSchema }) },
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { username, password } = request.body
      const { user, token, expiresAt } = await signup(username, password)
      reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt))
      reply.status(201).send({ user })
    },
  )

  app.post(
    '/login',
    {
      schema: {
        // `identifier` may be a username or a phone number.
        body: z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) }),
        response: { 200: z.object({ user: authUserResponseSchema }) },
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { identifier, password } = request.body
      const { user, token, expiresAt } = await login(identifier, password)
      reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt))
      reply.send({ user })
    },
  )

  app.post('/logout', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE_NAME]
    if (token) await revokeSession(token)
    reply.clearCookie(SESSION_COOKIE_NAME, clearedSessionCookieOptions())
    reply.status(204).send()
  })

  app.get(
    '/me',
    {
      preHandler: requireAuth,
      schema: { response: { 200: z.object({ user: authUserResponseSchema }) } },
    },
    async (request, reply) => {
      const user = await getAuthUser(request.authUser!.username)
      reply.send({ user })
    },
  )

  app.post(
    '/forgot-password',
    {
      schema: { body: z.object({ email: z.string().trim().min(1) }) },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      await requestPasswordReset(request.body.email)
      // Same response whether or not that email is actually registered —
      // never reveal which emails exist in the system.
      reply.send({ message: 'If an account with that email exists, a reset link has been sent.' })
    },
  )

  app.get('/google', async (_request, reply) => {
    const state = randomBytes(16).toString('hex')
    reply.setCookie(GOOGLE_STATE_COOKIE_NAME, state, oauthStateCookieOptions()).redirect(buildGoogleAuthUrl(state))
  })

  app.get(
    '/google/callback',
    { schema: { querystring: z.object({ code: z.string().optional(), state: z.string().optional() }) } },
    async (request, reply) => {
      const { code, state } = request.query
      const expectedState = request.cookies[GOOGLE_STATE_COOKIE_NAME]
      reply.clearCookie(GOOGLE_STATE_COOKIE_NAME, { path: '/' })

      if (!code || !state || !expectedState || state !== expectedState) {
        reply.redirect(frontendUrl('/login?error=google_auth_failed'))
        return
      }

      try {
        const profile = await exchangeCodeForProfile(code)
        const { token, expiresAt } = await loginOrSignupWithGoogle(profile)
        reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt))
        reply.redirect(frontendUrl('/dashboard'))
      } catch (error) {
        const reason = oauthErrorReason('google', error)
        request.log.error(error)
        reply.redirect(frontendUrl(`/login?error=${reason}`))
      }
    },
  )

  app.get('/github', async (_request, reply) => {
    const state = randomBytes(16).toString('hex')
    reply.setCookie(GITHUB_STATE_COOKIE_NAME, state, oauthStateCookieOptions()).redirect(buildGithubAuthUrl(state))
  })

  app.get(
    '/github/callback',
    { schema: { querystring: z.object({ code: z.string().optional(), state: z.string().optional() }) } },
    async (request, reply) => {
      const { code, state } = request.query
      const expectedState = request.cookies[GITHUB_STATE_COOKIE_NAME]
      reply.clearCookie(GITHUB_STATE_COOKIE_NAME, { path: '/' })

      if (!code || !state || !expectedState || state !== expectedState) {
        reply.redirect(frontendUrl('/login?error=github_auth_failed'))
        return
      }

      try {
        const profile = await exchangeCodeForGithubProfile(code)
        const { token, expiresAt } = await loginOrSignupWithGithub(profile)
        reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt))
        reply.redirect(frontendUrl('/dashboard'))
      } catch (error) {
        const reason = oauthErrorReason('github', error)
        request.log.error(error)
        reply.redirect(frontendUrl(`/login?error=${reason}`))
      }
    },
  )

  app.get('/linkedin', async (_request, reply) => {
    const state = randomBytes(16).toString('hex')
    reply.setCookie(LINKEDIN_STATE_COOKIE_NAME, state, oauthStateCookieOptions()).redirect(buildLinkedInAuthUrl(state))
  })

  app.get(
    '/linkedin/callback',
    { schema: { querystring: z.object({ code: z.string().optional(), state: z.string().optional() }) } },
    async (request, reply) => {
      const { code, state } = request.query
      const expectedState = request.cookies[LINKEDIN_STATE_COOKIE_NAME]
      reply.clearCookie(LINKEDIN_STATE_COOKIE_NAME, { path: '/' })

      if (!code || !state || !expectedState || state !== expectedState) {
        reply.redirect(frontendUrl('/login?error=linkedin_auth_failed'))
        return
      }

      try {
        const profile = await exchangeCodeForLinkedInProfile(code)
        const { token, expiresAt } = await loginOrSignupWithLinkedIn(profile)
        reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt))
        reply.redirect(frontendUrl('/dashboard'))
      } catch (error) {
        const reason = oauthErrorReason('linkedin', error)
        request.log.error(error)
        reply.redirect(frontendUrl(`/login?error=${reason}`))
      }
    },
  )

  app.post(
    '/reset-password',
    {
      schema: {
        body: z.object({
          token: z.string().min(1),
          newPassword: z.string().regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
        }),
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { token, newPassword } = request.body
      await resetPassword(token, newPassword)
      reply.status(204).send()
    },
  )
}
