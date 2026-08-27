import { request } from '../lib/apiClient'
import type { ProjectVersion } from '../types/project'

export interface VersionSummary {
  id: string
  version: string
  createdAt: string
  fileCount: number
}

export interface PendingUpdateRequest {
  id: string
  requestedByUsername: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export async function listVersions(projectId: string): Promise<VersionSummary[]> {
  return request<VersionSummary[]>(`/projects/${projectId}/versions`)
}

export async function getLatestVersion(projectId: string): Promise<ProjectVersion | undefined> {
  const latest = await request<ProjectVersion | null>(`/projects/${projectId}/versions/latest`)
  return latest ?? undefined
}

// "Update Project" — one atomic server-side call that replaces the old
// incrementProjectVersion + recordVersion + notifyAdmins sequence.
// `password` is only required when the top admin is publishing a project
// they don't own directly — any other admin can't call this at all and has
// to go through requestUpdate/resolveUpdateRequest instead.
export async function publishVersion(
  projectId: string,
  password?: string,
): Promise<{ changed: boolean; version?: string }> {
  return request(`/projects/${projectId}/versions`, { method: 'POST', body: { password } })
}

// The "pull request" flow for an admin who can't publish another user's
// project directly — see PendingUpdateBanner.
export async function getPendingUpdateRequest(projectId: string): Promise<PendingUpdateRequest | undefined> {
  const pending = await request<PendingUpdateRequest | null>(`/projects/${projectId}/update-request`)
  return pending ?? undefined
}

export async function requestUpdate(projectId: string): Promise<PendingUpdateRequest> {
  return request<PendingUpdateRequest>(`/projects/${projectId}/update-request`, { method: 'POST' })
}

// The top admin's decision — approving requires their own password and
// publishes immediately, just like publishVersion.
export async function resolveUpdateRequest(
  projectId: string,
  requestId: string,
  decision: 'approved' | 'rejected',
  password?: string,
): Promise<{ status: 'approved' | 'rejected'; changed?: boolean; version?: string }> {
  return request(`/projects/${projectId}/update-request/${requestId}/resolve`, {
    method: 'POST',
    body: { decision, password },
  })
}
