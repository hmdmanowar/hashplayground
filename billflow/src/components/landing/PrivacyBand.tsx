import { useMemo } from 'react'
import { CheckIcon } from '../Icons'

const CIPHER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
const CIPHER_LINES = 14
const CIPHER_LENGTH = 72

// Deterministic pseudo-random lines (same every render) for the backdrop.
function cipherLines(): string[] {
  let seed = 7
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  return Array.from({ length: CIPHER_LINES }, () =>
    Array.from({ length: CIPHER_LENGTH }, () => CIPHER_CHARS[Math.floor(next() * CIPHER_CHARS.length)]).join(''),
  )
}

const POINTS = ['Built and saved on your device', 'We never see your invoice data', 'Secure HTTPS on every page']

// Every claim here is literally true of BillFlow: invoices are generated in
// the browser and kept in its local storage; only anonymous page counters
// reach the server. (Local storage isn't encrypted, so this copy deliberately
// doesn't claim encryption.)
function PrivacyBand() {
  const lines = useMemo(cipherLines, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#ecfeff] via-[#effcf6] to-[#f0fdf4] py-20 dark:from-[#0b1f24] dark:via-[#0d1d1f] dark:to-[#0d1f18]">
      {/* Drifting ciphertext, masked to a soft glow behind the headline */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[46rem] max-w-full -translate-x-1/2 overflow-hidden font-mono text-[11px] leading-5 font-semibold text-teal-600/45 dark:text-teal-300/35"
        style={{
          maskImage: 'radial-gradient(ellipse 50% 55% at 50% 50%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 50% 55% at 50% 50%, black 20%, transparent 75%)',
        }}
        aria-hidden="true"
      >
        <div className="bf-cipher-drift">
          {[...lines, ...lines].map((line, index) => (
            <p key={index} className="whitespace-nowrap" style={{ marginLeft: `${(index * 37) % 60}px` }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 md:flex-row md:justify-between">
        <div className="max-w-2xl text-center md:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
            Private by design. <span className="text-teal-700 dark:text-teal-300">Built on trust.</span>
          </h2>
          <p className="mt-4 text-base text-gray-600 sm:text-lg dark:text-gray-300">
            Your invoices are created right in your browser and saved only on your device. No account, nothing stored on
            our servers.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-teal-800 backdrop-blur dark:border-teal-800 dark:bg-white/5 dark:text-teal-200"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Gold padlock whose shackle clicks shut every few seconds */}
        <div className="relative shrink-0" aria-hidden="true">
          <div className="absolute inset-0 -m-6 rounded-full bg-amber-300/30 blur-2xl" />
          <svg className="relative h-28 w-28" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="bf-lock-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fcd34d" />
                <stop offset="1" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="bf-lock-shackle" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#9ca3af" />
                <stop offset="0.5" stopColor="#e5e7eb" />
                <stop offset="1" stopColor="#9ca3af" />
              </linearGradient>
            </defs>
            <path
              className="bf-lock-shackle"
              d="M20 30V20a12 12 0 0 1 24 0v10"
              fill="none"
              stroke="url(#bf-lock-shackle)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect x="12" y="28" width="40" height="30" rx="8" fill="url(#bf-lock-body)" />
            <rect x="12" y="28" width="40" height="6" rx="3" fill="#fde68a" opacity="0.6" />
            <circle cx="32" cy="41" r="4" fill="#78350f" />
            <path d="M30.5 43h3l1 7h-5z" fill="#78350f" />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default PrivacyBand
