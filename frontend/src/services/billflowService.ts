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
