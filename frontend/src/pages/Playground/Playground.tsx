import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Navigate, useBlocker, useNavigate, useParams } from "react-router-dom";
import JSZip from "jszip";
import type { MonacoDiffEditor } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { getScaffoldFiles } from "../../lib/exportScaffold";
import { recordExport } from "../../services/exportService";
import { getUser, type UserSummary } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { usePageHeaderActions } from "../../hooks/usePageHeaderActions";
import { usePageTitle } from "../../hooks/usePageTitle";
import { usePageFullscreen } from "../../hooks/usePageFullscreen";
import { getProject, deleteProject } from "../../services/projectService";
import { getLatestVersion, publishVersion } from "../../services/versionService";
import {
  getSaveMode,
  setSaveMode,
  getEditorPrefs,
  setEditorPrefs,
  getPanelResizeMode,
  setPanelResizeMode,
  getPanelSizes,
  setPanelSizes,
  DEFAULT_PANEL_SIZES,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  type SaveMode,
  type EditorPrefs,
  type PanelResizeMode,
  type PanelSizes,
} from "../../services/playgroundSettingsService";
import { compileProject, buildPreviewDocument, isImagePath } from "../../lib/runPreview";
import {
  listFiles,
  createFile,
  createFolder,
  saveFilesBatch,
  renameFile,
  renamePathPrefix,
  deleteFile,
  deleteByPathPrefix,
  discardChanges,
} from "../../services/fileService";
import {
  buildFileTree,
  allFolderPaths,
  type FileTreeNode,
} from "../../utils/fileTree";
import { computeChangedFiles, type ChangedFile } from "../../utils/diff";
import type { Project, ProjectFile, ProjectVersion } from "../../types/project";
import {
  DownloadIcon,
  FolderIcon,
  ClockIcon,
  GitBranchIcon,
  AlertTriangleIcon,
  CopyIcon,
} from "../../components/Icons/Icons";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import PromptDialog from "../../components/PromptDialog/PromptDialog";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
import { diffTabId, isDiffTab, diffTabPath, type SidebarView } from "./playgroundUtils";
import ActivityBar from "./components/ActivityBar";
import MobileTabBar from "./components/MobileTabBar";
import Sidebar from "./components/Sidebar";
import EditorPanel from "./components/EditorPanel";
import PreviewPanel from "./components/PreviewPanel";
import LogTerminalPanel from "./components/LogTerminalPanel";
import ResizeHandle from "./components/ResizeHandle";
import QuickOpenList from "./components/QuickOpenList";
import OwnerDetailsDialog from "./components/OwnerDetailsDialog";
import ErrorDialog from "./components/ErrorDialog";

type DialogRequest =
  | {
      kind: "prompt";
      title: string;
      label?: string;
      placeholder?: string;
      defaultValue?: string;
      confirmLabel?: string;
      onSubmit: (value: string) => void;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel?: string;
      onConfirm: () => void;
    }
  | {
      kind: "error";
      title: string;
      message: string;
    }
  | null;

type LoadStatus = "loading" | "ready" | "not-found" | "error";

const MAX_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024;

function Playground() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [latestVersion, setLatestVersion] = useState<ProjectVersion | undefined>(undefined);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [log, setLog] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [bottomPanelTab, setBottomPanelTab] = useState<"log" | "console" | "terminal">("log");
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState("");
  const [sidebarView, setSidebarView] = useState<SidebarView>("explorer");
  const [mobilePanel, setMobilePanel] = useState<"sidebar" | "editor" | "preview">("sidebar");
  const [codeSearchQuery, setCodeSearchQuery] = useState("");
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const pendingRevealLineRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<ProjectFile | null>(null);
  const [editorMaximized, setEditorMaximized] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Hash Playground terminal — type a command and press Enter.",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [dialog, setDialog] = useState<DialogRequest>(null);
  const [changesExpanded, setChangesExpanded] = useState(true);
  const [filesTreeExpanded, setFilesTreeExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [lastSynced, setLastSynced] = useState<{
    name: string;
    time: Date;
  } | null>(null);
  const [saveMode, setSaveModeState] = useState<SaveMode>(() =>
    projectId ? getSaveMode(projectId) : "auto",
  );
  const [editorPrefs, setEditorPrefsState] = useState<EditorPrefs>(() =>
    getEditorPrefs(),
  );
  const [panelResizeMode, setPanelResizeModeState] = useState<PanelResizeMode>(() =>
    getPanelResizeMode(),
  );
  const [panelSizes, setPanelSizesState] = useState<PanelSizes>(() => getPanelSizes());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [ownerDetail, setOwnerDetail] = useState<UserSummary | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [previewRunKey, setPreviewRunKey] = useState(0);
  const [previewError, setPreviewError] = useState<{
    kind: "compile" | "runtime";
    message: string;
  } | null>(null);
  const diffEditorRef = useRef<MonacoDiffEditor | null>(null);
  const isSavingRef = useRef(false);

  const isFirstVersion = !latestVersion;
  const changedFiles = computeChangedFiles(files, latestVersion);
  const hasUnsavedDrafts = openTabs.some((id) => {
    const file = files.find((f) => f.id === id);
    return Boolean(
      file && drafts[id] !== undefined && drafts[id] !== file.content,
    );
  });
  // A project is only "confirmed" once Update Project has run at least once —
  // until then it's always treated as having a diff, even with zero edits.
  const hasUnpublishedChanges =
    isFirstVersion || hasUnsavedDrafts || changedFiles.length > 0;

  const blocker = useBlocker(hasUnpublishedChanges);

  async function loadProject() {
    if (!projectId) return;
    setStatus("loading");
    try {
      const found = await getProject(projectId);
      if (!found) {
        setStatus("not-found");
        return;
      }
      const [fetchedFiles, version] = await Promise.all([
        listFiles(projectId),
        getLatestVersion(projectId),
      ]);
      setProject(found);
      setFiles(fetchedFiles);
      setLatestVersion(version);
      setExpandedPaths(new Set(allFolderPaths(fetchedFiles)));
      setLog([`Loaded project "${found.name}"`]);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnpublishedChanges) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnpublishedChanges]);

  // Always points at the latest persistDirtyFiles closure so the debounced
  // timer below never acts on a stale "still dirty" snapshot — e.g. if Ctrl+S
  // (or Update/Export) already saved in between, this reflects that by the
  // time the timer fires, instead of redundantly re-saving and double-logging.
  const persistDirtyFilesRef = useRef<() => Promise<boolean>>(async () => false);
  const handleRunRef = useRef<() => void>(() => {});
  useEffect(() => {
    persistDirtyFilesRef.current = persistDirtyFiles;
    handleRunRef.current = handleRun;
  });

  // Auto-save: persists whatever is dirty ~1s after the last edit, then
  // re-runs the preview so it always reflects the last saved state. Re-created
  // on every `drafts` change so it always debounces off the latest keystroke,
  // never a stale one. Skipped entirely in manual save mode — Ctrl+S still works.
  useEffect(() => {
    if (saveMode !== "auto") return;
    const timer = setTimeout(async () => {
      if (await persistDirtyFilesRef.current()) handleRunRef.current();
    }, 1000);
    return () => clearTimeout(timer);
  }, [drafts, saveMode]);

  // Forwards console.log/warn/error and runtime errors from the sandboxed
  // preview iframe into the Debug Console tab below the editor — kept
  // separate from the app's own activity Log.
  useEffect(() => {
    function handlePreviewMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== "object" || !data.__hashPlaygroundPreview)
        return;
      const text = Array.isArray(data.args)
        ? data.args.join(" ")
        : String(data.args);
      addConsoleOutput(`[${data.type}] ${text}`);
      if (data.type === "crash") {
        // First crash in a run wins — React often retries after an error and
        // the retry's failure is a generic, less useful "Script error."
        // (cross-origin script redaction from the unpkg-hosted React build),
        // which would otherwise overwrite the original, more specific message.
        setPreviewError((prev) => prev ?? { kind: "runtime", message: text });
      }
    }

    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, []);

  // Manual save via Ctrl+S / Cmd+S — same persistence (and preview re-run) as
  // auto-save, just immediate.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persistDirtyFiles().then((saved) => {
          if (saved) handleRun();
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, drafts, openTabs]);

  // Quick Open (Ctrl+P / Cmd+P), matching VS Code's "Go to File" — available
  // whether or not a file is currently open, same as every other editor
  // action here (search shouldn't require a file to already be open).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setQuickOpenQuery("");
        setQuickOpenVisible((prev) => !prev);
      } else if (event.key === "Escape") {
        setQuickOpenVisible(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSaveModeChange(mode: SaveMode) {
    if (!projectId) return;
    setSaveMode(projectId, mode);
    setSaveModeState(mode);
    addLog(
      mode === "auto"
        ? "Auto save enabled"
        : "Switched to manual save (Ctrl+S)",
    );
  }

  function handleEditorPrefsChange(prefs: EditorPrefs) {
    const clamped = {
      ...prefs,
      fontSize: Math.min(
        MAX_FONT_SIZE,
        Math.max(MIN_FONT_SIZE, prefs.fontSize),
      ),
    };
    setEditorPrefs(clamped);
    setEditorPrefsState(clamped);
  }

  function handlePanelResizeModeChange(mode: PanelResizeMode) {
    setPanelResizeMode(mode);
    setPanelResizeModeState(mode);

    if (mode === "fixed") {
      setPanelSizesState(DEFAULT_PANEL_SIZES);
      setPanelSizes(DEFAULT_PANEL_SIZES);
    }
  }

  function resizeSidebar(deltaPx: number) {
    setPanelSizesState((prev) => ({
      ...prev,
      sidebarWidth: Math.min(480, Math.max(160, prev.sidebarWidth + deltaPx)),
    }));
  }

  function resizePreview(deltaPx: number) {
    setPanelSizesState((prev) => ({
      ...prev,
      previewWidth: Math.min(640, Math.max(240, prev.previewWidth - deltaPx)),
    }));
  }

  function resizeBottomPanel(deltaPx: number) {
    setPanelSizesState((prev) => ({
      ...prev,
      bottomPanelHeight: Math.min(480, Math.max(80, prev.bottomPanelHeight - deltaPx)),
    }));
  }

  function persistPanelSizes() {
    // Reads the truly-current sizes via the updater form rather than the
    // `panelSizes` closure variable, which would be stale — this callback is
    // captured once at drag-start, before the drag's own state updates land.
    setPanelSizesState((prev) => {
      setPanelSizes(prev);
      return prev;
    });
  }

  function handleSelectSidebarView(view: SidebarView) {
    setSidebarView(view);
    setMobilePanel("sidebar");
    if (view === "sourceControl") setChangesExpanded(true);
    if (sidebarCollapsed) setSidebarCollapsed(false);
  }

  function selectMobilePreview() {
    setMobilePanel("preview");
    setPreviewCollapsed(false);
  }

  usePageFullscreen(editorMaximized);

  usePageTitle(
    project?.name ?? null,
    project ? (
      <div className="ml-2 mt-1 flex flex-wrap items-center gap-2">
        {user?.role === "admin" && project.ownerUsername !== user.username && (
          <button
            type="button"
            onClick={handleShowOwnerDetails}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--hover-overlay)]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-[10px] font-medium text-white">
              {(project.owner.name ?? project.owner.username).slice(0, 1).toUpperCase()}
            </span>
            {project.owner.name ?? project.owner.username}
          </button>
        )}
        <span className="flex items-center gap-1 text-xs font-medium text-[var(--text-app)]">
          <FolderIcon className="h-5 w-5" />
          {files.length} file{files.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-app)]">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {latestVersion
              ? `Updated ${new Date(latestVersion.createdAt).toLocaleString()}`
              : "Not updated yet"}
          </span>
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[var(--text-app)]">
            <GitBranchIcon className="h-3.5 w-3.5" />
            Version : {project.version}
          </span>
        </span>
      </div>
    ) : null,
  );
  usePageHeaderActions(
    project ? (
      <div className="flex flex-wrap items-center gap-3">
        {hasUnpublishedChanges && (
          <span
            title={
              isFirstVersion
                ? "This project hasn't been updated yet — it won't be saved if you leave now."
                : "You have changes since the last update — they'll be lost if you leave without updating."
            }
            className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500"
          >
            <AlertTriangleIcon className="h-3.5 w-3.5" />
            {isFirstVersion ? "Not saved yet" : "Unpublished changes"}
          </span>
        )}
        <button
          type="button"
          onClick={handleExportProject}
          disabled={isExporting}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {isExporting ? "Exporting…" : "Export"}
        </button>
        <button
          type="button"
          onClick={handleUpdateProject}
          disabled={isUpdating}
          className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdating ? "Updating…" : "Update Project"}
        </button>
      </div>
    ) : null,
  );

  if (!projectId) return <Navigate to="/dashboard" replace />;
  if (status === "not-found") return <Navigate to="/dashboard" replace />;
  if (status === "loading" || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingOverlay />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-[var(--color-muted)]">Couldn't load this project.</p>
        <button
          type="button"
          onClick={loadProject}
          className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentProject = project;
  const terminalPrompt = `Playground\\${currentProject.name}>`;

  const ownerDetailRows: [string, string][] = ownerDetail
    ? [
        ["Username", ownerDetail.username],
        ["Name", ownerDetail.name ?? "—"],
        ["Role", ownerDetail.role],
        ["Joined", new Date(ownerDetail.joinedAt).toLocaleString()],
        ["Status", ownerDetail.blocked ? "Blocked" : "Active"],
        ["Total projects", String(ownerDetail.projectCount)],
      ]
    : [];

  async function handleShowOwnerDetails() {
    try {
      setOwnerDetail(await getUser(currentProject.ownerUsername));
      setShowOwnerDetails(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not load owner details");
    }
  }

  function addLog(message: string) {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, `[${time}] ${message}`]);
  }

  function addConsoleOutput(message: string) {
    const time = new Date().toLocaleTimeString();
    setConsoleOutput((prev) => [...prev, `[${time}] ${message}`]);
  }

  // Terminal is UI-only for now — it echoes commands back rather than running
  // them. Wiring real commands (e.g. "git push" triggering Update Project) is
  // planned for later.
  function handleTerminalSubmit() {
    const command = terminalInput.trim();
    if (!command) return;
    setTerminalInput("");

    if (command === "clear" || command === "cls") {
      setTerminalLines([]);
      return;
    }

    setTerminalLines((prev) => [
      ...prev,
      `${terminalPrompt} ${command}`,
      command === "git push"
        ? 'This will run "Update Project" once terminal commands are wired up — coming soon.'
        : `Command not recognized yet: "${command}" — terminal actions are coming soon.`,
    ]);
  }

  function openFile(file: ProjectFile | FileTreeNode) {
    // Image files hold a data URL, not editable text — a Monaco tab would
    // just render that data URL as one giant line, so preview it instead.
    if (isImagePath(file.path)) {
      const record = files.find((f) => f.id === file.id);
      if (record) setImagePreview(record);
      return;
    }

    setActiveFileId(file.id);
    setMobilePanel("editor");
    setOpenTabs((prev) => (prev.includes(file.id) ? prev : [...prev, file.id]));
    setDrafts((prev) => {
      if (file.id in prev) return prev;
      const record = files.find((f) => f.id === file.id);
      return record ? { ...prev, [file.id]: record.content } : prev;
    });
  }

  // Opens a file (if not already active) and reveals a specific line — used
  // by full-text search results. If the file is already the active tab, the
  // editor instance persists so we can jump immediately; otherwise the
  // Editor's key={file.id} forces a fresh mount, so the reveal happens from
  // its onMount callback instead (see pendingRevealLineRef below).
  function jumpToLine(file: ProjectFile, lineNumber: number) {
    const alreadyActive = activeFileId === file.id;
    openFile(file);
    if (alreadyActive && editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
    } else {
      pendingRevealLineRef.current = lineNumber;
    }
  }

  function handleEditorMount(editorInstance: MonacoEditorNS.IStandaloneCodeEditor) {
    editorRef.current = editorInstance;
    if (pendingRevealLineRef.current !== null) {
      editorInstance.revealLineInCenter(pendingRevealLineRef.current);
      editorInstance.setPosition({ lineNumber: pendingRevealLineRef.current, column: 1 });
      pendingRevealLineRef.current = null;
    }
  }

  function handleDraftChange(fileId: string, value: string) {
    setDrafts((prev) => ({ ...prev, [fileId]: value }));
  }

  function openDiff(path: string) {
    const id = diffTabId(path);
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveFileId(id);
  }

  function revealFirstDiffChange(diffEditor: MonacoDiffEditor) {
    const changes = diffEditor.getLineChanges();
    const first = changes?.[0];
    if (!first) return;
    const line =
      first.modifiedStartLineNumber ||
      first.modifiedEndLineNumber ||
      first.originalStartLineNumber ||
      1;
    const modifiedEditor = diffEditor.getModifiedEditor();
    modifiedEditor.revealLineInCenter(line);
    // Also move the cursor (not just the viewport) so the "Next/Previous change"
    // buttons have a real starting point to navigate relative to.
    modifiedEditor.setPosition({ lineNumber: line, column: 1 });
  }

  function handleDiffEditorMount(diffEditor: MonacoDiffEditor) {
    diffEditorRef.current = diffEditor;
    diffEditor.onDidUpdateDiff(() => revealFirstDiffChange(diffEditor));
  }

  function goToDiffChange(direction: 1 | -1) {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;
    const changes = diffEditor.getLineChanges();
    if (!changes || changes.length === 0) return;

    const lineOf = (change: (typeof changes)[number]) =>
      change.modifiedStartLineNumber ||
      change.modifiedEndLineNumber ||
      change.originalStartLineNumber ||
      1;

    const modifiedEditor = diffEditor.getModifiedEditor();
    const currentLine = modifiedEditor.getPosition()?.lineNumber ?? 1;
    const sorted =
      direction === 1
        ? [...changes].sort((a, b) => lineOf(a) - lineOf(b))
        : [...changes].sort((a, b) => lineOf(b) - lineOf(a));

    const next = sorted.find((change) =>
      direction === 1 ? lineOf(change) > currentLine : lineOf(change) < currentLine,
    );
    const target = next ?? sorted[0];
    const line = lineOf(target);
    modifiedEditor.revealLineInCenter(line);
    modifiedEditor.setPosition({ lineNumber: line, column: 1 });
  }

  // Re-syncs file/tab/draft state after one or more files were reverted via
  // the server-side discard endpoint, which already returns the resulting
  // current file list — no separate re-fetch needed.
  function syncFilesAfterRevert(updated: ProjectFile[]) {
    setFiles(updated);
    const remainingIds = new Set(updated.map((f) => f.id));
    const revertedById = new Map(updated.map((file) => [file.id, file] as const));

    setOpenTabs((prev) =>
      prev.filter((id) => isDiffTab(id) || remainingIds.has(id)),
    );
    setActiveFileId((prev) =>
      prev && (isDiffTab(prev) || remainingIds.has(prev)) ? prev : null,
    );
    setDrafts((prev) => {
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([id, value]) => {
        if (remainingIds.has(id)) next[id] = value;
      });
      revertedById.forEach((file, id) => {
        if (id in next) next[id] = file.content;
      });
      return next;
    });
  }

  function handleDiscardChange(changed: ChangedFile) {
    setDialog({
      kind: "confirm",
      title: "Discard changes",
      message:
        changed.status === "added"
          ? `Discard "${changed.name}"? It didn't exist in the last saved version and will be removed.`
          : changed.status === "deleted"
            ? `Restore "${changed.name}" from the last saved version?`
            : `Discard changes to "${changed.name}"? This restores it to the last saved version.`,
      confirmLabel: changed.status === "deleted" ? "Restore" : "Discard",
      onConfirm: async () => {
        try {
          const updated = await discardChanges(currentProject.id, [changed.path]);
          syncFilesAfterRevert(updated);
          addLog(`Discarded changes to ${changed.path}`);
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not discard this change");
        }
        setDialog(null);
      },
    });
  }

  function handleDiscardAllChanges() {
    const count = changedFiles.length;
    setDialog({
      kind: "confirm",
      title: "Discard all changes",
      message: `Discard changes to ${count} file${count === 1 ? "" : "s"}? This restores them to the last saved version.`,
      confirmLabel: "Discard All",
      onConfirm: async () => {
        try {
          const updated = await discardChanges(currentProject.id);
          syncFilesAfterRevert(updated);
          addLog(`Discarded changes to ${count} file${count === 1 ? "" : "s"}`);
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not discard changes");
        }
        setDialog(null);
      },
    });
  }

  // Called when the user confirms leaving the Playground without updating.
  // A never-updated project is deleted outright; an already-updated one
  // just has its unpublished edits reverted to the last recorded version.
  // Fire-and-forget: the user already confirmed via the leave-blocker dialog,
  // so blocking their exit on this cleanup call finishing isn't worth it —
  // a lost cleanup here is low-stakes (an orphaned never-updated project, or
  // unreverted files) compared to a navigation that visibly hangs.
  function discardUnpublishedChanges() {
    if (isFirstVersion) {
      deleteProject(currentProject.id).catch((error) =>
        console.error("Failed to delete never-updated project on leave:", error),
      );
      return;
    }

    discardChanges(currentProject.id).catch((error) =>
      console.error("Failed to discard changes on leave:", error),
    );
  }

  function closeTab(fileId: string) {
    const remaining = openTabs.filter((id) => id !== fileId);
    setOpenTabs(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[remaining.length - 1] ?? null);
    }
  }

  function toggleFolder(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function requestNewEntry(type: "file" | "folder", parentPath: string) {
    setDialog({
      kind: "prompt",
      title: type === "folder" ? "New folder" : "New file",
      placeholder:
        type === "folder" ? "Folder name" : "File name (e.g. Button.tsx)",
      confirmLabel: "Create",
      onSubmit: async (name) => {
        const path = parentPath ? `${parentPath}/${name}` : name;
        try {
          const created =
            type === "folder"
              ? await createFolder(currentProject.id, name, path)
              : await createFile(currentProject.id, name, path);

          setFiles((prev) => [...prev, created]);
          if (type === "folder") {
            setExpandedPaths((prev) => new Set(prev).add(path));
          } else {
            openFile(created);
          }
          addLog(`Created ${created.path}`);
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not create this entry");
        }
        setDialog(null);
      },
    });
  }

  // Stores the picked file's data URL directly as the new ProjectFile's
  // content — there's no separate blob storage, so that data URL doubles as
  // the image's only usable "src" both here and in the sandboxed preview
  // (see isImagePath handling in runPreview.ts).
  async function handleImageFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    if (!picked.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }
    if (picked.size > MAX_IMAGE_UPLOAD_BYTES) {
      showToast("Image is too large — please choose one under 3MB");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(picked);
    });

    const safeName = picked.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const existingPaths = new Set(files.map((f) => f.path));
    const dotIndex = safeName.lastIndexOf(".");
    const base = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
    const ext = dotIndex > 0 ? safeName.slice(dotIndex) : "";

    let targetName = safeName;
    let targetPath = `src/icons/${targetName}`;
    for (let suffix = 1; existingPaths.has(targetPath); suffix++) {
      targetName = `${base}-${suffix}${ext}`;
      targetPath = `src/icons/${targetName}`;
    }

    try {
      const created = await createFile(currentProject.id, targetName, targetPath);
      const [saved] = await saveFilesBatch(currentProject.id, [{ fileId: created.id, content: dataUrl }]);
      setFiles((prev) => [...prev, saved ?? created]);
      setExpandedPaths((prev) => new Set(prev).add("src").add("src/icons"));
      addLog(`Uploaded ${targetPath}`);

      try {
        await navigator.clipboard.writeText(targetPath);
        showToast(`Uploaded to ${targetPath} — path copied to clipboard`, { kind: "success" });
      } catch {
        showToast(`Uploaded to ${targetPath}`, { kind: "success" });
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not upload this image");
    }
  }

  function requestRename(node: FileTreeNode) {
    setDialog({
      kind: "prompt",
      title: node.type === "folder" ? "Rename folder" : "Rename file",
      defaultValue: node.name,
      confirmLabel: "Rename",
      onSubmit: async (name) => {
        if (name === node.name) {
          setDialog(null);
          return;
        }

        const parent = node.path.includes("/")
          ? node.path.slice(0, node.path.lastIndexOf("/") + 1)
          : "";
        const newPath = `${parent}${name}`;

        try {
          if (node.type === "folder") {
            await renamePathPrefix(currentProject.id, node.path, newPath);
            setExpandedPaths((prev) => {
              const next = new Set<string>();
              prev.forEach((path) => {
                if (path === node.path) next.add(newPath);
                else if (path.startsWith(`${node.path}/`))
                  next.add(`${newPath}${path.slice(node.path.length)}`);
                else next.add(path);
              });
              return next;
            });
          } else {
            await renameFile(currentProject.id, node.id, name);
          }

          setFiles(await listFiles(currentProject.id));
          addLog(`Renamed ${node.name} to ${name}`);
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not rename this entry");
        }
        setDialog(null);
      },
    });
  }

  function requestDelete(node: FileTreeNode) {
    const isFolder = node.type === "folder";
    setDialog({
      kind: "confirm",
      title: isFolder ? "Delete folder" : "Delete file",
      message: isFolder
        ? `Delete folder "${node.name}" and everything inside it? This cannot be undone.`
        : `Delete ${node.name}? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          if (isFolder) {
            await deleteByPathPrefix(currentProject.id, node.path);
          } else {
            await deleteFile(currentProject.id, node.id);
          }

          const updated = await listFiles(currentProject.id);
          setFiles(updated);
          const remainingIds = new Set(updated.map((f) => f.id));
          setOpenTabs((prev) => prev.filter((id) => remainingIds.has(id)));
          setActiveFileId((prev) =>
            prev && remainingIds.has(prev) ? prev : null,
          );
          addLog(`Deleted ${node.path}`);
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not delete this entry");
        }
        setDialog(null);
      },
    });
  }

  async function copyPathToClipboard(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      showToast(`Copied "${path}"`, { kind: "success" });
    } catch {
      showToast("Could not copy path — your browser blocked clipboard access");
    }
  }

  async function persistDirtyFiles(): Promise<boolean> {
    if (isSavingRef.current) return false;

    const dirtyIds = openTabs.filter((id) => {
      if (isDiffTab(id)) return false;
      const file = files.find((f) => f.id === id);
      return Boolean(
        file && drafts[id] !== undefined && drafts[id] !== file.content,
      );
    });

    if (dirtyIds.length === 0) return false;

    isSavingRef.current = true;
    try {
      const entries = dirtyIds.map((id) => ({ fileId: id, content: drafts[id] }));
      const updatedFiles = await saveFilesBatch(currentProject.id, entries);

      // Only touch the "clean" baseline on success — a failed save must
      // never silently mark a dirty file as clean.
      setFiles((prev) => prev.map((f) => updatedFiles.find((u) => u.id === f.id) ?? f));

      const lastSavedFile = updatedFiles[updatedFiles.length - 1];
      if (lastSavedFile)
        setLastSynced({ name: lastSavedFile.name, time: new Date() });

      addLog(`Saved ${dirtyIds.length} file${dirtyIds.length > 1 ? "s" : ""}`);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save your changes");
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }

  async function handleUpdateProject() {
    setIsUpdating(true);
    await persistDirtyFiles();

    try {
      const result = await publishVersion(currentProject.id);
      if (!result.changed) {
        addLog("No changes to update — version unchanged");
      } else {
        const updatedVersion = await getLatestVersion(currentProject.id);
        // Flush synchronously so the leave-blocker (which reads latestVersion)
        // sees the just-recorded version before the navigate() below runs —
        // otherwise it still thinks this project has never been updated and
        // blocks its own post-update redirect.
        flushSync(() => setLatestVersion(updatedVersion));
        addLog(`Updated project to v${result.version}`);
      }

      navigate("/dashboard");
    } catch (error) {
      setIsUpdating(false);
      const message = error instanceof Error ? error.message : "Could not update this project.";
      setDialog({ kind: "error", title: "Update failed", message });
    }
  }

  async function handleExportProject() {
    await persistDirtyFiles();
    setIsExporting(true);

    try {
      const latestFiles = await listFiles(currentProject.id);
      const safeName =
        currentProject.name
          .trim()
          .replace(/[^a-z0-9_-]+/gi, "-")
          .replace(/^-+|-+$/g, "") || "project";
      const packageName = safeName.toLowerCase() || "project";

      const zip = new JSZip();
      latestFiles.forEach((file) => {
        if (file.type === "file") zip.file(file.path, file.content);
      });

      const scaffoldFiles = getScaffoldFiles(currentProject.name, packageName, currentProject.template);
      Object.entries(scaffoldFiles).forEach(([path, content]) => {
        zip.file(path, content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // The version-transition-aware admin notification is now generated
      // server-side, inside recordExport, since it already knows the
      // project's previous export version.
      await recordExport(currentProject.id, currentProject.version, blob.size);
      addLog(`Exported project as ${safeName}.zip`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not export this project");
    } finally {
      setIsExporting(false);
    }
  }

  function handleRun() {
    // Expand the preview so the result (or a compile-error overlay) is
    // actually visible — it starts collapsed by default to give the editor
    // more room until there's something worth showing.
    setPreviewCollapsed(false);

    // Run reflects what's currently in the editor, including unsaved edits —
    // it doesn't require a Save first, matching the doc's Edit -> Run -> Preview flow.
    const filesForRun = files.map((file) =>
      file.type === "file" && drafts[file.id] !== undefined
        ? { ...file, content: drafts[file.id] }
        : file,
    );

    const result = compileProject(filesForRun);
    if (!result.ok) {
      setPreviewError({ kind: "compile", message: result.message });
      addLog(`Compile error: ${result.message}`);
      return;
    }

    setPreviewError(null);
    setPreviewDoc(buildPreviewDocument(result));
    setPreviewRunKey((key) => key + 1);
    addLog("Running project…");
  }

  const activeFile = files.find((f) => f.id === activeFileId) ?? null;
  const tree = buildFileTree(files);

  const activeDiffPath =
    activeFileId && isDiffTab(activeFileId) ? diffTabPath(activeFileId) : null;
  const activeDiffCurrentFile = activeDiffPath
    ? files.find((f) => f.path === activeDiffPath)
    : undefined;
  const activeDiffVersionFile = activeDiffPath
    ? latestVersion?.files.find((f) => f.path === activeDiffPath)
    : undefined;
  const activeDiffName =
    activeDiffCurrentFile?.name ??
    activeDiffVersionFile?.name ??
    activeDiffPath ??
    "";
  const activeDiffOriginal = activeDiffVersionFile?.content ?? "";
  const activeDiffModified = activeDiffCurrentFile?.content ?? "";

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileSelected}
      />
      {isUpdating && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-lg bg-black/50">
          <LoadingOverlay compact label="Updating project…" labelClassName="text-sm font-medium text-white" />
        </div>
      )}
      {dialog?.kind === "prompt" && (
        <PromptDialog
          open
          title={dialog.title}
          label={dialog.label}
          placeholder={dialog.placeholder}
          defaultValue={dialog.defaultValue}
          confirmLabel={dialog.confirmLabel}
          onSubmit={dialog.onSubmit}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "confirm" && (
        <ConfirmDialog
          open
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "error" && (
        <ErrorDialog
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog(null)}
        />
      )}
      {blocker.state === "blocked" && (
        <ConfirmDialog
          open
          title="Unpublished changes"
          message={
            isFirstVersion
              ? "This project has never been updated. Leaving now will discard it completely — click Update Project first if you want to keep it."
              : "You have changes since the last Update. Leaving now will discard them and restore the files to that last update — click Update Project first if you want to keep them."
          }
          confirmLabel="Leave"
          cancelLabel="Stay"
          onConfirm={() => {
            discardUnpublishedChanges();
            blocker.proceed();
          }}
          onCancel={() => blocker.reset()}
        />
      )}

      {showOwnerDetails && ownerDetail && (
        <OwnerDetailsDialog
          rows={ownerDetailRows}
          onClose={() => setShowOwnerDetails(false)}
        />
      )}

      {imagePreview && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70 px-4"
          onClick={() => setImagePreview(null)}
        >
          <img
            src={imagePreview.content}
            alt={imagePreview.name}
            className="max-h-[75vh] max-w-full rounded-lg"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              copyPathToClipboard(imagePreview.path);
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white transition-colors hover:bg-black/80"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {imagePreview.path}
          </button>
        </div>
      )}

      {quickOpenVisible && activeFileId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24"
          onClick={() => setQuickOpenVisible(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <QuickOpenList
              files={files}
              query={quickOpenQuery}
              onQueryChange={setQuickOpenQuery}
              onSelect={(file) => {
                openFile(file);
                setQuickOpenVisible(false);
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      <MobileTabBar
        sidebarView={sidebarView}
        mobilePanel={mobilePanel}
        changedFilesCount={changedFiles.length}
        onSelectSidebarView={handleSelectSidebarView}
        onSelectEditor={() => setMobilePanel("editor")}
        onSelectPreview={selectMobilePreview}
        saveMode={saveMode}
        onSaveModeChange={handleSaveModeChange}
        editorPrefs={editorPrefs}
        onEditorPrefsChange={handleEditorPrefsChange}
        panelResizeMode={panelResizeMode}
        onPanelResizeModeChange={handlePanelResizeModeChange}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ActivityBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapsed={() => setSidebarCollapsed((prev) => !prev)}
          sidebarView={sidebarView}
          onSelectView={handleSelectSidebarView}
          changedFilesCount={changedFiles.length}
          saveMode={saveMode}
          onSaveModeChange={handleSaveModeChange}
          editorPrefs={editorPrefs}
          onEditorPrefsChange={handleEditorPrefsChange}
          panelResizeMode={panelResizeMode}
          onPanelResizeModeChange={handlePanelResizeModeChange}
        />

        {!sidebarCollapsed && (
          <Sidebar
            sidebarView={sidebarView}
            width={panelSizes.sidebarWidth}
            mobileHidden={mobilePanel !== "sidebar"}
            projectName={currentProject.name}
            tree={tree}
            filesTreeExpanded={filesTreeExpanded}
            onToggleFilesTreeExpanded={() => setFilesTreeExpanded((prev) => !prev)}
            expandedPaths={expandedPaths}
            activeFileId={activeFileId}
            onToggleFolder={toggleFolder}
            onOpenFile={openFile}
            onNewFile={(parentPath) => requestNewEntry("file", parentPath)}
            onNewFolder={(parentPath) => requestNewEntry("folder", parentPath)}
            onUploadImage={() => imageInputRef.current?.click()}
            onRefreshExplorer={() => listFiles(currentProject.id).then(setFiles)}
            onCollapseFolders={() => setExpandedPaths(new Set())}
            onRename={requestRename}
            onDelete={requestDelete}
            onCopyPath={(node) => copyPathToClipboard(node.path)}
            files={files}
            codeSearchQuery={codeSearchQuery}
            onCodeSearchQueryChange={setCodeSearchQuery}
            onJumpToLine={jumpToLine}
            changedFiles={changedFiles}
            changesExpanded={changesExpanded}
            onToggleChangesExpanded={() => setChangesExpanded((prev) => !prev)}
            hasPreviousVersion={!isFirstVersion}
            onOpenDiff={openDiff}
            onDiscardChange={handleDiscardChange}
            onDiscardAll={handleDiscardAllChanges}
          />
        )}

        {!sidebarCollapsed ? (
          <ResizeHandle
            orientation="vertical"
            disabled={panelResizeMode !== "manual"}
            onResize={resizeSidebar}
            onResizeEnd={persistPanelSizes}
            className="hidden lg:flex"
          />
        ) : (
          <div className="hidden w-3 shrink-0 lg:block" />
        )}

        <EditorPanel
          mobileHidden={mobilePanel !== "editor"}
          openTabs={openTabs}
          files={files}
          activeFileId={activeFileId}
          drafts={drafts}
          onSelectTab={setActiveFileId}
          onCloseTab={closeTab}
          editorMaximized={editorMaximized}
          onToggleMaximize={() => setEditorMaximized((prev) => !prev)}
          activeDiffPath={activeDiffPath}
          activeDiffName={activeDiffName}
          activeDiffOriginal={activeDiffOriginal}
          activeDiffModified={activeDiffModified}
          activeFile={activeFile}
          theme={theme}
          editorPrefs={editorPrefs}
          onDraftChange={handleDraftChange}
          onEditorMount={handleEditorMount}
          onDiffEditorMount={handleDiffEditorMount}
          onPrevDiffChange={() => goToDiffChange(-1)}
          onNextDiffChange={() => goToDiffChange(1)}
          quickOpenQuery={quickOpenQuery}
          onQuickOpenQueryChange={setQuickOpenQuery}
          onOpenFile={openFile}
        />

        <ResizeHandle
          orientation="vertical"
          disabled={previewCollapsed || panelResizeMode !== "manual"}
          onResize={resizePreview}
          onResizeEnd={persistPanelSizes}
          className="hidden lg:flex"
        />

        <PreviewPanel
          mobileHidden={mobilePanel !== "preview"}
          collapsed={previewCollapsed}
          onExpand={() => setPreviewCollapsed(false)}
          onCollapse={() => setPreviewCollapsed(true)}
          width={panelSizes.previewWidth}
          onRun={handleRun}
          previewError={previewError}
          onDismissError={() => setPreviewError(null)}
          previewDoc={previewDoc}
          previewRunKey={previewRunKey}
          lastSynced={lastSynced}
        />
      </div>

      <ResizeHandle
        orientation="horizontal"
        disabled={bottomPanelCollapsed || panelResizeMode !== "manual"}
        onResize={resizeBottomPanel}
        onResizeEnd={persistPanelSizes}
      />

      <LogTerminalPanel
        collapsed={bottomPanelCollapsed}
        onToggleCollapsed={() => setBottomPanelCollapsed((prev) => !prev)}
        height={panelSizes.bottomPanelHeight}
        activeTab={bottomPanelTab}
        onTabChange={setBottomPanelTab}
        log={log}
        consoleOutput={consoleOutput}
        terminalLines={terminalLines}
        terminalPrompt={terminalPrompt}
        terminalInput={terminalInput}
        onTerminalInputChange={setTerminalInput}
        onTerminalSubmit={handleTerminalSubmit}
      />
    </div>
  );
}

export default Playground;
