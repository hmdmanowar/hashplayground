import { ArrowRightIcon, FileIcon } from '../Icons/Icons'

// BillFlow lives under /billflow/ as a separate app, so these are plain links
// (full page loads), not router links. Also gives the BillFlow pages a
// prominent internal link from the home page.
const LINKS = [
  { href: '/billflow/templates/', label: 'Invoice templates' },
  { href: '/billflow/guides/', label: 'Invoicing guides' },
]

function BillflowPromo() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <section
        aria-labelledby="billflow-promo"
        className="flex flex-col gap-6 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-strong)] text-white">
            <FileIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">Also from Hash Playground</p>
            <h2 id="billflow-promo" className="mt-1 text-xl font-bold sm:text-2xl">
              BillFlow: free invoice generator
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
              Make a professional invoice in any currency, with VAT, GST or sales tax and a scan-to-pay QR code. No
              sign-up, and your invoices stay in your browser.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {LINKS.map((link) => (
                <a key={link.href} href={link.href} className="font-medium text-[var(--color-primary)] hover:underline">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <a
          href="/billflow/"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Create a free invoice
          <ArrowRightIcon className="h-4 w-4" />
        </a>
      </section>
    </div>
  )
}

export default BillflowPromo
