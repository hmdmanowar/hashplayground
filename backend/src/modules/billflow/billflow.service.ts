import { prisma } from '../../lib/prisma.js'
import { verifyPasswordHash } from '../../lib/password.js'
import { ApiError } from '../../middleware/errorHandler.js'

// Rupee prices for India, US-dollar prices elsewhere (ranges never overlap).
export const BILLFLOW_PRICE_INTENTS = [199, 299, 499, 5, 9, 15] as const
export const BILLFLOW_EVENT_TYPES = ['page_view', 'pdf_downloaded', 'upgrade_clicked'] as const
export type BillflowEventType = (typeof BILLFLOW_EVENT_TYPES)[number]

const GATE_WINDOW_DAYS = 30

// Dashboard ranges: how far back to look and how to bucket the series.
export const BILLFLOW_STATS_RANGES = ['day', 'month', 'year'] as const
export type BillflowStatsRange = (typeof BILLFLOW_STATS_RANGES)[number]

const RANGE_CONFIG: Record<BillflowStatsRange, { buckets: number; label: string }> = {
  day: { buckets: 30, label: 'last 30 days' },
  month: { buckets: 12, label: 'last 12 months' },
  year: { buckets: 5, label: 'last 5 years' },
}

// Start of each bucket (UTC), oldest first — matches Postgres date_trunc on
// the UTC "createdAt" column, so buckets line up exactly.
function bucketStarts(range: BillflowStatsRange, now = new Date()): Date[] {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  const count = RANGE_CONFIG[range].buckets
  return Array.from({ length: count }, (_, i) => {
    const back = count - 1 - i
    if (range === 'day') return new Date(Date.UTC(y, m, d - back))
    if (range === 'month') return new Date(Date.UTC(y, m - back, 1))
    return new Date(Date.UTC(y - back, 0, 1))
  })
}

const bucketKey = (date: Date) => date.toISOString().slice(0, 10)

export interface JoinWaitlistInput {
  email: string
  priceIntent: number
  source?: string
  country?: string
}

// Re-joining with the same email just refreshes the price intent rather than
// erroring — the visitor clicked "upgrade" again, which is itself a signal.
export async function joinWaitlist(input: JoinWaitlistInput): Promise<{ alreadyJoined: boolean }> {
  const email = input.email.trim().toLowerCase()
  const existing = await prisma.billflowWaitlist.findUnique({ where: { email }, select: { id: true } })
  await prisma.billflowWaitlist.upsert({
    where: { email },
    create: { email, priceIntent: input.priceIntent, source: input.source, country: input.country },
    update: { priceIntent: input.priceIntent },
  })
  return { alreadyJoined: Boolean(existing) }
}

export async function recordEvent(type: BillflowEventType, slug?: string, country?: string): Promise<void> {
  await prisma.billflowEvent.create({ data: { type, slug: slug || null, country: country || null } })
}

export interface CountryRow {
  country: string | null // null: recorded before countries were tracked
  views: number
  downloads: number
  upgradeClicks: number
  signups: number // all-time, like the waitlist total
}

export interface BillflowStatsDto {
  range: BillflowStatsRange
  rangeLabel: string
  // Fixed 30-day downloads for the go/no-go gate, independent of the range.
  gateDownloads: number
  gateWindowDays: number
  waitlistTotal: number
  priceIntents: { priceIntent: number; count: number }[]
  recentSignups: { email: string; priceIntent: number; source: string | null; country: string | null; createdAt: string }[]
  byCountry: CountryRow[]
  eventTotals: { type: string; count: number }[]
  eventsBySlug: { slug: string; type: string; count: number }[]
  // One count per bucket (oldest first) for each event type.
  buckets: string[]
  series: Record<BillflowEventType, number[]>
}

export async function getStats(range: BillflowStatsRange = 'day'): Promise<BillflowStatsDto> {
  const starts = bucketStarts(range)
  const since = starts[0]
  const gateSince = new Date(Date.now() - GATE_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [waitlistTotal, intents, recent, totals, bySlug, byBucket, gateDownloads, eventsByCountry, signupsByCountry] = await Promise.all([
    prisma.billflowWaitlist.count(),
    prisma.billflowWaitlist.groupBy({ by: ['priceIntent'], _count: { _all: true }, orderBy: { priceIntent: 'asc' } }),
    prisma.billflowWaitlist.findMany({ orderBy: { createdAt: 'desc' }, take: 25 }),
    prisma.billflowEvent.groupBy({ by: ['type'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.billflowEvent.groupBy({ by: ['slug', 'type'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.$queryRaw<{ bucket: Date; type: string; count: number }[]>`
      SELECT date_trunc(${range}::text, "createdAt") AS bucket, "type", COUNT(*)::int AS count
      FROM "BillflowEvent"
      WHERE "createdAt" >= ${since}
      GROUP BY 1, 2`,
    prisma.billflowEvent.count({ where: { type: 'pdf_downloaded', createdAt: { gte: gateSince } } }),
    prisma.billflowEvent.groupBy({ by: ['country', 'type'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.billflowWaitlist.groupBy({ by: ['country'], _count: { _all: true } }),
  ])

  const countries = new Map<string | null, CountryRow>()
  const rowFor = (country: string | null) => {
    let row = countries.get(country)
    if (!row) countries.set(country, (row = { country, views: 0, downloads: 0, upgradeClicks: 0, signups: 0 }))
    return row
  }
  for (const event of eventsByCountry) {
    const row = rowFor(event.country)
    if (event.type === 'page_view') row.views += event._count._all
    else if (event.type === 'pdf_downloaded') row.downloads += event._count._all
    else if (event.type === 'upgrade_clicked') row.upgradeClicks += event._count._all
  }
  for (const signup of signupsByCountry) rowFor(signup.country).signups += signup._count._all
  // Busiest first; "unknown" (pre-tracking data) always last.
  const byCountry = [...countries.values()].sort(
    (a, b) => Number(a.country === null) - Number(b.country === null) || b.views - a.views || b.downloads - a.downloads,
  )

  const keys = starts.map(bucketKey)
  const index = new Map(keys.map((key, i) => [key, i]))
  const series = Object.fromEntries(BILLFLOW_EVENT_TYPES.map((type) => [type, keys.map(() => 0)])) as Record<
    BillflowEventType,
    number[]
  >
  for (const row of byBucket) {
    const i = index.get(bucketKey(row.bucket))
    const type = row.type as BillflowEventType
    if (i !== undefined && series[type]) series[type][i] = row.count
  }

  return {
    range,
    rangeLabel: RANGE_CONFIG[range].label,
    gateDownloads,
    gateWindowDays: GATE_WINDOW_DAYS,
    waitlistTotal,
    priceIntents: intents.map((row) => ({ priceIntent: row.priceIntent, count: row._count._all })),
    recentSignups: recent.map((row) => ({
      email: row.email,
      priceIntent: row.priceIntent,
      source: row.source,
      country: row.country,
      createdAt: row.createdAt.toISOString(),
    })),
    eventTotals: totals.map((row) => ({ type: row.type, count: row._count._all })),
    eventsBySlug: bySlug
      .map((row) => ({ slug: row.slug ?? '', type: row.type, count: row._count._all }))
      .sort((a, b) => b.count - a.count),
    buckets: keys,
    series,
    byCountry,
  }
}

// Wipes BillFlow tracking (funnel events) so it can start fresh. The Pro
// waitlist — real people's emails — survives a normal reset and is only
// deleted when the admin explicitly forces it (includeWaitlist). Either way
// it's irreversible, so the top admin must re-enter their account password
// even though they are already signed in.
export async function resetAllData(
  username: string,
  password: string,
  includeWaitlist = false,
): Promise<{ events: number; waitlist: number }> {
  const user = await prisma.user.findUnique({ where: { username }, select: { passwordHash: true } })
  if (!user?.passwordHash) {
    throw new ApiError(400, 'Set an account password in Account Settings before using reset.')
  }
  if (!(await verifyPasswordHash(password, user.passwordHash))) throw new ApiError(403, 'Incorrect password')

  if (!includeWaitlist) {
    const events = await prisma.billflowEvent.deleteMany({})
    return { events: events.count, waitlist: 0 }
  }
  const [events, waitlist] = await prisma.$transaction([
    prisma.billflowEvent.deleteMany({}),
    prisma.billflowWaitlist.deleteMany({}),
  ])
  return { events: events.count, waitlist: waitlist.count }
}
