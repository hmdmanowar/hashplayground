import { request } from '../lib/apiClient'
import type { ProjectVersion } from '../types/project'

export interface VersionSummary {
  id: string
  version: string
  createdAt: string
  fileCount: number
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
export async function publishVersion(projectId: string): Promise<{ changed: boolean; version?: string }> {
  return request(`/projects/${projectId}/versions`, { method: 'POST' })
}
