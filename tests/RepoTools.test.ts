import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRepoFileTools } from '../src/tools/RepoTools.js'
import { SandboxViolationError } from '../src/tools/sandbox.js'

describe('RepoTools', () => {
  let repoRoot: string

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'jarvis-repo-test-'))
  })

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true })
  })

  it('repo_write_file then repo_read_file round-trips content', async () => {
    const [, , writeFileTool] = createRepoFileTools(repoRoot)
    const [readFileTool] = createRepoFileTools(repoRoot)

    await writeFileTool.execute({ path: 'notes.txt', content: 'hello jarvis' })
    const result = await readFileTool.execute({ path: 'notes.txt' })

    expect(result.content).toBe('hello jarvis')
  })

  it('repo_write_file creates parent directories as needed', async () => {
    const [, , writeFileTool] = createRepoFileTools(repoRoot)
    const [readFileTool] = createRepoFileTools(repoRoot)

    await writeFileTool.execute({ path: 'nested/deep/file.txt', content: 'x' })
    const result = await readFileTool.execute({ path: 'nested/deep/file.txt' })

    expect(result.content).toBe('x')
  })

  it('repo_list_directory lists what was written', async () => {
    const [, listDirectoryTool, writeFileTool] = createRepoFileTools(repoRoot)
    await writeFileTool.execute({ path: 'a.txt', content: '1' })
    await writeFileTool.execute({ path: 'b.txt', content: '2' })

    const result = await listDirectoryTool.execute({})
    expect(result.entries.sort()).toEqual(['a.txt', 'b.txt'])
  })

  it('repo_search_code finds matches with file:line references', async () => {
    const [, , writeFileTool, searchCodeTool] = createRepoFileTools(repoRoot)
    await writeFileTool.execute({ path: 'a.ts', content: 'const needle = 1\nconst other = 2' })

    const result = await searchCodeTool.execute({ query: 'needle' })
    expect(result.matches).toEqual(['a.ts:1: const needle = 1'])
  })

  it('rejects a path that tries to escape the repo with ../', async () => {
    const [readFileTool] = createRepoFileTools(repoRoot)
    await expect(readFileTool.execute({ path: '../../outside.txt' })).rejects.toThrow(SandboxViolationError)
  })

  it('declares the expected risk levels', () => {
    const [readFileTool, listDirectoryTool, writeFileTool, searchCodeTool] = createRepoFileTools(repoRoot)
    expect(readFileTool.risk).toBe('low')
    expect(listDirectoryTool.risk).toBe('low')
    expect(writeFileTool.risk).toBe('medium')
    expect(searchCodeTool.risk).toBe('low')
  })
})
