import Editor, { DiffEditor, type MonacoDiffEditor } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import "../../../lib/monacoSetup";
import type { ProjectFile } from "../../../types/project";
import type { Theme } from "../../../context/ThemeContext";
import type { EditorPrefs } from "../../../services/playgroundSettingsService";
import {
  GitBranchIcon,
  XIcon,
  MaximizeIcon,
  MinimizeIcon,
  ChevronDownIcon,
} from "../../../components/Icons/Icons";
import { getLanguage, isDiffTab, diffTabPath } from "../playgroundUtils";
import QuickOpenList from "./QuickOpenList";

interface EditorPanelProps {
  mobileHidden: boolean;
  openTabs: string[];
  files: ProjectFile[];
  activeFileId: string | null;
  drafts: Record<string, string>;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  editorMaximized: boolean;
  onToggleMaximize: () => void;
  activeDiffPath: string | null;
  activeDiffName: string;
  activeDiffOriginal: string;
  activeDiffModified: string;
  activeFile: ProjectFile | null;
  theme: Theme;
  editorPrefs: EditorPrefs;
  onDraftChange: (fileId: string, value: string) => void;
  onEditorMount: (editorInstance: MonacoEditorNS.IStandaloneCodeEditor) => void;
  onDiffEditorMount: (diffEditor: MonacoDiffEditor) => void;
  onPrevDiffChange: () => void;
  onNextDiffChange: () => void;
  quickOpenQuery: string;
  onQuickOpenQueryChange: (query: string) => void;
  onOpenFile: (file: ProjectFile) => void;
}

// The main code editor area: open-tabs bar (with the maximize toggle),
// breadcrumb + diff navigation, and the Editor / DiffEditor / empty-state body.
function EditorPanel({
  mobileHidden,
  openTabs,
  files,
  activeFileId,
  drafts,
  onSelectTab,
  onCloseTab,
  editorMaximized,
  onToggleMaximize,
  activeDiffPath,
  activeDiffName,
  activeDiffOriginal,
  activeDiffModified,
  activeFile,
  theme,
  editorPrefs,
  onDraftChange,
  onEditorMount,
  onDiffEditorMount,
  onPrevDiffChange,
  onNextDiffChange,
  quickOpenQuery,
  onQuickOpenQueryChange,
  onOpenFile,
}: EditorPanelProps) {
  return (
    <div
      className={`font-scale-reset min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] ${
        mobileHidden ? "hidden" : "flex"
      } lg:flex`}
    >
      <div
        className="flex flex-wrap items-center gap-1 border-b border-[var(--border-panel)] p-1.5"
        style={{ height: "37px" }}
      >
        {openTabs.map((id) => {
          if (isDiffTab(id)) {
            const path = diffTabPath(id);
            const name = path.split("/").pop() ?? path;
            return (
              <div
                key={id}
                onClick={() => onSelectTab(id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs ${
                  activeFileId === id
                    ? "bg-[var(--bg-app)] font-medium"
                    : "text-[var(--color-muted)]"
                }`}
              >
                <GitBranchIcon className="h-3 w-3" />
                {name} (Working Tree)
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(id);
                  }}
                  aria-label={`Close diff for ${name}`}
                  className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--text-app)]"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            );
          }

          const file = files.find((f) => f.id === id);
          if (!file) return null;
          const dirty =
            drafts[id] !== undefined && drafts[id] !== file.content;

          return (
            <div
              key={id}
              onClick={() => onSelectTab(id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs ${
                activeFileId === id
                  ? "bg-[var(--bg-app)] font-medium"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {dirty && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              )}
              {file.name}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(id);
                }}
                aria-label={`Close ${file.name}`}
                className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--text-app)]"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onToggleMaximize}
          aria-label={editorMaximized ? "Restore panel layout" : "Maximize editor panel"}
          title={editorMaximized ? "Restore panel layout" : "Maximize editor panel"}
          className="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
        >
          {editorMaximized ? (
            <MinimizeIcon className="h-4 w-4" />
          ) : (
            <MaximizeIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {(activeDiffPath ?? activeFile?.path) && (
        <div className="flex items-center gap-1 border-b border-[var(--border-panel)] px-3 py-1 text-xs text-[var(--color-muted)]">
          {(activeDiffPath ?? activeFile?.path ?? "")
            .split("/")
            .map((segment, index, segments) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden="true">/</span>}
                <span
                  className={
                    index === segments.length - 1
                      ? "font-medium text-[var(--text-app)]"
                      : ""
                  }
                >
                  {segment}
                </span>
              </span>
            ))}
          {activeDiffPath && (
            <>
              <span className="ml-1 text-[10px]">(Working Tree)</span>
              <span className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onPrevDiffChange}
                  aria-label="Previous change"
                  title="Previous change"
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-[var(--hover-overlay)] hover:text-[var(--text-app)]"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={onNextDiffChange}
                  aria-label="Next change"
                  title="Next change"
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-[var(--hover-overlay)] hover:text-[var(--text-app)]"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            </>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {activeDiffPath ? (
          <DiffEditor
            key={activeDiffPath}
            language={getLanguage(activeDiffName)}
            originalModelPath={`original/${activeDiffPath}`}
            modifiedModelPath={`modified/${activeDiffPath}`}
            theme={theme === "dark" ? "hash-dark" : "hash-light"}
            original={activeDiffOriginal}
            modified={activeDiffModified}
            options={{
              readOnly: true,
              renderSideBySide: false,
              minimap: { enabled: editorPrefs.minimap },
              wordWrap: editorPrefs.wordWrap ? "on" : "off",
              fontSize: editorPrefs.fontSize,
            }}
            onMount={onDiffEditorMount}
          />
        ) : activeFile ? (
          <Editor
            key={activeFile.id}
            path={activeFile.path}
            language={getLanguage(activeFile.name)}
            theme={theme === "dark" ? "hash-dark" : "hash-light"}
            value={drafts[activeFile.id] ?? activeFile.content}
            onChange={(value) => onDraftChange(activeFile.id, value ?? "")}
            options={{
              minimap: { enabled: editorPrefs.minimap },
              wordWrap: editorPrefs.wordWrap ? "on" : "off",
              fontSize: editorPrefs.fontSize,
              "semanticHighlighting.enabled": true,
              quickSuggestions: { other: true, comments: false, strings: false },
            }}
            onMount={onEditorMount}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[var(--color-muted)]">
            <p>Select a file, or search for one below</p>
            <QuickOpenList
              files={files}
              query={quickOpenQuery}
              onQueryChange={onQuickOpenQueryChange}
              onSelect={onOpenFile}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorPanel;
