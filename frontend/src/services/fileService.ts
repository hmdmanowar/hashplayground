import { request } from '../lib/apiClient'
import type { ProjectFile } from '../types/project'

// Seeding now happens server-side, atomically, as part of project
// create/import — by the time a project reaches the Playground its files
// already exist, so there's no client-side "seed on first open" fallback
// left to do here.

export async function listFiles(projectId: string): Promise<ProjectFile[]> {
  return request<ProjectFile[]>(`/projects/${projectId}/files`)
}

export async function createFile(projectId: string, name: string, path: string): Promise<ProjectFile> {
  return request<ProjectFile>(`/projects/${projectId}/files`, { method: 'POST', body: { name, path } })
}

export async function createFolder(projectId: string, name: string, path: string): Promise<ProjectFile> {
  return request<ProjectFile>(`/projects/${projectId}/folders`, { method: 'POST', body: { name, path } })
}

export async function saveFile(projectId: string, fileId: string, content: string): Promise<ProjectFile> {
  return request<ProjectFile>(`/projects/${projectId}/files/${fileId}`, { method: 'PATCH', body: { content } })
}

// Replaces the old per-tab loop of individual saveFile() calls with one
// round trip — also bumps the project's updatedAt server-side.
export async function saveFilesBatch(
  projectId: string,
  entries: { fileId: string; content: string }[],
): Promise<ProjectFile[]> {
  return request<ProjectFile[]>(`/projects/${projectId}/files/batch`, { method: 'PATCH', body: { files: entries } })
}

export async function renameFile(projectId: string, fileId: string, name: string): Promise<ProjectFile> {
  return request<ProjectFile>(`/projects/${projectId}/files/${fileId}/rename`, { method: 'PATCH', body: { name } })
}

export async function deleteFile(projectId: string, fileId: string): Promise<void> {
  await request(`/projects/${projectId}/files/${fileId}`, { method: 'DELETE' })
}

export async function renamePathPrefix(projectId: string, oldPrefix: string, newPrefix: string): Promise<ProjectFile[]> {
  return request<ProjectFile[]>(`/projects/${projectId}/files/rename-prefix`, {
    method: 'POST',
    body: { oldPrefix, newPrefix },
  })
}

export async function deleteByPathPrefix(projectId: string, prefix: string): Promise<void> {
  await request(`/projects/${projectId}/files/delete-prefix`, { method: 'POST', body: { prefix } })
}

// Reverts one/many (or, if paths is omitted, all) changed files back to the
// last recorded version — server-side equivalent of the old
// applyDiscard + syncFilesAfterRevert per-file loop.
export async function discardChanges(projectId: string, paths?: string[]): Promise<ProjectFile[]> {
  return request<ProjectFile[]>(`/projects/${projectId}/files/discard`, { method: 'POST', body: { paths } })
}
