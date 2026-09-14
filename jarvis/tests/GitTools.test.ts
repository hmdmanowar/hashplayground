import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGitTools } from '../src/tools/GitTools.js'
import { SandboxViolationError } from '../src/tools/sandbox.js'

function initRepo(repoRoot: string): void {
  execSync('git init -b main', { cwd: repoRoot })
  execSync('git config user.email "test@jarvis.local"', { cwd: repoRoot })
  execSync('git config user.name "Jarvis Test"', { cwd: repoRoot })
  writeFileSync(join(repoRoot, 'README.md'), 'initial\n')
  execSync('git add -A', { cwd: repoRoot })
  execSync('git commit -m "init"', { cwd: repoRoot })
}

describe('GitTools', () => {
  let repoRoot: string
  let tools: ReturnType<typeof createGitTools>

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'jarvis-git-test-'))
    initRepo(repoRoot)
    tools = createGitTools(repoRoot)
  })

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true })
  })

  it('repo_status reports the current branch', async () => {
    const [status] = tools
    const result = await status.execute({})
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('main')
  })

  it('repo_log lists the initial commit', async () => {
    const [, log] = tools
    const result = await log.execute({})
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('init')
  })

  it('repo_diff shows uncommitted changes, and repo_commit clears them into a checkpoint', async () => {
    const [, , diff, , , commit] = tools
    writeFileSync(join(repoRoot, 'README.md'), 'changed\n')

    const beforeCommit = await diff.execute({})
    expect(beforeCommit.stdout.length).toBeGreaterThan(0)

    const commitResult = await commit.execute({ message: 'checkpoint' })
    expect(commitResult.committed).toBe(true)
    expect(commitResult.commitHash).toMatch(/^[0-9a-f]{40}$/)

    const afterCommit = await diff.execute({})
    expect(afterCommit.stdout.trim()).toBe('')
  })

  it('repo_create_branch switches to a new branch, repo_checkout_branch switches back', async () => {
    const [status, , , createBranch, checkoutBranch] = tools

    const created = await createBranch.execute({ name: 'feature/x' })
    expect(created.exitCode).toBe(0)
    expect((await status.execute({})).stdout).toContain('feature/x')

    const backToMain = await checkoutBranch.execute({ name: 'main' })
    expect(backToMain.exitCode).toBe(0)
    expect((await status.execute({})).stdout).toContain('main')
  })

  it('repo_reset discards a commit back to an earlier ref', async () => {
    const [, log, , , , commit, reset] = tools
    const initialHash = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()

    writeFileSync(join(repoRoot, 'throwaway.txt'), 'x')
    await commit.execute({ message: 'throwaway commit' })
    expect((await log.execute({})).stdout).toContain('throwaway commit')

    const resetResult = await reset.execute({ ref: initialHash })
    expect(resetResult.exitCode).toBe(0)
    expect((await log.execute({})).stdout).not.toContain('throwaway commit')
  })

  it('rejects a branch name that looks like a flag', () => {
    const [, , , createBranch] = tools
    expect(() => createBranch.execute({ name: '-x' })).toThrow()
  })

  it('rejects a ref that looks like a flag for repo_reset', () => {
    const [, , , , , , reset] = tools
    expect(() => reset.execute({ ref: '--hard' })).toThrow()
  })

  it('rejects a repo_diff path that escapes the repo root', () => {
    const [, , diff] = tools
    expect(() => diff.execute({ path: '../outside.txt' })).toThrow(SandboxViolationError)
  })

  it('declares the expected risk levels', () => {
    const [status, log, diff, createBranch, checkoutBranch, commit, reset] = tools
    expect(status.risk).toBe('low')
    expect(log.risk).toBe('low')
    expect(diff.risk).toBe('low')
    expect(createBranch.risk).toBe('medium')
    expect(checkoutBranch.risk).toBe('medium')
    expect(commit.risk).toBe('medium')
    expect(reset.risk).toBe('high')
  })
})
