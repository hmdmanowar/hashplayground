import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { listVersions, getLatestVersion, getVersion, publishVersion } from './versions.service.js'
import { requireAuth } from '../../middleware/auth.js'

const versionFileSchema = z.object({ id: z.string(), name: z.string(), path: z.string(), content: z.string(), type: z.string() })
const versionSummarySchema = z.object({ id: z.string(), version: z.string(), createdAt: z.string(), fileCount: z.number() })
const versionDetailSchema = z.object({
  id: z.string(),
  version: z.string(),
  createdAt: z.string(),
  files: z.array(versionFileSchema),
})

const projectIdParamSchema = z.object({ id: z.string() })
const versionIdParamSchema = z.object({ id: z.string(), versionId: z.string() })

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
        response: { 200: z.object({ changed: z.boolean(), version: z.string().optional() }) },
      },
    },
    async (request, reply) => {
      reply.send(await publishVersion(request.params.id, request.authUser!))
    },
  )
}
