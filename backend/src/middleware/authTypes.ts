import type { Role } from '@prisma/client'

export interface AuthenticatedUser {
  username: string
  role: Role
  blocked: boolean
}
