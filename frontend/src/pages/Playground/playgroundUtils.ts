import type { ProjectFile } from "../../types/project";

const DIFF_TAB_PREFIX = "diff::";

export const MAX_CODE_SEARCH_MATCHES = 200;

export type SidebarView = "explorer" | "search" | "sourceControl";

export interface CodeSearchMatch {
  file: ProjectFile;
  lineNumber: number;
  lineText: string;
}

export function searchFilesForText(files: ProjectFile[], query: string): CodeSearchMatch[] {
  const needle = query.toLowerCase();
  const matches: CodeSearchMatch[] = [];

  for (const file of files) {
    if (file.type !== "file") continue;
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        matches.push({ file, lineNumber: i + 1, lineText: lines[i].trim() });
        if (matches.length >= MAX_CODE_SEARCH_MATCHES) return matches;
      }
    }
  }

  return matches;
}

export function diffTabId(path: string): string {
  return `${DIFF_TAB_PREFIX}${path}`;
}

export function isDiffTab(id: string): boolean {
  return id.startsWith(DIFF_TAB_PREFIX);
}

export function diffTabPath(id: string): string {
  return id.slice(DIFF_TAB_PREFIX.length);
}

export function getLanguage(fileName: string): string {
  if (fileName.endsWith(".tsx") || fileName.endsWith(".ts"))
    return "typescript";
  if (fileName.endsWith(".jsx") || fileName.endsWith(".js"))
    return "javascript";
  if (fileName.endsWith(".css")) return "css";
  if (fileName.endsWith(".json")) return "json";
  if (fileName.endsWith(".html")) return "html";
  return "plaintext";
}

// VS Code-style file-type color coding in the explorer — deliberate literal
// colors (same precedent as the Changes A/M/D badges), not theme tokens.
export function getFileIconColor(fileName: string): string {
  if (fileName.endsWith(".tsx") || fileName.endsWith(".ts")) return "#3178c6";
  if (fileName.endsWith(".jsx") || fileName.endsWith(".js")) return "#eab308";
  if (fileName.endsWith(".css")) return "#a855f7";
  if (fileName.endsWith(".json")) return "#22c55e";
  if (fileName.endsWith(".html")) return "#f97316";
  return "var(--color-muted)";
}
