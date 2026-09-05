import { useState, type FormEvent, type ReactNode } from "react";
import { useToast } from "../../context/ToastContext";

interface PortfolioSectionDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Validate + persist the draft. Throw an Error with a user-facing message to show it inline instead of saving. */
  onSubmit: () => Promise<void>;
  children: ReactNode;
  successMessage?: string;
}

// Every portfolio-content dialog shares this width, so switching between
// Edit Experience / Edit Skills / etc. doesn't visibly resize the modal.
const DIALOG_MAX_WIDTH = "max-w-4xl";

// Shared overlay/footer/error/isSubmitting shell for every "edit a portfolio
// section" dialog (Experience, About, Featured Build, Skills, Profile) — only
// the field markup differs between them, so that's all callers provide via
// `children`, following the same dialog structure FeedbackDialog established.
function PortfolioSectionDialog({
  open,
  title,
  onClose,
  onSubmit,
  children,
  successMessage = "Saved.",
}: PortfolioSectionDialogProps) {
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  function handleClose() {
    setError("");
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit();
      showToast(successMessage, { kind: "success" });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-section-dialog-title"
        className={`flex max-h-full w-full ${DIALOG_MAX_WIDTH} flex-col overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--border-panel)] px-6 py-4">
          <h2 id="portfolio-section-dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
        </div>

        <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

          {error && <p className="px-6 text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-[var(--border-panel)] px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-full border border-[var(--border-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PortfolioSectionDialog;
