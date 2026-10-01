import { useEffect, useRef, useState } from 'react'
import type { InvoiceDraft } from '../lib/invoice'
import { getInvoiceStyle, INVOICE_STYLES, type InvoiceStyle, type InvoiceStyleId } from '../lib/invoiceStyles'
import InvoicePreview from './InvoicePreview'
import { SAMPLE_LOGO } from '../lib/sampleLogo'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'

// A tiny page sketch drawn from the style config, for the compact bar.
function Thumbnail({ look }: { look: InvoiceStyle }) {
  const topTitle = look.layout !== 'split'
  return (
    <div className="flex h-16 w-12 shrink-0 flex-col gap-[3px] rounded bg-white p-1.5 shadow-sm ring-1 ring-gray-200" aria-hidden="true">
      {look.layout === 'banner' ? (
        <div className="-mx-1.5 -mt-1.5 flex h-4 items-end rounded-t px-1.5 pb-1" style={{ backgroundColor: look.bannerBg }}>
          <span className="h-1 w-5 rounded-full bg-white" />
        </div>
      ) : (
        <div className={`flex ${topTitle ? (look.layout === 'centered' ? 'justify-center' : 'justify-start') : 'justify-end'}`}>
          <span className="h-1 w-5 rounded-full" style={{ backgroundColor: look.title.color }} />
        </div>
      )}
      <span className="h-[2px] w-full rounded-full bg-gray-200" />
      <span
        className="mt-0.5 h-1.5"
        style={{
          backgroundColor: look.head.bg,
          borderTop: look.headRule ? `1px solid ${look.accent}` : undefined,
          borderBottom: look.headRule ? `1px solid ${look.accent}` : undefined,
          outline: look.grid ? `1px solid ${look.rule}` : undefined,
        }}
      />
      {[0, 1].map((row) => (
        <span key={row} className="h-1" style={{ backgroundColor: look.zebra && row ? look.zebra : undefined, borderBottom: `1px solid ${look.rule}` }} />
      ))}
      <span
        className="mt-auto ml-auto h-1.5 w-5"
        style={look.totalBand ? { backgroundColor: look.totalBand.bg } : { borderTop: `2px solid ${look.accent}` }}
      />
    </div>
  )
}

// The user's own invoice rendered in a given style, scaled down to a card.
const PREVIEW_WIDTH = 640
const CARD_WIDTH = 150

function StyleSample({ draft, look }: { draft: InvoiceDraft; look: InvoiceStyle }) {
  return (
    <div className="relative h-[196px] w-full overflow-hidden rounded-md bg-white ring-1 ring-gray-200" aria-hidden="true">
      <div
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ width: PREVIEW_WIDTH, transform: `scale(${CARD_WIDTH / PREVIEW_WIDTH})` }}
      >
        <InvoicePreview draft={{ ...draft, style: look.id, logoDataUrl: draft.logoDataUrl || SAMPLE_LOGO }} printable={false} />
      </div>
    </div>
  )
}

// Compact bar showing the current style; "Change style" unfolds an inline,
// swipeable strip of samples right underneath (no modal). Picking a sample
// updates the main preview immediately.
function StylePicker({
  draft,
  value,
  onChange,
}: {
  draft: InvoiceDraft
  value: InvoiceStyleId
  onChange: (id: InvoiceStyleId) => void
}) {
  const [open, setOpen] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const current = getInvoiceStyle(value)

  // Bring the selected style into view when the strip opens.
  useEffect(() => {
    if (!open) return
    scrollerRef.current
      ?.querySelector<HTMLElement>('[aria-checked="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [open])

  function scrollBy(direction: 1 | -1) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollerRef.current?.scrollBy({ left: direction * (CARD_WIDTH + 12) * 2, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="print:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-2.5">
        <Thumbnail look={current} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--color-muted)]">Invoice style</p>
          <p className="truncate text-sm font-semibold">
            {current.name} <span className="font-normal text-[var(--color-muted)]">· {current.description}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="style-strip"
          className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            open
              ? 'border-[var(--color-primary-strong)] bg-[var(--color-primary-strong)] text-white'
              : 'border-[var(--border-panel)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] hover:text-[var(--color-accent)]'
          }`}
        >
          {open ? 'Done' : `Change style (${INVOICE_STYLES.length})`}
        </button>
      </div>

      {open && (
        <div
          id="style-strip"
          className="bf-fade-in mt-2 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--color-muted)]">Pick a style. Your preview and PDF update instantly.</p>
            <div className="hidden gap-1 sm:flex">
              {([-1, 1] as const).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => scrollBy(direction)}
                  aria-label={direction < 0 ? 'Previous styles' : 'More styles'}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] transition-colors hover:border-[var(--color-primary)]"
                >
                  {direction < 0 ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
            role="radiogroup"
            aria-label="Invoice style"
          >
            {INVOICE_STYLES.map((look) => {
              const selected = look.id === value
              return (
                <button
                  key={look.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={look.description}
                  onClick={() => onChange(look.id)}
                  style={{ width: CARD_WIDTH + 12 }}
                  className={`relative shrink-0 cursor-pointer snap-start rounded-xl border p-1.5 text-left transition-all duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none ${
                    selected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)]/40'
                      : 'border-[var(--border-panel)] bg-[var(--bg-app)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <StyleSample draft={draft} look={look} />
                  <span className="mt-1.5 block truncate px-0.5 text-center text-xs font-semibold">{look.name}</span>
                  {selected && (
                    <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white shadow">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default StylePicker
