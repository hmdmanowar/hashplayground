import { CodeIcon, FolderIcon, MonitorIcon } from '../Icons/Icons'

const CHIPS = [
  { icon: CodeIcon, offset: 'ml-0' },
  { icon: FolderIcon, offset: 'ml-8' },
  { icon: MonitorIcon, offset: 'ml-0' },
]

function WhatIsSection() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="flex flex-col items-center gap-8 overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-10 lg:flex-row-reverse lg:gap-4 lg:px-10">
        <div className="relative h-48 w-full max-w-xs shrink-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(circle, black, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle, black, transparent 75%)',
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {CHIPS.map(({ icon: Icon, offset }, index) => (
              <span
                key={index}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] text-[var(--color-primary)] ${offset}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            What is Hash Playground?
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">A browser-based coding and learning platform</h2>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            No installs, no environment setup. Create a real React + TypeScript project, write code in a fast
            in-browser editor, and run and preview it instantly &mdash; all from a single tab. Every file, version,
            and project is saved to your account, not just your browser, so it's there whenever you come back.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WhatIsSection
