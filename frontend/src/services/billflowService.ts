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
  recentSignups: { email: string; priceIntent: number; source: string | null; createdAt: string }[]
  eventTotals: { type: string; count: number }[]
  eventsBySlug: { slug: string; type: string; count: number }[]
  buckets: string[] // bucket start dates (YYYY-MM-DD, UTC), oldest first
  series: { page_view: number[]; pdf_downloaded: number[]; upgrade_clicked: number[] }
}

export function getBillflowStats(range: BillflowRange = 'day'): Promise<BillflowStats> {
  return request<BillflowStats>(`/billflow/admin/stats?range=${range}`)
}

// Permanently deletes all BillFlow events, and the waitlist signups only when
// includeWaitlist is set. The backend re-checks the top admin's password.
export function resetBillflowData(
  password: string,
  includeWaitlist = false,
): Promise<{ events: number; waitlist: number }> {
  return request<{ events: number; waitlist: number }>('/billflow/admin/reset', {
    method: 'POST',
    body: { password, includeWaitlist },
  })
}
