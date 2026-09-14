import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  getInfo,
  listConversations,
  getMessages,
  renameConversation,
  deleteConversation,
  truncateConversation,
  sendMessage,
  sendAnonymousMessage,
  resetConversation,
} from './jarvisAssistant.service.js'
import { requireAuth } from '../../middleware/auth.js'
import { getOrCreateAnonId } from '../../lib/anonymousSession.js'

const conversationSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  images: z.array(z.string()).optional(),
  createdAt: z.string(),
})

const conversationIdParamSchema = z.object({ id: z.string() })

export const jarvisAssistantRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Public — a not-logged-in visitor sees this before deciding whether to
  // try the free chat preview.
  app.get('/info', { schema: { response: { 200: z.object({ assistantName: z.string(), model: z.string() }) } } }, async (_request, reply) => {
    reply.send(getInfo())
  })

  app.get(
    '/conversations',
    { preHandler: requireAuth, schema: { response: { 200: z.array(conversationSummarySchema) } } },
    async (request, reply) => {
      reply.send(await listConversations(request.authUser!))
    },
  )

  app.get(
    '/conversations/:id/messages',
    { preHandler: requireAuth, schema: { params: conversationIdParamSchema, response: { 200: z.array(messageSchema) } } },
    async (request, reply) => {
      reply.send(await getMessages(request.authUser!, request.params.id))
    },
  )

  app.patch(
    '/conversations/:id',
    { preHandler: requireAuth, schema: { params: conversationIdParamSchema, body: z.object({ title: z.string().min(1).max(200) }) } },
    async (request, reply) => {
      await renameConversation(request.authUser!, request.params.id, request.body.title)
      reply.status(204).send()
    },
  )

  app.delete(
    '/conversations/:id',
    { preHandler: requireAuth, schema: { params: conversationIdParamSchema } },
    async (request, reply) => {
      await deleteConversation(request.authUser!, request.params.id)
      reply.status(204).send()
    },
  )

  app.post(
    '/conversations/:id/truncate',
    {
      preHandler: requireAuth,
      schema: { params: conversationIdParamSchema, body: z.object({ keepCount: z.number().int().min(0) }) },
    },
    async (request, reply) => {
      await truncateConversation(request.authUser!, request.params.id, request.body.keepCount)
      reply.status(204).send()
    },
  )

  // Public — logged-in users get the full assistant (tools, saved history);
  // an anonymous visitor gets a capped, chat-only preview instead of a 401
  // (see sendAnonymousMessage). The client resends its own trimmed transcript
  // as `history` only in the anonymous case — an authenticated conversation's
  // history already lives server-side.
  app.post(
    '/chat',
    {
      schema: {
        body: z.object({
          message: z.string().trim().min(1).max(4000),
          images: z.array(z.string()).max(4).optional(),
          conversationId: z.string().optional(),
          history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).max(20).optional(),
        }),
        response: {
          200: z.object({
            reply: z.string(),
            conversationId: z.string().nullable(),
            pendingApproval: z.object({ tool: z.string(), args: z.record(z.string(), z.unknown()), risk: z.string() }).nullable(),
            remaining: z.number().nullable(),
          }),
        },
      },
      // Default Fastify bodyLimit (1MB) is too small once an attached image's
      // base64 content is included — same reasoning as files.routes.ts's batch save.
      bodyLimit: 6_000_000,
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { message, images, conversationId, history } = request.body

      if (request.authUser) {
        const result = await sendMessage(request.authUser, conversationId, message, images)
        reply.send({ ...result, remaining: null })
        return
      }

      const anonId = getOrCreateAnonId(request, reply)
      const result = await sendAnonymousMessage(anonId, message, history ?? [])
      reply.send({ reply: result.reply, conversationId: null, pendingApproval: null, remaining: result.remaining })
    },
  )

  app.post('/reset', { preHandler: requireAuth }, async (request, reply) => {
    await resetConversation(request.authUser!)
    reply.status(204).send()
  })
}
