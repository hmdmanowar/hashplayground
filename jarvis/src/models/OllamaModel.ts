import type { AIModel, ModelRequest, ModelResponse } from './AIModel.js'

// Brace-depth-counted extraction (not a naive non-greedy regex, which breaks
// on the nested objects a real tool call's `args` can contain, e.g.
// write_project_file's own {path, content}) — finds the first balanced
// {...} starting at `from`.
function extractBalancedJson(text: string, from: number): string | null {
  const start = text.indexOf('{', from)
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

// Talks to an Ollama-compatible chat API — see https://github.com/ollama/ollama
// for the API this targets. Assumes the model has already been pulled
// (`ollama pull <model>`) for a local host; Ollama returns a clear error in
// the response body if it hasn't, which we surface as a thrown error rather
// than swallowing. `apiKey` is optional and only needed against Ollama Cloud
// (a local Ollama instance needs no auth) — passing it adds a standard
// Bearer Authorization header, otherwise this behaves exactly as before.
// A hosted/shared Ollama endpoint (notably Ollama Cloud's free tier) can
// queue a request for minutes under load rather than fail outright — live
// testing saw a single call take over 5 minutes. Left unbounded, that hangs
// an entire HTTP request (and the UI waiting on it) for just as long with no
// feedback. Fail fast instead with a clear, catchable error.
const DEFAULT_REQUEST_TIMEOUT_MS = 45_000

export class OllamaModel implements AIModel {
  constructor(
    private readonly host: string,
    private readonly model: string,
    private readonly apiKey?: string,
    // Callers with no UI waiting on the response (the autonomous worker,
    // notably) can pass a longer budget — a background retry costs nothing,
    // where an interactive request left unbounded can hang the caller for
    // as long as a loaded shared Ollama instance takes.
    private readonly timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
  ) {}

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    let response: Response
    try {
      response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          stream: false,
        }),
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama did not respond within ${this.timeoutMs / 1000}s — it may be overloaded right now. Please try again.`)
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Ollama request failed (${response.status}): ${body || response.statusText}`)
    }

    const data = (await response.json()) as {
      message?: {
        content?: string
        tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[]
      }
      error?: string
    }
    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`)
    }

    // Some cloud models (e.g. gpt-oss) are tuned to use Ollama's native
    // structured tool-calling channel on their own initiative — even though
    // we never pass a `tools` array in the request — leaving `content`
    // empty and the call sitting in `tool_calls` instead. Jarvis's own
    // protocol is a plain-text "TOOL_CALL: {...}" marker in `content` (see
    // core/Jarvis.ts's parseToolCall), so translate the first native call
    // into that same shape rather than raising "empty response" and losing
    // the model's actual intent.
    const nativeCall = data.message?.tool_calls?.[0]
    if (!data.message?.content && nativeCall) {
      return { content: `TOOL_CALL: ${JSON.stringify({ tool: nativeCall.function.name, args: nativeCall.function.arguments })}` }
    }

    if (!data.message?.content) {
      throw new Error('Ollama returned an empty response')
    }

    // gpt-oss models occasionally leak their internal "Harmony" response
    // format straight into `content` instead of a clean tool_calls entry —
    // observed live as `...to=TOOL_CALL <|constrain|>json<|message|>{"tool":
    // "write_project_file","args":{"path":...,"content":...}}<|call|>`. The
    // JSON payload after <|message|> is still exactly the {tool, args} shape
    // our own protocol expects, so pull it out and rewrap it rather than
    // showing the model's raw internal tokens as if they were a real answer.
    const messageMarker = data.message.content.indexOf('<|message|>')
    if (messageMarker !== -1) {
      const json = extractBalancedJson(data.message.content, messageMarker)
      if (json) return { content: `TOOL_CALL: ${json}` }
    }

    return { content: data.message.content }
  }
}
