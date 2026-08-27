import type { FileTreeNode } from "../../../utils/fileTree";
import {
  ChevronDownIcon,
  PlusIcon,
  FolderPlusIcon,
  RefreshIcon,
  CollapseAllIcon,
} from "../../../components/Icons/Icons";
import FileTreeRow from "./FileTreeRow";

interface ExplorerViewProps {
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
  onRefreshExplorer: () => void;
  onCollapseFolders: () => void;
  onRename: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onCopyPath: (node: FileTreeNode) => void;
}

// The Explorer's file tree — the root project row (with its hover toolbar)
// followed by the recursive FileTreeRow list.
function ExplorerView({
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
  onRefreshExplorer,
  onCollapseFolders,
  onRename,
  onDelete,
  onCopyPath,
}: ExplorerViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="group flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleFilesTreeExpanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded py-0.5 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--text-app)] hover:text-[var(--color-primary)]"
        >
          <ChevronDownIcon
            className={`h-3 w-3 shrink-0 transition-transform ${filesTreeExpanded ? "" : "-rotate-90"}`}
          />
          <span className="truncate">{projectName}</span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onNewFile("")}
            aria-label="New file"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNewFolder("")}
            aria-label="New folder"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
          >
            <FolderPlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRefreshExplorer}
            aria-label="Refresh explorer"
            title="Refresh explorer"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
          >
            <RefreshIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCollapseFolders}
            aria-label="Collapse folders in explorer"
            title="Collapse folders in explorer"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
          >
            <CollapseAllIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {filesTreeExpanded && (
        <ul className="flex flex-col gap-0.5">
          {tree.map((node) => (
            <FileTreeRow
              key={node.id}
              node={node}
              depth={0}
              expandedPaths={expandedPaths}
              activeFileId={activeFileId}
              onToggleFolder={onToggleFolder}
              onOpenFile={onOpenFile}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              onRename={onRename}
              onDelete={onDelete}
              onCopyPath={onCopyPath}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExplorerView;
