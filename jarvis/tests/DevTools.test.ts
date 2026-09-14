import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDevTools } from '../src/tools/DevTools.js'

// Uses a minimal throwaway package.json rather than this project's real
// build/test — keeps the test fast and independent of this repo's own
// build/test outcome.
function initProject(repoRoot: string, testExitCode: number, buildExitCode: number): void {
  const pkg = {
    name: 'throwaway',
    scripts: {
      test: `node -e "process.exit(${testExitCode})"`,
      build: `node -e "process.exit(${buildExitCode})"`,
    },
  }
  writeFileSync(join(repoRoot, 'package.json'), JSON.stringify(pkg))
}

describe('DevTools', () => {
  let repoRoot: string

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'jarvis-dev-test-'))
  })

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true })
  })

  // Spawning real npm processes is slow and can vary a lot under load
  // (especially alongside other test files' subprocesses), so these get a
  // longer per-test timeout than vitest's 5s default.
  it('repo_run_tests surfaces a passing exit code', async () => {
    initProject(repoRoot, 0, 0)
    const [runTests] = createDevTools(repoRoot)
    const result = await runTests.execute({})
    expect(result.exitCode).toBe(0)
  }, 30_000)

  it('repo_run_tests surfaces a failing exit code', async () => {
    initProject(repoRoot, 1, 0)
    const [runTests] = createDevTools(repoRoot)
    const result = await runTests.execute({})
    expect(result.exitCode).toBe(1)
  }, 30_000)

  it('repo_run_build surfaces its exit code', async () => {
    initProject(repoRoot, 0, 1)
    const [, runBuild] = createDevTools(repoRoot)
    const result = await runBuild.execute({})
    expect(result.exitCode).toBe(1)
  }, 30_000)

  it('declares the expected risk levels', () => {
    initProject(repoRoot, 0, 0)
    const [runTests, runBuild] = createDevTools(repoRoot)
    expect(runTests.risk).toBe('low')
    expect(runBuild.risk).toBe('medium')
  })
})
