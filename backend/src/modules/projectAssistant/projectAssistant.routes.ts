import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { sendMessage, resetSession } from './projectAssistant.service.js'
import { requireAuth } from '../../middleware/auth.js'

const projectIdParamSchema = z.object({ id: z.string() })

export const projectAssistantRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/:id/assistant/chat',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ message: z.string().trim().min(1).max(4000) }),
        response: {
          200: z.object({
            reply: z.string(),
            pendingApproval: z.object({ tool: z.string(), args: z.record(z.string(), z.unknown()), risk: z.string() }).nullable(),
          }),
        },
      },
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      reply.send(await sendMessage(request.params.id, request.authUser!, request.body.message))
    },
  )

  app.post(
    '/:id/assistant/reset',
    { preHandler: requireAuth, schema: { params: projectIdParamSchema } },
    async (request, reply) => {
      await resetSession(request.params.id, request.authUser!)
      reply.status(204).send()
    },
  )
}
