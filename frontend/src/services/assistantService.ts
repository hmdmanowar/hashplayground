import { request } from '../lib/apiClient'

export interface AssistantInfo {
  assistantName: string
  model: string
}

export interface ConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  createdAt: string
}

export interface PendingApproval {
  tool: string
  args: Record<string, unknown>
  risk: string
}

export interface AnonymousHistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

export function fetchInfo(): Promise<AssistantInfo> {
  return request<AssistantInfo>('/assistant/info')
}

export function listConversations(): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>('/assistant/conversations')
}

export function getConversationMessages(id: string): Promise<ConversationMessage[]> {
  return request<ConversationMessage[]>(`/assistant/conversations/${encodeURIComponent(id)}/messages`)
}

export function renameConversation(id: string, title: string): Promise<void> {
  return request<void>(`/assistant/conversations/${encodeURIComponent(id)}`, { method: 'PATCH', body: { title } })
}

export function deleteConversation(id: string): Promise<void> {
  return request<void>(`/assistant/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function truncateConversation(id: string, keepCount: number): Promise<void> {
  return request<void>(`/assistant/conversations/${encodeURIComponent(id)}/truncate`, {
    method: 'POST',
    body: { keepCount },
  })
}

// `history` only matters for an anonymous (not-logged-in) visitor — the
// backend has nothing server-side to resume for them, unlike a real
// conversationId, so the client resends its own trimmed transcript each time.
export function sendMessage(
  message: string,
  conversationId: string | undefined,
  images?: string[],
  history?: AnonymousHistoryEntry[],
): Promise<{ reply: string; conversationId: string | null; pendingApproval: PendingApproval | null; remaining: number | null }> {
  return request('/assistant/chat', { method: 'POST', body: { message, conversationId, images, history } })
}

export function resetConversation(): Promise<void> {
  return request<void>('/assistant/reset', { method: 'POST' })
}
