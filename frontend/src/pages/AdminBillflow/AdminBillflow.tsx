import { useCallback, useEffect, useState, type FormEvent } from 'react'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import Sparkline from '../../components/Sparkline/Sparkline'
import { getBillflowStats, resetBillflowData, type BillflowRange, type BillflowStats } from '../../services/billflowService'
import { useToast } from '../../context/ToastContext'

// Milestone-1 go/no-go gate for building BillFlow's paid tier (Razorpay,
// dashboard, reminders) — see the BillFlow plan. Tune here if the bar moves.
const GATE_PDF_DOWNLOADS = 150
const GATE_WAITLIST = 15

const RANGES: { id: BillflowRange; label: string }[] = [
  { id: 'day', label: 'Daily' },
  { id: 'month', label: 'Monthly' },
  { id: 'year', label: 'Yearly' },
]

// Bucket starts arrive as UTC dates (YYYY-MM-DD); label them per range.
function formatBucket(bucket: string, range: BillflowRange): string {
  const [y, m, d] = bucket.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (range === 'year') return String(y)
  return date.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    ...(range === 'day' ? { day: 'numeric', month: 'short' } : { month: 'short', year: 'numeric' }),
  })
}

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

// Irreversible wipe of all BillFlow events + waitlist, confirmed by
// re-entering the top admin's account password (checked server-side).
function ResetDialog({
  waitlistTotal,
  onClose,
  onDone,
}: {
  waitlistTotal: number
  onClose: () => void
  onDone: (result: { events: number; waitlist: number }) => void
}) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      onDone(await resetBillflowData(password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => !submitting && onClose()}>
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="billflow-reset-title"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
      >
        <h2 id="billflow-reset-title" className="text-lg font-semibold text-red-600 dark:text-red-400">
          Reset all BillFlow data?
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">This permanently deletes, with no undo:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>every page view, PDF download and upgrade click</li>
          <li>
            all {waitlistTotal} Pro waitlist signup{waitlistTotal === 1 ? '' : 's'} (emails and price intent)
          </li>
        </ul>
        <p className="mt-3 text-sm text-[var(--color-muted)]">Users’ invoices are not affected; they live in their own browsers.</p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Enter your account password to confirm</span>
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Resetting…' : 'Reset everything'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminBillflow() {
  const [stats, setStats] = useState<BillflowStats | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [resetOpen, setResetOpen] = useState(false)
  const [range, setRange] = useState<BillflowRange>('day')
  // While a new range loads, the previous numbers stay on screen (dimmed)
  // instead of flashing a spinner.
  const [refreshing, setRefreshing] = useState(false)
  const { showToast } = useToast()

  const loadStats = useCallback(() => {
    setRefreshing(true)
    getBillflowStats(range)
      .then((data) => {
        setStats(data)
        setLoadStatus('ready')
      })
      .catch(() => setLoadStatus((prev) => (prev === 'ready' ? prev : 'error')))
      .finally(() => setRefreshing(false))
  }, [range])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const closeReset = useCallback(() => setResetOpen(false), [])

  function handleResetDone(result: { events: number; waitlist: number }) {
    setResetOpen(false)
    showToast(`BillFlow reset: removed ${result.events} events and ${result.waitlist} waitlist signups.`, { kind: 'success' })
    loadStats()
  }

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
  const bucketLabels = stats.buckets.map((bucket) => formatBucket(bucket, stats.range))
  // Per-period download rate (downloads / views); periods with no views read 0.
  const rateSeries = stats.series.page_view.map((viewCount, i) =>
    viewCount ? (stats.series.pdf_downloaded[i] / viewCount) * 100 : 0,
  )

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
        (the go/no-go gate is always the last {stats.gateWindowDays} days; the waitlist is all-time).
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <GateMeter
          label={`PDF downloads (${stats.gateWindowDays}d)`}
          value={stats.gateDownloads}
          target={GATE_PDF_DOWNLOADS}
        />
        <GateMeter label="Pro waitlist signups" value={stats.waitlistTotal} target={GATE_WAITLIST} />
      </div>

      {/* Range filter scopes the tiles and the Pages table below it */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1"
          role="group"
          aria-label="Time range"
        >
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={range === option.id}
              onClick={() => setRange(option.id)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                range === option.id
                  ? 'bg-[var(--color-primary-strong)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--text-app)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-[var(--color-muted)]">Showing the {stats.rangeLabel}</span>
      </div>

      <div className={`space-y-6 transition-opacity duration-200 ${refreshing ? 'opacity-60' : ''}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Page views', value: String(views), series: stats.series.page_view, format: (v: number) => String(v) },
            {
              label: 'PDF downloads',
              value: String(downloads),
              series: stats.series.pdf_downloaded,
              format: (v: number) => String(v),
            },
            {
              label: 'Upgrade clicks',
              value: String(upgradeClicks),
              series: stats.series.upgrade_clicked,
              format: (v: number) => String(v),
            },
            {
              label: 'Download rate',
              value: views ? `${Math.round((downloads / views) * 100)}%` : '—',
              series: rateSeries,
              format: (v: number) => `${Math.round(v)}%`,
            },
          ].map((tile) => (
            <div
              key={tile.label}
              className="flex items-center gap-4 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4"
            >
              <div className="shrink-0">
                <p className="text-xs text-[var(--color-muted)]">{tile.label}</p>
                <p className="mt-1 text-2xl font-semibold">{tile.value}</p>
              </div>
              <div className="min-w-0 flex-1">
                <Sparkline values={tile.series} labels={bucketLabels} format={tile.format} label={tile.label} />
              </div>
            </div>
          ))}
        </div>

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

      <section className="rounded-lg border border-red-300 p-4 dark:border-red-900">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-[var(--color-muted)]">
            Reset all BillFlow tracking (page views, downloads, upgrade clicks) and the Pro waitlist to start fresh.
            Requires your account password.
          </p>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="cursor-pointer rounded-full border border-red-400 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white dark:text-red-400"
          >
            Reset all data
          </button>
        </div>
      </section>

      {resetOpen && <ResetDialog waitlistTotal={stats.waitlistTotal} onClose={closeReset} onDone={handleResetDone} />}
    </div>
  )
}

export default AdminBillflow
