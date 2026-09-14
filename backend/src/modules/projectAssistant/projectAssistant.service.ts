import { env } from '../../env.js'
import { ApiError } from '../../middleware/errorHandler.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'
import { loadAccessibleProject } from '../projects/projects.service.js'
import { getOrCreateSession, clearSession } from './projectAssistant.session.js'

export async function sendMessage(projectId: string, viewer: AuthenticatedUser, message: string) {
  await loadAccessibleProject(projectId, viewer)

  if (!env.OLLAMA_API_KEY) {
    throw new ApiError(503, 'The Jarvis assistant is not configured yet — missing OLLAMA_API_KEY.')
  }

  const session = getOrCreateSession(projectId, viewer)
  const reply = await session.jarvis.handleInput(message)
  return { reply, pendingApproval: session.jarvis.getPendingToolCall() ?? null }
}

// Starts a fresh session on the next message — used when a project's
// assistant panel is reset, mirroring the personal assistant's "New chat".
export async function resetSession(projectId: string, viewer: AuthenticatedUser) {
  await loadAccessibleProject(projectId, viewer)
  clearSession(projectId)
}
