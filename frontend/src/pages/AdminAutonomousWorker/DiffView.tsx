// Renders a GitHub-style unified diff patch as colored monospace lines — no
// diff library needed, GitHub's compare API already computes the patch text
// for us; this just colors it by each line's leading character.
function diffLineClass(line: string): string {
  if (line.startsWith('+') && !line.startsWith('+++')) return 'bg-emerald-500/10 text-emerald-400'
  if (line.startsWith('-') && !line.startsWith('---')) return 'bg-red-500/10 text-red-400'
  if (line.startsWith('@@')) return 'text-[var(--color-primary)]'
  return 'text-[var(--color-muted)]'
}

export function DiffView({ patch }: { patch: string | null }) {
  if (!patch) {
    return <p className="p-3 text-xs text-[var(--color-muted)]">No inline diff available for this file (binary, or too large).</p>
  }

  return (
    <pre className="overflow-x-auto bg-[var(--bg-app)] p-3 text-xs leading-relaxed">
      {patch.split('\n').map((line, index) => (
        <div key={index} className={`whitespace-pre ${diffLineClass(line)}`}>
          {line}
        </div>
      ))}
    </pre>
  )
}
