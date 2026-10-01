import { BellIcon, CheckIcon } from './Icons'

const PRO_FEATURES = [
  'Automatic email reminders to clients when an invoice is overdue',
  'Dashboard of paid, unpaid and overdue invoices',
  'Saved clients and full invoice history',
]

function UpgradeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <aside className="rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary-soft)] p-5 print:hidden">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
          <BellIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Tired of chasing clients for payment?</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            BillFlow Pro follows up on unpaid invoices for you, so you don’t have to.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {PRO_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-5 w-full cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
      >
        Get early access to BillFlow Pro
      </button>
    </aside>
  )
}

export default UpgradeBanner
