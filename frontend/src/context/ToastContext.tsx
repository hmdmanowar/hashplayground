import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircleIcon, AlertTriangleIcon, XIcon } from '../components/Icons/Icons'

type ToastKind = 'success' | 'error'

interface Toast {
  id: string
  message: string
  kind: ToastKind
}

interface ToastContextValue {
  showToast: (message: string, options?: { kind?: ToastKind }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 5000

// Non-blocking, non-modal notices — for ambient failures (a failed autosave,
// an expired session, a partial-discard result) where the existing
// ConfirmDialog/PromptDialog/ErrorDialog (all modal, steal focus) would be
// the wrong tool.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, options?: { kind?: ToastKind }) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, kind: options?.kind ?? 'error' }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-3 text-sm shadow-lg"
          >
            {toast.kind === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            ) : (
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            )}
            <p className="max-w-xs">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="ml-1 cursor-pointer text-[var(--color-muted)] hover:text-[var(--text-app)]"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
