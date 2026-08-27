import { useState, type FormEvent } from "react";
import { AlertTriangleIcon } from "../../../components/Icons/Icons";

interface AdminUpdateConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isSubmitting: boolean;
  error: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

// A generic password confirmation gate for a deliberate, hard-to-fat-finger
// step before someone else's code gets overwritten — used both when the top
// admin publishes another user's project directly, and when they approve a
// pending update request (see PendingUpdateBanner). Not a real access
// boundary; an admin can already view/edit any project.
function AdminUpdateConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: AdminUpdateConfirmDialogProps) {
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password) onConfirm(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <form
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <AlertTriangleIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{message}</p>
          </div>
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          className="mt-4 w-full rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm transition-colors"
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--text-app)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying…" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminUpdateConfirmDialog;
