import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Tool } from './Tool.js'
import { createFileSystemTools } from './FileSystemTools.js'
import { createSearchTool } from './SearchTool.js'
import { createTerminalTool } from './TerminalTool.js'
import { createRepoFileTools } from './RepoTools.js'
import { createGitTools } from './GitTools.js'
import { createDevTools } from './DevTools.js'

// Every concrete tool, keyed by name, plus the text block that gets
// injected into the system prompt so the model knows what's available and
// how to ask for it. Adding a new tool later means writing one factory
// function and listing it here — nothing else changes.
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>()

  constructor(workspaceRoot: string, repoRoot: string) {
    // write_file creates its own parent dirs lazily, but read_file/
    // list_directory/search_code/run_command all assume the root itself
    // already exists — ensure that up front rather than failing on
    // whichever tool happens to run first.
    mkdirSync(workspaceRoot, { recursive: true })

    // Phase 6: repoRoot is the real project checkout, not a sandbox we
    // create — fail fast with a clear error if it isn't actually a git repo
    // rather than letting repo_* tools fail confusingly one call at a time.
    if (!existsSync(join(repoRoot, '.git'))) {
      throw new Error(`repoRoot "${repoRoot}" is not a git repository (no .git directory found)`)
    }

    const allTools: Tool[] = [
      ...createFileSystemTools(workspaceRoot),
      createSearchTool(workspaceRoot),
      createTerminalTool(workspaceRoot),
      ...createRepoFileTools(repoRoot),
      ...createGitTools(repoRoot),
      ...createDevTools(repoRoot),
    ]
    for (const tool of allTools) this.tools.set(tool.name, tool)
  }

  // A second construction path for consumers that bring their own tools
  // entirely (e.g. a host application scoping Jarvis to its own data model
  // instead of a real filesystem) and want none of the built-in fs/git/shell
  // tools or the workspaceRoot/repoRoot wiring above. Bypasses the
  // constructor via Object.create so no mkdirSync/git-repo check ever runs.
  static fromTools(tools: Tool[]): ToolRegistry {
    const registry: ToolRegistry = Object.create(ToolRegistry.prototype)
    ;(registry as unknown as { tools: Map<string, Tool> }).tools = new Map(tools.map((tool) => [tool.name, tool]))
    return registry
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  list(): Tool[] {
    return [...this.tools.values()]
  }

  describeForPrompt(): string {
    return this.list()
      .map((tool) => `- ${tool.name}(${Object.keys(tool.inputSchema).join(', ')}): ${tool.description}`)
      .join('\n')
  }
}
