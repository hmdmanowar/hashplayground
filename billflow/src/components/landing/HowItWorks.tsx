import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GENERATOR_PATH } from '../../lib/templates'
import { BellIcon, CheckIcon, FileTextIcon, PenIcon, QrIcon, SendIcon, WalletIcon } from '../Icons'

interface Step {
  title: string
  body: string
  icon: typeof PenIcon
  visual: ReactNode
}

// Deep indigo band in both themes, so it reads as a deliberate contrast
// section (like the dark "how it works" band on big invoicing sites).
const STEPS: Step[] = [
  {
    title: 'Create',
    icon: PenIcon,
    body: 'Pick a template, add your client and items. GST, totals and the amount in words are worked out as you type.',
    visual: (
      <div className="space-y-2.5">
        {[
          ['Client', 'Acme Retail Pvt Ltd'],
          ['Item', 'Website design · 1 × ₹40,000'],
          ['Tax', 'GST 18% → CGST 9% + SGST 9%'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[11px] tracking-wide text-indigo-200 uppercase">{label}</p>
            <p className="mt-0.5 text-sm font-medium text-white">{value}</p>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900">
          <span>Total</span>
          <span>₹47,200.00</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Send',
    icon: SendIcon,
    body: 'Download a clean A4 PDF with your logo and send it over email or WhatsApp. No account needed.',
    visual: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-gray-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FileTextIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">INV-0001.pdf</p>
            <p className="text-xs text-gray-500">A4 · ready to share</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Email', 'WhatsApp'].map((channel) => (
            <div key={channel} className="rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-medium text-white">
              Share on {channel}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Get paid',
    icon: WalletIcon,
    body: 'Your client scans the UPI QR on the invoice and pays the exact amount from any UPI app. Pro will chase late payers for you.',
    visual: (
      <div className="space-y-3">
        <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-4 text-gray-900">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-900">
            <QrIcon className="h-10 w-10" />
          </span>
          <div>
            <p className="text-sm font-semibold">Scan to pay ₹47,200.00</p>
            <p className="text-xs text-gray-500">GPay · PhonePe · Paytm · BHIM</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-400/15 px-4 py-3 text-sm font-medium text-emerald-200">
          <CheckIcon className="h-4 w-4" />
          Payment received
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-indigo-100">
          <BellIcon className="h-4 w-4" />
          Overdue? Pro sends a polite reminder for you.
        </div>
      </div>
    ),
  },
]

function HowItWorks() {
  const [active, setActive] = useState(0)

  return (
    <section className="bg-[#141a3a] py-20 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Invoicing made <span className="text-[#9fb4f0]">surprisingly easy</span>
          </h2>
          <p className="mt-3 max-w-md text-indigo-200">Three steps from blank page to money in your account.</p>

          <ol className="mt-8 space-y-2" role="tablist" aria-label="How BillFlow works">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const selected = index === active
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActive(index)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl px-4 py-4 text-left transition-colors ${
                      selected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        selected ? 'bg-[#7091e6] text-white' : 'bg-white/10 text-indigo-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{step.title}</span>
                      {selected && <span className="mt-1 block text-sm text-indigo-200">{step.body}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          <Link
            to={GENERATOR_PATH}
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#141a3a] transition-opacity hover:opacity-90"
          >
            Try it now, it’s free
          </Link>
        </div>

        <div className="relative" aria-live="polite">
          <div className="absolute -inset-6 rounded-[2rem] bg-[#7091e6]/20 blur-2xl" aria-hidden="true" />
          <div key={active} className="bf-fade-in relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="mb-4 text-xs font-semibold tracking-widest text-indigo-200 uppercase">
              Step {active + 1} · {STEPS[active].title}
            </p>
            {STEPS[active].visual}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
