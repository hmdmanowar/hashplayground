import type { FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { resolveSessionUsername, SESSION_COOKIE_NAME } from '../lib/session.js'
import { getTopAdminUsername } from '../modules/users/users.service.js'
import { ApiError } from './errorHandler.js'

// Runs on every request (registered as a global onRequest hook in app.ts)
// so request.authUser is always populated before any route's preHandler runs.
export async function loadAuthUser(request: FastifyRequest): Promise<void> {
  const token = request.cookies[SESSION_COOKIE_NAME]
  const username = await resolveSessionUsername(token)
  if (!username) {
    request.authUser = null
    return
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { username: true, role: true, blocked: true },
  })
  request.authUser = user ?? null
}

export async function requireAuth(request: FastifyRequest): Promise<void> {
  if (!request.authUser) throw new ApiError(401, 'Not authenticated')
  if (request.authUser.blocked) throw new ApiError(403, 'This account has been blocked')
}

export async function requireAdmin(request: FastifyRequest): Promise<void> {
  await requireAuth(request)
  if (request.authUser!.role !== 'admin') throw new ApiError(403, 'Admin access required')
}

// The "superior admin" gate — same top-admin concept already used for
// approving PendingUpdateRequests (see users.service.ts's findTopAdmin).
export async function requireTopAdmin(request: FastifyRequest): Promise<void> {
  await requireAdmin(request)
  const topAdminUsername = await getTopAdminUsername()
  if (request.authUser!.username !== topAdminUsername) throw new ApiError(403, 'Top admin access required')
}
