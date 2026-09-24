import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Jarvis } from '../src/core/Jarvis.js'
import { ToolRegistry } from '../src/tools/registry.js'
import { PermissionEngine } from '../src/permissions/PermissionEngine.js'
import { runCycle, runAutonomousLoop, type AutonomousWorkerOptions } from '../src/scheduler/AutonomousWorker.js'
import type { AIModel, ModelRequest, ModelResponse } from '../src/models/AIModel.js'

// Steps through a fixed script of canned responses, one per generate() call
// — same pattern tests/Jarvis.test.ts uses to simulate a model that
// requests a tool then (once it sees the result) gives a final answer.
class ScriptedModel implements AIModel {
  private step = 0
  constructor(private readonly script: string[]) {}
  async generate(_request: ModelRequest): Promise<ModelResponse> {
    const content = this.script[Math.min(this.step, this.script.length - 1)]
    this.step += 1
    return { content }
  }
}

function fixtureTestScript(): string {
  return "process.exit(require('node:fs').existsSync('SHOULD_FAIL') ? 1 : 0)"
}

// A repo with real, controllable `npm test`/`npm run build` scripts (pass
// unless a marker file is present) and a bare "origin" so `git push`
// actually has somewhere to go — everything runCycle/runAutonomousLoop
// touches for real.
function makeFixture() {
  const parent = mkdtempSync(join(tmpdir(), 'jarvis-autonomy-test-'))
  const repoRoot = join(parent, 'repo')
  const originRoot = join(parent, 'origin.git')
  const workspaceRoot = join(parent, 'workspace')
  const auditLogPath = join(parent, 'audit.log')
  const reportPath = join(parent, 'autonomy-log.md')

  mkdirSync(repoRoot, { recursive: true })
  execSync('git init -b main', { cwd: repoRoot })
  execSync('git config user.email "test@jarvis.local"', { cwd: repoRoot })
  execSync('git config user.name "Jarvis Test"', { cwd: repoRoot })
  writeFileSync(
    join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'fixture', scripts: { test: `node -e "${fixtureTestScript()}"`, build: 'node -e "process.exit(0)"' } }),
  )
  execSync('git add -A', { cwd: repoRoot })
  execSync('git commit -m "init"', { cwd: repoRoot })

  execSync(`git init --bare "${originRoot}"`)
  execSync(`git remote add origin "${originRoot}"`, { cwd: repoRoot })
  execSync('git push -u origin main', { cwd: repoRoot })

  return {
    parent,
    repoRoot,
    workspaceRoot,
    reportPath,
    permissionEngine: new PermissionEngine(auditLogPath),
    cleanup: () => rmSync(parent, { recursive: true, force: true }),
  }
}

function makeJarvis(fixture: ReturnType<typeof makeFixture>, model: AIModel): Jarvis {
  return new Jarvis(model, {
    toolRegistry: new ToolRegistry(fixture.workspaceRoot, fixture.repoRoot),
    permissionEngine: fixture.permissionEngine,
  })
}

function optionsFor(fixture: ReturnType<typeof makeFixture>, jarvis: Jarvis): AutonomousWorkerOptions {
  return {
    jarvis,
    repoRoot: fixture.repoRoot,
    branch: 'jarvis-auto',
    intervalMs: 60_000,
    reportPath: fixture.reportPath,
  }
}

describe('AutonomousWorker', () => {
  let fixture: ReturnType<typeof makeFixture>

  beforeEach(() => {
    fixture = makeFixture()
  })

  afterEach(() => {
    fixture.cleanup()
  })

  it('creates the autonomy branch from main and never touches main itself', async () => {
    const mainHeadBefore = execSync('git rev-parse main', { cwd: fixture.repoRoot }).toString().trim()
    const jarvis = makeJarvis(fixture, new ScriptedModel(['Nothing worth changing right now.']))

    await runCycle(optionsFor(fixture, jarvis), 1)

    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: fixture.repoRoot }).toString().trim()
    expect(currentBranch).toBe('jarvis-auto')
    const mainHeadAfter = execSync('git rev-parse main', { cwd: fixture.repoRoot }).toString().trim()
    expect(mainHeadAfter).toBe(mainHeadBefore)
  })

  it('reverts a cycle whose changes fail tests, and pushes nothing', async () => {
    writeFileSync(join(fixture.repoRoot, 'SHOULD_FAIL'), '')
    // SHOULD_FAIL is itself an uncommitted change the marker script checks
    // for at test-run time — commit it as part of the fixture's baseline so
    // only the model's own file (new.txt) is what the cycle has to revert.
    execSync('git add -A && git commit -m "add fail marker"', { cwd: fixture.repoRoot })

    const model = new ScriptedModel([
      'TOOL_CALL: {"tool": "repo_write_file", "args": {"path": "new.txt", "content": "hello"}}',
      'Added a new file.',
    ])
    const jarvis = makeJarvis(fixture, model)

    const result = await runCycle(optionsFor(fixture, jarvis), 1)

    expect(result.outcome).toBe('reverted')
    expect(result.testResult).toBe('failed')
    expect(existsSync(join(fixture.repoRoot, 'new.txt'))).toBe(false)
    const log = execSync('git log --oneline', { cwd: fixture.repoRoot }).toString()
    expect(log).not.toContain('Added a new file')
  })

  it('commits and pushes a cycle whose changes pass tests', async () => {
    const model = new ScriptedModel([
      'TOOL_CALL: {"tool": "repo_write_file", "args": {"path": "new.txt", "content": "hello"}}',
      'Added a new file.',
    ])
    const jarvis = makeJarvis(fixture, model)

    const result = await runCycle(optionsFor(fixture, jarvis), 1)

    expect(result.outcome).toBe('pushed')
    expect(result.testResult).toBe('passed')
    expect(result.commitHash).toBeTruthy()
    expect(existsSync(join(fixture.repoRoot, 'new.txt'))).toBe(true)

    const originLog = execSync('git log jarvis-auto --oneline', { cwd: fixture.repoRoot }).toString()
    expect(originLog).toContain('Added a new file')
  })

  it('skips a cycle with no resulting changes and pushes nothing', async () => {
    const jarvis = makeJarvis(fixture, new ScriptedModel(['Nothing worth changing right now.']))

    const result = await runCycle(optionsFor(fixture, jarvis), 1)

    expect(result.outcome).toBe('no-changes')
    expect(result.filesChanged).toEqual([])
  })

  it('auto-denies a pending high-risk tool call instead of hanging', async () => {
    const model = new ScriptedModel(['TOOL_CALL: {"tool": "repo_reset", "args": {"ref": "HEAD~1"}}'])
    const jarvis = makeJarvis(fixture, model)

    const result = await runCycle(optionsFor(fixture, jarvis), 1)

    expect(jarvis.hasPendingToolCall()).toBe(false)
    expect(result.outcome).toBe('no-changes')
    expect(result.detail).toContain('repo_reset')
  })

  it('refuses to run with the autonomy branch set to main or master', async () => {
    const jarvis = makeJarvis(fixture, new ScriptedModel(['irrelevant']))
    const options = { ...optionsFor(fixture, jarvis), branch: 'main' }

    await expect(runAutonomousLoop(options)).rejects.toThrow(/protected branch/i)
  })
})

// Models Jarvis living inside a bigger repo (as it now does, merged into
// Hash Playground's repo) — repoRoot is the monorepo root, and only
// repoRoot/jarvis should ever be touched. Deliberately no package.json at
// repoRoot itself, so if scoping ever regressed and `npm test`/`npm run
// build` ran with the wrong cwd, that would fail loudly instead of
// silently passing against the wrong project.
function makeMonorepoFixture() {
  const parent = mkdtempSync(join(tmpdir(), 'jarvis-autonomy-monorepo-test-'))
  const repoRoot = join(parent, 'repo')
  const jarvisDir = join(repoRoot, 'jarvis')
  const otherDir = join(repoRoot, 'other')
  const originRoot = join(parent, 'origin.git')
  const workspaceRoot = join(parent, 'workspace')
  const auditLogPath = join(parent, 'audit.log')
  const reportPath = join(parent, 'autonomy-log.md')

  mkdirSync(jarvisDir, { recursive: true })
  mkdirSync(otherDir, { recursive: true })
  execSync('git init -b main', { cwd: repoRoot })
  execSync('git config user.email "test@jarvis.local"', { cwd: repoRoot })
  execSync('git config user.name "Jarvis Test"', { cwd: repoRoot })
  writeFileSync(
    join(jarvisDir, 'package.json'),
    JSON.stringify({ name: 'fixture-jarvis', scripts: { test: `node -e "${fixtureTestScript()}"`, build: 'node -e "process.exit(0)"' } }),
  )
  writeFileSync(join(otherDir, 'existing.txt'), 'original\n')
  execSync('git add -A', { cwd: repoRoot })
  execSync('git commit -m "init"', { cwd: repoRoot })

  execSync(`git init --bare "${originRoot}"`)
  execSync(`git remote add origin "${originRoot}"`, { cwd: repoRoot })
  execSync('git push -u origin main', { cwd: repoRoot })

  return {
    parent,
    repoRoot,
    jarvisDir,
    otherDir,
    workspaceRoot,
    reportPath,
    permissionEngine: new PermissionEngine(auditLogPath),
    cleanup: () => rmSync(parent, { recursive: true, force: true }),
  }
}

describe('AutonomousWorker with repoScopePath (Jarvis inside a bigger repo)', () => {
  let fixture: ReturnType<typeof makeMonorepoFixture>

  beforeEach(() => {
    fixture = makeMonorepoFixture()
  })

  afterEach(() => {
    fixture.cleanup()
  })

  function makeScopedJarvis(model: AIModel): Jarvis {
    return new Jarvis(model, {
      toolRegistry: new ToolRegistry(fixture.workspaceRoot, fixture.repoRoot, 'jarvis'),
      permissionEngine: fixture.permissionEngine,
    })
  }

  function scopedOptions(jarvis: Jarvis): AutonomousWorkerOptions {
    return {
      jarvis,
      repoRoot: fixture.repoRoot,
      repoScopePath: 'jarvis',
      branch: 'jarvis-auto',
      intervalMs: 60_000,
      reportPath: fixture.reportPath,
    }
  }

  it('commits and pushes only jarvis/ changes, leaving a dirty file in a sibling directory untouched and uncommitted', async () => {
    writeFileSync(join(fixture.otherDir, 'existing.txt'), 'modified by someone else\n')

    const model = new ScriptedModel([
      'TOOL_CALL: {"tool": "repo_write_file", "args": {"path": "new.txt", "content": "hello"}}',
      'Added a new file.',
    ])
    const jarvis = makeScopedJarvis(model)

    const result = await runCycle(scopedOptions(jarvis), 1)

    expect(result.outcome).toBe('pushed')
    expect(existsSync(join(fixture.jarvisDir, 'new.txt'))).toBe(true)

    const committedFiles = execSync('git show --stat --format= HEAD', { cwd: fixture.repoRoot }).toString()
    expect(committedFiles).toContain('jarvis/new.txt')
    expect(committedFiles).not.toContain('other/existing.txt')

    // The sibling directory's unrelated change is still sitting there,
    // uncommitted, exactly as it was — never staged or reverted.
    const status = execSync('git status --porcelain', { cwd: fixture.repoRoot }).toString()
    expect(status).toContain('other/existing.txt')
  })

  it('reverts only jarvis/ on a failing cycle, never touching the sibling directory', async () => {
    writeFileSync(join(fixture.jarvisDir, 'SHOULD_FAIL'), '')
    execSync('git add -A && git commit -m "add fail marker"', { cwd: fixture.repoRoot })
    writeFileSync(join(fixture.otherDir, 'existing.txt'), 'modified by someone else\n')

    const model = new ScriptedModel([
      'TOOL_CALL: {"tool": "repo_write_file", "args": {"path": "new.txt", "content": "hello"}}',
      'Added a new file.',
    ])
    const jarvis = makeScopedJarvis(model)

    const result = await runCycle(scopedOptions(jarvis), 1)

    expect(result.outcome).toBe('reverted')
    expect(existsSync(join(fixture.jarvisDir, 'new.txt'))).toBe(false)
    // The sibling directory's own dirty change survives the revert untouched.
    const otherContent = execSync('git show :other/existing.txt', { cwd: fixture.repoRoot }).toString()
    expect(otherContent).toBe('original\n')
    const workingTreeContent = readFileSync(join(fixture.otherDir, 'existing.txt'), 'utf8')
    expect(workingTreeContent).toBe('modified by someone else\n')
  })
})
