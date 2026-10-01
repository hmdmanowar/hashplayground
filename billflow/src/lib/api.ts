// Same convention as the main app's apiClient: '/api' in dev (Vite proxy),
// VITE_API_BASE_URL (the backend's Render domain) in production.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type BillflowEventType = 'page_view' | 'pdf_downloaded' | 'upgrade_clicked'
export type PriceIntent = 199 | 299 | 499

// Fire-and-forget — analytics must never block or break the generator.
export function trackEvent(type: BillflowEventType, slug: string): void {
  fetch(`${API_BASE}/billflow/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, slug }),
    keepalive: true,
  }).catch(() => {})
}

export async function joinWaitlist(input: {
  email: string
  priceIntent: PriceIntent
  source: string
}): Promise<{ alreadyJoined: boolean }> {
  const response = await fetch(`${API_BASE}/billflow/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
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
