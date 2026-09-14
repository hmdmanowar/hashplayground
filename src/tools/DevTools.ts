import type { Tool } from './Tool.js'
import { runProcess, type CommandResult } from './execUtil.js'

// Builds and test suites run far longer and log far more than a typical
// terminal command, hence the wider budget than TerminalTool.ts's 15s/4000
// chars.
const TIMEOUT_MS = 120_000
const MAX_OUTPUT_CHARS = 8000

// Phase 6: fixed, literal npm scripts — never built from model-supplied
// input — so unlike run_command (TerminalTool.ts) there is no shell
// injection surface to worry about even with shell:true.
export function createDevTools(repoRoot: string): Tool[] {
  const runTestsTool: Tool<Record<string, never>, CommandResult> = {
    name: 'repo_run_tests',
    description: 'Run the real project\'s test suite (npm test).',
    inputSchema: {},
    risk: 'low',
    execute: () => runProcess('npm test', [], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS, true),
  }

  const runBuildTool: Tool<Record<string, never>, CommandResult> = {
    name: 'repo_run_build',
    description: 'Run the real project\'s build (npm run build).',
    inputSchema: {},
    risk: 'medium',
    execute: () => runProcess('npm run build', [], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS, true),
  }

  return [runTestsTool, runBuildTool]
}
