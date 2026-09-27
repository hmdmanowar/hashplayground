import { request } from '../lib/apiClient'

export interface WorkerState {
  enabled: boolean
  updatedAt: string | null
}

export interface AutonomousTask {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'done' | 'failed'
  createdAt: string
  createdBy: string
  startedAt: string | null
  completedAt: string | null
  resultSummary: string | null
  outcome: string | null
  commitHash: string | null
  attempts: number
}

export interface CycleLogEntry {
  id: string
  cycleNumber: number
  timestamp: string
  outcome: 'pushed' | 'reverted' | 'no-changes' | 'error'
  summary: string
  detail: string | null
  filesChanged: string[]
  commitHash: string | null
  taskId: string | null
}

export function getWorkerState(): Promise<WorkerState> {
  return request<WorkerState>('/autonomous-worker/state')
}

export function setWorkerEnabled(enabled: boolean): Promise<WorkerState> {
  return request<WorkerState>('/autonomous-worker/state', { method: 'POST', body: { enabled } })
}

export function listTasks(): Promise<AutonomousTask[]> {
  return request<AutonomousTask[]>('/autonomous-worker/tasks')
}

export function queueTask(description: string): Promise<AutonomousTask> {
  return request<AutonomousTask>('/autonomous-worker/tasks', { method: 'POST', body: { description } })
}

export function cancelTask(id: string): Promise<void> {
  return request<void>(`/autonomous-worker/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function retryTask(id: string): Promise<AutonomousTask> {
  return request<AutonomousTask>(`/autonomous-worker/tasks/${encodeURIComponent(id)}/retry`, { method: 'POST' })
}

export function listCycles(): Promise<CycleLogEntry[]> {
  return request<CycleLogEntry[]>('/autonomous-worker/cycles')
}

export function clearHistory(): Promise<void> {
  return request<void>('/autonomous-worker/history', { method: 'DELETE' })
}

export interface DiffFile {
  filename: string
  status: string
  additions: number
  deletions: number
  patch: string | null
}

export interface BranchStatus {
  exists: boolean
  aheadBy: number
  files: DiffFile[]
  tokenConfigured: boolean
}

export function getBranchStatus(): Promise<BranchStatus> {
  return request<BranchStatus>('/autonomous-worker/branch-status')
}

export interface ConflictFile {
  path: string
  baseContent: string | null
  headContent: string | null
  binary: boolean
}

export interface MergeConflict {
  baseSha: string
  headSha: string
  mergeBaseSha: string
  files: ConflictFile[]
}

export type MergeOutcome = { ok: true; commitSha: string } | { ok: false; conflict: MergeConflict }

export type MergeDirection = 'merge-to-main' | 'sync-from-main'

export function mergeToMain(): Promise<MergeOutcome> {
  return request<MergeOutcome>('/autonomous-worker/merge-to-main', { method: 'POST' })
}

export function syncFromMain(): Promise<MergeOutcome> {
  return request<MergeOutcome>('/autonomous-worker/sync-from-main', { method: 'POST' })
}

export function resolveConflict(direction: MergeDirection, resolutions: { path: string; content: string }[]): Promise<{ commitSha: string }> {
  return request<{ commitSha: string }>('/autonomous-worker/resolve-conflict', { method: 'POST', body: { direction, resolutions } })
}
