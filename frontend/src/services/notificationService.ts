import { request } from '../lib/apiClient'

export type NotificationKind = 'message' | 'alert' | 'activity'
type ComposableNotificationKind = 'message' | 'alert'

export const BROADCAST_RECIPIENT = 'all'

export interface Notification {
  id: string
  toUsername: string
  fromUsername: string
  kind: NotificationKind
  message: string
  link?: string
  createdAt: string
  readBy: string[]
}

// fromUsername is never passed — the backend derives it from the session,
// never trusting a client-supplied sender.
export async function sendNotification(
  toUsername: string,
  kind: ComposableNotificationKind,
  message: string,
  link?: string,
): Promise<Notification> {
  return request<Notification>('/notifications', { method: 'POST', body: { toUsername, kind, message, link } })
}

export async function listNotificationsForUser(): Promise<Notification[]> {
  return request<Notification[]>('/notifications')
}

export async function getUnreadCount(): Promise<number> {
  const { count } = await request<{ count: number }>('/notifications/unread-count')
  return count
}

export async function markAllAsRead(): Promise<void> {
  await request('/notifications/read-all', { method: 'POST' })
}

// Every notification ever sent, admin-composed and system-generated alike —
// used for the admin "sent history" view (which further filters by kind).
export async function listAllNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/notifications/all')
}
