interface OwnerDetailsDialogProps {
  rows: [string, string][];
  onClose: () => void;
}

// Small read-only modal showing a project's owner info — surfaced from the
// admin-only owner badge next to the project title.
function OwnerDetailsDialog({ rows, onClose }: OwnerDetailsDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Project owner</h2>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-[var(--color-muted)]">{label}</dt>
              <dd className="font-medium capitalize">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerDetailsDialog;
