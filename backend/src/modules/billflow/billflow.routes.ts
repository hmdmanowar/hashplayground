import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  joinWaitlist,
  recordEvent,
  getStats,
  resetAllData,
  BILLFLOW_EVENT_TYPES,
  BILLFLOW_STATS_RANGES,
} from './billflow.service.js'
import { requireTopAdmin } from '../../middleware/auth.js'

// Template slugs are lowercase-kebab (see billflow/src/data/templates.json);
// the empty string is the main /billflow/ generator page.
const slugSchema = z
  .string()
  .max(80)
  .regex(/^[a-z0-9-]*$/)
  .optional()

const statsDtoSchema = z.object({
  range: z.enum(BILLFLOW_STATS_RANGES),
  rangeLabel: z.string(),
  gateDownloads: z.number(),
  gateWindowDays: z.number(),
  waitlistTotal: z.number(),
  priceIntents: z.array(z.object({ priceIntent: z.number(), count: z.number() })),
  recentSignups: z.array(
    z.object({ email: z.string(), priceIntent: z.number(), source: z.string().nullable(), createdAt: z.string() }),
  ),
  eventTotals: z.array(z.object({ type: z.string(), count: z.number() })),
  eventsBySlug: z.array(z.object({ slug: z.string(), type: z.string(), count: z.number() })),
  buckets: z.array(z.string()),
  series: z.object({ page_view: z.array(z.number()), pdf_downloaded: z.array(z.number()), upgrade_clicked: z.array(z.number()) }),
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

  // Public, fire-and-forget funnel counter. Admins' own visits are dropped
  // (the generator sends cookies), so testing the app doesn't skew demand.
  app.post(
    '/events',
    {
      schema: {
        body: z.object({ type: z.enum(BILLFLOW_EVENT_TYPES), slug: slugSchema }),
      },
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      if (request.authUser?.role !== 'admin') await recordEvent(request.body.type, request.body.slug)
      reply.status(204).send()
    },
  )

  // Top admin only, and re-confirmed with the account password.
  app.post(
    '/admin/reset',
    {
      preHandler: requireTopAdmin,
      schema: {
        body: z.object({ password: z.string().min(1).max(200), includeWaitlist: z.boolean().default(false) }),
        response: { 200: z.object({ events: z.number(), waitlist: z.number() }) },
      },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      reply.send(await resetAllData(request.authUser!.username, request.body.password, request.body.includeWaitlist))
    },
  )

  app.get(
    '/admin/stats',
    {
      preHandler: requireTopAdmin,
      schema: {
        querystring: z.object({ range: z.enum(BILLFLOW_STATS_RANGES).default('day') }),
        response: { 200: statsDtoSchema },
      },
    },
    async (request, reply) => {
      reply.send(await getStats(request.query.range))
    },
  )
}
