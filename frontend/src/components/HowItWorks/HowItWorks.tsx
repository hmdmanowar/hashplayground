import { FolderIcon, CodeIcon, PlayIcon, GraduationCapIcon } from '../Icons/Icons'

const STEPS = [
  { icon: FolderIcon, title: 'Create', description: 'Spin up a new project in seconds.' },
  { icon: CodeIcon, title: 'Code', description: 'Write real React + TypeScript in the editor.' },
  { icon: PlayIcon, title: 'Run', description: 'See it run instantly in the live preview.' },
  { icon: GraduationCapIcon, title: 'Learn', description: 'Build understanding as you build projects.' },
]

function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">How it works</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Create, code, run, learn</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <div key={step.title} className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <step.icon className="h-4 w-4" />
            </div>
            <h3 className="mt-3 font-medium">{step.title}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HowItWorks
