import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import InvoicePreview from '../components/InvoicePreview'
import { ArrowRightIcon, CheckIcon, SparkleIcon, XIcon } from '../components/Icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { isGst } from '../lib/invoice'
import { INVOICE_STYLES } from '../lib/invoiceStyles'
import { sampleDraftFor } from '../lib/sampleDraft'
import { GALLERY_PAGE, GENERATOR_PATH, TEMPLATES, type InvoiceTemplate } from '../lib/templates'

const STEPS = ['Pick a template', 'Fill in your details', 'Download the PDF']

// Filter chips, each a simple predicate over the template data.
const CREATIVE = new Set(['graphic-designer-invoice', 'photography-invoice', 'content-writer-invoice', 'social-media-marketing-invoice'])
const SERVICES = new Set(['consulting-invoice-template', 'web-developer-invoice', 'freelance-invoice-template', 'tutor-invoice-template'])

const FILTERS: { id: string; label: string; match: (template: InvoiceTemplate) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'gst', label: 'GST', match: (t) => isGst(t.taxMode) },
  { id: 'no-gst', label: 'Without GST', match: (t) => t.taxMode === 'none' && t.currency === 'INR' },
  { id: 'intl', label: 'International', match: (t) => t.currency !== 'INR' },
  { id: 'creative', label: 'Creative', match: (t) => CREATIVE.has(t.slug) },
  { id: 'services', label: 'Services', match: (t) => SERVICES.has(t.slug) },
]

// Give each card a different PDF style so the gallery shows the variety.
const CARD_STYLES = ['classic', 'bold', 'vibrant', 'modern', 'genz', 'fresh', 'studio', 'service', 'minimal', 'vintage', 'compact'] as const

const PREVIEW_WIDTH = 640

// Renders the real invoice preview at a fixed width and scales it to fit
// whatever width the card has.
function ScaledPreview({ template, styleId }: { template: InvoiceTemplate; styleId: (typeof CARD_STYLES)[number] }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  const draft = useMemo(() => sampleDraftFor(template, styleId), [template, styleId])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const observer = new ResizeObserver(() => setScale(box.clientWidth / PREVIEW_WIDTH))
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={boxRef} className="relative h-64 overflow-hidden" aria-hidden="true">
      <div
        className="pointer-events-none absolute top-0 left-0 origin-top-left transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})` }}
      >
        <InvoicePreview draft={draft} printable={false} />
      </div>
      {/* Fade the bottom of the page into the card */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-panel)] to-transparent" />
    </div>
  )
}

function GalleryCard({ template, index }: { template: InvoiceTemplate; index: number }) {
  const styleId = CARD_STYLES[index % CARD_STYLES.length]
  const badges = [
    isGst(template.taxMode) ? 'GST' : template.taxMode === 'custom' ? template.taxLabel || 'Tax' : 'No tax',
    template.currency,
    template.documentTitle,
  ]

  return (
    <Link
      to={`/${template.slug}/`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-xl focus-visible:border-[var(--color-primary)] focus-visible:outline-none motion-reduce:transition-none"
    >
      <div className="bg-[var(--bg-app)] px-4 pt-4">
        <div className="overflow-hidden rounded-t-lg shadow-sm ring-1 ring-black/5">
          <ScaledPreview template={template} styleId={styleId} />
        </div>
      </div>

      {/* Hover call to action over the preview */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[17rem] items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
          Use this template
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-semibold">{template.label}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">{template.intro}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

let viewed = false

function TemplatesPage() {
  const [query, setQuery] = useState('')
  const [filterId, setFilterId] = useState('all')

  usePageMeta(GALLERY_PAGE)

  useEffect(() => {
    if (viewed) return
    viewed = true
    trackEvent('page_view', GALLERY_PAGE.slug)
  }, [])

  const search = query.trim().toLowerCase()
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0]
  const matchesSearch = (template: InvoiceTemplate) =>
    !search || `${template.label} ${template.h1} ${template.intro} ${template.documentTitle}`.toLowerCase().includes(search)
  const visible = TEMPLATES.filter((template) => filter.match(template) && matchesSearch(template))

  return (
    <div className="pb-8">
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          <SparkleIcon className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          {TEMPLATES.length} templates · works with all {INVOICE_STYLES.length} PDF styles
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Invoice templates{' '}
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] bg-clip-text text-transparent dark:from-[#a5b8f3] dark:to-[var(--color-primary)]">
            made for your work
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--color-muted)] sm:text-base">{GALLERY_PAGE.intro}</p>
        <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[10px] font-semibold text-[var(--color-accent)]">
                {index + 1}
              </span>
              {step}
              {index < STEPS.length - 1 && <span className="text-[var(--color-muted)]">→</span>}
            </li>
          ))}
        </ol>
      </section>

      {/* Search + filters */}
      <div className="sticky top-14 z-20 border-y border-[var(--border-panel)] bg-[var(--bg-app)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter templates">
            {FILTERS.map((item) => {
              const count = TEMPLATES.filter((template) => item.match(template) && matchesSearch(template)).length
              const active = item.id === filterId
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilterId(item.id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--color-primary-strong)] bg-[var(--color-primary-strong)] text-white'
                      : 'border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {active && <CheckIcon className="h-3 w-3" />}
                  {item.label}
                  <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-[var(--bg-app)]'}`}>{count}</span>
                </button>
              )
            })}
          </div>
          <label className="relative block md:w-72">
            <span className="sr-only">Search templates</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search e.g. GST, proforma, photographer…"
              className="w-full rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 pr-9 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--hover-overlay)]"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-8">
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((template) => (
              <GalleryCard key={template.slug} template={template} index={TEMPLATES.indexOf(template)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-panel)] p-12 text-center">
            <p className="font-semibold">No templates match “{query}”</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Try another word, or start from the standard invoice.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setFilterId('all')
              }}
              className="mt-4 cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium hover:border-[var(--color-primary)]"
            >
              Show all templates
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#3d52a0] to-[#7091e6] px-6 py-8 text-center text-white sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Don’t see your format?</h2>
            <p className="mt-1 text-sm text-indigo-100">
              Start with the standard invoice. Rename the title, add any items and pick one of {INVOICE_STYLES.length} styles.
            </p>
          </div>
          <Link
            to={GENERATOR_PATH}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3d52a0] transition-transform duration-300 hover:-translate-y-0.5"
          >
            Start a blank invoice
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default TemplatesPage
