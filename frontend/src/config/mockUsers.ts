import type { Role } from '../context/AuthContext'

export const MOCK_USERS: Record<string, { password: string; role: Role }> = {
  admin: { password: 'admin123', role: 'admin' },
}
