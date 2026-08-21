import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowRightIcon, AlertTriangleIcon, BotIcon, LayersIcon, PauseIcon, PlayIcon } from '../Icons/Icons'

const STATUS_COLORS = {
  healthy: '#22c55e',
  high: '#f59e0b',
  critical: '#ef4444',
  unscanned: 'color-mix(in srgb, var(--color-muted) 45%, transparent)',
}

const SEVERITY_BREAKDOWN = [
  { label: 'Critical', pct: 2, color: STATUS_COLORS.critical },
  { label: 'High', pct: 12, color: STATUS_COLORS.high },
  { label: 'Unscanned', pct: 40, color: STATUS_COLORS.unscanned },
  { label: 'Healthy', pct: 46, color: STATUS_COLORS.healthy },
]

const DOT_COUNT = 260

function pickDotStatus() {
  const r = Math.random()
  if (r < 0.02) return STATUS_COLORS.critical
  if (r < 0.14) return STATUS_COLORS.high
  if (r < 0.54) return STATUS_COLORS.unscanned
  return STATUS_COLORS.healthy
}

const TABS = [
  { label: 'Review' },
  { label: 'Prioritize' },
  { label: 'Understand' },
  { label: 'Secure your codebase continually' },
]

const PR_ROWS = [
  { priority: 'P0', color: STATUS_COLORS.critical, note: 'New, active work needs your attention.' },
  { priority: 'P1', color: STATUS_COLORS.high, note: 'New, active work needs your attention.' },
  { priority: 'P2', color: '#eab308', note: 'New, active work needs your attention.' },
  { priority: 'P2', color: '#eab308', note: 'New, active work needs your attention.' },
]

function SeverityDonut() {
  let cursor = 0
  const stops = SEVERITY_BREAKDOWN.map((segment) => {
    const start = cursor
    cursor += segment.pct
    return `${segment.color} ${start}% ${cursor}%`
  }).join(', ')

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-[var(--bg-panel)] text-center">
        <span className="text-sm font-semibold leading-none">1,999</span>
        <span className="mt-0.5 text-[9px] text-[var(--color-muted)]">findings</span>
      </div>
    </div>
  )
}

function ReviewPanel() {
  return (
    <div className="rounded-xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">AI code review</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold">Nothing slips through</h3>
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          Reviewing PR #482 &middot; 3 comments
        </p>
      </div>

      <div className="mt-4 max-w-xl rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
            <BotIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">reviewbot</span>
          <span className="rounded-full border border-[var(--border-panel)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">bot</span>
        </div>

        <p className="mt-3 text-sm font-medium">Review Change Request</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: STATUS_COLORS.high }}>
          <AlertTriangleIcon className="h-4 w-4" />
          Potential issue
        </p>
        <p className="mt-1 text-sm">Reject expired refresh tokens</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Check the token expiry before issuing a new access token.</p>

        <div className="mt-3 overflow-x-auto rounded-md bg-[var(--bg-panel)] p-3 font-mono text-xs leading-relaxed">
          <div className="text-[var(--color-muted)]">@@ -42,2 +42,3 @@</div>
          <div style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: STATUS_COLORS.critical }}>- return issue</div>
          <div style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: STATUS_COLORS.healthy }}>
            + if (payload.exp &lt; Date.now()) {'{'}
          </div>
          <div style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: STATUS_COLORS.healthy }}>+ &nbsp; return issue</div>
        </div>

        <p className="mt-3 text-xs font-medium text-[var(--color-primary)]">&#9656; Committable suggestion</p>
      </div>
    </div>
  )
}

function PrioritizePanel() {
  return (
    <div className="rounded-xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Pull request triage</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold">Highest-impact changes first</h3>
        <p className="text-xs text-[var(--color-muted)]">128 open pull requests</p>
      </div>

      <div className="mt-4 max-w-xl overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)]">
        <div className="grid grid-cols-[70px_1fr] gap-2 border-b border-[var(--border-panel)] px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          <span>Priority</span>
          <span>Notes</span>
        </div>
        {PR_ROWS.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-[70px_1fr] items-center gap-2 border-b border-[var(--border-panel)] px-4 py-3 text-sm last:border-b-0"
          >
            <span
              className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ color: row.color, border: `1px solid ${row.color}` }}
            >
              {row.priority}
            </span>
            <span className="text-xs text-[var(--color-muted)]">{row.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UnderstandPanel() {
  return (
    <div className="rounded-xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Architecture awareness</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold">See the blast radius before you merge</h3>
        <p className="text-xs text-[var(--color-muted)]">PR #482 &middot; 2 files changed</p>
      </div>

      <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
            <LayersIcon className="h-4 w-4" />
            Layers
          </div>
          <ul className="mt-3 flex flex-col gap-3 text-sm">
            <li>
              <p className="font-medium">Overview</p>
              <p className="text-xs" style={{ color: STATUS_COLORS.critical }}>
                Not mergeable &middot; 3 blockers
              </p>
            </li>
            <li className="font-medium">Blast radius</li>
            <li className="font-medium">Architecture impact</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4">
          <p className="text-xs font-medium text-[var(--color-muted)]">Files</p>
          <ol className="mt-3 flex flex-col gap-3 text-sm">
            <li>
              <span className="mr-2 text-[var(--color-muted)]">1</span>
              Add the invitation data model
            </li>
            <li>
              <span className="mr-2 text-[var(--color-muted)]">2</span>
              Add the invitation API and handlers
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function SecurePanel() {
  const dots = useMemo(() => Array.from({ length: DOT_COUNT }, pickDotStatus), [])

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Real-time codebase health</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold">Mostly healthy</h3>
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          Scanning every PR &middot; Last scan now &middot; 0 critical
        </p>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-panel)]">
        <div
          className="h-full rounded-full"
          style={{ width: '86%', background: `linear-gradient(90deg, ${STATUS_COLORS.healthy}, ${STATUS_COLORS.high} 85%, ${STATUS_COLORS.critical})` }}
        />
      </div>

      <div className="relative mt-5 grid min-h-[240px] grid-cols-[repeat(auto-fill,minmax(14px,1fr))] content-start gap-1.5 rounded-lg bg-[var(--bg-app)] p-4 lg:pb-24">
        {dots.map((color, index) => (
          <span key={index} className="aspect-square rounded-full" style={{ backgroundColor: color }} />
        ))}

        <div className="static lg:absolute lg:bottom-3 lg:left-3 mt-3 lg:mt-0 flex w-full max-w-[220px] flex-col gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-[#f59e0b]" />
              Dependency vulnerability
            </span>
            <span className="rounded-full border border-[#f59e0b] px-1.5 py-0.5 text-[9px] font-medium text-[#f59e0b]">High</span>
          </div>
          <p className="text-[10px] text-[var(--color-muted)]">axios &middot; GHSA-4w2v-q235-vp99</p>
          <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)]">
            <span>Detected on PR #482</span>
            <span className="font-medium text-[var(--color-primary)]">Fix ready</span>
          </div>
        </div>

        <div className="static lg:absolute lg:right-3 lg:top-3 mt-3 lg:mt-0 flex w-full max-w-[240px] items-center gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-3 shadow-lg">
          <SeverityDonut />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium">Severity distribution</p>
            <p className="text-[9px] text-[var(--color-muted)]">AI Deep Scan and Dependencies</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-[var(--color-muted)]">
              {SEVERITY_BREAKDOWN.map((segment) => (
                <li key={segment.label} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label} {segment.pct}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductShowcase() {
  const { user } = useAuth()
  const [active, setActive] = useState(TABS.length - 1)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActive((prev) => (prev + 1) % TABS.length), 4000)
    return () => clearInterval(id)
  }, [paused])

  return (
    <div className="mx-auto flex flex-col gap-10 py-6">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Agentic change management</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            The future isn't writing code.
            <br />
            It's reviewing it.
          </h1>
        </div>
        <div className="max-w-xs lg:text-right">
          <p className="text-sm text-[var(--color-muted)]">
            AI-driven code now outpaces human capacity. We help teams ship code, not surprises.
          </p>
          {!user && (
            <Link
              to="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              Try it for free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-[var(--border-panel)] pb-3">
          {TABS.map((tab, index) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-2 text-sm transition-colors ${
                active === index ? 'font-semibold text-[var(--text-app)]' : 'text-[var(--color-muted)] hover:text-[var(--text-app)]'
              }`}
            >
              <span className="text-xs text-[var(--color-muted)]">{String(index + 1).padStart(2, '0')}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {active === 0 && <ReviewPanel />}
          {active === 1 && <PrioritizePanel />}
          {active === 2 && <UnderstandPanel />}
          {active === 3 && <SecurePanel />}
        </div>

        <button
          type="button"
          onClick={() => setPaused((prev) => !prev)}
          aria-label={paused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
          className="mt-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--text-app)]"
        >
          {paused ? <PlayIcon className="h-3.5 w-3.5" /> : <PauseIcon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default ProductShowcase
