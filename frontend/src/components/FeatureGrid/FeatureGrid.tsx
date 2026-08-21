import { CodeIcon, FolderIcon, MonitorIcon, PlugIcon, GraduationCapIcon, BotIcon } from '../Icons/Icons'

const FEATURES = [
  {
    icon: CodeIcon,
    title: 'Editor',
    description: 'Write real React + TypeScript in a fast, in-browser editor.',
  },
  {
    icon: FolderIcon,
    title: 'Projects',
    description: 'Create and organize real projects, not disposable snippets.',
  },
  {
    icon: MonitorIcon,
    title: 'Preview',
    description: 'See your changes render instantly, right next to your code.',
  },
  {
    icon: PlugIcon,
    title: 'APIs',
    description: 'Work with real APIs and data, not contrived puzzles.',
  },
  {
    icon: GraduationCapIcon,
    title: 'Learning mode',
    description: 'Guided exercises that teach you by having you build.',
  },
  {
    icon: BotIcon,
    title: 'AI mentor',
    description: "An AI that understands your project and helps you get better, not just one that writes the code for you.",
    comingSoon: true,
  },
]

function FeatureGrid() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Core features</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Everything you need to build, run, and learn</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
                <feature.icon className="h-5 w-5" />
              </span>
              {feature.comingSoon && (
                <span className="rounded-full border border-[var(--border-panel)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
                  Coming soon
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeatureGrid
