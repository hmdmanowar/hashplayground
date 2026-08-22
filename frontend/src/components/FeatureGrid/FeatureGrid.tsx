import { CodeIcon, FolderIcon, MonitorIcon, GitBranchIcon, DownloadIcon, ShieldIcon } from '../Icons/Icons'

const FEATURES = [
  {
    icon: CodeIcon,
    title: 'Real code editor',
    description: 'Monaco — the exact editor behind VS Code — with multi-file tabs and full syntax support.',
  },
  {
    icon: FolderIcon,
    title: 'File explorer',
    description: 'A real project tree: create, rename, and organize files and folders, just like on your machine.',
  },
  {
    icon: MonitorIcon,
    title: 'Live preview & run',
    description: 'Compile and run your project in a sandboxed preview with real console output and error overlays.',
  },
  {
    icon: GitBranchIcon,
    title: 'Version history & diffs',
    description: 'Every update publishes a version with a Git-style diff view — review or discard, file by file.',
  },
  {
    icon: DownloadIcon,
    title: 'Export & import',
    description: 'Export any project as a ready-to-run npm package, or import an existing .zip straight in.',
  },
  {
    icon: ShieldIcon,
    title: 'Real accounts, saved for good',
    description: 'Sign up once. Every project, file, and version lives in your account, not just your browser.',
  },
]

function FeatureGrid() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Core features</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Everything below already works</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
              <feature.icon className="h-5 w-5" />
            </span>
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
