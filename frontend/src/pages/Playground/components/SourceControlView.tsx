import { ChevronDownIcon, GitBranchIcon, UndoIcon } from "../../../components/Icons/Icons";
import type { ChangedFile, ChangeStatus } from "../../../utils/diff";

const STATUS_META: Record<ChangeStatus, { label: string; color: string }> = {
  added: { label: "A", color: "#22c55e" },
  modified: { label: "M", color: "#f59e0b" },
  deleted: { label: "D", color: "#ef4444" },
};

interface SourceControlViewProps {
  changedFiles: ChangedFile[];
  changesExpanded: boolean;
  onToggleChangesExpanded: () => void;
  hasPreviousVersion: boolean;
  onOpenDiff: (path: string) => void;
  onDiscardChange: (changed: ChangedFile) => void;
  onDiscardAll: () => void;
}

// The "Changes" list — diff against the last recorded version, with
// per-file and discard-all revert actions.
function SourceControlView({
  changedFiles,
  changesExpanded,
  onToggleChangesExpanded,
  hasPreviousVersion,
  onOpenDiff,
  onDiscardChange,
  onDiscardAll,
}: SourceControlViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="group flex w-full items-center justify-between rounded py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
        <button
          type="button"
          onClick={onToggleChangesExpanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 hover:text-[var(--text-app)]"
        >
          <ChevronDownIcon
            className={`h-3 w-3 shrink-0 transition-transform ${changesExpanded ? "" : "-rotate-90"}`}
          />
          <GitBranchIcon className="h-3.5 w-3.5" />
          Changes
        </button>
        {changedFiles.length > 0 && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onDiscardAll}
              aria-label="Discard all changes"
              title="Discard all changes"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] opacity-0 hover:text-[var(--color-primary)] group-hover:opacity-100"
            >
              <UndoIcon className="h-3.5 w-3.5" />
            </button>
            <span className="rounded-full bg-[var(--color-primary-strong)] px-1.5 py-0 text-[10px] font-medium text-white">
              {changedFiles.length}
            </span>
          </div>
        )}
      </div>
      {changesExpanded &&
        (changedFiles.length === 0 ? (
          <p className="px-1 py-1 text-xs text-[var(--color-muted)]">
            {hasPreviousVersion
              ? "No changes since last version"
              : "No previous version yet"}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {changedFiles.map((changed) => (
              <li
                key={changed.path}
                className="group flex items-center gap-1 rounded pr-1 hover:bg-[var(--hover-overlay)]"
              >
                <button
                  type="button"
                  onClick={() => onOpenDiff(changed.path)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center px-1 py-1 text-left text-xs text-[var(--color-muted)] group-hover:text-[var(--text-app)]"
                >
                  <span className="truncate">{changed.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDiscardChange(changed)}
                  aria-label={`Discard changes to ${changed.name}`}
                  title="Discard changes"
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] opacity-0 hover:text-[var(--color-primary)] group-hover:opacity-100"
                >
                  <UndoIcon className="h-3.5 w-3.5" />
                </button>
                <span
                  className="shrink-0 text-[10px] font-semibold"
                  style={{ color: STATUS_META[changed.status].color }}
                >
                  {STATUS_META[changed.status].label}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

export default SourceControlView;
