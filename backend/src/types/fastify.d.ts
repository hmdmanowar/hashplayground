import type { AuthenticatedUser } from '../middleware/authTypes.js'

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthenticatedUser | null
  }
}
