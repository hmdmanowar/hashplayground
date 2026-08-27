import type { AppliedStyle, StyleTemplate } from "../../../lib/styleTemplates";
import { BootstrapMark, NoneMark, TailwindMark } from "../../../components/BrandMarks/BrandMarks";
import { CheckCircleIcon } from "../../../components/Icons/Icons";

interface StyleTemplateDialogProps {
  appliedStyle: AppliedStyle | null;
  onSelect: (style: StyleTemplate) => void;
  onCancel: () => void;
}

const OPTIONS: { value: StyleTemplate; label: string; description: string; Mark: () => JSX.Element }[] = [
  { value: "none", label: "None", description: "No CSS framework", Mark: NoneMark },
  { value: "bootstrap", label: "Bootstrap", description: "Component classes, via CDN", Mark: BootstrapMark },
  { value: "tailwind", label: "Tailwind CSS", description: "Utility-first, via CDN", Mark: TailwindMark },
];

// Lets a project that skipped (or wants to switch) its style framework at
// creation time add, switch, or remove one later — same injection logic as
// the creation-time seed, just applied to the project's current files
// instead.
function StyleTemplateDialog({ appliedStyle, onSelect, onCancel }: StyleTemplateDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Style template</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Choose a CSS framework for your project's starter files, or None to go without one.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {OPTIONS.map((option) => {
            const selected = option.value === "none" ? appliedStyle === null : appliedStyle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-[var(--bg-app)] p-4 text-center transition-colors ${
                  selected ? "border-[var(--color-primary)]" : "border-transparent hover:border-[var(--border-panel)]"
                }`}
              >
                {selected && (
                  <CheckCircleIcon className="absolute right-2 top-2 h-4 w-4 text-[var(--color-primary)]" />
                )}
                <option.Mark />
                <span className="text-xs font-medium">{option.label}</span>
                <span className="text-[10px] text-[var(--color-muted)]">
                  {selected ? "Current" : option.description}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--text-app)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default StyleTemplateDialog;
