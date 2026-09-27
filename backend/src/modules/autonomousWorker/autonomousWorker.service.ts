import type { AutonomousCycleLog, AutonomousTask } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'

const STATE_ID = 1

// A transient `error` outcome (a model timeout, a network blip) gets
// re-queued automatically rather than failing the task outright — only
// after this many attempts is it left as a permanent `failed` for a human
// to look at or retry manually. A stale reclaim (see pollForWorker) counts
// as an attempt too, so a task can't loop forever between "claimed, worker
// dies" and "reclaimed" without ever counting toward the limit.
const MAX_TASK_ATTEMPTS = 3
// Comfortably longer than any single cycle should ever take (repo_* tool
// calls, npm test/build, git push) — a task still `in_progress` past this
// almost certainly means the run that claimed it died or got cancelled
// mid-work, not that it's genuinely still going.
const STALE_TASK_MS = 15 * 60 * 1000

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
    attempts: task.attempts,
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

// A manual retry after the automatic bounded retries (see MAX_TASK_ATTEMPTS)
// are exhausted — a fresh start rather than another bounded attempt, since a
// human has now looked at why it failed and decided it's worth trying again.
export async function retryTask(id: string) {
  const task = await prisma.autonomousTask.findUnique({ where: { id } })
  if (!task) throw new ApiError(404, 'Task not found')
  if (task.status !== 'failed') throw new ApiError(409, 'Only a failed task can be retried')
  const retried = await prisma.autonomousTask.update({
    where: { id },
    data: { status: 'pending', attempts: 0, startedAt: null, completedAt: null, resultSummary: null, outcome: null },
  })
  return toTaskDto(retried)
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

// A task left `in_progress` past STALE_TASK_MS means whatever run claimed it
// (a killed/cancelled CI job, a crashed local process) never reported back —
// reclaim it to `pending` so the next poll can pick it up again, rather than
// leaving it stuck forever. Counts as an attempt, same as a reported `error`.
async function reclaimStaleTasks(): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_TASK_MS)
  await prisma.autonomousTask.updateMany({
    where: { status: 'in_progress', startedAt: { lt: staleBefore } },
    data: { status: 'pending', attempts: { increment: 1 } },
  })
}

// Called by the worker itself (see autonomousWorker.routes.ts's token-gated
// /poll route) — atomically claims the oldest pending task, if any, so a
// second poll before the first one's /report lands doesn't hand out the
// same task twice.
export async function pollForWorker() {
  const state = await getState()
  if (!state.enabled) return { enabled: false, task: null }

  await reclaimStaleTasks()

  const next = await prisma.autonomousTask.findFirst({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } })
  if (!next) return { enabled: true, task: null }
  if (next.attempts >= MAX_TASK_ATTEMPTS) {
    await prisma.autonomousTask.update({
      where: { id: next.id },
      data: { status: 'failed', completedAt: new Date(), resultSummary: 'Exceeded the maximum retry attempts.' },
    })
    return { enabled: true, task: null }
  }

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
    if (report.outcome === 'error') {
      const task = await prisma.autonomousTask.findUnique({ where: { id: report.taskId } })
      const attempts = (task?.attempts ?? 0) + 1
      const exhausted = attempts >= MAX_TASK_ATTEMPTS
      await prisma.autonomousTask.update({
        where: { id: report.taskId },
        data: {
          // A transient error gets one more shot at the next poll instead of
          // failing outright — only `pending` (not `in_progress`) is picked
          // up again, so this doubles as releasing the claim from this run.
          status: exhausted ? 'failed' : 'pending',
          attempts,
          resultSummary: report.summary,
          outcome: report.outcome,
          ...(exhausted ? { completedAt: new Date() } : {}),
        },
      })
    } else {
      await prisma.autonomousTask.update({
        where: { id: report.taskId },
        data: {
          status: 'done',
          completedAt: new Date(),
          resultSummary: report.summary,
          outcome: report.outcome,
          commitHash: report.commitHash,
        },
      })
    }
  }
}
