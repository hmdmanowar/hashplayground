interface ErrorDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

// A simple title+message+OK modal — the Playground's own error kind
// (e.g. failed Update Project) that doesn't need the Prompt/Confirm dialogs'
// input or dual-action affordances.
function ErrorDialog({ title, message, onClose }: ErrorDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorDialog;
