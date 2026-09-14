import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import type { Tool } from './Tool.js'
import { resolveSandboxedPath } from './sandbox.js'

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist'])
const MAX_RESULTS = 50

async function walk(dir: string, root: string, query: string, matches: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (matches.length >= MAX_RESULTS) return
    if (IGNORED_DIRS.has(entry.name)) continue

    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, root, query, matches)
      continue
    }
    if (!entry.isFile()) continue

    let content: string
    try {
      content = await readFile(fullPath, 'utf8')
    } catch {
      continue // Binary or unreadable — skip it.
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length && matches.length < MAX_RESULTS; i++) {
      if (lines[i].toLowerCase().includes(query.toLowerCase())) {
        matches.push(`${relative(root, fullPath)}:${i + 1}: ${lines[i].trim()}`)
      }
    }
  }
}

// Phase 6: the same read/list/write/search shapes as FileSystemTools.ts and
// SearchTool.ts, but rooted at `repoRoot` (the real project checkout)
// instead of the disposable `workspaceRoot` sandbox — so Jarvis can actually
// inspect and edit its own source, not just move git branches around.
// `repo_write_file` is medium risk (auto-approved) per an explicit choice:
// the Phase-4 agent loop needs to write-then-rerun-tests within one turn,
// and changes stay reviewable via repo_diff/repo_status plus the always
// high-risk repo_reset for rollback.
export function createRepoFileTools(repoRoot: string): Tool[] {
  const readFileTool: Tool<{ path: string }, { content: string }> = {
    name: 'repo_read_file',
    description: 'Read the contents of a text file in the real project repository.',
    inputSchema: { path: 'string' },
    risk: 'low',
    async execute({ path }) {
      const target = resolveSandboxedPath(repoRoot, path)
      const content = await readFile(target, 'utf8')
      return { content }
    },
  }

  const listDirectoryTool: Tool<{ path?: string }, { entries: string[] }> = {
    name: 'repo_list_directory',
    description: 'List the files and folders inside a directory in the real project repository. Omit path for the repo root.',
    inputSchema: { path: 'string' },
    risk: 'low',
    async execute({ path }) {
      const target = resolveSandboxedPath(repoRoot, path ?? '.')
      const entries = await readdir(target)
      return { entries }
    },
  }

  const writeFileTool: Tool<{ path: string; content: string }, { bytesWritten: number }> = {
    name: 'repo_write_file',
    description: 'Create or overwrite a text file in the real project repository, creating parent folders as needed.',
    inputSchema: { path: 'string', content: 'string' },
    risk: 'medium',
    async execute({ path, content }) {
      const target = resolveSandboxedPath(repoRoot, path)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, content, 'utf8')
      return { bytesWritten: Buffer.byteLength(content, 'utf8') }
    },
  }

  const searchCodeTool: Tool<{ query: string }, { matches: string[] }> = {
    name: 'repo_search_code',
    description: 'Search for a text string across every file in the real project repository. Returns matching lines with file:line references.',
    inputSchema: { query: 'string' },
    risk: 'low',
    async execute({ query }) {
      const root = resolveSandboxedPath(repoRoot, '.')
      const matches: string[] = []
      await walk(root, root, query, matches)
      return { matches }
    },
  }

  return [readFileTool, listDirectoryTool, writeFileTool, searchCodeTool]
}
