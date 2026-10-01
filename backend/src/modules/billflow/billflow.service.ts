import { prisma } from '../../lib/prisma.js'

export const BILLFLOW_PRICE_INTENTS = [199, 299, 499] as const
export const BILLFLOW_EVENT_TYPES = ['page_view', 'pdf_downloaded', 'upgrade_clicked'] as const
export type BillflowEventType = (typeof BILLFLOW_EVENT_TYPES)[number]

const STATS_WINDOW_DAYS = 30

export interface JoinWaitlistInput {
  email: string
  priceIntent: number
  source?: string
}

// Re-joining with the same email just refreshes the price intent rather than
// erroring — the visitor clicked "upgrade" again, which is itself a signal.
export async function joinWaitlist(input: JoinWaitlistInput): Promise<{ alreadyJoined: boolean }> {
  const email = input.email.trim().toLowerCase()
  const existing = await prisma.billflowWaitlist.findUnique({ where: { email }, select: { id: true } })
  await prisma.billflowWaitlist.upsert({
    where: { email },
    create: { email, priceIntent: input.priceIntent, source: input.source },
    update: { priceIntent: input.priceIntent },
  })
  return { alreadyJoined: Boolean(existing) }
}

export async function recordEvent(type: BillflowEventType, slug?: string): Promise<void> {
  await prisma.billflowEvent.create({ data: { type, slug: slug || null } })
}

export interface BillflowStatsDto {
  windowDays: number
  waitlistTotal: number
  priceIntents: { priceIntent: number; count: number }[]
  recentSignups: { email: string; priceIntent: number; source: string | null; createdAt: string }[]
  eventTotals: { type: string; count: number }[]
  eventsBySlug: { slug: string; type: string; count: number }[]
  eventsByDay: { day: string; type: string; count: number }[]
}

export async function getStats(): Promise<BillflowStatsDto> {
  const since = new Date(Date.now() - STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [waitlistTotal, intents, recent, totals, bySlug, byDay] = await Promise.all([
    prisma.billflowWaitlist.count(),
    prisma.billflowWaitlist.groupBy({ by: ['priceIntent'], _count: { _all: true }, orderBy: { priceIntent: 'asc' } }),
    prisma.billflowWaitlist.findMany({ orderBy: { createdAt: 'desc' }, take: 25 }),
    prisma.billflowEvent.groupBy({ by: ['type'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.billflowEvent.groupBy({ by: ['slug', 'type'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.$queryRaw<{ day: Date; type: string; count: number }[]>`
      SELECT date_trunc('day', "createdAt") AS day, "type", COUNT(*)::int AS count
      FROM "BillflowEvent"
      WHERE "createdAt" >= ${since}
      GROUP BY 1, 2
      ORDER BY 1 ASC`,
  ])

  return {
    windowDays: STATS_WINDOW_DAYS,
    waitlistTotal,
    priceIntents: intents.map((row) => ({ priceIntent: row.priceIntent, count: row._count._all })),
    recentSignups: recent.map((row) => ({
      email: row.email,
      priceIntent: row.priceIntent,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
    })),
    eventTotals: totals.map((row) => ({ type: row.type, count: row._count._all })),
    eventsBySlug: bySlug
      .map((row) => ({ slug: row.slug ?? '', type: row.type, count: row._count._all }))
      .sort((a, b) => b.count - a.count),
    eventsByDay: byDay.map((row) => ({ day: row.day.toISOString().slice(0, 10), type: row.type, count: row.count })),
  }
}
