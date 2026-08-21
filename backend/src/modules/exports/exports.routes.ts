import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { listExports, recordExport } from './exports.service.js'
import { requireAuth } from '../../middleware/auth.js'

const exportRecordSchema = z.object({
  id: z.string(),
  version: z.string(),
  exportedAt: z.string(),
  fileSizeBytes: z.number(),
})
const projectIdParamSchema = z.object({ id: z.string() })

export const exportsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/:id/exports',
    { preHandler: requireAuth, schema: { params: projectIdParamSchema, response: { 200: z.array(exportRecordSchema) } } },
    async (request, reply) => {
      reply.send(await listExports(request.params.id, request.authUser!))
    },
  )

  app.post(
    '/:id/exports',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ version: z.string().min(1), fileSizeBytes: z.number().int().nonnegative() }),
        response: { 201: exportRecordSchema },
      },
    },
    async (request, reply) => {
      const { version, fileSizeBytes } = request.body
      reply.status(201).send(await recordExport(request.params.id, request.authUser!, version, fileSizeBytes))
    },
  )
}
