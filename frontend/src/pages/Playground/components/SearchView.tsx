import type { ProjectFile } from "../../../types/project";
import { SearchIcon, FileIcon } from "../../../components/Icons/Icons";
import { getFileIconColor, searchFilesForText, MAX_CODE_SEARCH_MATCHES } from "../playgroundUtils";

interface SearchViewProps {
  files: ProjectFile[];
  query: string;
  onQueryChange: (query: string) => void;
  onJumpToLine: (file: ProjectFile, lineNumber: number) => void;
}

// Full-text search across every file in the project, with jump-to-line on
// each result — the Explorer sidebar's "Search" view.
function SearchView({ files, query, onQueryChange, onJumpToLine }: SearchViewProps) {
  const trimmed = query.trim();
  const matches = trimmed ? searchFilesForText(files, trimmed) : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1.5">
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" />
        <input
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search across all files…"
          className="w-full bg-transparent text-xs outline-none"
        />
      </div>
      {trimmed && (
        <>
          <p className="text-xs text-[var(--color-muted)]">
            {matches.length} result{matches.length === 1 ? "" : "s"}
            {matches.length === MAX_CODE_SEARCH_MATCHES ? "+" : ""}
          </p>
          <ul className="flex flex-col gap-0.5">
            {matches.map((match) => (
              <li key={`${match.file.id}-${match.lineNumber}`}>
                <button
                  type="button"
                  onClick={() => onJumpToLine(match.file, match.lineNumber)}
                  className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-[var(--hover-overlay)]"
                >
                  <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <span className="shrink-0" style={{ color: getFileIconColor(match.file.name) }}>
                      <FileIcon className="h-3 w-3" />
                    </span>
                    <span className="truncate">{match.file.path}</span>
                    <span className="shrink-0">:{match.lineNumber}</span>
                  </span>
                  <span className="truncate pl-4 font-mono text-xs">{match.lineText}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default SearchView;
