import type { FeedbackStatus, FeedbackType } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'

export interface FeedbackDto {
  id: string
  type: FeedbackType
  message: string
  imageData?: string
  status: FeedbackStatus
  username: string
  name?: string
  createdAt: string
}

export interface SubmitFeedbackInput {
  type: FeedbackType
  message: string
  imageData?: string
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

function toDto(feedback: {
  id: string
  type: FeedbackType
  message: string
  imageData: string | null
  status: FeedbackStatus
  username: string
  createdAt: Date
  user: { name: string | null }
}): FeedbackDto {
  return {
    id: feedback.id,
    type: feedback.type,
    message: feedback.message,
    imageData: feedback.imageData ?? undefined,
    status: feedback.status,
    username: feedback.username,
    name: feedback.user.name ?? undefined,
    createdAt: feedback.createdAt.toISOString(),
  }
}

export async function submitFeedback(username: string, input: SubmitFeedbackInput): Promise<FeedbackDto> {
  const feedback = await prisma.feedback.create({
    data: { username, type: input.type, message: input.message, imageData: input.imageData },
    include: { user: { select: { name: true } } },
  })
  return toDto(feedback)
}

export async function listFeedback(): Promise<FeedbackDto[]> {
  const rows = await prisma.feedback.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toDto)
}

function truncate(message: string, max = 60): string {
  return message.length > max ? `${message.slice(0, max)}…` : message
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  actingUsername: string,
): Promise<FeedbackDto> {
  const existing = await prisma.feedback.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Feedback not found')

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status },
    include: { user: { select: { name: true } } },
  })

  // Only the submitter cares, and only when the status actually changed —
  // an admin re-saving the same status (or a no-op PATCH) shouldn't spam them.
  if (existing.status !== status) {
    const kindLabel = existing.type === 'bug' ? 'bug report' : 'feature request'
    await prisma.notification.create({
      data: {
        toUsername: existing.username,
        fromUsername: actingUsername,
        kind: 'message',
        message: `Your ${kindLabel} "${truncate(existing.message)}" is now marked as ${STATUS_LABELS[status]}.`,
      },
    })
  }

  return toDto(updated)
}
