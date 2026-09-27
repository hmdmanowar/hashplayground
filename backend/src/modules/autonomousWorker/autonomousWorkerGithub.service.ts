import { env } from '../../env.js'
import { ApiError } from '../../middleware/errorHandler.js'

// Hardcoded for this one repo — this feature only ever makes sense against
// the single project the autonomous worker operates on, never a generic
// "any repo" tool.
const OWNER = 'hmdmanowar'
const REPO = 'hashplayground'
const MAIN = 'main'
const AUTO_BRANCH = 'jarvis-auto'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'hash-playground',
    Accept: 'application/vnd.github+json',
  }
  // Compare (read) works unauthenticated against a public repo, just at a
  // much lower rate limit — attach the token whenever it's configured
  // regardless of which route is calling, no reason not to.
  if (env.GITHUB_REPO_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_REPO_TOKEN}`
  return headers
}

function requireToken(): string {
  if (!env.GITHUB_REPO_TOKEN) {
    throw new ApiError(503, 'Merging/syncing needs GITHUB_REPO_TOKEN configured on the backend — the diff view above works without it.')
  }
  return env.GITHUB_REPO_TOKEN
}

async function gh<T>(path: string, init?: RequestInit): Promise<{ status: number; data: T | null }> {
  const response = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } })
  if (response.status === 404) return { status: 404, data: null }
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GitHub API ${path} failed (${response.status}): ${body}`)
  }
  const data = response.status === 204 ? null : ((await response.json()) as T)
  return { status: response.status, data }
}

export interface DiffFile {
  filename: string
  status: string
  additions: number
  deletions: number
  patch: string | null
}

export interface BranchStatus {
  exists: boolean
  aheadBy: number
  files: DiffFile[]
  // Never the token itself — just whether merge/sync are even possible.
  tokenConfigured: boolean
}

interface CompareResult {
  mergeBaseSha: string
  files: { filename: string; status: string; additions: number; deletions: number; patch?: string }[]
}

async function compareRefs(base: string, head: string): Promise<CompareResult | null> {
  const { status, data } = await gh<{
    merge_base_commit: { sha: string }
    files?: { filename: string; status: string; additions: number; deletions: number; patch?: string }[]
  }>(`/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`)
  if (status === 404 || !data) return null
  return { mergeBaseSha: data.merge_base_commit.sha, files: data.files ?? [] }
}

// Compares main...jarvis-auto — what's on jarvis-auto that isn't on main yet,
// i.e. exactly what a merge into main would bring in.
export async function getBranchStatus(): Promise<BranchStatus> {
  const tokenConfigured = Boolean(env.GITHUB_REPO_TOKEN)
  const compared = await compareRefs(MAIN, AUTO_BRANCH)
  if (!compared) return { exists: false, aheadBy: 0, files: [], tokenConfigured }
  return {
    exists: true,
    aheadBy: compared.files.length,
    files: compared.files.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch ?? null,
    })),
    tokenConfigured,
  }
}

export interface ConflictFile {
  path: string
  baseContent: string | null
  headContent: string | null
  binary: boolean
}

export interface MergeConflict {
  baseSha: string
  headSha: string
  mergeBaseSha: string
  files: ConflictFile[]
}

export type MergeOutcome = { ok: true; commitSha: string } | { ok: false; conflict: MergeConflict }

function decodeContent(base64: string): { text: string | null; binary: boolean } {
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.includes(0)) return { text: null, binary: true }
  return { text: buffer.toString('utf-8'), binary: false }
}

async function getRefSha(branch: string): Promise<string> {
  const { data } = await gh<{ object: { sha: string } }>(`/git/refs/heads/${encodeURIComponent(branch)}`)
  if (!data) throw new Error(`Ref "${branch}" not found`)
  return data.object.sha
}

async function getFileContentAt(path: string, ref: string): Promise<{ text: string | null; binary: boolean }> {
  const { status, data } = await gh<{ content: string; encoding: string }>(
    `/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`,
  )
  if (status === 404 || !data) return { text: null, binary: false }
  return decodeContent(data.content)
}

// A file is a genuine conflict candidate if BOTH sides changed it since their
// common ancestor — file-level, not line-level: safer to ask a human about a
// whole file than to risk an incorrect automatic combine of overlapping
// hunks ourselves.
async function findConflictingFiles(base: string, head: string): Promise<MergeConflict> {
  const [baseSha, headSha] = await Promise.all([getRefSha(base), getRefSha(head)])

  // What head brings in relative to base (what a merge would apply)...
  const baseVsHead = await compareRefs(base, head)
  if (!baseVsHead) throw new Error(`"${base}" or "${head}" doesn't exist.`)
  // ...intersected with what base itself changed since their common ancestor
  // — a file present in both lists is one both sides touched independently.
  const ancestorVsBase = await compareRefs(baseVsHead.mergeBaseSha, base)

  const headChangedPaths = new Set(baseVsHead.files.map((f) => f.filename))
  const candidatePaths = (ancestorVsBase?.files ?? []).map((f) => f.filename).filter((path) => headChangedPaths.has(path))

  const files: ConflictFile[] = await Promise.all(
    candidatePaths.map(async (path) => {
      const [baseVersion, headVersion] = await Promise.all([getFileContentAt(path, baseSha), getFileContentAt(path, headSha)])
      return {
        path,
        baseContent: baseVersion.text,
        headContent: headVersion.text,
        binary: baseVersion.binary || headVersion.binary,
      }
    }),
  )

  return { baseSha, headSha, mergeBaseSha: baseVsHead.mergeBaseSha, files }
}

async function merge(base: string, head: string, commitMessage: string): Promise<MergeOutcome> {
  requireToken()
  const response = await fetch(`${API}/merges`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ base, head, commit_message: commitMessage }),
  })

  if (response.status === 201) {
    const data = (await response.json()) as { sha: string }
    return { ok: true, commitSha: data.sha }
  }
  if (response.status === 204) throw new ApiError(409, 'Already up to date — nothing to merge.')
  if (response.status === 409) return { ok: false, conflict: await findConflictingFiles(base, head) }
  if (response.status === 404) throw new ApiError(404, `"${base}" or "${head}" doesn't exist.`)
  const body = await response.text().catch(() => '')
  throw new Error(`GitHub merge failed (${response.status}): ${body}`)
}

// jarvis-auto -> main: the actual "I reviewed this, ship it" action.
export function mergeToMain(): Promise<MergeOutcome> {
  return merge(MAIN, AUTO_BRANCH, 'Merge jarvis-auto into main')
}

// main -> jarvis-auto: keeps the auto branch current after a merge (or
// whenever main moves independently) so the worker's next cycle builds on
// the latest reviewed code instead of an increasingly stale base.
export function syncFromMain(): Promise<MergeOutcome> {
  return merge(AUTO_BRANCH, MAIN, 'Sync main into jarvis-auto')
}

export type MergeDirection = 'merge-to-main' | 'sync-from-main'

function branchesFor(direction: MergeDirection): { base: string; head: string; message: string } {
  return direction === 'merge-to-main'
    ? { base: MAIN, head: AUTO_BRANCH, message: 'Merge jarvis-auto into main' }
    : { base: AUTO_BRANCH, head: MAIN, message: 'Sync main into jarvis-auto' }
}

interface TreeEntry {
  path: string
  mode: string
  type: string
  sha: string | null
}

// Finishes a merge the Merges API refused, using the manually-resolved
// content for every genuinely conflicting file — the same Git Data API
// sequence (blob -> tree -> commit -> ref update) GitHub's own conflict
// editor uses under the hood. Re-derives everything fresh rather than
// trusting anything the client cached from the earlier conflict response,
// since either branch could have moved since then.
export async function completeMerge(direction: MergeDirection, resolutions: { path: string; content: string }[]): Promise<{ commitSha: string }> {
  requireToken()
  const { base, head, message } = branchesFor(direction)
  const resolutionByPath = new Map(resolutions.map((r) => [r.path, r.content]))

  const conflict = await findConflictingFiles(base, head)
  const binaryPaths = conflict.files.filter((f) => f.binary).map((f) => f.path)
  if (binaryPaths.length > 0) {
    throw new ApiError(409, `Binary file(s) still conflict and can't be resolved here — resolve on GitHub directly: ${binaryPaths.join(', ')}`)
  }
  const missing = conflict.files.filter((f) => !resolutionByPath.has(f.path))
  if (missing.length > 0) {
    throw new ApiError(400, `Missing a resolution for: ${missing.map((f) => f.path).join(', ')}`)
  }

  const compared = await compareRefs(base, head)
  if (!compared) throw new ApiError(404, `"${base}" or "${head}" doesn't exist.`)

  const [baseCommit, headTree] = await Promise.all([
    gh<{ tree: { sha: string } }>(`/git/commits/${conflict.baseSha}`).then((r) => r.data!),
    gh<{ tree: { path: string; mode: string; type: string; sha: string }[] }>(`/git/trees/${conflict.headSha}?recursive=1`).then((r) => r.data!),
  ])
  const headEntryByPath = new Map(headTree.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e]))

  const treeEntries: TreeEntry[] = await Promise.all(
    compared.files.map(async (file): Promise<TreeEntry> => {
      if (resolutionByPath.has(file.filename)) {
        const { data } = await gh<{ sha: string }>('/git/blobs', {
          method: 'POST',
          body: JSON.stringify({ content: resolutionByPath.get(file.filename), encoding: 'utf-8' }),
        })
        return { path: file.filename, mode: '100644', type: 'blob', sha: data!.sha }
      }
      if (file.status === 'removed') {
        return { path: file.filename, mode: '100644', type: 'blob', sha: null }
      }
      const headEntry = headEntryByPath.get(file.filename)
      if (!headEntry) throw new Error(`"${file.filename}" changed on ${head} but is missing from its tree`)
      return { path: headEntry.path, mode: headEntry.mode, type: headEntry.type, sha: headEntry.sha }
    }),
  )

  const { data: newTree } = await gh<{ sha: string }>('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: treeEntries }),
  })
  const { data: newCommit } = await gh<{ sha: string }>('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree!.sha, parents: [conflict.baseSha, conflict.headSha] }),
  })
  await gh(`/git/refs/heads/${encodeURIComponent(base)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit!.sha }),
  })

  return { commitSha: newCommit!.sha }
}
