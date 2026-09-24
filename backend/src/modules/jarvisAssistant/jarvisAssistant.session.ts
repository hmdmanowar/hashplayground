import { join } from 'node:path'
import { Jarvis, OllamaModel, PermissionEngine, ToolRegistry, DEFAULT_PERMISSION_POLICY } from 'jarvis'
import { env } from '../../env.js'
import { createPersonalWorkspaceTools } from './jarvisAssistant.tools.js'

const PERSONAL_ASSISTANT_CONTEXT = `This is your personal Jarvis assistant on Hash Playground (hashplayground.in), private to this logged-in account. You have real tools — list_files/read_file/write_file/delete_file — against this user's own personal workspace (separate from any of their Playground projects). You do not have shell/command execution here; that's intentionally not available in this web context.

The chat UI renders any single \`\`\`html code block as a live, interactive preview (in a sandboxed iframe) right above the code itself — not just as text. So whenever the user asks you to "render", "show", "preview", or "demo" a UI component (a button, modal, card, form, etc.), respond with exactly ONE self-contained \`\`\`html code block that actually works when opened as-is: inline <style> and <script>, no external stylesheets/scripts/fonts/CDNs, no placeholders — real markup, real CSS, real JS event handlers wired up so the interaction genuinely works (e.g. a "render a modal" request means a real button in that HTML that opens a real modal when clicked, not just a static mockup or a text description of one). Keep any explanation brief and put it outside the code block, before or after it.`

// One live Jarvis instance per logged-in user, kept across requests so the
// approve/deny flow (Jarvis's pendingToolCall) can actually pause between an
// HTTP request that proposes a risky action and a later one that approves or
// denies it — a fresh instance per request has nowhere to hold that state.
// In-memory only: lost on a backend restart, same tradeoff Jarvis's own
// local api/server.ts already makes for its single shared instance.
interface Session {
  jarvis: Jarvis
  activeConversationId?: string
  lastUsedAt: number
}

const sessions = new Map<string, Session>()
const IDLE_EVICTION_MS = 30 * 60 * 1000

function evictIdleSessions(): void {
  const now = Date.now()
  for (const [username, session] of sessions) {
    if (now - session.lastUsedAt > IDLE_EVICTION_MS) sessions.delete(username)
  }
}

function auditLogPathFor(username: string): string {
  return join(process.cwd(), 'data', 'audit-logs', `user-${username}.jsonl`)
}

function buildJarvis(username: string): Jarvis {
  const model = new OllamaModel(env.OLLAMA_HOST, env.OLLAMA_CHAT_MODEL, env.OLLAMA_API_KEY)
  return new Jarvis(model, {
    assistantName: 'Jarvis',
    toolRegistry: ToolRegistry.fromTools(createPersonalWorkspaceTools(username)),
    permissionEngine: new PermissionEngine(auditLogPathFor(username), DEFAULT_PERMISSION_POLICY),
    extraContext: PERSONAL_ASSISTANT_CONTEXT,
  })
}

// Gets (or lazily creates) this user's session. Callers are responsible for
// loading the right conversation's history into it before sending a message
// — see ensureActiveConversation in jarvisAssistant.service.ts.
export function getOrCreateSession(username: string): Session {
  evictIdleSessions()
  let session = sessions.get(username)
  if (!session) {
    session = { jarvis: buildJarvis(username), lastUsedAt: Date.now() }
    sessions.set(username, session)
  }
  session.lastUsedAt = Date.now()
  return session
}
