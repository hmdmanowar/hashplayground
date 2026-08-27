import {
  MenuUnfoldIcon,
  MenuFoldIcon,
  PlayIcon,
  AlertTriangleIcon,
  XIcon,
  MonitorIcon,
} from "../../../components/Icons/Icons";

interface PreviewPanelProps {
  mobileHidden: boolean;
  collapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  width: number;
  onRun: () => void;
  previewError: { kind: "compile" | "runtime"; message: string } | null;
  onDismissError: () => void;
  previewDoc: string | null;
  previewRunKey: number;
  lastSynced: { name: string; time: Date } | null;
}

// The live preview panel — collapsible, runs the compiled project in a
// sandboxed iframe and surfaces compile/runtime errors inline.
function PreviewPanel({
  mobileHidden,
  collapsed,
  onExpand,
  onCollapse,
  width,
  onRun,
  previewError,
  onDismissError,
  previewDoc,
  previewRunKey,
  lastSynced,
}: PreviewPanelProps) {
  return (
    <div
      style={{ "--panel-width": `${collapsed ? 40 : width}px` } as React.CSSProperties}
      className={`${mobileHidden ? "hidden" : "flex"} w-full flex-col overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] lg:flex lg:w-[var(--panel-width)] lg:shrink-0 ${
        collapsed ? "items-center p-1.5" : ""
      }`}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand preview panel"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
        >
          <MenuUnfoldIcon className="h-4 w-4" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border-panel)] px-3 py-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Preview
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRun}
                aria-label="Run"
                title="Run"
                className="flex cursor-pointer items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/25"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Run
              </button>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse preview panel"
                className="hidden h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)] lg:flex"
              >
                <MenuFoldIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            {previewError && (
              <div
                className="absolute inset-0 z-30 flex flex-col gap-2 overflow-y-auto p-4"
                style={{
                  backgroundColor: "rgba(30, 8, 8, 0.97)",
                  color: "#fecaca",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-semibold">
                      {previewError.kind === "compile"
                        ? "Compile Error"
                        : "Runtime Error"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDismissError}
                    aria-label="Dismiss error"
                    className="cursor-pointer text-[#fecaca] hover:text-white"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                  {previewError.message}
                </pre>
              </div>
            )}

            {previewDoc ? (
              <iframe
                key={previewRunKey}
                srcDoc={previewDoc}
                sandbox="allow-scripts"
                title="Live preview"
                className="h-full w-full rounded-b-lg border-0 bg-white"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
                  <MonitorIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium">Live preview</p>
                {lastSynced && (
                  <p className="text-xs text-[var(--color-accent)]">
                    Synced {lastSynced.name} at{" "}
                    {lastSynced.time.toLocaleTimeString()}
                  </p>
                )}
                <p className="max-w-[220px] text-xs text-[var(--color-muted)]">
                  Click Run to compile and preview your project.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PreviewPanel;
