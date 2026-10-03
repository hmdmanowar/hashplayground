// Same convention as the main app's apiClient: '/api' in dev (Vite proxy),
// VITE_API_BASE_URL (the backend's Render domain) in production.
import { detectCountry } from './region'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type BillflowEventType = 'page_view' | 'pdf_downloaded' | 'upgrade_clicked'
// Monthly price a waitlist signup would pay: rupees for India, US dollars
// everywhere else (the two ranges never overlap, so the number alone says
// which currency it is).
export type PriceIntent = 199 | 299 | 499 | 5 | 9 | 15

// Set by the Hash Playground admin page (same origin) on an admin's
// browser: nothing from it is counted, even when logged out.
const EXCLUDE_KEY = 'billflow:exclude'

function excludedBrowser(): boolean {
  try {
    return localStorage.getItem(EXCLUDE_KEY) === '1'
  } catch {
    return false
  }
}

// Fire-and-forget — analytics must never block or break the generator.
// Sends the Hash Playground session cookie so the backend can skip admins'
// own visits.
export function trackEvent(type: BillflowEventType, slug: string): void {
  if (excludedBrowser()) return
  fetch(`${API_BASE}/billflow/events`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    // The browser's best guess at the country; the backend prefers Cloudflare's.
    body: JSON.stringify({ type, slug, country: detectCountry() }),
    keepalive: true,
  }).catch(() => {})
}

export async function joinWaitlist(input: {
  email: string
  priceIntent: PriceIntent
  source: string
}): Promise<{ alreadyJoined: boolean }> {
  // An admin's browser can try the flow, but nothing is saved.
  if (excludedBrowser()) return { alreadyJoined: false }
  const response = await fetch(`${API_BASE}/billflow/waitlist`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, country: detectCountry() }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(
      response.status === 429
        ? 'Too many attempts. Please try again in a minute.'
        : (payload?.message ?? 'Something went wrong. Please try again.'),
    )
  }
  return response.json()
}
