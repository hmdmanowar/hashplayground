import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { joinWaitlist, recordEvent, getStats, BILLFLOW_EVENT_TYPES } from './billflow.service.js'
import { requireTopAdmin } from '../../middleware/auth.js'

// Template slugs are lowercase-kebab (see billflow/src/data/templates.json);
// the empty string is the main /billflow/ generator page.
const slugSchema = z
  .string()
  .max(80)
  .regex(/^[a-z0-9-]*$/)
  .optional()

const statsDtoSchema = z.object({
  windowDays: z.number(),
  waitlistTotal: z.number(),
  priceIntents: z.array(z.object({ priceIntent: z.number(), count: z.number() })),
  recentSignups: z.array(
    z.object({ email: z.string(), priceIntent: z.number(), source: z.string().nullable(), createdAt: z.string() }),
  ),
  eventTotals: z.array(z.object({ type: z.string(), count: z.number() })),
  eventsBySlug: z.array(z.object({ slug: z.string(), type: z.string(), count: z.number() })),
  eventsByDay: z.array(z.object({ day: z.string(), type: z.string(), count: z.number() })),
})

export const billflowRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Public — anonymous visitors of the free generator join the Pro waitlist.
  app.post(
    '/waitlist',
    {
      schema: {
        body: z.object({
          email: z.string().trim().email().max(254),
          priceIntent: z.union([z.literal(199), z.literal(299), z.literal(499)]),
          source: slugSchema,
        }),
        response: { 200: z.object({ alreadyJoined: z.boolean() }) },
      },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      reply.send(await joinWaitlist(request.body))
    },
  )

  // Public, fire-and-forget funnel counter.
  app.post(
    '/events',
    {
      schema: {
        body: z.object({ type: z.enum(BILLFLOW_EVENT_TYPES), slug: slugSchema }),
      },
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      await recordEvent(request.body.type, request.body.slug)
      reply.status(204).send()
    },
  )

  app.get(
    '/admin/stats',
    { preHandler: requireTopAdmin, schema: { response: { 200: statsDtoSchema } } },
    async (_request, reply) => {
      reply.send(await getStats())
    },
  )
}
