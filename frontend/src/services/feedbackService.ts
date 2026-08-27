import { request } from '../lib/apiClient'

export type FeedbackType = 'bug' | 'feature'
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved'

export interface FeedbackStatusChange {
  status: FeedbackStatus
  changedAt: string
  changedByUsername?: string
  changedByName?: string
}

export interface FeedbackRecord {
  id: string
  type: FeedbackType
  message: string
  imageData?: string
  status: FeedbackStatus
  username: string
  name?: string
  createdAt: string
  statusUpdatedAt: string
  statusHistory: FeedbackStatusChange[]
}

export interface SubmitFeedbackInput {
  type: FeedbackType
  message: string
  imageData?: string
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<FeedbackRecord> {
  return request<FeedbackRecord>('/feedback', { method: 'POST', body: input })
}

export async function listFeedback(): Promise<FeedbackRecord[]> {
  return request<FeedbackRecord[]>('/feedback')
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<FeedbackRecord> {
  return request<FeedbackRecord>(`/feedback/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
}
