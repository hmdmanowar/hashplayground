import { join } from 'node:path'
import { Jarvis, OllamaModel, PermissionEngine, ToolRegistry, DEFAULT_PERMISSION_POLICY } from 'jarvis'
import { env } from '../../env.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'
import { createProjectFileTools } from './projectAssistant.tools.js'

const PROJECT_ASSISTANT_CONTEXT = `You are embedded as a panel inside the Hash Playground IDE (hashplayground.in), scoped to one specific open project. You have real tools — list_project_files/read_project_file/write_project_file/delete_project_file — against this project's own files. You do not have shell/command execution here; that's intentionally not available in this web context.`

// One live Jarvis instance per project, kept across requests so the
// approve/deny flow (Jarvis's pendingToolCall) can pause between an HTTP
// request that proposes a risky action and a later one that approves or
// denies it. In-memory only: lost on a backend restart, same tradeoff the
// personal assistant's session cache already makes.
interface Session {
  jarvis: Jarvis
  lastUsedAt: number
}

const sessions = new Map<string, Session>()
const IDLE_EVICTION_MS = 30 * 60 * 1000

function evictIdleSessions(): void {
  const now = Date.now()
  for (const [projectId, session] of sessions) {
    if (now - session.lastUsedAt > IDLE_EVICTION_MS) sessions.delete(projectId)
  }
}

function auditLogPathFor(projectId: string): string {
  return join(process.cwd(), 'data', 'audit-logs', `project-${projectId}.jsonl`)
}

function buildJarvis(projectId: string, viewer: AuthenticatedUser): Jarvis {
  const model = new OllamaModel(env.OLLAMA_HOST, env.OLLAMA_CHAT_MODEL, env.OLLAMA_API_KEY)
  return new Jarvis(model, {
    assistantName: 'Jarvis',
    toolRegistry: ToolRegistry.fromTools(createProjectFileTools(projectId, viewer)),
    permissionEngine: new PermissionEngine(auditLogPathFor(projectId), DEFAULT_PERMISSION_POLICY),
    extraContext: PROJECT_ASSISTANT_CONTEXT,
  })
}

export function getOrCreateSession(projectId: string, viewer: AuthenticatedUser): Session {
  evictIdleSessions()
  let session = sessions.get(projectId)
  if (!session) {
    session = { jarvis: buildJarvis(projectId, viewer), lastUsedAt: Date.now() }
    sessions.set(projectId, session)
  }
  session.lastUsedAt = Date.now()
  return session
}

export function clearSession(projectId: string): void {
  sessions.delete(projectId)
}
