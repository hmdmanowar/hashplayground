import { BotIcon, GithubIcon } from '../Icons/Icons'

const ROADMAP_ITEMS = [
  {
    icon: BotIcon,
    title: 'An AI mentor, not just an AI generator',
    description:
      'An AI that understands your project and helps you become a better developer — explaining, debugging, reviewing, and teaching, not just handing you code.',
  },
  {
    icon: GithubIcon,
    title: 'Collaboration & GitHub',
    description:
      'Share a project, collaborate with others in real time, and push straight to GitHub — no manual export needed.',
  },
]

function RoadmapSection() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">What's next</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Coming soon</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROADMAP_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-10 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
              <item.icon className="h-6 w-6" />
            </span>
            <span className="rounded-full border border-[var(--border-panel)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
              Coming soon
            </span>
            <h3 className="max-w-sm text-lg font-bold">{item.title}</h3>
            <p className="max-w-sm text-sm text-[var(--color-muted)]">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoadmapSection
