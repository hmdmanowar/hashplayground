import { Jarvis, OllamaModel } from 'jarvis'
import type { JarvisConversation, JarvisMessage } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../env.js'
import { ApiError } from '../../middleware/errorHandler.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'
import { getOrCreateSession } from './jarvisAssistant.session.js'

// Not logged in yet: chat-only (no tools, no persisted history — the client
// resends its own trimmed transcript each request, like the old public demo)
// and capped so this stays a "try before you sign up" experience rather than
// a free unlimited chat endpoint.
const ANON_MESSAGE_LIMIT = 5
const ANON_MAX_HISTORY = 10
const ANON_CONTEXT = `This is a free preview of you (Jarvis) on Hash Playground (hashplayground.in) for a visitor who hasn't logged in yet. Be upfront if asked: this preview is chat-only (no file tools) and capped at a few messages — logging in unlocks a full personal assistant with real file tools and saved conversation history.`

// Mirrors Jarvis's own standalone web/CLI api server (src/api/server.ts's
// autoTitle) — a new conversation is titled from its first message instead
// of staying "New chat" forever, since nothing else here ever renames it.
function autoTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ')
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed
}

function toConversationDto(conversation: JarvisConversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  }
}

function toMessageDto(message: JarvisMessage) {
  return {
    role: message.role as 'user' | 'assistant',
    content: message.content,
    images: (message.images as string[] | null) ?? undefined,
    createdAt: message.createdAt.toISOString(),
  }
}

// Same 404-for-both-cases pattern as loadAccessibleProject — a conversation
// that exists but belongs to someone else looks identical to one that
// doesn't exist at all.
async function loadOwnConversation(conversationId: string, viewer: AuthenticatedUser): Promise<JarvisConversation> {
  const conversation = await prisma.jarvisConversation.findUnique({ where: { id: conversationId } })
  if (!conversation || conversation.ownerUsername !== viewer.username) {
    throw new ApiError(404, 'Conversation not found')
  }
  return conversation
}

export function getInfo() {
  return { assistantName: 'Jarvis', model: env.OLLAMA_CHAT_MODEL }
}

export async function listConversations(viewer: AuthenticatedUser) {
  const conversations = await prisma.jarvisConversation.findMany({
    where: { ownerUsername: viewer.username },
    orderBy: { updatedAt: 'desc' },
  })
  return conversations.map(toConversationDto)
}

export async function getMessages(viewer: AuthenticatedUser, conversationId: string) {
  await loadOwnConversation(conversationId, viewer)
  const messages = await prisma.jarvisMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })
  return messages.map(toMessageDto)
}

export async function renameConversation(viewer: AuthenticatedUser, conversationId: string, title: string) {
  await loadOwnConversation(conversationId, viewer)
  await prisma.jarvisConversation.update({ where: { id: conversationId }, data: { title } })
}

export async function deleteConversation(viewer: AuthenticatedUser, conversationId: string) {
  await loadOwnConversation(conversationId, viewer)
  await prisma.jarvisConversation.delete({ where: { id: conversationId } })
  const session = getOrCreateSession(viewer.username)
  if (session.activeConversationId === conversationId) session.activeConversationId = undefined
}

// Drops a message and everything after it — used for "edit and regenerate."
export async function truncateConversation(viewer: AuthenticatedUser, conversationId: string, keepCount: number) {
  await loadOwnConversation(conversationId, viewer)
  const toKeep = await prisma.jarvisMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: keepCount,
    select: { id: true },
  })
  const keepIds = new Set(toKeep.map((m) => m.id))
  await prisma.jarvisMessage.deleteMany({
    where: { conversationId, id: { notIn: [...keepIds] } },
  })
}

async function ensureActiveConversation(
  viewer: AuthenticatedUser,
  conversationId: string | undefined,
  firstMessage: string,
): Promise<string> {
  const session = getOrCreateSession(viewer.username)

  if (conversationId) {
    await loadOwnConversation(conversationId, viewer)
    if (session.activeConversationId !== conversationId) {
      const history = await prisma.jarvisMessage.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } })
      session.jarvis.loadHistory(
        history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, images: (m.images as string[] | null) ?? undefined })),
      )
      session.activeConversationId = conversationId
    }
    return conversationId
  }

  const created = await prisma.jarvisConversation.create({
    data: { ownerUsername: viewer.username, title: autoTitle(firstMessage) },
  })
  session.jarvis.loadHistory([])
  session.activeConversationId = created.id
  return created.id
}

export async function sendMessage(
  viewer: AuthenticatedUser,
  conversationId: string | undefined,
  message: string,
  images?: string[],
) {
  if (!env.OLLAMA_API_KEY) {
    throw new ApiError(503, 'The Jarvis assistant is not configured yet — missing OLLAMA_API_KEY.')
  }

  const activeId = await ensureActiveConversation(viewer, conversationId, message)
  const session = getOrCreateSession(viewer.username)

  await prisma.jarvisMessage.create({ data: { conversationId: activeId, role: 'user', content: message, images } })

  const reply = await session.jarvis.handleInput(message, images)

  await prisma.jarvisMessage.create({ data: { conversationId: activeId, role: 'assistant', content: reply } })
  await prisma.jarvisConversation.update({ where: { id: activeId }, data: { updatedAt: new Date() } })

  return { reply, conversationId: activeId, pendingApproval: session.jarvis.getPendingToolCall() ?? null }
}

// Starts a brand-new conversation on the next message, without deleting the
// one just left — mirrors Jarvis's own web UI's "New chat" (resetConversation
// + clearing the local transcript), just without a dedicated empty row.
export async function resetConversation(viewer: AuthenticatedUser) {
  const session = getOrCreateSession(viewer.username)
  session.jarvis.loadHistory([])
  session.activeConversationId = undefined
}

export interface AnonymousHistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

// Enforced against Postgres (not an in-memory counter) so a backend restart
// or a second instance can't silently reset everyone's free-message count.
export async function sendAnonymousMessage(anonId: string, message: string, history: AnonymousHistoryEntry[]) {
  if (!env.OLLAMA_API_KEY) {
    throw new ApiError(503, 'The Jarvis assistant is not configured yet — missing OLLAMA_API_KEY.')
  }

  const usage = await prisma.anonymousChatUsage.upsert({
    where: { id: anonId },
    create: { id: anonId },
    update: {},
  })
  if (usage.count >= ANON_MESSAGE_LIMIT) {
    throw new ApiError(403, "You've used your free messages with Jarvis — log in to keep chatting.", 'LOGIN_REQUIRED')
  }

  const model = new OllamaModel(env.OLLAMA_HOST, env.OLLAMA_CHAT_MODEL, env.OLLAMA_API_KEY)
  const jarvis = new Jarvis(model, { assistantName: 'Jarvis', extraContext: ANON_CONTEXT })
  jarvis.loadHistory(history.slice(-ANON_MAX_HISTORY))
  const reply = await jarvis.chat(message)

  const updated = await prisma.anonymousChatUsage.update({ where: { id: anonId }, data: { count: { increment: 1 } } })
  return { reply, remaining: Math.max(0, ANON_MESSAGE_LIMIT - updated.count) }
}
