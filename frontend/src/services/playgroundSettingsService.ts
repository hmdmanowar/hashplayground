export type SaveMode = 'auto' | 'manual'

const STORAGE_KEY = 'hash_playground_save_mode'

function readAll(): Record<string, SaveMode> {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Record<string, SaveMode>) : {}
}

export function getSaveMode(projectId: string): SaveMode {
  return readAll()[projectId] ?? 'auto'
}

export function setSaveMode(projectId: string, mode: SaveMode): void {
  const all = readAll()
  all[projectId] = mode
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export interface EditorPrefs {
  minimap: boolean
  wordWrap: boolean
  fontSize: number
}

const EDITOR_PREFS_KEY = 'hash_playground_editor_prefs'
const DEFAULT_EDITOR_PREFS: EditorPrefs = { minimap: true, wordWrap: false, fontSize: 13 }
export const MIN_FONT_SIZE = 10
export const MAX_FONT_SIZE = 24

// Global (not per-project) — this mirrors how VS Code's own editor
// preferences are user-level settings, not per-workspace ones.
export function getEditorPrefs(): EditorPrefs {
  const raw = localStorage.getItem(EDITOR_PREFS_KEY)
  if (!raw) return DEFAULT_EDITOR_PREFS
  try {
    return { ...DEFAULT_EDITOR_PREFS, ...(JSON.parse(raw) as Partial<EditorPrefs>) }
  } catch {
    return DEFAULT_EDITOR_PREFS
  }
}

export function setEditorPrefs(prefs: EditorPrefs): void {
  const clamped = { ...prefs, fontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prefs.fontSize)) }
  localStorage.setItem(EDITOR_PREFS_KEY, JSON.stringify(clamped))
}

export type PanelResizeMode = 'manual' | 'fixed'

const PANEL_RESIZE_MODE_KEY = 'hash_playground_panel_resize_mode'

// Global, same reasoning as editor prefs above.
export function getPanelResizeMode(): PanelResizeMode {
  return localStorage.getItem(PANEL_RESIZE_MODE_KEY) === 'fixed' ? 'fixed' : 'manual'
}

export function setPanelResizeMode(mode: PanelResizeMode): void {
  localStorage.setItem(PANEL_RESIZE_MODE_KEY, mode)
}

export interface PanelSizes {
  sidebarWidth: number
  previewWidth: number
  bottomPanelHeight: number
}

const PANEL_SIZES_KEY = 'hash_playground_panel_sizes'
export const DEFAULT_PANEL_SIZES: PanelSizes = { sidebarWidth: 220, previewWidth: 360, bottomPanelHeight: 160 }

export function getPanelSizes(): PanelSizes {
  const raw = localStorage.getItem(PANEL_SIZES_KEY)
  if (!raw) return DEFAULT_PANEL_SIZES
  try {
    return { ...DEFAULT_PANEL_SIZES, ...(JSON.parse(raw) as Partial<PanelSizes>) }
  } catch {
    return DEFAULT_PANEL_SIZES
  }
}

export function setPanelSizes(sizes: PanelSizes): void {
  localStorage.setItem(PANEL_SIZES_KEY, JSON.stringify(sizes))
}
