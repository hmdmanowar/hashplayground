import type { AIModel, ModelRequest, ModelResponse } from './AIModel.js'

// Talks to an Ollama-compatible chat API — see https://github.com/ollama/ollama
// for the API this targets. Assumes the model has already been pulled
// (`ollama pull <model>`) for a local host; Ollama returns a clear error in
// the response body if it hasn't, which we surface as a thrown error rather
// than swallowing. `apiKey` is optional and only needed against Ollama Cloud
// (a local Ollama instance needs no auth) — passing it adds a standard
// Bearer Authorization header, otherwise this behaves exactly as before.
export class OllamaModel implements AIModel {
  constructor(
    private readonly host: string,
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const response = await fetch(`${this.host}/api/chat`, {
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
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Ollama request failed (${response.status}): ${body || response.statusText}`)
    }

    const data = (await response.json()) as { message?: { content?: string }; error?: string }
    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`)
    }
    if (!data.message?.content) {
      throw new Error('Ollama returned an empty response')
    }

    return { content: data.message.content }
  }
}
