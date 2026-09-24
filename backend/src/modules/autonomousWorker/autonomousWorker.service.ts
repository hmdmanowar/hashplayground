import type { AutonomousCycleLog, AutonomousTask } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'

const STATE_ID = 1

function toTaskDto(task: AutonomousTask) {
  return {
    id: task.id,
    description: task.description,
    status: task.status as 'pending' | 'in_progress' | 'done' | 'failed',
    createdAt: task.createdAt.toISOString(),
    createdBy: task.createdBy,
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    resultSummary: task.resultSummary,
    outcome: task.outcome,
    commitHash: task.commitHash,
  }
}

function toCycleDto(cycle: AutonomousCycleLog) {
  return {
    id: cycle.id,
    cycleNumber: cycle.cycleNumber,
    timestamp: cycle.timestamp.toISOString(),
    outcome: cycle.outcome as 'pushed' | 'reverted' | 'no-changes' | 'error',
    summary: cycle.summary,
    detail: cycle.detail,
    filesChanged: (cycle.filesChanged as string[] | null) ?? [],
    commitHash: cycle.commitHash,
    taskId: cycle.taskId,
  }
}

export async function getState() {
  const row = await prisma.autonomousWorkerState.findUnique({ where: { id: STATE_ID } })
  return { enabled: row?.enabled ?? false, updatedAt: row?.updatedAt.toISOString() ?? null }
}

export async function setEnabled(enabled: boolean, updatedBy: string) {
  const row = await prisma.autonomousWorkerState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, enabled, updatedBy },
    update: { enabled, updatedBy },
  })
  return { enabled: row.enabled, updatedAt: row.updatedAt.toISOString() }
}

export async function listTasks() {
  const tasks = await prisma.autonomousTask.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return tasks.map(toTaskDto)
}

export async function queueTask(description: string, createdBy: string) {
  const task = await prisma.autonomousTask.create({ data: { description, createdBy } })
  return toTaskDto(task)
}

export async function cancelTask(id: string) {
  const task = await prisma.autonomousTask.findUnique({ where: { id } })
  if (!task) throw new ApiError(404, 'Task not found')
  if (task.status !== 'pending') throw new ApiError(409, 'Only a pending task can be cancelled')
  await prisma.autonomousTask.delete({ where: { id } })
}

export async function listCycles() {
  const cycles = await prisma.autonomousCycleLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 })
  return cycles.map(toCycleDto)
}

// Clears past activity only — pending/in_progress tasks are left alone since
// those are still live work, not history, and deleting an in-progress one
// out from under the worker would orphan whatever /report call comes next.
export async function clearHistory() {
  await prisma.autonomousCycleLog.deleteMany({})
  await prisma.autonomousTask.deleteMany({ where: { status: { in: ['done', 'failed'] } } })
}

// Called by the worker itself (see autonomousWorker.routes.ts's token-gated
// /poll route) — atomically claims the oldest pending task, if any, so a
// second poll before the first one's /report lands doesn't hand out the
// same task twice.
export async function pollForWorker() {
  const state = await getState()
  if (!state.enabled) return { enabled: false, task: null }

  const next = await prisma.autonomousTask.findFirst({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } })
  if (!next) return { enabled: true, task: null }

  const claimed = await prisma.autonomousTask.update({
    where: { id: next.id },
    data: { status: 'in_progress', startedAt: new Date() },
  })
  return { enabled: true, task: { id: claimed.id, description: claimed.description } }
}

export interface CycleReport {
  cycleNumber: number
  timestamp: string
  outcome: 'pushed' | 'reverted' | 'no-changes' | 'error'
  summary: string
  detail?: string
  filesChanged: string[]
  commitHash?: string
  taskId?: string
}

export async function reportCycle(report: CycleReport) {
  await prisma.autonomousCycleLog.create({
    data: {
      cycleNumber: report.cycleNumber,
      timestamp: new Date(report.timestamp),
      outcome: report.outcome,
      summary: report.summary,
      detail: report.detail,
      filesChanged: report.filesChanged,
      commitHash: report.commitHash,
      taskId: report.taskId,
    },
  })

  if (report.taskId) {
    await prisma.autonomousTask.update({
      where: { id: report.taskId },
      data: {
        status: report.outcome === 'error' ? 'failed' : 'done',
        completedAt: new Date(),
        resultSummary: report.summary,
        outcome: report.outcome,
        commitHash: report.commitHash,
      },
    })
  }
}
