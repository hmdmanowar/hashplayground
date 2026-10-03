import type { ReactNode } from 'react'
import { DEMO } from '../../lib/demo'
import { TEMPLATES } from '../../lib/templates'
import { INVOICE_STYLES } from '../../lib/invoiceStyles'
import { CheckIcon, DownloadIcon, FileTextIcon, LockIcon, PercentIcon, QrIcon } from '../Icons'

// Phone mockup flanked by staggered pastel cards. The cards state what the
// product actually does — no invented testimonials or ratings. When real
// customer quotes exist, they can replace a card's body without touching the
// layout.

interface ProofCard {
  tone: string // card background (fixed pastel in both themes, dark text)
  accent: string
  icon: typeof LockIcon
  title: string
  footer: ReactNode
  offset: string // vertical stagger on large screens
}

const LEFT: ProofCard[] = [
  {
    tone: '#fde4e4',
    accent: '#c2410c',
    icon: PercentIcon,
    title: 'Tax maths, done for you on every line.',
    footer: (
      <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
        {DEMO.taxChip}
      </span>
    ),
    offset: 'lg:mt-16',
  },
  {
    tone: '#ddf3e7',
    accent: '#15803d',
    icon: QrIcon,
    title: 'Clients pay in one scan, straight from the invoice.',
    footer: (
      <span className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
        <QrIcon className="h-6 w-6 text-gray-900" />
        {DEMO.india ? 'GPay · PhonePe · Paytm' : DEMO.payApps}
      </span>
    ),
    offset: 'lg:mt-0',
  },
]

const RIGHT: ProofCard[] = [
  {
    tone: '#dbe8fb',
    accent: '#1d4ed8',
    icon: LockIcon,
    title: 'Your invoices stay on your device. No account needed.',
    footer: (
      <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
        <LockIcon className="h-3.5 w-3.5" />
        Private by design
      </span>
    ),
    offset: 'lg:mt-0',
  },
  {
    tone: '#fdf0c4',
    accent: '#b45309',
    icon: FileTextIcon,
    title: 'Free for every business, everywhere.',
    footer: (
      <span className="block rounded-2xl bg-white/80 px-4 py-2 text-center shadow-sm">
        <span className="block text-2xl font-bold text-gray-900">{DEMO.free}</span>
        <span className="block text-[11px] text-gray-600">
          {TEMPLATES.length} templates · {INVOICE_STYLES.length} styles
        </span>
      </span>
    ),
    offset: 'lg:mt-16',
  },
]

function Card({ card }: { card: ProofCard }) {
  const Icon = card.icon
  return (
    <div
      className={`flex min-h-64 flex-col justify-between rounded-[2rem] p-6 text-gray-900 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none ${card.offset}`}
      style={{ backgroundColor: card.tone }}
    >
      <div>
        <span className="block" style={{ color: card.accent }}>
          <Icon className="h-6 w-6" />
        </span>
        <p className="mt-3 text-lg leading-snug font-medium">{card.title}</p>
      </div>
      <div className="mt-6 flex justify-center">{card.footer}</div>
    </div>
  )
}

// A phone showing BillFlow's own mobile invoice view.
function Phone() {
  return (
    <div className="bf-float relative mx-auto w-[250px]" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[3rem] bg-[var(--color-primary)]/25 blur-2xl" />
      <div className="relative rounded-[2.6rem] border-[7px] border-[#1c1f2e] bg-[#1c1f2e] shadow-2xl">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="overflow-hidden rounded-[2.1rem] bg-[#f6f7fb] text-gray-900">
          <div className="flex justify-between px-5 pt-2.5 pb-1 text-[10px] font-semibold">
            <span>9:41</span>
            <span>●●●</span>
          </div>
          <div className="flex items-center justify-between bg-white px-4 py-2.5 shadow-sm">
            <span className="text-sm font-bold">
              <span className="text-[#3d52a0]">Bill</span>
              <span className="text-[#7091e6]">Flow</span>
            </span>
            <span className="rounded-full bg-[#3d52a0] px-2 py-0.5 text-[9px] font-semibold text-white">+ New</span>
          </div>

          <div className="space-y-2.5 p-3">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] tracking-wide text-gray-500 uppercase">{DEMO.docTitle}</p>
                  <p className="text-xs font-semibold">INV-0042</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">Due 17 Oct</span>
              </div>
              <p className="mt-2 text-[10px] text-gray-500">Billed to</p>
              <p className="text-xs font-medium">{DEMO.client}</p>
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Website design</span>
                  <span>{DEMO.design}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance × 3</span>
                  <span>{DEMO.maintenance}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{DEMO.taxLine}</span>
                  <span>{DEMO.tax}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                <span>Total</span>
                <span>{DEMO.total}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-gray-900">
                <QrIcon className="h-8 w-8" />
              </span>
              <div>
                <p className="text-xs font-semibold">Scan to pay</p>
                <p className="text-[10px] text-gray-500">{DEMO.payHint}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
              <CheckIcon className="h-3.5 w-3.5" />
              PDF ready to share
            </div>

            <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#3d52a0] py-2.5 text-xs font-semibold text-white">
              <DownloadIcon className="h-3.5 w-3.5" />
              Download PDF
            </div>
          </div>
          <div className="mx-auto mt-1 mb-2 h-1 w-24 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}

function ProofStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_1fr_1fr] lg:gap-6">
        <div className="order-2 sm:order-none">
          <Card card={LEFT[0]} />
        </div>
        <div className="order-3 sm:order-none">
          <Card card={LEFT[1]} />
        </div>
        <div className="order-1 sm:col-span-2 sm:order-first lg:order-none lg:col-span-1 lg:-mt-6">
          <Phone />
        </div>
        <div className="order-4 sm:order-none">
          <Card card={RIGHT[0]} />
        </div>
        <div className="order-5 sm:order-none">
          <Card card={RIGHT[1]} />
        </div>
      </div>
    </section>
  )
}

export default ProofStrip
