import { useEffect, useState } from 'react'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import { getBillflowStats, type BillflowStats } from '../../services/billflowService'

// Milestone-1 go/no-go gate for building BillFlow's paid tier (Razorpay,
// dashboard, reminders) — see the BillFlow plan. Tune here if the bar moves.
const GATE_PDF_DOWNLOADS = 150
const GATE_WAITLIST = 15

function countOf(stats: BillflowStats, type: string): number {
  return stats.eventTotals.find((row) => row.type === type)?.count ?? 0
}

function GateMeter({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  return (
    <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-[var(--color-muted)]">{label}</p>
        <p className="text-sm font-semibold">
          {value} / {target}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-app)]">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-[var(--color-primary)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function AdminBillflow() {
  const [stats, setStats] = useState<BillflowStats | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    getBillflowStats()
      .then((data) => {
        setStats(data)
        setLoadStatus('ready')
      })
      .catch(() => setLoadStatus('error'))
  }, [])

  if (loadStatus === 'loading') return <LoadingOverlay />

  if (loadStatus === 'error' || !stats) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] p-10 text-center">
        <p className="text-sm text-[var(--color-muted)]">Couldn't load BillFlow stats.</p>
      </div>
    )
  }

  const views = countOf(stats, 'page_view')
  const downloads = countOf(stats, 'pdf_downloaded')
  const upgradeClicks = countOf(stats, 'upgrade_clicked')
  const intentTotal = stats.priceIntents.reduce((sum, row) => sum + row.count, 0)

  const pages = new Map<string, Record<string, number>>()
  for (const row of stats.eventsBySlug) {
    const entry = pages.get(row.slug) ?? {}
    entry[row.type] = row.count
    pages.set(row.slug, entry)
  }
  const pageRows = [...pages.entries()].sort((a, b) => (b[1].page_view ?? 0) - (a[1].page_view ?? 0))

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-muted)]">
        Demand signals for{' '}
        <a href="/billflow/" className="text-[var(--color-primary)] hover:underline">
          BillFlow
        </a>{' '}
        over the last {stats.windowDays} days (the waitlist is all-time).
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <GateMeter label={`PDF downloads (${stats.windowDays}d)`} value={downloads} target={GATE_PDF_DOWNLOADS} />
        <GateMeter label="Pro waitlist signups" value={stats.waitlistTotal} target={GATE_WAITLIST} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Page views', value: views },
          { label: 'PDF downloads', value: downloads },
          { label: 'Upgrade clicks', value: upgradeClicks },
          { label: 'Download rate', value: views ? `${Math.round((downloads / views) * 100)}%` : '—' },
        ].map((tile) => (
          <div key={tile.label} className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4">
            <p className="text-xs text-[var(--color-muted)]">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold">{tile.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-sm font-semibold">Price intent</h2>
        {intentTotal === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">No waitlist signups yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {stats.priceIntents.map((row) => (
              <div key={row.priceIntent} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0">₹{row.priceIntent}/mo</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-app)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${(row.count / intentTotal) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-[var(--color-muted)]">
                  {row.count} ({Math.round((row.count / intentTotal) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Pages</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-panel)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-app)]">
              <tr>
                <th className="px-3 py-2 font-medium">Page</th>
                <th className="px-3 py-2 text-right font-medium">Views</th>
                <th className="px-3 py-2 text-right font-medium">Downloads</th>
                <th className="px-3 py-2 text-right font-medium">Upgrade clicks</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-[var(--color-muted)]">
                    No traffic yet.
                  </td>
                </tr>
              ) : (
                pageRows.map(([slug, counts]) => (
                  <tr key={slug} className="border-t border-[var(--border-panel)]">
                    <td className="px-3 py-2">
                      <a href={`/billflow/${slug ? `${slug}/` : ''}`} className="hover:text-[var(--color-primary)]">
                        /billflow/{slug}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-right">{counts.page_view ?? 0}</td>
                    <td className="px-3 py-2 text-right">{counts.pdf_downloaded ?? 0}</td>
                    <td className="px-3 py-2 text-right">{counts.upgrade_clicked ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Recent waitlist signups</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-panel)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-app)]">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Would pay</th>
                <th className="px-3 py-2 font-medium">From page</th>
                <th className="px-3 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-[var(--color-muted)]">
                    No signups yet.
                  </td>
                </tr>
              ) : (
                stats.recentSignups.map((row) => (
                  <tr key={row.email} className="border-t border-[var(--border-panel)]">
                    <td className="px-3 py-2 break-all">{row.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">₹{row.priceIntent}/mo</td>
                    <td className="px-3 py-2">/billflow/{row.source ?? ''}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminBillflow
