import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  listUsers,
  getUserDetail,
  updateOwnProfile,
  changeOwnPassword,
  setUserRole,
  setUserBlocked,
  removeUserAccount,
  deleteProjectsForUser,
} from './users.service.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } from '../../lib/password.js'

const userDetailSchema = z.object({
  username: z.string(),
  role: z.enum(['admin', 'user']),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  joinedAt: z.string(),
  blocked: z.boolean(),
  projectCount: z.number(),
})

const usernameParamSchema = z.object({ username: z.string() })

function assertSelf(actingUsername: string, targetUsername: string) {
  if (actingUsername !== targetUsername) throw new ApiError(403, 'You can only manage your own account')
}

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/',
    { preHandler: requireAdmin, schema: { response: { 200: z.array(userDetailSchema) } } },
    async (_request, reply) => {
      reply.send(await listUsers())
    },
  )

  app.get(
    '/:username',
    {
      preHandler: requireAuth,
      schema: { params: usernameParamSchema, response: { 200: userDetailSchema } },
    },
    async (request, reply) => {
      const { username } = request.params
      if (request.authUser!.role !== 'admin') assertSelf(request.authUser!.username, username)
      reply.send(await getUserDetail(username))
    },
  )

  app.patch(
    '/:username',
    {
      preHandler: requireAuth,
      schema: {
        params: usernameParamSchema,
        body: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        }),
        response: { 200: userDetailSchema },
      },
    },
    async (request, reply) => {
      const { username } = request.params
      assertSelf(request.authUser!.username, username)
      reply.send(await updateOwnProfile(username, request.body))
    },
  )

  app.patch(
    '/:username/password',
    {
      preHandler: requireAuth,
      schema: {
        params: usernameParamSchema,
        body: z.object({
          currentPassword: z.string().min(1),
          newPassword: z.string().regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
        }),
      },
    },
    async (request, reply) => {
      const { username } = request.params
      assertSelf(request.authUser!.username, username)
      const { currentPassword, newPassword } = request.body
      await changeOwnPassword(username, currentPassword, newPassword)
      reply.status(204).send()
    },
  )

  app.patch(
    '/:username/role',
    {
      preHandler: requireAdmin,
      schema: {
        params: usernameParamSchema,
        body: z.object({ role: z.enum(['admin', 'user']) }),
        response: { 200: userDetailSchema },
      },
    },
    async (request, reply) => {
      const { username } = request.params
      reply.send(await setUserRole(request.authUser!.username, username, request.body.role))
    },
  )

  app.patch(
    '/:username/block',
    {
      preHandler: requireAdmin,
      schema: {
        params: usernameParamSchema,
        body: z.object({ blocked: z.boolean() }),
        response: { 200: userDetailSchema },
      },
    },
    async (request, reply) => {
      const { username } = request.params
      reply.send(await setUserBlocked(request.authUser!.username, username, request.body.blocked))
    },
  )

  app.delete(
    '/:username',
    {
      preHandler: requireAuth,
      schema: {
        params: usernameParamSchema,
        response: { 200: z.object({ transferredProjects: z.number() }) },
      },
    },
    async (request, reply) => {
      const { username } = request.params
      const actingUser = request.authUser!
      if (actingUser.role !== 'admin' && actingUser.username !== username) {
        throw new ApiError(403, 'Admin access required')
      }
      reply.send(await removeUserAccount(actingUser.username, username))
    },
  )

  app.delete(
    '/:username/projects',
    {
      preHandler: requireAdmin,
      schema: { params: usernameParamSchema, response: { 200: z.object({ deleted: z.number() }) } },
    },
    async (request, reply) => {
      reply.send(await deleteProjectsForUser(request.params.username))
    },
  )
}
