import { useState } from 'react'

interface NotifyDialogProps {
  targetLabel: string
  onSend: (kind: 'message' | 'alert', message: string) => void
  onCancel: () => void
}

function NotifyDialog({ targetLabel, onSend, onCancel }: NotifyDialogProps) {
  const [message, setMessage] = useState('')
  const [kind, setKind] = useState<'message' | 'alert'>('message')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Notify {targetLabel}</h2>

        <div className="mt-4 flex gap-2">
          {(['message', 'alert'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                kind === option
                  ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--border-panel)] text-[var(--color-muted)] hover:border-[var(--color-primary)]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <textarea
          autoFocus
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your message…"
          rows={4}
          className="mt-3 w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!message.trim()}
            onClick={() => onSend(kind, message.trim())}
            className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotifyDialog
