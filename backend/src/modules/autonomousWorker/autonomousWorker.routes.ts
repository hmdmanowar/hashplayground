import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAdmin, requireTopAdmin } from '../../middleware/auth.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { env } from '../../env.js'
import {
  getState,
  setEnabled,
  listTasks,
  queueTask,
  cancelTask,
  listCycles,
  clearHistory,
  pollForWorker,
  reportCycle,
} from './autonomousWorker.service.js'

// The worker has no browser session (it's a separate long-lived process,
// not a page load) — this shared-secret header stands in for one. Same
// "optional, disables just these routes" shape as OLLAMA_API_KEY.
async function requireWorkerToken(request: FastifyRequest): Promise<void> {
  if (!env.AUTONOMOUS_WORKER_TOKEN) {
    throw new ApiError(503, 'The autonomous worker control plane is not configured yet — missing AUTONOMOUS_WORKER_TOKEN.')
  }
  if (request.headers['x-worker-token'] !== env.AUTONOMOUS_WORKER_TOKEN) {
    throw new ApiError(401, 'Invalid worker token')
  }
}

const stateSchema = z.object({ enabled: z.boolean(), updatedAt: z.string().nullable() })
const taskSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'done', 'failed']),
  createdAt: z.string(),
  createdBy: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  resultSummary: z.string().nullable(),
  outcome: z.string().nullable(),
  commitHash: z.string().nullable(),
})
const cycleSchema = z.object({
  id: z.string(),
  cycleNumber: z.number(),
  timestamp: z.string(),
  outcome: z.enum(['pushed', 'reverted', 'no-changes', 'error']),
  summary: z.string(),
  detail: z.string().nullable(),
  filesChanged: z.array(z.string()),
  commitHash: z.string().nullable(),
  taskId: z.string().nullable(),
})

export const autonomousWorkerRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get('/state', { preHandler: requireAdmin, schema: { response: { 200: stateSchema } } }, async (_request, reply) => {
    reply.send(await getState())
  })

  app.post(
    '/state',
    { preHandler: requireTopAdmin, schema: { body: z.object({ enabled: z.boolean() }), response: { 200: stateSchema } } },
    async (request, reply) => {
      reply.send(await setEnabled(request.body.enabled, request.authUser!.username))
    },
  )

  app.get('/tasks', { preHandler: requireAdmin, schema: { response: { 200: z.array(taskSchema) } } }, async (_request, reply) => {
    reply.send(await listTasks())
  })

  app.post(
    '/tasks',
    {
      preHandler: requireTopAdmin,
      schema: { body: z.object({ description: z.string().trim().min(1).max(2000) }), response: { 201: taskSchema } },
    },
    async (request, reply) => {
      reply.status(201).send(await queueTask(request.body.description, request.authUser!.username))
    },
  )

  app.delete(
    '/tasks/:id',
    { preHandler: requireTopAdmin, schema: { params: z.object({ id: z.string() }) } },
    async (request, reply) => {
      await cancelTask(request.params.id)
      reply.status(204).send()
    },
  )

  app.get('/cycles', { preHandler: requireAdmin, schema: { response: { 200: z.array(cycleSchema) } } }, async (_request, reply) => {
    reply.send(await listCycles())
  })

  app.delete('/history', { preHandler: requireTopAdmin }, async (_request, reply) => {
    await clearHistory()
    reply.status(204).send()
  })

  app.get(
    '/poll',
    {
      preHandler: requireWorkerToken,
      schema: { response: { 200: z.object({ enabled: z.boolean(), task: z.object({ id: z.string(), description: z.string() }).nullable() }) } },
    },
    async (_request, reply) => {
      reply.send(await pollForWorker())
    },
  )

  app.post(
    '/report',
    {
      preHandler: requireWorkerToken,
      schema: {
        body: z.object({
          cycleNumber: z.number(),
          timestamp: z.string(),
          outcome: z.enum(['pushed', 'reverted', 'no-changes', 'error']),
          summary: z.string(),
          detail: z.string().optional(),
          filesChanged: z.array(z.string()),
          commitHash: z.string().optional(),
          taskId: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      await reportCycle(request.body)
      reply.status(204).send()
    },
  )
}
