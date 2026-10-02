import { useState, type KeyboardEvent, type PointerEvent } from 'react'

interface SparklineProps {
  values: number[]
  labels: string[]
  format: (value: number) => string
  label: string // what the series is, for screen readers ("Page views")
}

const VIEW_W = 100
const VIEW_H = 40
const PAD = 3

// Single-series trend line for a stat tile: 2px line + soft area in the
// accent token, a dot on the current (latest) period, and a crosshair +
// tooltip that snaps to the nearest period on hover or arrow-key focus.
// A visually hidden table carries every value for screen readers.
function Sparkline({ values, labels, format, label }: SparklineProps) {
  const [active, setActive] = useState<number | null>(null)
  const count = values.length
  const max = Math.max(...values, 0) || 1

  const x = (i: number) => (count <= 1 ? VIEW_W / 2 : (i / (count - 1)) * VIEW_W)
  const y = (v: number) => VIEW_H - PAD - (v / max) * (VIEW_H - PAD * 2)
  const points = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`)
  const line = `M${points.join('L')}`
  const area = `${line}L${VIEW_W},${VIEW_H}L0,${VIEW_H}Z`

  // Positions as percentages so HTML overlays (dots, crosshair, tooltip)
  // stay round and crisp while the SVG stretches to the tile.
  const pctX = (i: number) => (x(i) / VIEW_W) * 100
  const pctY = (i: number) => (y(values[i]) / VIEW_H) * 100

  function handlePointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setActive(Math.round(ratio * (count - 1)))
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setActive((prev) => {
      const current = prev ?? count - 1
      return Math.min(count - 1, Math.max(0, current + (event.key === 'ArrowRight' ? 1 : -1)))
    })
  }

  if (count === 0) return null
  const shown = active ?? count - 1

  return (
    <div
      className="relative h-12 w-full cursor-crosshair rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      style={{ color: 'var(--color-accent)' }}
      tabIndex={0}
      aria-label={`${label} trend. Use left and right arrow keys to read each period.`}
      onPointerMove={handlePointer}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(count - 1)}
      onBlur={() => setActive(null)}
      onKeyDown={handleKey}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={area} fill="currentColor" opacity={0.12} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Current period marker */}
      <span
        className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-[var(--bg-panel)]"
        style={{ left: `${pctX(count - 1)}%`, top: `${pctY(count - 1)}%` }}
        aria-hidden="true"
      />

      {active !== null && (
        <>
          <span
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--color-muted)] opacity-40"
            style={{ left: `${pctX(active)}%` }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-[var(--bg-panel)]"
            style={{ left: `${pctX(active)}%`, top: `${pctY(active)}%` }}
            aria-hidden="true"
          />
          {/* Anchored to whichever side keeps it inside the tile — a centred
              tooltip near the ends would overflow the page and make the
              scrollbar flicker as the pointer moves. */}
          <div
            className={`pointer-events-none absolute bottom-full z-10 mb-2 rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 whitespace-nowrap shadow-lg ${
              pctX(active) > 66 ? 'right-0 text-right' : pctX(active) < 34 ? 'left-0 text-left' : '-translate-x-1/2 text-center'
            }`}
            style={pctX(active) >= 34 && pctX(active) <= 66 ? { left: `${pctX(active)}%` } : undefined}
            role="status"
          >
            <p className="text-sm font-semibold text-[var(--text-app)]">{format(values[shown])}</p>
            <p className="text-[10px] text-[var(--color-muted)]">{labels[shown]}</p>
          </div>
        </>
      )}

      <table className="sr-only">
        <caption>{label} by period</caption>
        <tbody>
          {values.map((value, i) => (
            <tr key={labels[i]}>
              <th scope="row">{labels[i]}</th>
              <td>{format(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Sparkline
