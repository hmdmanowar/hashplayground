import { BotIcon } from '../Icons/Icons'

function FutureAISection() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
          <BotIcon className="h-6 w-6" />
        </span>
        <span className="rounded-full border border-[var(--border-panel)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
          Coming soon
        </span>
        <h2 className="max-w-lg text-2xl font-bold sm:text-3xl">An AI mentor, not just an AI generator</h2>
        <p className="max-w-lg text-sm text-[var(--color-muted)]">
          An AI that understands your project and helps you become a better developer &mdash; explaining, debugging,
          reviewing, and teaching, not just handing you code.
        </p>
      </div>
    </div>
  )
}

export default FutureAISection
