// Thin fetch wrapper shared by every service module once they talk to the
// real backend instead of localStorage. Kept deliberately small (no query
// library) — this app has no cross-component cache-sharing need beyond
// NotificationBell's own bespoke poll, so a query library would just add a
// second unfamiliar thing on top of the sync-to-async conversion itself.
// In dev, Vite's proxy forwards same-origin '/api' to the local backend.
// In production the frontend and backend are on different Render domains,
// so VITE_API_BASE_URL points straight at the backend — the cookie session
// already handles that cross-site case via secure + sameSite:'none'.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

// For the handful of auth flows that need a real top-level browser
// navigation (Google OAuth) rather than a fetch — same base as `request()`.
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

type UnauthorizedListener = () => void
const unauthorizedListeners = new Set<UnauthorizedListener>()

// AuthContext subscribes to this so a 401 from ANY service call can clear
// the session and redirect to /login, without services needing to import
// AuthContext directly (which would create an import cycle).
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    unauthorizedListeners.forEach((listener) => listener())
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(response.status, payload?.message ?? `Request failed (${response.status})`, payload?.code)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
