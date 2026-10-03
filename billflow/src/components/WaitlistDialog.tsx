import { useEffect, useRef, useState, type FormEvent } from 'react'
import { joinWaitlist, type PriceIntent } from '../lib/api'
import { detectCountry } from '../lib/region'
import { CheckIcon, XIcon } from './Icons'

const PRICE_OPTIONS: { value: PriceIntent; label: string }[] =
  detectCountry() === 'IN'
    ? [
        { value: 199, label: '₹199 / month' },
        { value: 299, label: '₹299 / month' },
        { value: 499, label: '₹499 / month' },
      ]
    : [
        { value: 5, label: '$5 / month' },
        { value: 9, label: '$9 / month' },
        { value: 15, label: '$15 / month' },
      ]

interface WaitlistDialogProps {
  open: boolean
  source: string
  defaultEmail: string
  onClose: () => void
}

function WaitlistDialog({ open, source, defaultEmail, onClose }: WaitlistDialogProps) {
  const [email, setEmail] = useState('')
  const [priceIntent, setPriceIntent] = useState<PriceIntent>(PRICE_OPTIONS[1].value)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [error, setError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setStatus('idle')
    setError('')
    // Prefill from the "Your business" email, but never overwrite what the
    // visitor already typed here.
    setEmail((current) => current || defaultEmail)
    emailRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, defaultEmail, onClose])

  if (!open) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      const result = await joinWaitlist({ email: email.trim(), priceIntent, source })
      setAlreadyJoined(result.alreadyJoined)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--hover-overlay)]"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {status === 'done' ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-accent)]">
              <CheckIcon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{alreadyJoined ? 'You’re already on the list' : 'You’re on the list!'}</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              We’ll email you as soon as BillFlow Pro launches. Early members get launch pricing.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Back to my invoice
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="waitlist-title" className="pr-8 text-lg font-semibold">
              Get early access to BillFlow Pro
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Automatic payment reminders, an invoice dashboard and client history. Join the list and we’ll let you know
              when it’s ready.
            </p>

            <label className="mt-5 block">
              <span className="bf-label">Email</span>
              <input
                ref={emailRef}
                className="bf-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <fieldset className="mt-4">
              <legend className="bf-label">What would you pay for this each month?</legend>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {PRICE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors ${
                      priceIntent === option.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-accent)]'
                        : 'border-[var(--border-panel)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priceIntent"
                      className="sr-only"
                      checked={priceIntent === option.value}
                      onChange={() => setPriceIntent(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-5 w-full cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'submitting' ? 'Joining…' : 'Join the early access list'}
            </button>
            <p className="mt-3 text-center text-xs text-[var(--color-muted)]">No spam. Just one email when Pro is ready.</p>
          </form>
        )}
      </div>
    </div>
  )
}

export default WaitlistDialog
