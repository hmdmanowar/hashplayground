import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'

export const BROADCAST_RECIPIENT = 'all'

export interface NotificationDto {
  id: string
  toUsername: string
  fromUsername: string
  kind: 'message' | 'alert' | 'activity'
  message: string
  link?: string
  createdAt: string
  readBy: string[]
}

function toDto(notification: {
  id: string
  toUsername: string
  fromUsername: string
  kind: string
  message: string
  link: string | null
  createdAt: Date
  readBy: string[]
}): NotificationDto {
  return {
    id: notification.id,
    toUsername: notification.toUsername,
    fromUsername: notification.fromUsername,
    kind: notification.kind as NotificationDto['kind'],
    message: notification.message,
    link: notification.link ?? undefined,
    createdAt: notification.createdAt.toISOString(),
    readBy: notification.readBy,
  }
}

// Recipient = addressed to this user specifically, or a broadcast — but
// never something the user sent themselves (an admin broadcasting to "all"
// shouldn't see it in their own inbox).
function recipientWhere(username: string) {
  return {
    fromUsername: { not: username },
    OR: [{ toUsername: username }, { toUsername: BROADCAST_RECIPIENT }],
  }
}

export async function listNotificationsForUser(username: string): Promise<NotificationDto[]> {
  const notifications = await prisma.notification.findMany({
    where: recipientWhere(username),
    orderBy: { createdAt: 'desc' },
  })
  return notifications.map(toDto)
}

export async function getUnreadCount(username: string): Promise<number> {
  const notifications = await prisma.notification.findMany({
    where: recipientWhere(username),
    select: { readBy: true },
  })
  return notifications.filter((n) => !n.readBy.includes(username)).length
}

// All-or-nothing per bell-open, not per-item — matches today's behavior.
export async function markAllAsRead(username: string): Promise<void> {
  const notifications = await prisma.notification.findMany({
    where: { ...recipientWhere(username), NOT: { readBy: { has: username } } },
    select: { id: true, readBy: true },
  })
  await prisma.$transaction(
    notifications.map((n) =>
      prisma.notification.update({ where: { id: n.id }, data: { readBy: { push: username } } }),
    ),
  )
}

export async function sendNotification(
  fromUsername: string,
  toUsername: string,
  kind: 'message' | 'alert',
  message: string,
  link?: string,
): Promise<NotificationDto> {
  if (toUsername !== BROADCAST_RECIPIENT) {
    const target = await prisma.user.findUnique({ where: { username: toUsername } })
    if (!target) throw new ApiError(404, 'Recipient not found')
  }
  const notification = await prisma.notification.create({
    data: { toUsername, fromUsername, kind, message, link },
  })
  return toDto(notification)
}

export async function listAllNotifications(): Promise<NotificationDto[]> {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } })
  return notifications.map(toDto)
}
