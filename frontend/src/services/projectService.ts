import { request, ApiError } from '../lib/apiClient'
import type { Project, ProjectFile } from '../types/project'
import type { Role } from '../context/AuthContext'

export interface CreateProjectInput {
  name: string
  description?: string
  template: string
}

export interface ImportProjectInput {
  name: string
  template: string
  entries: { path: string; name: string; content: string }[]
}

// Visibility scoping (own projects vs. everyone's) and 404-for-unauthorized
// are both enforced server-side now — this just calls the endpoint the
// backend already scopes correctly.
export async function listVisibleProjects(_viewer: { username: string; role: Role }, ownerUsernameFilter?: string): Promise<Project[]> {
  const query = ownerUsernameFilter ? `?ownerUsername=${encodeURIComponent(ownerUsernameFilter)}` : ''
  return request<Project[]>(`/projects${query}`)
}

export async function getProject(id: string): Promise<Project | undefined> {
  try {
    return await request<Project>(`/projects/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
}

export async function createProject(input: CreateProjectInput): Promise<{ project: Project; files: ProjectFile[] }> {
  return request('/projects', { method: 'POST', body: input })
}

export async function importProject(input: ImportProjectInput): Promise<{ project: Project; files: ProjectFile[] }> {
  return request('/projects/import', { method: 'POST', body: input })
}

export async function updateProject(id: string, changes: { name?: string; description?: string }): Promise<Project> {
  return request<Project>(`/projects/${id}`, { method: 'PATCH', body: changes })
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/projects/${id}`, { method: 'DELETE' })
}

export async function duplicateProject(id: string): Promise<{ project: Project; files: ProjectFile[] } | undefined> {
  try {
    return await request(`/projects/${id}/duplicate`, { method: 'POST' })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
}
