import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { submitFeedback, listFeedback, updateFeedbackStatus } from './feedback.service.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'

// Base64 data URL, capped well above what a reasonably-sized screenshot
// needs (~3MB raw inflates to ~4MB of base64 text) but well short of
// anything that could be used to bloat the database with huge uploads.
const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000

const feedbackStatusChangeSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
  changedAt: z.string(),
  changedByUsername: z.string().optional(),
  changedByName: z.string().optional(),
})

const feedbackDtoSchema = z.object({
  id: z.string(),
  type: z.enum(['bug', 'feature']),
  message: z.string(),
  imageData: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved']),
  username: z.string(),
  name: z.string().optional(),
  createdAt: z.string(),
  statusUpdatedAt: z.string(),
  statusHistory: z.array(feedbackStatusChangeSchema),
})

export const feedbackRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/',
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          type: z.enum(['bug', 'feature']),
          message: z.string().trim().min(1).max(5000),
          imageData: z
            .string()
            .max(MAX_IMAGE_DATA_URL_LENGTH, 'Image is too large — please attach a smaller screenshot')
            .regex(/^data:image\/(png|jpe?g|gif|webp);base64,/, 'Attachment must be an image')
            .optional(),
        }),
        response: { 201: feedbackDtoSchema },
      },
      // Default Fastify bodyLimit (1MB) is too small once an image attachment
      // is included — raised only for this route, not globally.
      bodyLimit: 6_000_000,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const feedback = await submitFeedback(request.authUser!.username, request.body)
      reply.status(201).send(feedback)
    },
  )

  app.get(
    '/',
    { preHandler: requireAdmin, schema: { response: { 200: z.array(feedbackDtoSchema) } } },
    async (_request, reply) => {
      reply.send(await listFeedback())
    },
  )

  app.patch(
    '/:id/status',
    {
      preHandler: requireAdmin,
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({ status: z.enum(['open', 'in_progress', 'resolved']) }),
        response: { 200: feedbackDtoSchema },
      },
    },
    async (request, reply) => {
      const updated = await updateFeedbackStatus(request.params.id, request.body.status, request.authUser!.username)
      reply.send(updated)
    },
  )
}
