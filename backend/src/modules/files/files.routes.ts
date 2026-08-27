import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  listFiles,
  createFile,
  createFolder,
  saveFilesBatch,
  saveFile,
  renameFile,
  deleteFile,
  renamePathPrefix,
  deleteByPathPrefix,
  discardChanges,
} from './files.service.js'
import { requireAuth } from '../../middleware/auth.js'

const fileDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  content: z.string(),
  type: z.string(),
})

const projectIdParamSchema = z.object({ id: z.string() })
const fileIdParamSchema = z.object({ id: z.string(), fileId: z.string() })

export const filesRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/:id/files',
    { preHandler: requireAuth, schema: { params: projectIdParamSchema, response: { 200: z.array(fileDtoSchema) } } },
    async (request, reply) => {
      reply.send(await listFiles(request.params.id, request.authUser!))
    },
  )

  app.post(
    '/:id/files',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ name: z.string().min(1), path: z.string().min(1) }),
        response: { 201: fileDtoSchema },
      },
    },
    async (request, reply) => {
      const { name, path } = request.body
      reply.status(201).send(await createFile(request.params.id, request.authUser!, name, path))
    },
  )

  app.post(
    '/:id/folders',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ name: z.string().min(1), path: z.string().min(1) }),
        response: { 201: fileDtoSchema },
      },
    },
    async (request, reply) => {
      const { name, path } = request.body
      reply.status(201).send(await createFolder(request.params.id, request.authUser!, name, path))
    },
  )

  app.patch(
    '/:id/files/batch',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ files: z.array(z.object({ fileId: z.string(), content: z.string() })) }),
        response: { 200: z.array(fileDtoSchema) },
      },
      // Default Fastify bodyLimit (1MB) is too small once an uploaded image's
      // base64 content is included — raised only for this route.
      bodyLimit: 6_000_000,
    },
    async (request, reply) => {
      reply.send(await saveFilesBatch(request.params.id, request.authUser!, request.body.files))
    },
  )

  app.post(
    '/:id/files/rename-prefix',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ oldPrefix: z.string(), newPrefix: z.string() }),
        response: { 200: z.array(fileDtoSchema) },
      },
    },
    async (request, reply) => {
      const { oldPrefix, newPrefix } = request.body
      reply.send(await renamePathPrefix(request.params.id, request.authUser!, oldPrefix, newPrefix))
    },
  )

  app.post(
    '/:id/files/delete-prefix',
    {
      preHandler: requireAuth,
      schema: { params: projectIdParamSchema, body: z.object({ prefix: z.string() }) },
    },
    async (request, reply) => {
      await deleteByPathPrefix(request.params.id, request.authUser!, request.body.prefix)
      reply.status(204).send()
    },
  )

  app.post(
    '/:id/files/discard',
    {
      preHandler: requireAuth,
      schema: {
        params: projectIdParamSchema,
        body: z.object({ paths: z.array(z.string()).optional() }),
        response: { 200: z.array(fileDtoSchema) },
      },
    },
    async (request, reply) => {
      reply.send(await discardChanges(request.params.id, request.authUser!, request.body.paths))
    },
  )

  app.patch(
    '/:id/files/:fileId',
    {
      preHandler: requireAuth,
      schema: { params: fileIdParamSchema, body: z.object({ content: z.string() }), response: { 200: fileDtoSchema } },
    },
    async (request, reply) => {
      reply.send(await saveFile(request.params.id, request.authUser!, request.params.fileId, request.body.content))
    },
  )

  app.patch(
    '/:id/files/:fileId/rename',
    {
      preHandler: requireAuth,
      schema: { params: fileIdParamSchema, body: z.object({ name: z.string().min(1) }), response: { 200: fileDtoSchema } },
    },
    async (request, reply) => {
      reply.send(await renameFile(request.params.id, request.authUser!, request.params.fileId, request.body.name))
    },
  )

  app.delete(
    '/:id/files/:fileId',
    { preHandler: requireAuth, schema: { params: fileIdParamSchema } },
    async (request, reply) => {
      await deleteFile(request.params.id, request.authUser!, request.params.fileId)
      reply.status(204).send()
    },
  )
}
