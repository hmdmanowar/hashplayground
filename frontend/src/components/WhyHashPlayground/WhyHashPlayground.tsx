import { CheckCircleIcon } from '../Icons/Icons'

const REASONS = [
  'No installs, no config, no environment drift',
  'Real React + TypeScript, not toy syntax',
  'Learn by building actual projects',
  'Everything you build stays yours',
]

function WhyHashPlayground() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Why Hash Playground?
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Practice real frontend skills, without the setup friction</h2>
        </div>

        <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-sm">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default WhyHashPlayground
