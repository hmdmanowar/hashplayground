import { useEffect, useRef, useState } from "react";
import {
  type SaveMode,
  type EditorPrefs,
  type PanelResizeMode,
} from "../../../services/playgroundSettingsService";
import { SettingsIcon, CheckCircleIcon } from "../../../components/Icons/Icons";
import ToggleSwitch from "./ToggleSwitch";

interface PlaygroundSettingsMenuProps {
  saveMode: SaveMode;
  onSaveModeChange: (mode: SaveMode) => void;
  editorPrefs: EditorPrefs;
  onEditorPrefsChange: (prefs: EditorPrefs) => void;
  panelResizeMode: PanelResizeMode;
  onPanelResizeModeChange: (mode: PanelResizeMode) => void;
  variant?: "header" | "activityBar";
}

function PlaygroundSettingsMenu({
  saveMode,
  onSaveModeChange,
  editorPrefs,
  onEditorPrefsChange,
  panelResizeMode,
  onPanelResizeModeChange,
  variant = "header",
}: PlaygroundSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Playground settings"
        title={variant === "activityBar" ? "Playground settings" : undefined}
        className={
          variant === "activityBar"
            ? "flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--text-app)]"
            : "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        }
      >
        <SettingsIcon className={variant === "activityBar" ? "h-5 w-5" : "h-4 w-4"} />
      </button>
      {open && (
        <div
          className={`absolute z-20 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1 shadow-lg ${
            variant === "activityBar" ? "bottom-full left-0 mb-2" : "top-full right-0 mt-2"
          }`}
        >
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Save mode
          </p>
          {[
            {
              value: "auto" as const,
              label: "Auto save",
              description: "Saves ~1s after you stop typing",
            },
            {
              value: "manual" as const,
              label: "Manual save",
              description: "Only saves on Ctrl+S / Cmd+S",
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSaveModeChange(option.value);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-start justify-between gap-2 rounded px-2 py-2 text-left text-sm transition-colors hover:bg-[var(--hover-overlay)]"
            >
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-[var(--color-muted)]">
                  {option.description}
                </span>
              </span>
              {saveMode === option.value && (
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              )}
            </button>
          ))}

          <p className="mt-1 border-t border-[var(--border-panel)] px-2 py-1.5 pt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Editor
          </p>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Minimap</span>
            <ToggleSwitch
              checked={editorPrefs.minimap}
              onChange={(checked) =>
                onEditorPrefsChange({ ...editorPrefs, minimap: checked })
              }
              label="Toggle minimap"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Word wrap</span>
            <ToggleSwitch
              checked={editorPrefs.wordWrap}
              onChange={(checked) =>
                onEditorPrefsChange({ ...editorPrefs, wordWrap: checked })
              }
              label="Toggle word wrap"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Font size</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease font size"
                onClick={() =>
                  onEditorPrefsChange({
                    ...editorPrefs,
                    fontSize: editorPrefs.fontSize - 1,
                  })
                }
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
              >
                −
              </button>
              <span className="w-6 text-center text-sm tabular-nums">
                {editorPrefs.fontSize}
              </span>
              <button
                type="button"
                aria-label="Increase font size"
                onClick={() =>
                  onEditorPrefsChange({
                    ...editorPrefs,
                    fontSize: editorPrefs.fontSize + 1,
                  })
                }
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
              >
                +
              </button>
            </div>
          </div>

          <p className="mt-1 border-t border-[var(--border-panel)] px-2 py-1.5 pt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Panel resizing
          </p>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Manual resizing</span>
            <ToggleSwitch
              checked={panelResizeMode === "manual"}
              onChange={(checked) => onPanelResizeModeChange(checked ? "manual" : "fixed")}
              label="Toggle manual panel resizing"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaygroundSettingsMenu;
