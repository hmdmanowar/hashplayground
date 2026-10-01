import { request } from '../lib/apiClient'

export interface BillflowStats {
  windowDays: number
  waitlistTotal: number
  priceIntents: { priceIntent: number; count: number }[]
  recentSignups: { email: string; priceIntent: number; source: string | null; createdAt: string }[]
  eventTotals: { type: string; count: number }[]
  eventsBySlug: { slug: string; type: string; count: number }[]
  eventsByDay: { day: string; type: string; count: number }[]
}

export function getBillflowStats(): Promise<BillflowStats> {
  return request<BillflowStats>('/billflow/admin/stats')
}

// Permanently deletes all BillFlow events and waitlist signups. The backend
// re-checks the top admin's password before doing anything.
export function resetBillflowData(password: string): Promise<{ events: number; waitlist: number }> {
  return request<{ events: number; waitlist: number }>('/billflow/admin/reset', { method: 'POST', body: { password } })
}
