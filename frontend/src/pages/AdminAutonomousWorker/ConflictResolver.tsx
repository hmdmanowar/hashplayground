import { useState } from 'react'
import type { MergeConflict } from '../../services/autonomousWorkerService'

// Pre-fills the same conflict-marker shape a plain text editor shows for a
// real git conflict — the user edits this down to the final content, same
// mental model as resolving one locally, just in the browser.
function markerText(baseLabel: string, headLabel: string, baseContent: string | null, headContent: string | null): string {
  return [
    `<<<<<<< ${baseLabel}`,
    baseContent ?? '(deleted)',
    '=======',
    headContent ?? '(deleted)',
    `>>>>>>> ${headLabel}`,
  ].join('\n')
}

export function ConflictResolver({
  conflict,
  baseLabel,
  headLabel,
  onSubmit,
  onCancel,
  submitting,
}: {
  conflict: MergeConflict
  baseLabel: string
  headLabel: string
  onSubmit: (resolutions: { path: string; content: string }[]) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [resolutions, setResolutions] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      conflict.files.filter((f) => !f.binary).map((f) => [f.path, markerText(baseLabel, headLabel, f.baseContent, f.headContent)]),
    ),
  )

  const binaryFiles = conflict.files.filter((f) => f.binary)
  const canSubmit = !submitting && conflict.files.every((f) => f.binary || resolutions[f.path]?.trim())

  function handleSubmit() {
    onSubmit(conflict.files.filter((f) => !f.binary).map((f) => ({ path: f.path, content: resolutions[f.path] })))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] shadow-2xl">
        <div className="border-b border-[var(--border-panel)] p-4">
          <h2 className="text-lg font-semibold text-[var(--text-app)]">Resolve merge conflict</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {conflict.files.length} file{conflict.files.length === 1 ? '' : 's'} changed on both {baseLabel} and {headLabel} since they
            diverged. Edit each one down to the content you want — remove the markers once you've decided.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {binaryFiles.length > 0 && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
              Binary file{binaryFiles.length === 1 ? '' : 's'} can't be resolved here — resolve on GitHub directly:{' '}
              {binaryFiles.map((f) => f.path).join(', ')}
            </p>
          )}
          {conflict.files
            .filter((f) => !f.binary)
            .map((file) => (
              <div key={file.path} className="rounded-md border border-[var(--border-panel)]">
                <p className="border-b border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm font-medium text-[var(--text-app)]">
                  {file.path}
                </p>
                <textarea
                  value={resolutions[file.path] ?? ''}
                  onChange={(event) => setResolutions((prev) => ({ ...prev, [file.path]: event.target.value }))}
                  rows={10}
                  className="w-full resize-y bg-[var(--bg-app)] p-3 font-mono text-xs text-[var(--text-app)] outline-none"
                />
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border-panel)] p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[var(--border-panel)] px-4 py-2 text-sm font-medium hover:border-[var(--color-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {submitting ? 'Completing merge…' : 'Complete merge'}
          </button>
        </div>
      </div>
    </div>
  )
}
