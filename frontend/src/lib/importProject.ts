import JSZip from 'jszip'

export interface ImportedFile {
  path: string
  name: string
  content: string
}

export interface ImportResult {
  files: ImportedFile[]
  skippedCount: number
}

const EXCLUDED_PREFIXES = ['node_modules/', '.git/', 'dist/', 'build/', '.vscode/']

const EXCLUDED_ROOT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'vite.config.ts',
  'vite.config.js',
  'tsconfig.json',
  'tsconfig.node.json',
  'tsconfig.app.json',
  'readme.md',
  '.gitignore',
  '.ds_store',
])

// A root index.html is ambiguous: it's the real page for an HTML/CSS/JS
// project, but it's also generated Vite scaffold boilerplate when re-importing
// an exported React project (see getScaffoldFiles) — only the latter should
// be dropped, so this distinguishes them by content instead of excluding
// every root index.html outright.
const VITE_SCAFFOLD_INDEX_HTML_SIGNATURE = /src=["']\/src\/main\.(tsx?|jsx?)["']/i

// This playground only compiles source text, not binary assets — importing
// anything else would just clutter the Explorer with garbled content.
const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html', '.md', '.txt', '.svg']

const MAX_FILES = 500

function isExcludedPath(path: string): boolean {
  const lower = path.toLowerCase()
  if (EXCLUDED_PREFIXES.some((prefix) => lower.startsWith(prefix))) return true
  if (!path.includes('/') && EXCLUDED_ROOT_FILES.has(lower)) return true
  return false
}

function hasTextExtension(path: string): boolean {
  const lower = path.toLowerCase()
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

// If every candidate path is nested under the same single top-level folder
// (common when zipping a project directory, or downloading a GitHub zip),
// strip it so `src/main.tsx` lands at the root the Playground expects.
function stripCommonRootFolder(paths: string[]): string | null {
  if (paths.length === 0 || !paths.every((path) => path.includes('/'))) return null
  const firstSegments = paths.map((path) => path.slice(0, path.indexOf('/')))
  return firstSegments.every((segment) => segment === firstSegments[0]) ? firstSegments[0] : null
}

export async function readProjectZip(file: File, onProgress: (percent: number) => void): Promise<ImportResult> {
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read the file'))
    reader.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 30))
      }
    }
    reader.readAsArrayBuffer(file)
  })

  onProgress(32)
  const zip = await JSZip.loadAsync(buffer)
  onProgress(35)

  const allFileEntries = Object.values(zip.files).filter((entry) => !entry.dir)

  // Strip any single wrapping folder (GitHub-zip-style) BEFORE running the exclusion
  // checks below — otherwise `my-project-main/node_modules/...` never matches the
  // `node_modules/` prefix check, since it doesn't start with it until after stripping.
  const commonRoot = stripCommonRootFolder(allFileEntries.map((entry) => entry.name))
  const stripRoot = (name: string) => (commonRoot ? name.slice(commonRoot.length + 1) : name)

  const candidates = allFileEntries
    .map((entry) => ({ entry, path: stripRoot(entry.name) }))
    .filter(({ path }) => !isExcludedPath(path) && hasTextExtension(path))
  const skippedCount = allFileEntries.length - candidates.length

  if (candidates.length === 0) {
    throw new Error('No importable source files found in this zip.')
  }
  if (candidates.length > MAX_FILES) {
    throw new Error(`This zip has too many files (${candidates.length}). Only project source files are supported.`)
  }

  const files: ImportedFile[] = []
  let scaffoldIndexHtmlSkipped = 0
  for (let i = 0; i < candidates.length; i++) {
    const { entry, path } = candidates[i]
    const content = await entry.async('string')
    if (path === 'index.html' && VITE_SCAFFOLD_INDEX_HTML_SIGNATURE.test(content)) {
      scaffoldIndexHtmlSkipped++
    } else {
      files.push({ path, name: path.split('/').pop() ?? path, content })
    }
    onProgress(35 + Math.round(((i + 1) / candidates.length) * 55))
  }

  if (files.length === 0) {
    throw new Error('No importable source files found in this zip.')
  }

  return { files, skippedCount: skippedCount + scaffoldIndexHtmlSkipped }
}
