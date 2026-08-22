import {
  LayersIcon,
  SearchIcon,
  GitBranchIcon,
  CodeIcon,
  MonitorIcon,
} from "../../../components/Icons/Icons";
import {
  type SaveMode,
  type EditorPrefs,
  type PanelResizeMode,
} from "../../../services/playgroundSettingsService";
import type { SidebarView } from "../playgroundUtils";
import PlaygroundSettingsMenu from "./PlaygroundSettingsMenu";

type MobilePanel = "sidebar" | "editor" | "preview";

interface MobileTabBarProps {
  sidebarView: SidebarView;
  mobilePanel: MobilePanel;
  changedFilesCount: number;
  onSelectSidebarView: (view: SidebarView) => void;
  onSelectEditor: () => void;
  onSelectPreview: () => void;
  saveMode: SaveMode;
  onSaveModeChange: (mode: SaveMode) => void;
  editorPrefs: EditorPrefs;
  onEditorPrefsChange: (prefs: EditorPrefs) => void;
  panelResizeMode: PanelResizeMode;
  onPanelResizeModeChange: (mode: PanelResizeMode) => void;
}

// The mobile equivalent of the ActivityBar + panel layout — since the
// Explorer/Editor/Preview can't reasonably sit side by side on a phone
// width, this switches between them one at a time instead. Hidden at the
// `lg` breakpoint, where the real side-by-side layout takes over.
function MobileTabBar({
  sidebarView,
  mobilePanel,
  changedFilesCount,
  onSelectSidebarView,
  onSelectEditor,
  onSelectPreview,
  saveMode,
  onSaveModeChange,
  editorPrefs,
  onEditorPrefsChange,
  panelResizeMode,
  onPanelResizeModeChange,
}: MobileTabBarProps) {
  function tabClass(active: boolean) {
    return `flex flex-1 flex-col items-center gap-0.5 rounded py-1.5 text-[10px] font-medium ${
      active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
    }`;
  }

  const isSidebarActive = (view: SidebarView) =>
    mobilePanel === "sidebar" && sidebarView === view;

  return (
    <div className="mb-2 flex items-center gap-1 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1 lg:hidden">
      <button
        type="button"
        onClick={() => onSelectSidebarView("explorer")}
        className={tabClass(isSidebarActive("explorer"))}
      >
        <LayersIcon className="h-4 w-4" />
        Files
      </button>
      <button
        type="button"
        onClick={() => onSelectSidebarView("search")}
        className={tabClass(isSidebarActive("search"))}
      >
        <SearchIcon className="h-4 w-4" />
        Search
      </button>
      <button
        type="button"
        onClick={() => onSelectSidebarView("sourceControl")}
        className={`relative ${tabClass(isSidebarActive("sourceControl"))}`}
      >
        <GitBranchIcon className="h-4 w-4" />
        Git
        {changedFilesCount > 0 && (
          <span className="absolute right-3 top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--color-primary-strong)] px-0.5 text-[9px] font-semibold leading-none text-white">
            {changedFilesCount > 99 ? "99+" : changedFilesCount}
          </span>
        )}
      </button>
      <button type="button" onClick={onSelectEditor} className={tabClass(mobilePanel === "editor")}>
        <CodeIcon className="h-4 w-4" />
        Editor
      </button>
      <button type="button" onClick={onSelectPreview} className={tabClass(mobilePanel === "preview")}>
        <MonitorIcon className="h-4 w-4" />
        Preview
      </button>
      <PlaygroundSettingsMenu
        variant="header"
        saveMode={saveMode}
        onSaveModeChange={onSaveModeChange}
        editorPrefs={editorPrefs}
        onEditorPrefsChange={onEditorPrefsChange}
        panelResizeMode={panelResizeMode}
        onPanelResizeModeChange={onPanelResizeModeChange}
      />
    </div>
  );
}

export default MobileTabBar;
