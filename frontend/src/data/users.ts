import type { Role } from '../context/AuthContext'

export interface KnownUser {
  username: string
  role: Role
}

export const knownUsers: KnownUser[] = [
  { username: 'admin', role: 'admin' },
  { username: 'user', role: 'user' },
]
