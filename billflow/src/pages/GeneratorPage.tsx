import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InvoiceForm from '../components/InvoiceForm'
import InvoicePreview from '../components/InvoicePreview'
import UpgradeBanner from '../components/UpgradeBanner'
import WaitlistDialog from '../components/WaitlistDialog'
import { DownloadIcon, PrinterIcon } from '../components/Icons'
import { useInvoiceDraft } from '../hooks/useInvoiceDraft'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { TEMPLATES, type InvoiceTemplate } from '../lib/templates'

const HOW_IT_WORKS = [
  { title: 'Fill in your details', body: 'Add your business, your client and the items you’re billing. Your details are remembered in this browser.' },
  { title: 'Check the live preview', body: 'Totals, GST split and amount in words update as you type, exactly as they’ll appear on the PDF.' },
  { title: 'Download and send', body: 'Download a clean A4 PDF and email or WhatsApp it to your client. No account needed.' },
]

// StrictMode runs mount effects twice in dev; count each page once per load.
const viewedSlugs = new Set<string>()

function GeneratorPage({ template }: { template: InvoiceTemplate }) {
  const { draft, update, updateParty, updatePayment, updateItem, addItem, removeItem, reset } = useInvoiceDraft(template)
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
        {template.slug ? (
          <Link
            to="/templates/"
            className="text-xs font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            ← All templates
          </Link>
        ) : (
          <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">Free · No sign-up · GST ready</p>
        )}
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{template.h1}</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)] sm:text-base">{template.intro}</p>
        {!template.slug && (
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

          <InvoicePreview draft={draft} />
          <UpgradeBanner onUpgrade={handleUpgrade} />
        </div>
      </div>

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
        <div className="mt-4 divide-y divide-[var(--border-panel)] rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)]">
          {template.faq.map((item) => (
            <details key={item.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-[var(--color-muted)] transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <WaitlistDialog open={waitlistOpen} source={template.slug} defaultEmail={draft.from.email} onClose={closeWaitlist} />
    </div>
  )
}

export default GeneratorPage
