import { GitBranchIcon } from '../Icons/Icons'

const FLOW_LINES = [
  { id: 'green', y: 40, color: '#22c55e' },
  { id: 'teal', y: 110, color: '#14b8a6' },
  { id: 'amber', y: 190, color: '#f59e0b' },
  { id: 'red', y: 260, color: '#ef4444' },
]

function FlowGraphic() {
  return (
    <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {FLOW_LINES.map((line) => (
          <linearGradient key={line.id} id={`flow-${line.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={line.color} stopOpacity="0" />
            <stop offset="100%" stopColor={line.color} stopOpacity="0.85" />
          </linearGradient>
        ))}
      </defs>
      {FLOW_LINES.map((line) => (
        <path
          key={line.id}
          d={`M0,${line.y} C220,${line.y} 300,160 460,160 L640,160`}
          fill="none"
          stroke={`url(#flow-${line.id})`}
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}

const CHIP_OFFSETS = ['ml-0', 'ml-8', 'ml-0', 'ml-8']

function ChaosSection() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="flex flex-col items-center gap-8 overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-10 lg:flex-row lg:gap-4 lg:px-10">
        <div className="relative h-64 w-full max-w-md shrink-0 lg:h-72">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'linear-gradient(to right, black, transparent 85%)',
              WebkitMaskImage: 'linear-gradient(to right, black, transparent 85%)',
            }}
          />
          <div className="absolute inset-0">
            <FlowGraphic />
          </div>
          <div className="absolute left-2 top-1/2 flex -translate-y-1/2 flex-col gap-4">
            {CHIP_OFFSETS.map((offset, index) => (
              <span
                key={index}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] text-[var(--color-muted)] ${offset}`}
              >
                <GitBranchIcon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Fast code. Faster chaos.</h2>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Coding agents are flooding pipelines with massive PRs faster than teams can validate, prioritize, understand, or
            secure them.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChaosSection
