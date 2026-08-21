import { ClockIcon, TerminalIcon, ChevronDownIcon } from "../../../components/Icons/Icons";

interface LogTerminalPanelProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  height: number;
  activeTab: "log" | "terminal";
  onTabChange: (tab: "log" | "terminal") => void;
  log: string[];
  terminalLines: string[];
  terminalPrompt: string;
  terminalInput: string;
  onTerminalInputChange: (value: string) => void;
  onTerminalSubmit: () => void;
}

// The bottom panel — Log and Terminal tabs, collapsible.
function LogTerminalPanel({
  collapsed,
  onToggleCollapsed,
  height,
  activeTab,
  onTabChange,
  log,
  terminalLines,
  terminalPrompt,
  terminalInput,
  onTerminalInputChange,
  onTerminalSubmit,
}: LogTerminalPanelProps) {
  return (
    <div
      style={collapsed ? undefined : { height }}
      className="flex flex-col overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)]"
    >
      <div className="flex items-center gap-1 border-b border-[var(--border-panel)] px-1 py-1">
        <button
          type="button"
          onClick={() => onTabChange("log")}
          className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
            activeTab === "log"
              ? "bg-[var(--hover-overlay)] text-[var(--text-app)]"
              : "text-[var(--color-muted)] hover:text-[var(--text-app)]"
          }`}
        >
          <ClockIcon className="h-3.5 w-3.5" />
          Log
        </button>
        <button
          type="button"
          onClick={() => onTabChange("terminal")}
          className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
            activeTab === "terminal"
              ? "bg-[var(--hover-overlay)] text-[var(--text-app)]"
              : "text-[var(--color-muted)] hover:text-[var(--text-app)]"
          }`}
        >
          <TerminalIcon className="h-3.5 w-3.5" />
          Terminal
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-primary)]"
        >
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
            {activeTab === "log" ? (
              <div className="flex flex-col gap-0.5">
                {log.map((entry, index) => (
                  <p key={index}>{entry}</p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {terminalLines.map((line, index) => (
                  <p
                    key={index}
                    className={line.startsWith(terminalPrompt) ? "text-[var(--text-app)]" : ""}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {activeTab === "terminal" && (
            <div className="flex items-center gap-1.5 border-t border-[var(--border-panel)] px-3 py-1.5 font-mono text-xs">
              <span className="whitespace-pre text-[var(--color-accent)]">{terminalPrompt}</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(event) => onTerminalInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onTerminalSubmit();
                }}
                placeholder="Type a command…"
                className="flex-1 bg-transparent text-[var(--text-app)] outline-none placeholder:text-[var(--color-muted)]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LogTerminalPanel;
