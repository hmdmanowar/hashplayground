import {
  LayersIcon,
  SearchIcon,
  GitBranchIcon,
  GridIcon,
  MenuFoldIcon,
  MenuUnfoldIcon,
} from "../../../components/Icons/Icons";
import {
  type SaveMode,
  type EditorPrefs,
  type PanelResizeMode,
} from "../../../services/playgroundSettingsService";
import type { SidebarView } from "../playgroundUtils";
import PlaygroundSettingsMenu from "./PlaygroundSettingsMenu";

interface ActivityBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebarCollapsed: () => void;
  sidebarView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  changedFilesCount: number;
  saveMode: SaveMode;
  onSaveModeChange: (mode: SaveMode) => void;
  editorPrefs: EditorPrefs;
  onEditorPrefsChange: (prefs: EditorPrefs) => void;
  panelResizeMode: PanelResizeMode;
  onPanelResizeModeChange: (mode: PanelResizeMode) => void;
}

// The left-most icon rail — switches which view the Sidebar shows
// (Explorer / Search / Source Control), toggles the Sidebar's visibility
// entirely, and hosts the Playground settings popover at the bottom.
function ActivityBar({
  sidebarCollapsed,
  onToggleSidebarCollapsed,
  sidebarView,
  onSelectView,
  changedFilesCount,
  saveMode,
  onSaveModeChange,
  editorPrefs,
  onEditorPrefsChange,
  panelResizeMode,
  onPanelResizeModeChange,
}: ActivityBarProps) {
  return (
    <div
      className={`hidden w-10 shrink-0 flex-col items-center gap-1 border border-[var(--border-panel)] bg-[var(--bg-panel)] py-2 lg:flex ${
        sidebarCollapsed ? "rounded-lg" : "rounded-l-lg"
      }`}
    >
      <button
        type="button"
        onClick={onToggleSidebarCollapsed}
        aria-label={sidebarCollapsed ? "Show Explorer panel" : "Hide Explorer panel"}
        title={sidebarCollapsed ? "Show Explorer panel" : "Hide Explorer panel"}
        className="mb-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--text-app)]"
      >
        {sidebarCollapsed ? (
          <MenuUnfoldIcon className="h-5 w-5" />
        ) : (
          <MenuFoldIcon className="h-5 w-5" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onSelectView("explorer")}
        aria-label="Explorer"
        title="Explorer"
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded ${
          sidebarView === "explorer" && !sidebarCollapsed
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-muted)] hover:text-[var(--text-app)]"
        }`}
      >
        <LayersIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onSelectView("search")}
        aria-label="Search"
        title="Search"
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded ${
          sidebarView === "search" && !sidebarCollapsed
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-muted)] hover:text-[var(--text-app)]"
        }`}
      >
        <SearchIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onSelectView("sourceControl")}
        aria-label="Source Control"
        title="Source Control"
        className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded ${
          sidebarView === "sourceControl" && !sidebarCollapsed
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-muted)] hover:text-[var(--text-app)]"
        }`}
      >
        <GitBranchIcon className="h-5 w-5" />
        {changedFilesCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--color-primary-strong)] px-0.5 text-[9px] font-semibold leading-none text-white">
            {changedFilesCount > 99 ? "99+" : changedFilesCount}
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label="Extensions"
        title="Extensions — coming soon"
        className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded text-[var(--color-muted)] opacity-50"
      >
        <GridIcon className="h-5 w-5" />
      </button>
      <div className="mt-auto">
        <PlaygroundSettingsMenu
          variant="activityBar"
          saveMode={saveMode}
          onSaveModeChange={onSaveModeChange}
          editorPrefs={editorPrefs}
          onEditorPrefsChange={onEditorPrefsChange}
          panelResizeMode={panelResizeMode}
          onPanelResizeModeChange={onPanelResizeModeChange}
        />
      </div>
    </div>
  );
}

export default ActivityBar;
