import type { ProjectFile } from "../../../types/project";
import { FileIcon, SearchIcon } from "../../../components/Icons/Icons";
import { getFileIconColor } from "../playgroundUtils";

interface QuickOpenListProps {
  files: ProjectFile[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (file: ProjectFile) => void;
  autoFocus?: boolean;
}

// File search ("Quick Open"), reused both inline in the empty editor state
// and as a Ctrl+P overlay when a file is already open — the same feature
// either way, not gated on whether a file happens to be active.
function QuickOpenList({ files, query, onQueryChange, onSelect, autoFocus }: QuickOpenListProps) {
  const matches = files
    .filter((file) => file.type === "file")
    .filter((file) => file.path.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search files by name…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-1 text-left">
        {matches.length === 0 ? (
          <li className="px-2 py-2 text-xs text-[var(--color-muted)]">
            {query ? `No files match "${query}"` : "No files in this project yet"}
          </li>
        ) : (
          matches.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => onSelect(file)}
                className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--hover-overlay)]"
              >
                <span className="shrink-0" style={{ color: getFileIconColor(file.name) }}>
                  <FileIcon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{file.name}</span>
                <span className="ml-auto truncate text-xs text-[var(--color-muted)]">
                  {file.path}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default QuickOpenList;
