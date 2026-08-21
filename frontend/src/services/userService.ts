import { request } from '../lib/apiClient'
import type { Role } from '../context/AuthContext'

export interface UserSummary {
  username: string
  role: Role
  joinedAt: string
  blocked: boolean
  projectCount: number
  name?: string
  email?: string
}

export async function listUsers(): Promise<UserSummary[]> {
  return request<UserSummary[]>('/users')
}

export async function getUser(username: string): Promise<UserSummary> {
  return request<UserSummary>(`/users/${encodeURIComponent(username)}`)
}

export async function updateOwnProfile(username: string, changes: { name?: string; email?: string }): Promise<UserSummary> {
  return request<UserSummary>(`/users/${encodeURIComponent(username)}`, { method: 'PATCH', body: changes })
}

export async function changeOwnPassword(username: string, currentPassword: string, newPassword: string): Promise<void> {
  await request(`/users/${encodeURIComponent(username)}/password`, {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  })
}

export async function setUserRole(username: string, role: Role): Promise<UserSummary> {
  return request<UserSummary>(`/users/${encodeURIComponent(username)}/role`, { method: 'PATCH', body: { role } })
}

export async function blockUser(username: string): Promise<UserSummary> {
  return request<UserSummary>(`/users/${encodeURIComponent(username)}/block`, { method: 'PATCH', body: { blocked: true } })
}

export async function unblockUser(username: string): Promise<UserSummary> {
  return request<UserSummary>(`/users/${encodeURIComponent(username)}/block`, { method: 'PATCH', body: { blocked: false } })
}

export async function removeUserAccount(username: string): Promise<{ transferredProjects: number }> {
  return request(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' })
}

export async function deleteProjectsForUser(username: string): Promise<{ deleted: number }> {
  return request(`/users/${encodeURIComponent(username)}/projects`, { method: 'DELETE' })
}

// "Top admin" (earliest-joined active admin) is enforced server-side — these
// are pure client-side helpers over an already-fetched user list, used only
// for UI decisions (crown icon, pre-emptively disabling a button) rather
// than a second network round trip.
export function getTopAdminUsername(users: UserSummary[]): string | undefined {
  const activeAdmins = users.filter((entry) => entry.role === 'admin' && !entry.blocked)
  if (activeAdmins.length === 0) return undefined
  return activeAdmins.slice().sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0]?.username
}

export function isTopAdmin(users: UserSummary[], username: string): boolean {
  return getTopAdminUsername(users) === username
}

export function hasOtherActiveAdmin(users: UserSummary[], excludingUsername: string): boolean {
  return users.some((entry) => entry.username !== excludingUsername && entry.role === 'admin' && !entry.blocked)
}
