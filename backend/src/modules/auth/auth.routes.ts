import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { signup, login, getAuthUser } from './auth.service.js'
import { requireAuth } from '../../middleware/auth.js'
import {
  revokeSession,
  sessionCookieOptions,
  clearedSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../lib/session.js'

const authUserResponseSchema = z.object({
  username: z.string(),
  role: z.enum(['admin', 'user']),
  name: z.string().optional(),
  email: z.string().optional(),
  joinedAt: z.string(),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/signup',
    {
      schema: {
        body: z.object({ username: z.string().trim().min(1), password: z.string().min(4) }),
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
        body: z.object({ username: z.string().trim().min(1), password: z.string().min(1) }),
        response: { 200: z.object({ user: authUserResponseSchema }) },
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { username, password } = request.body
      const { user, token, expiresAt } = await login(username, password)
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
}
