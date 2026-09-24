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

export function listCycles(): Promise<CycleLogEntry[]> {
  return request<CycleLogEntry[]>('/autonomous-worker/cycles')
}
