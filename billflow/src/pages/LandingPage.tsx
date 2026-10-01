import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FaqList from '../components/FaqList'
import InvoicePreview from '../components/InvoicePreview'
import TemplateCard from '../components/TemplateCard'
import WaitlistDialog from '../components/WaitlistDialog'
import HowItWorks from '../components/landing/HowItWorks'
import {
  ArrowRightIcon,
  BankIcon,
  BellIcon,
  BriefcaseIcon,
  CameraIcon,
  ChartIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  GraduationIcon,
  ImageIcon,
  LockIcon,
  PenIcon,
  PercentIcon,
  QrIcon,
  SparkleIcon,
  UsersIcon,
} from '../components/Icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { EMPTY_PAYMENT, newId, toIsoDate, type InvoiceDraft } from '../lib/invoice'
import { GENERATOR_PATH, LANDING_PAGE, TEMPLATES, findTemplate } from '../lib/templates'

// ---------------------------------------------------------------- data

// A sample invoice for the hero, rendered by the real preview component so
// the landing page always shows exactly what users will get. The UPI handle
// is deliberately fake (no "@billflow" bank exists) so the demo QR can never
// send money to a real account.
function sampleDraft(): InvoiceDraft {
  const today = new Date()
  const due = new Date(today)
  due.setDate(due.getDate() + 15)
  const party = { address: '', taxId: '', email: '', phone: '' }
  return {
    documentTitle: 'Tax Invoice',
    invoiceNumber: 'INV-0042',
    issueDate: toIsoDate(today),
    dueDate: toIsoDate(due),
    currency: 'INR',
    taxMode: 'gst_intra',
    taxLabel: '',
    discountPercent: '',
    from: { ...party, name: 'Your Studio', address: 'Bengaluru, Karnataka', taxId: '29ABCDE1234F1Z5' },
    to: { ...party, name: 'Acme Retail Pvt Ltd', address: 'Bengaluru, Karnataka' },
    items: [
      { id: newId(), description: 'Website design and development', hsn: '998314', quantity: '1', rate: '40000', taxRate: '18' },
      { id: newId(), description: 'Monthly maintenance', hsn: '998316', quantity: '3', rate: '2500', taxRate: '18' },
    ],
    notes: '',
    payment: { ...EMPTY_PAYMENT, upi: true, upiId: 'yourstudio@billflow' },
    logoDataUrl: '',
  }
}

const HIGHLIGHTS = ['No sign-up', 'GST ready', 'UPI QR on every invoice', 'PDF in seconds']

const FACTS = [
  { value: `${TEMPLATES.length}`, label: 'ready-made templates' },
  { value: '5', label: 'currencies, incl. INR & USD' },
  { value: '₹0', label: 'to create & download' },
  { value: '< 1 min', label: 'to your first invoice' },
]

const FEATURES = [
  {
    icon: PercentIcon,
    title: 'GST done for you',
    body: 'CGST + SGST or IGST worked out line by line, with a hint when the GSTINs show which one applies.',
  },
  {
    icon: QrIcon,
    title: 'Scan-to-pay UPI QR',
    body: 'Add your UPI ID and every invoice carries a QR with the exact amount, ready for GPay, PhonePe or Paytm.',
  },
  {
    icon: BankIcon,
    title: 'Bank details in one go',
    body: 'Type an IFSC and the bank name and branch fill themselves in. Account numbers are checked as you type.',
  },
  {
    icon: FileTextIcon,
    title: 'Templates for every job',
    body: 'Tax invoice, proforma, export under LUT, freelance, tuition, VAT and more, each with the right wording.',
  },
  {
    icon: GlobeIcon,
    title: 'Bill clients anywhere',
    body: 'Invoice in INR, USD, EUR, GBP or AED. The amount in words follows the currency you pick.',
  },
  {
    icon: ImageIcon,
    title: 'Your brand on it',
    body: 'Upload your logo and get a crisp A4 PDF with selectable text that looks great printed or on screen.',
  },
  {
    icon: LockIcon,
    title: 'Private by design',
    body: 'Invoices are built in your browser. Your details stay on your device and nothing is stored on our servers.',
  },
  {
    icon: SparkleIcon,
    title: 'Fast every time',
    body: 'Your business and payment details are remembered, so the next invoice takes seconds, not minutes.',
  },
]

const PRO_FEATURES = [
  { icon: BellIcon, title: 'Automatic payment reminders', body: 'Polite email nudges when an invoice goes overdue.' },
  { icon: ChartIcon, title: 'Paid / unpaid dashboard', body: 'See what’s outstanding, overdue and paid this month.' },
  { icon: UsersIcon, title: 'Clients & invoice history', body: 'Save clients once and find any past invoice in seconds.' },
]

const PERSONAS = [
  { icon: BriefcaseIcon, title: 'Freelancers', body: 'Milestones, hourly work, revisions.', slug: 'freelance-invoice-template' },
  { icon: ChartIcon, title: 'Consultants', body: 'Hourly rates, day rates and retainers.', slug: 'consulting-invoice-template' },
  { icon: PenIcon, title: 'Designers & writers', body: 'Concepts, deliverables and per-piece work.', slug: 'graphic-designer-invoice' },
  { icon: CameraIcon, title: 'Photographers', body: 'Shoots, editing, albums and advances.', slug: 'photography-invoice' },
  { icon: GraduationIcon, title: 'Tutors & coaches', body: 'Monthly fees, sessions and course material.', slug: 'tutor-invoice-template' },
  { icon: GlobeIcon, title: 'Exporters', body: 'Foreign clients, USD/EUR, LUT wording.', slug: 'invoice-for-international-clients' },
]

const SHOWCASE_SLUGS = [
  'gst-invoice-format',
  'proforma-invoice',
  'freelance-invoice-template',
  'invoice-for-international-clients',
  'photography-invoice',
  'vat-invoice-generator',
]

// ---------------------------------------------------------------- sections

function SectionHeading({ eyebrow, title, accent, body }: { eyebrow?: string; title: string; accent?: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
        {title} {accent && <span className="text-[var(--color-accent)]">{accent}</span>}
      </h2>
      {body && <p className="mt-3 text-[var(--color-muted)]">{body}</p>}
    </div>
  )
}

function Hero({ draft }: { draft: InvoiceDraft }) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-12 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
      <div className="bf-fade-in">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Free invoicing for India, built by Hash Playground
        </span>
        <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Free GST invoicing for <span className="text-[var(--color-accent)]">freelancers</span> and small businesses
        </h1>
        <p className="mt-5 max-w-xl text-base text-[var(--color-muted)] sm:text-lg">{LANDING_PAGE.intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={GENERATOR_PATH}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3d52a0]/25 transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            Create an invoice, free
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/templates/"
            className="inline-flex items-center rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]"
          >
            Browse templates
          </Link>
        </div>
        <ul className="mt-8 grid max-w-md grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Live product shot: the real invoice preview with floating callouts */}
      <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
        <div className="absolute -inset-8 rounded-[3rem] bg-[var(--color-primary)]/20 blur-3xl" />
        <div className="pointer-events-none relative rotate-1 select-none">
          <InvoicePreview draft={draft} />
        </div>
        <div className="bf-float absolute -top-4 left-2 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-3 shadow-xl sm:-left-10">
          <p className="text-[11px] text-[var(--color-muted)]">GST worked out</p>
          <p className="text-sm font-semibold">CGST 9% + SGST 9%</p>
        </div>
        <div className="bf-float-delayed absolute right-2 bottom-24 hidden rounded-2xl sm:block border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-3 shadow-xl sm:-right-8">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <QrIcon className="h-4 w-4 text-[var(--color-accent)]" />
            Scan to pay
          </p>
          <p className="text-[11px] text-[var(--color-muted)]">Any UPI app, exact amount</p>
        </div>
        <div className="bf-float absolute -bottom-5 left-6 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-xl">
          <CheckIcon className="h-4 w-4" />
          PDF ready in seconds
        </div>
      </div>
    </section>
  )
}

function Facts() {
  return (
    <section className="border-y border-[var(--border-panel)] bg-[var(--bg-panel)]/80 backdrop-blur">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
        {FACTS.map((fact) => (
          <div key={fact.label} className="text-center">
            <dt className="text-3xl font-bold text-[var(--color-accent)]">{fact.value}</dt>
            <dd className="mt-1 text-sm text-[var(--color-muted)]">{fact.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <SectionHeading
        eyebrow="Everything an invoice needs"
        title="Invoicing"
        accent="without the busywork"
        body="All the details Indian clients and accountants expect, filled in for you so you can get back to work."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--color-primary)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-accent)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">{feature.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TemplateShowcase() {
  const showcase = SHOWCASE_SLUGS.map((slug) => findTemplate(slug)).filter((template) => template !== undefined)
  return (
    <section className="py-20">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">Templates</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            Invoice templates that <span className="text-[var(--color-accent)]">fit your work</span>
          </h2>
        </div>
        <Link
          to="/templates/"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]"
        >
          View all {TEMPLATES.length} templates
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      {/* Auto-scrolling marquee: the set is rendered twice and slid by -50%
          for a seamless loop; hover/focus pauses it. The second copy is
          hidden from screen readers and skipped by keyboard focus. */}
      <div className="bf-marquee-track mt-8 pb-4">
        <div className="bf-marquee flex">
          {[false, true].map((duplicate) =>
            showcase.map((template) => (
              <div
                key={`${template.slug}-${duplicate}`}
                className={`flex w-72 shrink-0 pr-5 ${duplicate ? 'bf-marquee-dup' : ''}`}
                aria-hidden={duplicate || undefined}
              >
                <TemplateCard template={template} focusable={!duplicate} />
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  )
}

function Personas() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <SectionHeading
        eyebrow="Who it’s for"
        title="Built for Indian businesses,"
        accent="especially yours"
        body="Start from a template made for the way you bill."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon
          return (
            <Link
              key={persona.title}
              to={`/${persona.slug}/`}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5 transition-all duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:border-[var(--color-primary)] hover:shadow-lg"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-strong)] text-white">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{persona.title}</span>
                <span className="block text-sm text-[var(--color-muted)]">{persona.body}</span>
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function ProBand({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#3d52a0] to-[#7091e6] p-8 text-white shadow-2xl sm:p-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <SparkleIcon className="h-3.5 w-3.5" />
              BillFlow Pro · coming soon
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Stop chasing clients for payment</h2>
            <p className="mt-3 text-indigo-100">
              Pro keeps track of every invoice and follows up on late ones automatically, so getting paid isn’t another
              job on your list.
            </p>
            <button
              type="button"
              onClick={onJoin}
              className="mt-6 cursor-pointer rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3d52a0] transition-opacity hover:opacity-90"
            >
              Get early access
            </button>
          </div>
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.title} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>
                    <span className="block font-semibold">{feature.title}</span>
                    <span className="block text-sm text-indigo-100">{feature.body}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-20 lg:grid-cols-[1fr_2fr]">
      <div>
        <h2 className="text-3xl font-bold">
          Frequently asked <span className="text-[var(--color-accent)]">questions</span>
        </h2>
        <p className="mt-3 text-[var(--color-muted)]">Everything you need to know before your first invoice.</p>
      </div>
      <FaqList items={LANDING_PAGE.faq} />
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 pb-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-[#141a3a] px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-bold sm:text-4xl">Your first invoice is a minute away</h2>
        <p className="mx-auto mt-3 max-w-xl text-indigo-200">
          No sign-up and no credit card. Just fill it in, download it and get paid.
        </p>
        <Link
          to={GENERATOR_PATH}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#141a3a] transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none"
        >
          Create an invoice, free
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- page

let viewed = false

function LandingPage() {
  const [draft] = useState(sampleDraft)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  usePageMeta(LANDING_PAGE)

  useEffect(() => {
    if (viewed) return
    viewed = true
    trackEvent('page_view', LANDING_PAGE.slug)
  }, [])

  function openWaitlist() {
    trackEvent('upgrade_clicked', LANDING_PAGE.slug)
    setWaitlistOpen(true)
  }

  const closeWaitlist = useCallback(() => setWaitlistOpen(false), [])

  return (
    // overflow-x-clip: decorative glows bleed past the edges on purpose; clip
    // them without creating a scroll container.
    <div className="overflow-x-clip">
      <Hero draft={draft} />
      <Facts />
      <HowItWorks />
      <Features />
      <TemplateShowcase />
      <Personas />
      <ProBand onJoin={openWaitlist} />
      <Faq />
      <FinalCta />
      <WaitlistDialog open={waitlistOpen} source={LANDING_PAGE.slug} defaultEmail="" onClose={closeWaitlist} />
    </div>
  )
}

export default LandingPage
