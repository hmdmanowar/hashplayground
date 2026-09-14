import { useEffect } from 'react'

// Small, generic confirm dialog — replaces window.confirm() so destructive
// actions (currently just delete-conversation) match the app's own theme
// instead of popping a native browser dialog.
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
      >
        <h2 className="text-base font-semibold text-[var(--text-app)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[var(--border-panel)] px-3 py-1.5 text-sm text-[var(--text-app)] hover:border-[var(--color-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
