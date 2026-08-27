import type { FeedbackStatus, FeedbackType } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'

export interface FeedbackStatusChangeDto {
  status: FeedbackStatus
  changedAt: string
  changedByUsername?: string
  changedByName?: string
}

export interface FeedbackDto {
  id: string
  type: FeedbackType
  message: string
  imageData?: string
  status: FeedbackStatus
  username: string
  name?: string
  createdAt: string
  statusUpdatedAt: string
  statusHistory: FeedbackStatusChangeDto[]
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

const historyInclude = {
  orderBy: { changedAt: 'asc' as const },
  include: { changedByUser: { select: { name: true } } },
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
  statusHistory: {
    status: FeedbackStatus
    changedAt: Date
    changedBy: string | null
    changedByUser: { name: string | null } | null
  }[]
}): FeedbackDto {
  const latestChange = feedback.statusHistory[feedback.statusHistory.length - 1]
  return {
    id: feedback.id,
    type: feedback.type,
    message: feedback.message,
    imageData: feedback.imageData ?? undefined,
    status: feedback.status,
    username: feedback.username,
    name: feedback.user.name ?? undefined,
    createdAt: feedback.createdAt.toISOString(),
    statusUpdatedAt: (latestChange?.changedAt ?? feedback.createdAt).toISOString(),
    statusHistory: feedback.statusHistory.map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt.toISOString(),
      changedByUsername: entry.changedBy ?? undefined,
      changedByName: entry.changedByUser?.name ?? undefined,
    })),
  }
}

export async function submitFeedback(username: string, input: SubmitFeedbackInput): Promise<FeedbackDto> {
  const feedback = await prisma.feedback.create({
    data: {
      username,
      type: input.type,
      message: input.message,
      imageData: input.imageData,
      // Seeds the timeline with its starting state, attributed to the
      // submitter themselves — they're the one who opened it.
      statusHistory: { create: { status: 'open', changedBy: username } },
    },
    include: { user: { select: { name: true } }, statusHistory: historyInclude },
  })
  return toDto(feedback)
}

export async function listFeedback(): Promise<FeedbackDto[]> {
  const rows = await prisma.feedback.findMany({
    include: { user: { select: { name: true } }, statusHistory: historyInclude },
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

  // A no-op PATCH (re-saving the same status) updates nothing and leaves the
  // timeline untouched — only a genuine transition gets its own history row.
  const statusChanged = existing.status !== status

  const updated = await prisma.$transaction(async (tx) => {
    if (statusChanged) {
      await tx.feedbackStatusChange.create({
        data: { feedbackId: id, status, changedBy: actingUsername },
      })
    }
    return tx.feedback.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true } }, statusHistory: historyInclude },
    })
  })

  // Only the submitter cares, and only when the status actually changed —
  // an admin re-saving the same status (or a no-op PATCH) shouldn't spam them.
  if (statusChanged) {
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
