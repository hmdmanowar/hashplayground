import { request } from '../lib/apiClient'

export interface PendingApproval {
  tool: string
  args: Record<string, unknown>
  risk: string
}

export function sendAssistantMessage(
  projectId: string,
  message: string,
): Promise<{ reply: string; pendingApproval: PendingApproval | null }> {
  return request(`/projects/${encodeURIComponent(projectId)}/assistant/chat`, { method: 'POST', body: { message } })
}

export function resetAssistantSession(projectId: string): Promise<void> {
  return request<void>(`/projects/${encodeURIComponent(projectId)}/assistant/reset`, { method: 'POST' })
}
