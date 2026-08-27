import type { ProjectFile } from "../../../types/project";
import type { FileTreeNode } from "../../../utils/fileTree";
import type { ChangedFile } from "../../../utils/diff";
import {
  PlusIcon,
  FolderPlusIcon,
  RefreshIcon,
  CollapseAllIcon,
  UploadIcon,
  PaletteIcon,
} from "../../../components/Icons/Icons";
import RowActionsMenu, { menuItemClass, menuIconClass } from "../../../components/RowActionsMenu/RowActionsMenu";
import type { SidebarView } from "../playgroundUtils";
import ExplorerView from "./ExplorerView";
import SearchView from "./SearchView";
import SourceControlView from "./SourceControlView";

interface SidebarProps {
  sidebarView: SidebarView;
  width: number;
  mobileHidden: boolean;
  projectName: string;
  tree: FileTreeNode[];
  filesTreeExpanded: boolean;
  onToggleFilesTreeExpanded: () => void;
  expandedPaths: Set<string>;
  activeFileId: string | null;
  onToggleFolder: (path: string) => void;
  onOpenFile: (node: FileTreeNode) => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onUploadImage: () => void;
  onAddStyleTemplate: () => void;
  onRefreshExplorer: () => void;
  onCollapseFolders: () => void;
  onRename: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onCopyPath: (node: FileTreeNode) => void;
  files: ProjectFile[];
  codeSearchQuery: string;
  onCodeSearchQueryChange: (query: string) => void;
  onJumpToLine: (file: ProjectFile, lineNumber: number) => void;
  changedFiles: ChangedFile[];
  changesExpanded: boolean;
  onToggleChangesExpanded: () => void;
  hasPreviousVersion: boolean;
  onOpenDiff: (path: string) => void;
  onDiscardChange: (changed: ChangedFile) => void;
  onDiscardAll: () => void;
}

// The Explorer sidebar shell — a shared header (label + "..." actions menu,
// Explorer only) wrapping whichever of the three Activity Bar views
// (Explorer / Search / Source Control) is currently selected.
function Sidebar({
  sidebarView,
  width,
  mobileHidden,
  projectName,
  tree,
  filesTreeExpanded,
  onToggleFilesTreeExpanded,
  expandedPaths,
  activeFileId,
  onToggleFolder,
  onOpenFile,
  onNewFile,
  onNewFolder,
  onUploadImage,
  onAddStyleTemplate,
  onRefreshExplorer,
  onCollapseFolders,
  onRename,
  onDelete,
  onCopyPath,
  files,
  codeSearchQuery,
  onCodeSearchQueryChange,
  onJumpToLine,
  changedFiles,
  changesExpanded,
  onToggleChangesExpanded,
  hasPreviousVersion,
  onOpenDiff,
  onDiscardChange,
  onDiscardAll,
}: SidebarProps) {
  return (
    <div
      style={{ "--panel-width": `${width}px` } as React.CSSProperties}
      className={`${mobileHidden ? "hidden" : "flex"} w-full flex-col gap-2 overflow-y-auto rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-3 lg:flex lg:w-[var(--panel-width)] lg:shrink-0 lg:rounded-l-none lg:rounded-r-lg`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {sidebarView === "search"
            ? "Search"
            : sidebarView === "sourceControl"
              ? "Source Control"
              : "Explorer"}
        </p>
        <div className="flex items-center gap-0.5">
          {sidebarView === "explorer" && (
            <RowActionsMenu>
              <button
                type="button"
                onClick={() => onNewFile("")}
                className={menuItemClass}
              >
                <PlusIcon className={menuIconClass} />
                New File
              </button>
              <button
                type="button"
                onClick={() => onNewFolder("")}
                className={menuItemClass}
              >
                <FolderPlusIcon className={menuIconClass} />
                New Folder
              </button>
              <button
                type="button"
                onClick={onUploadImage}
                className={menuItemClass}
              >
                <UploadIcon className={menuIconClass} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={onAddStyleTemplate}
                className={menuItemClass}
              >
                <PaletteIcon className={menuIconClass} />
                Add Style Template
              </button>
              <button
                type="button"
                onClick={onRefreshExplorer}
                className={menuItemClass}
              >
                <RefreshIcon className={menuIconClass} />
                Refresh Explorer
              </button>
              <button
                type="button"
                onClick={onCollapseFolders}
                className={menuItemClass}
              >
                <CollapseAllIcon className={menuIconClass} />
                Collapse Folders
              </button>
            </RowActionsMenu>
          )}
        </div>
      </div>

      {sidebarView === "search" ? (
        <SearchView
          files={files}
          query={codeSearchQuery}
          onQueryChange={onCodeSearchQueryChange}
          onJumpToLine={onJumpToLine}
        />
      ) : sidebarView === "sourceControl" ? (
        <SourceControlView
          changedFiles={changedFiles}
          changesExpanded={changesExpanded}
          onToggleChangesExpanded={onToggleChangesExpanded}
          hasPreviousVersion={hasPreviousVersion}
          onOpenDiff={onOpenDiff}
          onDiscardChange={onDiscardChange}
          onDiscardAll={onDiscardAll}
        />
      ) : (
        <ExplorerView
          projectName={projectName}
          tree={tree}
          filesTreeExpanded={filesTreeExpanded}
          onToggleFilesTreeExpanded={onToggleFilesTreeExpanded}
          expandedPaths={expandedPaths}
          activeFileId={activeFileId}
          onToggleFolder={onToggleFolder}
          onOpenFile={onOpenFile}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onRefreshExplorer={onRefreshExplorer}
          onCollapseFolders={onCollapseFolders}
          onRename={onRename}
          onDelete={onDelete}
          onCopyPath={onCopyPath}
        />
      )}
    </div>
  );
}

export default Sidebar;
