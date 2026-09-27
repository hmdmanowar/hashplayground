import { env } from '../../env.js'
import { ApiError } from '../../middleware/errorHandler.js'

// Hardcoded for this one repo — this feature only ever makes sense against
// the single project the autonomous worker operates on, never a generic
// "any repo" tool.
const OWNER = 'hmdmanowar'
const REPO = 'hashplayground'
const MAIN = 'main'
const AUTO_BRANCH = 'jarvis-auto'

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

// Compares main...jarvis-auto — what's on jarvis-auto that isn't on main yet,
// i.e. exactly what a merge into main would bring in.
export async function getBranchStatus(): Promise<BranchStatus> {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/compare/${MAIN}...${AUTO_BRANCH}`, {
    headers: authHeaders(),
  })
  const tokenConfigured = Boolean(env.GITHUB_REPO_TOKEN)
  if (response.status === 404) return { exists: false, aheadBy: 0, files: [], tokenConfigured }
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GitHub compare failed (${response.status}): ${body}`)
  }
  const data = (await response.json()) as {
    ahead_by: number
    files?: { filename: string; status: string; additions: number; deletions: number; patch?: string }[]
  }
  return {
    exists: true,
    aheadBy: data.ahead_by,
    files: (data.files ?? []).map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch ?? null,
    })),
    tokenConfigured,
  }
}

async function merge(base: string, head: string, commitMessage: string): Promise<{ commitSha: string }> {
  requireToken()
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/merges`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ base, head, commit_message: commitMessage }),
  })

  if (response.status === 201) {
    const data = (await response.json()) as { sha: string }
    return { commitSha: data.sha }
  }
  if (response.status === 204) throw new ApiError(409, 'Already up to date — nothing to merge.')
  if (response.status === 409) throw new ApiError(409, 'Merge conflict — resolve this on GitHub directly.')
  if (response.status === 404) throw new ApiError(404, `"${base}" or "${head}" doesn't exist.`)
  const body = await response.text().catch(() => '')
  throw new Error(`GitHub merge failed (${response.status}): ${body}`)
}

// jarvis-auto -> main: the actual "I reviewed this, ship it" action.
export function mergeToMain(): Promise<{ commitSha: string }> {
  return merge(MAIN, AUTO_BRANCH, 'Merge jarvis-auto into main')
}

// main -> jarvis-auto: keeps the auto branch current after a merge (or
// whenever main moves independently) so the worker's next cycle builds on
// the latest reviewed code instead of an increasingly stale base.
export function syncFromMain(): Promise<{ commitSha: string }> {
  return merge(AUTO_BRANCH, MAIN, 'Sync main into jarvis-auto')
}
