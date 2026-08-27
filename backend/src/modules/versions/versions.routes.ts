import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  listVersions,
  getLatestVersion,
  getVersion,
  publishVersion,
  getPendingUpdateRequest,
  requestUpdate,
  resolveUpdateRequest,
} from './versions.service.js'
import { requireAuth } from '../../middleware/auth.js'

const versionFileSchema = z.object({ id: z.string(), name: z.string(), path: z.string(), content: z.string(), type: z.string() })
const versionSummarySchema = z.object({ id: z.string(), version: z.string(), createdAt: z.string(), fileCount: z.number() })
const versionDetailSchema = z.object({
  id: z.string(),
  version: z.string(),
  createdAt: z.string(),
  files: z.array(versionFileSchema),
})
const pendingUpdateRequestSchema = z.object({
  id: z.string(),
  requestedByUsername: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
})

const projectIdParamSchema = z.object({ id: z.string() })
const versionIdParamSchema = z.object({ id: z.string(), versionId: z.string() })
const updateRequestIdParamSchema = z.object({ id: z.string(), requestId: z.string() })

export const versionsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/:id/versions',
    { preHandler: requireAuth, schema: { params: projectIdParamSchema, response: { 200: z.array(versionSummarySchema) } } },
    async (request, reply) => {
      reply.send(await listVersions(request.params.id, request.authUser!))
    },
  )

  app.get(
    '/:id/versions/latest',
    {
      preHandler: requireAuth,
      schema: { params: projectIdParamSchema, response: { 200: versionDetailSchema.nullable() } },
    },
    async (request, reply) => {
      reply.send(await getLatestVersion(request.params.id, request.authUser!))
    },
  )

  app.get(
    '/:id/versions/:versionId',
    { preHandler: requireAuth, schema: { params: versionIdParamSchema, response: { 200: versionDetailSchema } } },
    async (request, reply) => {
      reply.send(await getVersion(request.params.id, request.authUser!, request.params.versionId))
    },
  )

  app.post(
    '/:id/versions',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ password: z.string().optional() }).optional(),
        response: { 200: z.object({ changed: z.boolean(), version: z.string().optional() }) },
      },
    },
    async (request, reply) => {
      reply.send(await publishVersion(request.params.id, request.authUser!, request.body?.password))
    },
  )

  // The "PR merge" flow for a lower-level admin who can't publish another
  // user's project directly — see versions.service.ts's requestUpdate /
  // resolveUpdateRequest.
  app.get(
    '/:id/update-request',
    {
      preHandler: requireAuth,
      schema: { params: projectIdParamSchema, response: { 200: pendingUpdateRequestSchema.nullable() } },
    },
    async (request, reply) => {
      reply.send(await getPendingUpdateRequest(request.params.id, request.authUser!))
    },
  )

  app.post(
    '/:id/update-request',
    {
      preHandler: requireAuth,
      schema: { params: projectIdParamSchema, response: { 200: pendingUpdateRequestSchema } },
    },
    async (request, reply) => {
      reply.send(await requestUpdate(request.params.id, request.authUser!))
    },
  )

  app.post(
    '/:id/update-request/:requestId/resolve',
    {
      preHandler: requireAuth,
      schema: {
        params: updateRequestIdParamSchema,
        body: z.object({ decision: z.enum(['approved', 'rejected']), password: z.string().optional() }),
        response: {
          200: z.object({
            status: z.enum(['approved', 'rejected']),
            changed: z.boolean().optional(),
            version: z.string().optional(),
          }),
        },
      },
    },
    async (request, reply) => {
      reply.send(
        await resolveUpdateRequest(
          request.params.id,
          request.params.requestId,
          request.authUser!,
          request.body.decision,
          request.body.password,
        ),
      )
    },
  )
}
