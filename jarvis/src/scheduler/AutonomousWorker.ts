import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Jarvis } from '../core/Jarvis.js'
import { runProcess } from '../tools/execUtil.js'

const GIT_TIMEOUT_MS = 30_000
const CHECK_TIMEOUT_MS = 180_000 // test/build can legitimately take a while
const MAX_OUTPUT_CHARS = 8000

const PROTECTED_BRANCHES = new Set(['main', 'master'])

// What Jarvis is told at the start of every unattended exploratory cycle
// (no specific task queued). Deliberately narrow: the model's job is to
// find and make ONE safe, verifiable improvement using its repo_* tools —
// everything else (branch hygiene, committing, testing, pushing) is handled
// deterministically by this file, not left to the model to remember
// correctly every cycle.
export const CYCLE_PROMPT = `You are running autonomously and unattended on your own codebase (this repo), on a dedicated branch that has already been checked out for you — nothing you do here touches main. Look for ONE concrete, safe, well-scoped improvement (a failing test, a clear bug, dead code, a rough edge you notice via repo_search_code/repo_read_file) and make it using your repo_* tools. Prefer small, verifiable changes over large speculative ones — if you're not confident something is safe and correct, do nothing. Never use repo_reset. When you're done (or if there's nothing worth doing this cycle), reply with ONE short sentence summarizing what you did or why you're skipping — that sentence becomes the commit message, so make it read like one.`

// Used instead of CYCLE_PROMPT when the control plane (see below) has a
// specific task queued for this cycle — one cycle per task, same bounded
// turn as the exploratory prompt.
function taskCyclePrompt(description: string): string {
  return `You are running autonomously and unattended on your own codebase (this repo), on a dedicated branch that has already been checked out for you — nothing you do here touches main. A user has queued this specific task for you to work on: "${description}". Complete it using your repo_* tools, within this one turn. Never use repo_reset. Reply with ONE short sentence summarizing what you did (or why you couldn't complete it) — that sentence becomes the commit message, so make it read like one.`
}

export interface CycleResult {
  cycleNumber: number
  timestamp: string
  summary: string
  filesChanged: string[]
  testResult: 'passed' | 'failed' | 'skipped'
  outcome: 'pushed' | 'reverted' | 'no-changes' | 'error'
  commitHash?: string
  detail?: string
  taskId?: string
}

// Lets an admin panel (or anything else) steer this worker without the
// process itself being reachable from outside — the worker polls for
// desired state instead of being started/stopped directly. See Hash
// Playground's backend/src/modules/autonomousWorker for the other end of
// this contract.
export interface ControlPlane {
  baseUrl: string
  token: string
}

export interface AutonomousWorkerOptions {
  jarvis: Jarvis
  repoRoot: string
  branch: string
  intervalMs: number
  reportPath: string
  // When repoRoot is a real repo but Jarvis should only ever touch one
  // subtree of it (e.g. Jarvis living inside a bigger monorepo), every git
  // operation this worker runs itself (status/revert/commit) is confined to
  // this subtree via a pathspec, and test/build commands run with this
  // subtree as their cwd instead of repoRoot — matching how ToolRegistry's
  // own repoScopePath confines the model's repo_* tools. Omit it and the
  // worker operates on the whole of repoRoot, same as before.
  repoScopePath?: string
  // Omit entirely for the original always-on, locally-reported behavior.
  controlPlane?: ControlPlane
  onCycleComplete?: (result: CycleResult) => void
  onCycleSkipped?: (reason: string) => void
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function git(repoRoot: string, args: string[]): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return runProcess('git', args, repoRoot, GIT_TIMEOUT_MS, MAX_OUTPUT_CHARS)
}

async function getCurrentBranch(repoRoot: string): Promise<string> {
  const result = await git(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])
  return result.stdout.trim()
}

// Creates the autonomy branch from whatever HEAD currently is if it doesn't
// exist yet, otherwise just switches to it — either way, every cycle starts
// on this branch and nowhere else.
async function ensureAutonomyBranch(repoRoot: string, branch: string): Promise<void> {
  const current = await getCurrentBranch(repoRoot)
  if (current === branch) return

  const exists = await git(repoRoot, ['rev-parse', '--verify', branch])
  if (exists.exitCode === 0) {
    await git(repoRoot, ['checkout', branch])
  } else {
    await git(repoRoot, ['checkout', '-b', branch])
  }
}

async function changedFiles(repoRoot: string, scopePath?: string): Promise<string[]> {
  const pathspec = scopePath ? ['--', scopePath] : []
  const status = await git(repoRoot, ['status', '--porcelain', ...pathspec])
  return status.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
}

// Discards every change the model's cycle made — tracked and untracked —
// so a cycle that fails verification leaves the branch exactly as it found
// it, never a half-broken state. Scoped to scopePath when set, so a dirty
// file elsewhere in a bigger repo (unrelated to this worker) is never
// touched by a revert.
async function revertWorkingTree(repoRoot: string, scopePath?: string): Promise<void> {
  const target = scopePath ?? '.'
  await git(repoRoot, ['checkout', '--', target])
  await git(repoRoot, ['clean', '-fd', '--', target])
}

// Runs with the scoped subtree (if any) as cwd, not repoRoot — so this
// invokes the subproject's own package.json scripts (e.g. jarvis/'s own
// `npm test`), not whatever (or nothing) the outer repo root defines.
async function runCheck(repoRoot: string, scopePath: string | undefined, command: string): Promise<boolean> {
  const cwd = scopePath ? join(repoRoot, scopePath) : repoRoot
  const result = await runProcess(command, [], cwd, CHECK_TIMEOUT_MS, MAX_OUTPUT_CHARS, true)
  return result.exitCode === 0
}

function commitMessageFrom(summary: string): string {
  const trimmed = summary.trim().split('\n')[0].slice(0, 200)
  return trimmed || `Autonomous cycle: ${new Date().toISOString()}`
}

async function commitAndPush(repoRoot: string, branch: string, summary: string, scopePath?: string): Promise<string> {
  // Defense in depth beyond ensureAutonomyBranch — never push anywhere but
  // the configured autonomy branch, and never main/master under any name.
  const current = await getCurrentBranch(repoRoot)
  if (current !== branch || PROTECTED_BRANCHES.has(current)) {
    throw new Error(`Refusing to push: expected to be on "${branch}", actually on "${current}".`)
  }

  const pathspec = scopePath ? ['--', scopePath] : []
  await git(repoRoot, ['add', '-A', ...pathspec])
  await git(repoRoot, ['commit', '-m', commitMessageFrom(summary), ...pathspec])
  const hash = await git(repoRoot, ['rev-parse', 'HEAD'])
  await git(repoRoot, ['push', '-u', 'origin', branch])
  return hash.stdout.trim()
}

interface PollResponse {
  enabled: boolean
  task: { id: string; description: string } | null
}

// Fails closed: a poll failure (control plane unreachable, misconfigured
// token, etc.) is treated the same as enabled:false — an autonomous worker
// that can't confirm the kill switch is off should not keep pushing
// changes, network blip or not.
async function pollControlPlane(controlPlane: ControlPlane): Promise<PollResponse> {
  try {
    const response = await fetch(`${controlPlane.baseUrl}/api/autonomous-worker/poll`, {
      headers: { 'x-worker-token': controlPlane.token },
    })
    if (!response.ok) throw new Error(`poll failed: ${response.status}`)
    return (await response.json()) as PollResponse
  } catch {
    return { enabled: false, task: null }
  }
}

// Best-effort — the local markdown report (appendReport) is always written
// regardless, so a control-plane outage never loses the record of what
// happened, just the admin panel's visibility into it until it's back.
async function reportToControlPlane(controlPlane: ControlPlane, result: CycleResult): Promise<void> {
  try {
    await fetch(`${controlPlane.baseUrl}/api/autonomous-worker/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-worker-token': controlPlane.token },
      body: JSON.stringify(result),
    })
  } catch {
    // Nothing more to do — see comment above.
  }
}

function appendReport(reportPath: string, result: CycleResult): void {
  mkdirSync(dirname(reportPath), { recursive: true })
  const lines = [
    `## Cycle ${result.cycleNumber} — ${result.timestamp}`,
    '',
    `**Outcome:** ${result.outcome}${result.commitHash ? ` (\`${result.commitHash.slice(0, 8)}\`)` : ''}`,
    `**Tests:** ${result.testResult}`,
    result.filesChanged.length > 0 ? `**Files changed:** ${result.filesChanged.join(', ')}` : '',
    '',
    result.summary,
    result.detail ? `\n> ${result.detail}` : '',
    '',
    '---',
    '',
  ].filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
  appendFileSync(reportPath, lines.join('\n') + '\n', 'utf8')
}

// Runs exactly one observe -> act -> evaluate -> (commit+push | revert)
// cycle and returns what happened. Exported separately from the loop below
// so it can be tested (and reasoned about) one cycle at a time. `task`
// (from the control plane's /poll) swaps in a task-specific prompt instead
// of the generic exploratory one; its id is carried onto the result so the
// caller can report completion back against that specific task.
export async function runCycle(
  options: AutonomousWorkerOptions,
  cycleNumber: number,
  task?: { id: string; description: string } | null,
): Promise<CycleResult> {
  const { jarvis, repoRoot, branch, repoScopePath } = options
  const timestamp = new Date().toISOString()
  const taskId = task?.id

  await ensureAutonomyBranch(repoRoot, branch)

  // Fresh short-term memory per cycle — long-term memory (if configured)
  // still carries across cycles, so Jarvis can recall past decisions
  // without every cycle's conversation growing unbounded.
  jarvis.reset()
  let summary = await jarvis.handleInput(task ? taskCyclePrompt(task.description) : CYCLE_PROMPT)

  let detail: string | undefined
  if (jarvis.hasPendingToolCall()) {
    const pending = jarvis.getPendingToolCall()
    // No human is present to /approve at 3am — anything landing here is by
    // definition high-risk (medium and below already auto-approve), so it's
    // always auto-denied, never queued.
    await jarvis.handleInput('/deny')
    detail = `Auto-denied a pending "${pending?.tool}" call (risk: ${pending?.risk}) — high-risk actions are never approved unattended.`
  }

  const files = await changedFiles(repoRoot, repoScopePath)
  if (files.length === 0) {
    return { cycleNumber, timestamp, summary, filesChanged: [], testResult: 'skipped', outcome: 'no-changes', detail, taskId }
  }

  const testsPassed = await runCheck(repoRoot, repoScopePath, 'npm test')
  const buildPassed = testsPassed && (await runCheck(repoRoot, repoScopePath, 'npm run build'))

  if (!testsPassed || !buildPassed) {
    await revertWorkingTree(repoRoot, repoScopePath)
    return {
      cycleNumber,
      timestamp,
      summary,
      filesChanged: files,
      testResult: 'failed',
      outcome: 'reverted',
      detail: detail ?? 'Changes were made but did not pass tests/build, so they were reverted.',
      taskId,
    }
  }

  const commitHash = await commitAndPush(repoRoot, branch, summary, repoScopePath)
  return { cycleNumber, timestamp, summary, filesChanged: files, testResult: 'passed', outcome: 'pushed', commitHash, detail, taskId }
}

// Runs cycles forever at `intervalMs` apart until SIGINT/SIGTERM, always
// letting the in-flight cycle finish before stopping. `branch` may never be
// main/master — that's a configuration error, refused up front rather than
// discovered mid-run.
export async function runAutonomousLoop(options: AutonomousWorkerOptions): Promise<void> {
  if (PROTECTED_BRANCHES.has(options.branch)) {
    throw new Error(`autonomyBranch cannot be "${options.branch}" — refusing to operate directly on a protected branch.`)
  }

  let running = true
  const stop = () => {
    running = false
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  let cycleNumber = 0
  try {
    while (running) {
      let task: { id: string; description: string } | null = null

      if (options.controlPlane) {
        const poll = await pollControlPlane(options.controlPlane)
        if (!poll.enabled) {
          options.onCycleSkipped?.('disabled from the control plane (or it was unreachable)')
          if (!running) break
          await sleep(options.intervalMs)
          continue
        }
        task = poll.task
      }

      cycleNumber += 1
      try {
        const result = await runCycle(options, cycleNumber, task)
        appendReport(options.reportPath, result)
        options.onCycleComplete?.(result)
        if (options.controlPlane) await reportToControlPlane(options.controlPlane, result)
      } catch (error) {
        const errorResult: CycleResult = {
          cycleNumber,
          timestamp: new Date().toISOString(),
          summary: 'Cycle failed with an error.',
          filesChanged: [],
          testResult: 'skipped',
          outcome: 'error',
          detail: error instanceof Error ? error.message : String(error),
          taskId: task?.id,
        }
        appendReport(options.reportPath, errorResult)
        if (options.controlPlane) await reportToControlPlane(options.controlPlane, errorResult)
      }
      if (!running) break
      await sleep(options.intervalMs)
    }
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
  }
}
