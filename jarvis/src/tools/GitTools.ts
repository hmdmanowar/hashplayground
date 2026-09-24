import { join } from 'node:path'
import type { Tool } from './Tool.js'
import { resolveSandboxedPath } from './sandbox.js'
import { runProcess, type CommandResult } from './execUtil.js'

type CommitResult = CommandResult & { committed: boolean; commitHash?: string }

const TIMEOUT_MS = 15_000
const MAX_OUTPUT_CHARS = 4000

// Branch names: no leading '-' (so a value can never be mistaken for a git
// flag) and no whitespace/control characters. Refs (used by repo_reset) are
// the same idea but additionally allow '~' and '^' for relative refs like
// "HEAD~1".
const BRANCH_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/~^-]*$/

function assertSafe(value: string, pattern: RegExp, label: string): void {
  if (!pattern.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`)
  }
}

// Phase 6: git operations against the real project repository (`repoRoot`),
// used for branching/checkpointing/rolling back Jarvis's own changes. Every
// call spawns `git` with an argv array (never a shell string), so a branch
// name, commit message, or ref can never be reinterpreted as a flag or
// shell syntax — the only extra guard needed is rejecting values that look
// like a flag themselves (a leading '-'), which assertSafe does above.
//
// scopePath (optional) confines status/log/diff/commit to one subtree of a
// bigger repo via a trailing git pathspec — for when repoRoot is a real
// repo but only part of it should actually be touched (see
// scheduler/AutonomousWorker.ts). Branch/reset operations are left
// unscoped regardless — a branch or a hard reset isn't a subset of a repo,
// there's no meaningful way to confine those.
export function createGitTools(repoRoot: string, scopePath?: string): Tool[] {
  const scopedRoot = scopePath ? join(repoRoot, scopePath) : repoRoot
  const pathspec = scopePath ? ['--', scopePath] : []

  const statusTool: Tool<Record<string, never>, CommandResult> = {
    name: 'repo_status',
    description: 'Show the working tree status of the real project repository (branch, staged/unstaged/untracked changes).',
    inputSchema: {},
    risk: 'low',
    execute: () => runProcess('git', ['status', '--porcelain=v1', '-b', ...pathspec], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS),
  }

  const logTool: Tool<{ maxCount?: number }, CommandResult> = {
    name: 'repo_log',
    description: 'Show recent commit history of the real project repository. Optional maxCount (default 10).',
    inputSchema: { maxCount: 'number' },
    risk: 'low',
    execute: ({ maxCount }) =>
      runProcess('git', ['log', `-n${maxCount ?? 10}`, '--oneline', ...pathspec], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS),
  }

  const diffTool: Tool<{ path?: string }, CommandResult> = {
    name: 'repo_diff',
    description:
      'Show uncommitted changes to tracked files (staged and unstaged) in the real project repository, optionally scoped to one path. Like plain `git diff`, brand-new untracked files are not shown here — check repo_status for those.',
    inputSchema: { path: 'string' },
    risk: 'low',
    execute: ({ path }) => {
      const args = ['diff', 'HEAD']
      if (path) {
        resolveSandboxedPath(scopedRoot, path) // throws if it escapes the effective (possibly scoped) root
        args.push('--', scopePath ? join(scopePath, path) : path)
      } else if (scopePath) {
        args.push('--', scopePath)
      }
      return runProcess('git', args, repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
    },
  }

  const createBranchTool: Tool<{ name: string }, CommandResult> = {
    name: 'repo_create_branch',
    description: 'Create and switch to a new branch in the real project repository.',
    inputSchema: { name: 'string' },
    risk: 'medium',
    execute: ({ name }) => {
      assertSafe(name, BRANCH_NAME_PATTERN, 'branch name')
      return runProcess('git', ['checkout', '-b', name], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
    },
  }

  const checkoutBranchTool: Tool<{ name: string }, CommandResult> = {
    name: 'repo_checkout_branch',
    description: 'Switch to an existing branch in the real project repository.',
    inputSchema: { name: 'string' },
    risk: 'medium',
    execute: ({ name }) => {
      assertSafe(name, BRANCH_NAME_PATTERN, 'branch name')
      return runProcess('git', ['checkout', name], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
    },
  }

  const commitTool: Tool<{ message: string }, CommitResult> = {
    name: 'repo_commit',
    description: 'Stage all changes and create a checkpoint commit in the real project repository.',
    inputSchema: { message: 'string' },
    risk: 'medium',
    async execute({ message }) {
      await runProcess('git', ['add', '-A', ...pathspec], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
      const commitResult = await runProcess('git', ['commit', '-m', message, ...pathspec], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
      if (commitResult.exitCode !== 0) {
        return { committed: false, ...commitResult }
      }
      const hashResult = await runProcess('git', ['rev-parse', 'HEAD'], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
      return { committed: true, commitHash: hashResult.stdout.trim(), ...commitResult }
    },
  }

  const resetTool: Tool<{ ref: string }, CommandResult> = {
    name: 'repo_reset',
    description:
      'Hard-reset the real project repository to a given ref (e.g. a commit hash or "HEAD~1"), discarding all uncommitted changes and any commits after it. Destructive — always requires human approval.',
    inputSchema: { ref: 'string' },
    risk: 'high',
    execute: ({ ref }) => {
      assertSafe(ref, REF_PATTERN, 'ref')
      return runProcess('git', ['reset', '--hard', ref], repoRoot, TIMEOUT_MS, MAX_OUTPUT_CHARS)
    },
  }

  return [statusTool, logTool, diffTool, createBranchTool, checkoutBranchTool, commitTool, resetTool]
}
