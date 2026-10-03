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

// A product that raises its own notifications (sent as that fromUsername);
// passing it narrows the bell to just those.
export type NotificationSource = 'billflow'

const sourceQuery = (source?: NotificationSource) => (source ? `?source=${source}` : '')

export async function listNotificationsForUser(source?: NotificationSource): Promise<Notification[]> {
  return request<Notification[]>(`/notifications${sourceQuery(source)}`)
}

export async function getUnreadCount(source?: NotificationSource): Promise<number> {
  const { count } = await request<{ count: number }>(`/notifications/unread-count${sourceQuery(source)}`)
  return count
}

export async function markAllAsRead(source?: NotificationSource): Promise<void> {
  await request(`/notifications/read-all${sourceQuery(source)}`, { method: 'POST' })
}

// Every notification ever sent, admin-composed and system-generated alike —
// used for the admin "sent history" view (which further filters by kind).
export async function listAllNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/notifications/all')
}
