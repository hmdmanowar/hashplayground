import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  listNotificationsForUser,
  getUnreadCount,
  markAllAsRead,
  sendNotification,
  listAllNotifications,
} from './notifications.service.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'

const notificationSchema = z.object({
  id: z.string(),
  toUsername: z.string(),
  fromUsername: z.string(),
  kind: z.enum(['message', 'alert', 'activity']),
  message: z.string(),
  link: z.string().optional(),
  createdAt: z.string(),
  readBy: z.array(z.string()),
})

export const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/',
    { preHandler: requireAuth, schema: { response: { 200: z.array(notificationSchema) } } },
    async (request, reply) => {
      reply.send(await listNotificationsForUser(request.authUser!.username))
    },
  )

  app.get(
    '/unread-count',
    { preHandler: requireAuth, schema: { response: { 200: z.object({ count: z.number() }) } } },
    async (request, reply) => {
      reply.send({ count: await getUnreadCount(request.authUser!.username) })
    },
  )

  app.post('/read-all', { preHandler: requireAuth }, async (request, reply) => {
    await markAllAsRead(request.authUser!.username)
    reply.status(204).send()
  })

  app.post(
    '/',
    {
      preHandler: requireAdmin,
      schema: {
        body: z.object({
          toUsername: z.string().min(1),
          kind: z.enum(['message', 'alert']),
          message: z.string().min(1),
          link: z.string().optional(),
        }),
        response: { 201: notificationSchema },
      },
    },
    async (request, reply) => {
      const { toUsername, kind, message, link } = request.body
      reply.status(201).send(await sendNotification(request.authUser!.username, toUsername, kind, message, link))
    },
  )

  app.get(
    '/all',
    { preHandler: requireAdmin, schema: { response: { 200: z.array(notificationSchema) } } },
    async (_request, reply) => {
      reply.send(await listAllNotifications())
    },
  )
}
