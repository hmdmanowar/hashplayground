import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import InvoicePreview from '../components/InvoicePreview'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  LockIcon,
  PercentIcon,
  QrIcon,
  SparkleIcon,
  XIcon,
} from '../components/Icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { isGst } from '../lib/invoice'
import { getInvoiceStyle, INVOICE_STYLES, type InvoiceStyleId } from '../lib/invoiceStyles'
import { readJson } from '../lib/storage'
import { sampleDraftFor } from '../lib/sampleDraft'
import { findTemplate, GALLERY_PAGE, GENERATOR_PATH, TEMPLATES, type InvoiceTemplate } from '../lib/templates'

const STEPS = ['Pick a template', 'Fill in your details', 'Download the PDF']

// Filter chips, each a simple predicate over the template data.
const CREATIVE = new Set(['graphic-designer-invoice', 'photography-invoice', 'content-writer-invoice', 'social-media-marketing-invoice'])
const SERVICES = new Set(['consulting-invoice-template', 'web-developer-invoice', 'freelance-invoice-template', 'tutor-invoice-template'])

type IconComponent = (props: { className?: string }) => React.ReactElement

const FILTERS: { id: string; label: string; icon: IconComponent; match: (template: InvoiceTemplate) => boolean }[] = [
  { id: 'all', label: 'All', icon: SparkleIcon, match: () => true },
  { id: 'global', label: 'Any country', icon: GlobeIcon, match: (t) => t.region === 'global' },
  { id: 'vat', label: 'VAT & GST', icon: PercentIcon, match: (t) => t.taxMode !== 'none' },
  { id: 'country', label: 'UK · US · Australia', icon: FileTextIcon, match: (t) => ['GB', 'US', 'AU'].includes(t.region) },
  { id: 'india', label: 'India', icon: FileTextIcon, match: (t) => t.region === 'IN' },
  { id: 'creative', label: 'Creative', icon: CameraIcon, match: (t) => CREATIVE.has(t.slug) },
  { id: 'services', label: 'Services', icon: BriefcaseIcon, match: (t) => SERVICES.has(t.slug) },
]

// The most-searched formats get a "Popular" badge.
const POPULAR = new Set(['freelance-invoice-template', 'invoice-generator', 'gst-invoice-format'])

// Fanned stack in the hero: three different templates as real previews.
const HERO_STACK: { slug: string; style: InvoiceStyleId }[] = [
  { slug: 'photography-invoice', style: 'studio' },
  { slug: 'gst-invoice-format', style: 'classic' },
  { slug: 'uk-invoice-template', style: 'modern' },
]

const TRUST_POINTS = ['Free forever', 'No sign-up', 'Any currency & tax', 'Data stays in your browser']

const INCLUDED: { icon: IconComponent; title: string; body: string }[] = [
  { icon: PercentIcon, title: 'Tax worked out', body: 'VAT, GST or sales tax per line, and India’s CGST + SGST or IGST.' },
  { icon: QrIcon, title: 'Scan-to-pay QR', body: 'Add a pay link (or UPI ID in India) and a QR prints on the invoice.' },
  { icon: FileTextIcon, title: 'Amount in words', body: 'In your currency, with lakh and crore for rupee invoices.' },
  { icon: LockIcon, title: 'Private by design', body: 'Nothing is uploaded. The PDF is made in your browser.' },
]


const PREVIEW_WIDTH = 640

// Renders the real invoice preview at a fixed width and scales it to fit
// whatever width the card has.
function ScaledPreview({ template, styleId }: { template: InvoiceTemplate; styleId: InvoiceStyleId }) {
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
  // The gallery shows every template in the standard Classic style; styles
  // are chosen in step 2.
  const styleId: InvoiceStyleId = 'classic'
  const badges = [
    isGst(template.taxMode) ? 'GST' : template.taxMode === 'custom' ? template.taxLabel || 'Tax' : 'No tax',
    template.currency,
    template.documentTitle,
  ]

  return (
    <Link
      to={`/templates/?template=${template.slug}`}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className="bf-fade-in group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-xl focus-visible:border-[var(--color-primary)] focus-visible:outline-none motion-reduce:transition-none"
    >
      <div className="bg-[var(--bg-app)] px-4 pt-4">
        <div className="overflow-hidden rounded-t-lg shadow-sm ring-1 ring-black/5">
          <ScaledPreview template={template} styleId={styleId} />
        </div>
      </div>

      {POPULAR.has(template.slug) && (
        <span className="absolute top-6 left-6 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-strong)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase shadow-md">
          <SparkleIcon className="h-3 w-3" />
          Popular
        </span>
      )}

      {/* Hover call to action over the preview */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[17rem] items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
          Choose this template
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-semibold">{template.label}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">{template.intro}</p>
        {template.highlights.length > 0 && (
          <ul className="mt-3 space-y-1">
            {template.highlights.slice(0, 2).map((point) => (
              <li key={point} className="flex items-start gap-1.5 text-xs">
                <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-accent)]" />
                <span className="line-clamp-1">{point}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
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

// Step 2: the chosen template shown in every style; pick one, then continue
// to the generator with both applied.
function StyleStep({ template }: { template: InvoiceTemplate }) {
  const navigate = useNavigate()
  const savedStyle = readJson<{ style?: string }>('billflow:business')?.style
  const [selected, setSelected] = useState<InvoiceStyleId>(getInvoiceStyle(savedStyle).id)
  const current = getInvoiceStyle(selected)

  function proceed() {
    navigate(`/${template.slug}/`, { state: { style: selected } })
  }

  return (
    <div className="pb-28">
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-6">
        <Link
          to="/templates/"
          className="text-xs font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
        >
          ← All templates
        </Link>
        <p className="mt-4 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">Step 2 of 2</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Pick a style for your <span className="text-[var(--color-accent)]">{template.label}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-muted)] sm:text-base">
          This is exactly how your downloaded PDF will look. You can still switch styles later in the editor.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="radiogroup" aria-label="Invoice style">
          {INVOICE_STYLES.map((look) => {
            const active = look.id === selected
            return (
              <button
                key={look.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(look.id)}
                onDoubleClick={() => navigate(`/${template.slug}/`, { state: { style: look.id } })}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-xl ring-2 ring-[var(--color-primary)]/40'
                    : 'border-[var(--border-panel)] bg-[var(--bg-panel)] shadow-sm hover:border-[var(--color-primary)] hover:shadow-lg'
                }`}
              >
                <div className="bg-[var(--bg-app)] px-4 pt-4">
                  <div className="overflow-hidden rounded-t-lg shadow-sm ring-1 ring-black/5">
                    <ScaledPreview template={template} styleId={look.id} />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 p-4">
                  <div>
                    <p className="font-semibold">{look.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">{look.description}</p>
                  </div>
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      active ? 'border-[var(--color-primary-strong)] bg-[var(--color-primary-strong)] text-white' : 'border-[var(--border-panel)]'
                    }`}
                    aria-hidden="true"
                  >
                    {active && <CheckIcon className="h-3 w-3" />}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Continue bar stays in reach while browsing styles */}
      <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-panel)] bg-[var(--bg-panel)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 truncate text-sm text-[var(--color-muted)]">
            <span className="font-semibold text-[var(--text-app)]">{template.label}</span> ·{' '}
            <span className="font-semibold text-[var(--text-app)]">{current.name}</span> style
          </p>
          <button
            type="button"
            onClick={proceed}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            Continue with {current.name}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Three real template previews fanned out like a hand of cards.
function HeroStack() {
  const poses = ['-translate-x-24 translate-y-6 -rotate-6', 'z-10', 'translate-x-24 translate-y-6 rotate-6']
  return (
    <div className="relative hidden h-80 items-center justify-center lg:flex" aria-hidden="true">
      <div className="absolute inset-x-10 inset-y-6 rounded-full bg-[var(--color-primary)]/15 blur-3xl" />
      {HERO_STACK.map(({ slug, style }, index) => {
        const template = findTemplate(slug)
        if (!template) return null
        return (
          <div key={slug} className={`absolute w-60 ${poses[index]}`}>
            <div
              className={`overflow-hidden rounded-xl border border-[var(--border-panel)] bg-[var(--bg-panel)] shadow-2xl ${
                index === 1 ? 'bf-float' : 'bf-float-delayed'
              }`}
            >
              <ScaledPreview template={template} styleId={style} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

let viewed = false

function TemplatesPage() {
  const [query, setQuery] = useState('')
  const [filterId, setFilterId] = useState('all')
  const [params] = useSearchParams()
  const picked = findTemplate(params.get('template') ?? '')

  usePageMeta(GALLERY_PAGE)

  useEffect(() => {
    if (viewed) return
    viewed = true
    trackEvent('page_view', GALLERY_PAGE.slug)
  }, [])

  // Switching between gallery and style step changes only the query string,
  // which the app-level scroll reset doesn't watch.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [picked?.slug])

  if (picked) return <StyleStep key={picked.slug} template={picked} />

  const search = query.trim().toLowerCase()
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0]
  const matchesSearch = (template: InvoiceTemplate) =>
    !search || `${template.label} ${template.h1} ${template.intro} ${template.documentTitle}`.toLowerCase().includes(search)
  const visible = TEMPLATES.filter((template) => filter.match(template) && matchesSearch(template))

  return (
    <div className="pb-8">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 pb-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="text-center lg:text-left">
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
        <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--color-muted)] sm:text-base lg:mx-0">{GALLERY_PAGE.intro}</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
          {TRUST_POINTS.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-medium"
            >
              <CheckIcon className="h-3 w-3 text-[var(--color-accent)]" />
              {point}
            </li>
          ))}
        </ul>
        <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium lg:justify-start">
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
        </div>
        <HeroStack />
      </section>

      {/* Search + filters */}
      <div className="sticky top-14 z-20 border-y border-[var(--border-panel)] bg-[var(--bg-app)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
            role="group"
            aria-label="Filter templates"
          >
            {FILTERS.map((item) => {
              const count = TEMPLATES.filter((template) => item.match(template) && matchesSearch(template)).length
              const active = item.id === filterId
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilterId(item.id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--color-primary-strong)] bg-[var(--color-primary-strong)] text-white'
                      : 'border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
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
              placeholder="Search e.g. VAT, UK, proforma, photographer…"
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

      <section className="mx-auto max-w-7xl px-4 pt-6">
        {visible.length > 0 && (
          <p className="mb-4 text-sm text-[var(--color-muted)]" aria-live="polite">
            Showing <span className="font-semibold text-[var(--text-app)]">{visible.length}</span>{' '}
            {visible.length === 1 ? 'template' : 'templates'}
            {filter.id !== 'all' && (
              <>
                {' '}
                in <span className="font-semibold text-[var(--text-app)]">{filter.label}</span>
              </>
            )}
            {search && <> matching “{query.trim()}”</>}
          </p>
        )}
        {visible.length > 0 ? (
          <div
            key={`${filterId}:${search}`}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visible.map((template, index) => (
              <GalleryCard key={template.slug} template={template} index={index} />
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

      <section className="mx-auto mt-16 max-w-7xl px-4" aria-labelledby="included">
        <h2 id="included" className="text-center text-2xl font-bold tracking-tight">
          Every template includes
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map((item) => (
            <li key={item.title} className="bf-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-accent)]">
                <item.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{item.body}</p>
            </li>
          ))}
        </ul>
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
