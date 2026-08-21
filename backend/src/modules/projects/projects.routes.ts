import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  listVisibleProjects,
  getProject,
  createProject,
  importProject,
  updateProject,
  deleteProject,
  duplicateProject,
} from './projects.service.js'
import { requireAuth } from '../../middleware/auth.js'

const projectFileDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  content: z.string(),
  type: z.string(),
})

const projectOwnerSchema = z.object({
  username: z.string(),
  role: z.enum(['admin', 'user']),
  name: z.string().optional(),
  email: z.string().optional(),
  joinedAt: z.string(),
})

const projectDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  template: z.string(),
  technology: z.string(),
  version: z.string(),
  ownerUsername: z.string(),
  owner: projectOwnerSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const idParamSchema = z.object({ id: z.string() })

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/',
    {
      preHandler: requireAuth,
      schema: {
        querystring: z.object({ ownerUsername: z.string().optional() }),
        response: { 200: z.array(projectDtoSchema) },
      },
    },
    async (request, reply) => {
      reply.send(await listVisibleProjects(request.authUser!, request.query.ownerUsername))
    },
  )

  app.get(
    '/:id',
    { preHandler: requireAuth, schema: { params: idParamSchema, response: { 200: projectDtoSchema } } },
    async (request, reply) => {
      reply.send(await getProject(request.params.id, request.authUser!))
    },
  )

  app.post(
    '/',
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({ name: z.string().min(1), description: z.string().optional(), template: z.string().min(1) }),
        response: { 201: z.object({ project: projectDtoSchema, files: z.array(projectFileDtoSchema) }) },
      },
    },
    async (request, reply) => {
      const result = await createProject(request.authUser!.username, request.body)
      reply.status(201).send(result)
    },
  )

  app.post(
    '/import',
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          name: z.string().min(1),
          template: z.string().min(1),
          entries: z.array(z.object({ path: z.string(), name: z.string(), content: z.string() })),
        }),
        response: { 201: z.object({ project: projectDtoSchema, files: z.array(projectFileDtoSchema) }) },
      },
    },
    async (request, reply) => {
      const result = await importProject(request.authUser!.username, request.body)
      reply.status(201).send(result)
    },
  )

  app.patch(
    '/:id',
    {
      preHandler: requireAuth,
      schema: {
        params: idParamSchema,
        body: z.object({ name: z.string().optional(), description: z.string().optional() }),
        response: { 200: projectDtoSchema },
      },
    },
    async (request, reply) => {
      reply.send(await updateProject(request.params.id, request.authUser!, request.body))
    },
  )

  app.delete(
    '/:id',
    { preHandler: requireAuth, schema: { params: idParamSchema } },
    async (request, reply) => {
      await deleteProject(request.params.id, request.authUser!)
      reply.status(204).send()
    },
  )

  app.post(
    '/:id/duplicate',
    {
      preHandler: requireAuth,
      schema: {
        params: idParamSchema,
        response: { 201: z.object({ project: projectDtoSchema, files: z.array(projectFileDtoSchema) }) },
      },
    },
    async (request, reply) => {
      const result = await duplicateProject(request.params.id, request.authUser!)
      reply.status(201).send(result)
    },
  )
}
