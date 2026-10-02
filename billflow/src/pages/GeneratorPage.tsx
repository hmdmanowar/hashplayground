import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FaqList from '../components/FaqList'
import InvoiceForm from '../components/InvoiceForm'
import InvoicePreview from '../components/InvoicePreview'
import StylePicker from '../components/StylePicker'
import UpgradeBanner from '../components/UpgradeBanner'
import WaitlistDialog from '../components/WaitlistDialog'
import { CheckIcon, DownloadIcon, PrinterIcon } from '../components/Icons'
import { useInvoiceDraft } from '../hooks/useInvoiceDraft'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { GENERATOR_SLUG, TEMPLATES, type InvoiceTemplate } from '../lib/templates'

const HOW_IT_WORKS = [
  { title: 'Fill in your details', body: 'Add your business, your client and the items you’re billing. Your details are remembered in this browser.' },
  { title: 'Check the live preview', body: 'Totals, GST split and amount in words update as you type, exactly as they’ll appear on the PDF.' },
  { title: 'Download and send', body: 'Download a clean A4 PDF and email or WhatsApp it to your client. No account needed.' },
]

// A handful of other templates to link to from each page (internal links
// help both visitors and crawlers find the long-tail pages).
function relatedTemplates(slug: string, count = 6): InvoiceTemplate[] {
  const others = TEMPLATES.filter((other) => other.slug !== slug && other.slug !== GENERATOR_SLUG)
  const start = Math.max(0, TEMPLATES.findIndex((other) => other.slug === slug))
  return Array.from({ length: Math.min(count, others.length) }, (_, i) => others[(start + i) % others.length])
}

// StrictMode runs mount effects twice in dev; count each page once per load.
const viewedSlugs = new Set<string>()

function GeneratorPage({ template }: { template: InvoiceTemplate }) {
  // Style chosen on the templates page (step 2), passed via navigation state.
  const requestedStyle = (useLocation().state as { style?: string } | null)?.style
  const { draft, update, updateParty, updatePayment, updateItem, addItem, removeItem, reset } = useInvoiceDraft(
    template,
    requestedStyle,
  )
  const [downloading, setDownloading] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  usePageMeta(template)

  useEffect(() => {
    if (viewedSlugs.has(template.slug)) return
    viewedSlugs.add(template.slug)
    trackEvent('page_view', template.slug)
  }, [template.slug])

  async function handleDownload() {
    setDownloading(true)
    setDownloadError('')
    try {
      // Loaded on demand: jsPDF is the biggest dependency and most visitors
      // fill in the form for a while before they download.
      const { generateInvoicePdf } = await import('../lib/generatePdf')
      await generateInvoicePdf(draft)
      trackEvent('pdf_downloaded', template.slug)
    } catch {
      setDownloadError('Couldn’t create the PDF. Please try again, or use Print instead.')
    } finally {
      setDownloading(false)
    }
  }

  function handleUpgrade() {
    trackEvent('upgrade_clicked', template.slug)
    setWaitlistOpen(true)
  }

  const closeWaitlist = useCallback(() => setWaitlistOpen(false), [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="max-w-3xl print:hidden">
        <Link
          to="/templates/"
          className="text-xs font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
        >
          ← All templates
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{template.h1}</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)] sm:text-base">{template.intro}</p>
        {template.slug === GENERATOR_SLUG && (
          <p className="mt-3 text-sm">
            Need a GST, proforma, freelance or export format?{' '}
            <Link to="/templates/" className="font-semibold text-[var(--color-accent)] hover:underline">
              Browse {TEMPLATES.length - 1} ready-made templates →
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="print:hidden">
          <InvoiceForm
            draft={draft}
            update={update}
            updateParty={updateParty}
            updatePayment={updatePayment}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            reset={reset}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              <DownloadIcon className="h-4 w-4" />
              {downloading ? 'Preparing PDF…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border-panel)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            {downloadError && <p className="w-full text-sm text-red-600 dark:text-red-400">{downloadError}</p>}
          </div>

          <StylePicker draft={draft} value={draft.style} onChange={(style) => update({ style })} />
          <InvoicePreview draft={draft} logoPlaceholder />
          <UpgradeBanner onUpgrade={handleUpgrade} />
        </div>
      </div>

      {template.highlights.length > 0 && (
        <section className="mt-16 print:hidden" aria-labelledby="included">
          <h2 id="included" className="text-xl font-semibold">
            What this template includes
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {template.highlights.map((point) => (
              <li key={point} className="bf-card flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-accent)]">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {template.guide.length > 0 && (
        <article className="mt-16 max-w-3xl space-y-8 print:hidden">
          {template.guide.map((section) => (
            <section key={section.h}>
              <h2 className="text-xl font-semibold">{section.h}</h2>
              {section.p.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      )}

      <section className="mt-16 print:hidden" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-xl font-semibold">
          How it works
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="bf-card">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-accent)]">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 max-w-3xl print:hidden" aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-semibold">
          Frequently asked questions
        </h2>
        <div className="mt-4">
          <FaqList items={template.faq} />
        </div>
      </section>

      <section className="mt-12 print:hidden" aria-labelledby="related">
        <h2 id="related" className="text-xl font-semibold">
          More free invoice templates
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTemplates(template.slug).map((other) => (
            <li key={other.slug}>
              <Link
                to={`/${other.slug}/`}
                className="bf-card block h-full transition-colors hover:border-[var(--color-primary)]"
              >
                <span className="text-sm font-semibold">{other.h1}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted)]">{other.intro}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <WaitlistDialog open={waitlistOpen} source={template.slug} defaultEmail={draft.from.email} onClose={closeWaitlist} />
    </div>
  )
}

export default GeneratorPage
