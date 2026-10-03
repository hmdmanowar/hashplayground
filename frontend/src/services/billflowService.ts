import { request } from '../lib/apiClient'

export type BillflowRange = 'day' | 'month' | 'year'

export interface BillflowStats {
  range: BillflowRange
  rangeLabel: string
  // Fixed 30-day downloads for the go/no-go gate, independent of the range.
  gateDownloads: number
  gateWindowDays: number
  waitlistTotal: number
  priceIntents: { priceIntent: number; count: number }[]
  recentSignups: {
    email: string
    priceIntent: number
    source: string | null
    country: string | null
    createdAt: string
  }[]
  // Views/downloads/clicks within the range; signups are all-time.
  byCountry: {
    country: string | null
    views: number
    downloads: number
    upgradeClicks: number
    signups: number
  }[]
  eventTotals: { type: string; count: number }[]
  eventsBySlug: { slug: string; type: string; count: number }[]
  buckets: string[] // bucket start dates (YYYY-MM-DD, UTC), oldest first
  series: { page_view: number[]; pdf_downloaded: number[]; upgrade_clicked: number[] }
}

export function getBillflowStats(range: BillflowRange = 'day'): Promise<BillflowStats> {
  return request<BillflowStats>(`/billflow/admin/stats?range=${range}`)
}

// One event type, all events, or the waitlist — see the backend's
// BILLFLOW_RESET_SCOPES.
export type BillflowResetScope = 'page_view' | 'pdf_downloaded' | 'upgrade_clicked' | 'events' | 'waitlist'

// Permanently deletes the data in one scope. The backend re-checks the top
// admin's password.
export function resetBillflowData(
  password: string,
  scope: BillflowResetScope,
): Promise<{ events: number; waitlist: number }> {
  return request<{ events: number; waitlist: number }>('/billflow/admin/reset', {
    method: 'POST',
    body: { password, scope },
  })
}
