import type { FileTreeNode } from "../../../utils/fileTree";
import {
  ChevronDownIcon,
  FolderIcon,
  FileIcon,
  PlusIcon,
  FolderPlusIcon,
  PencilIcon,
  TrashIcon,
  CopyIcon,
} from "../../../components/Icons/Icons";
import { getFileIconColor } from "../playgroundUtils";

interface FileTreeRowProps {
  node: FileTreeNode;
  depth: number;
  expandedPaths: Set<string>;
  activeFileId: string | null;
  onToggleFolder: (path: string) => void;
  onOpenFile: (node: FileTreeNode) => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onRename: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onCopyPath: (node: FileTreeNode) => void;
}

function FileTreeRow({
  node,
  depth,
  expandedPaths,
  activeFileId,
  onToggleFolder,
  onOpenFile,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
}: FileTreeRowProps) {
  const isFolder = node.type === "folder";
  const expanded = expandedPaths.has(node.path);

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded py-1 pr-1 ${
          !isFolder && activeFileId === node.id
            ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
            : "text-[var(--color-muted)] hover:text-[var(--text-app)]"
        }`}
        style={{ paddingLeft: `${depth * 14 + 15}px` }}
      >
        <button
          type="button"
          onClick={() =>
            isFolder ? onToggleFolder(node.path) : onOpenFile(node)
          }
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left text-sm"
        >
          {isFolder ? (
            <ChevronDownIcon
              className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}
            />
          ) : (
            <span className="w-3 shrink-0" />
          )}
          {isFolder ? (
            <FolderIcon className="h-4 w-4 shrink-0" />
          ) : (
            <span
              className="shrink-0"
              style={{ color: getFileIconColor(node.name) }}
            >
              <FileIcon className="h-4 w-4" />
            </span>
          )}
          <span className="truncate">{node.name}</span>
        </button>

        <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          {isFolder && (
            <>
              <button
                type="button"
                onClick={() => onNewFile(node.path)}
                aria-label={`New file in ${node.name}`}
                className="flex h-5 w-5 max-[1281px]:h-4 max-[1281px]:w-4 cursor-pointer items-center justify-center rounded hover:text-[var(--color-primary)]"
              >
                <PlusIcon className="h-3.5 w-3.5 max-[1281px]:h-3 max-[1281px]:w-3" />
              </button>
              <button
                type="button"
                onClick={() => onNewFolder(node.path)}
                aria-label={`New folder in ${node.name}`}
                className="flex h-5 w-5 max-[1281px]:h-4 max-[1281px]:w-4 cursor-pointer items-center justify-center rounded hover:text-[var(--color-primary)]"
              >
                <FolderPlusIcon className="h-3.5 w-3.5 max-[1281px]:h-3 max-[1281px]:w-3" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onCopyPath(node)}
            aria-label={`Copy path of ${node.name}`}
            title="Copy path"
            className="flex h-5 w-5 max-[1281px]:h-4 max-[1281px]:w-4 cursor-pointer items-center justify-center rounded hover:text-[var(--color-primary)]"
          >
            <CopyIcon className="h-3.5 w-3.5 max-[1281px]:h-3 max-[1281px]:w-3" />
          </button>
          <button
            type="button"
            onClick={() => onRename(node)}
            aria-label={`Rename ${node.name}`}
            className="flex h-5 w-5 max-[1281px]:h-4 max-[1281px]:w-4 cursor-pointer items-center justify-center rounded hover:text-[var(--color-primary)]"
          >
            <PencilIcon className="h-3.5 w-3.5 max-[1281px]:h-3 max-[1281px]:w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            aria-label={`Delete ${node.name}`}
            className="flex h-5 w-5 max-[1281px]:h-4 max-[1281px]:w-4 cursor-pointer items-center justify-center rounded hover:text-red-500"
          >
            <TrashIcon className="h-3.5 w-3.5 max-[1281px]:h-3 max-[1281px]:w-3" />
          </button>
        </span>
      </div>

      {isFolder && expanded && node.children.length > 0 && (
        <ul className="flex flex-col">
          {node.children.map((child) => (
            <FileTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
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
    </li>
  );
}

export default FileTreeRow;
