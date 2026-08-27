import { Prisma, type Role, type User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { hashPassword, verifyPasswordHash } from '../../lib/password.js'
import { revokeAllSessionsForUser } from '../../lib/session.js'
import { ApiError } from '../../middleware/errorHandler.js'

export interface UserDetailDto {
  username: string
  role: Role
  name?: string
  email?: string
  phone?: string
  joinedAt: string
  blocked: boolean
  projectCount: number
}

function toUserDetail(user: User, projectCount: number): UserDetailDto {
  return {
    username: user.username,
    role: user.role,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    joinedAt: user.joinedAt.toISOString(),
    blocked: user.blocked,
    projectCount,
  }
}

export async function listUsers(): Promise<UserDetailDto[]> {
  const users = await prisma.user.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  return users.map((user) => toUserDetail(user, user._count.projects))
}

export async function getUserDetail(username: string): Promise<UserDetailDto> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { _count: { select: { projects: true } } },
  })
  if (!user) throw new ApiError(404, 'User not found')
  return toUserDetail(user, user._count.projects)
}

export async function updateOwnProfile(
  username: string,
  changes: { name?: string; email?: string; phone?: string },
): Promise<UserDetailDto> {
  if (changes.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: changes.phone } })
    if (existing && existing.username !== username) {
      throw new ApiError(409, 'That phone number is already in use by another account')
    }
  }

  // `email` has no @unique constraint at the DB level (unlike phone/googleId/
  // etc.) since it's optional free-text, not itself a login credential — but
  // OAuth login/signup relies on "one email → at most one account" to reject
  // duplicates correctly, so it must be enforced here too.
  if (changes.email) {
    const existing = await prisma.user.findFirst({ where: { email: changes.email } })
    if (existing && existing.username !== username) {
      throw new ApiError(409, 'That email is already in use by another account')
    }
  }

  const user = await prisma.user.update({
    where: { username },
    data: changes,
    include: { _count: { select: { projects: true } } },
  })
  return toUserDetail(user, user._count.projects)
}

export async function changeOwnPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new ApiError(404, 'User not found')

  // A Google-only account has no existing password to verify against — use
  // "forgot password" (which sets one directly, no current-password check)
  // to add a password to this kind of account for the first time.
  if (!user.passwordHash) {
    throw new ApiError(400, 'This account signed up with Google and has no password yet — use "Forgot password?" to set one')
  }

  const valid = await verifyPasswordHash(currentPassword, user.passwordHash)
  if (!valid) throw new ApiError(401, 'Current password is incorrect')

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { username }, data: { passwordHash } })
}

// "Top admin": the earliest-joined active (non-blocked) admin. Only the top
// admin may manage (block/demote/delete) another admin — and only the top
// admin can publish a version to a project they don't own directly; any
// other admin has to request it and let the top admin approve (see
// versions.service.ts's publishVersion/requestUpdate/resolveUpdateRequest).
async function findTopAdmin(tx: Prisma.TransactionClient): Promise<User | null> {
  return tx.user.findFirst({ where: { role: 'admin', blocked: false }, orderBy: { joinedAt: 'asc' } })
}

// Non-transactional counterpart of findTopAdmin, for call sites (auth routes,
// version publishing) that just need to know who the top admin currently is
// rather than manage them inside a transaction.
export async function getTopAdminUsername(): Promise<string | undefined> {
  const topAdmin = await prisma.user.findFirst({ where: { role: 'admin', blocked: false }, orderBy: { joinedAt: 'asc' } })
  return topAdmin?.username
}

async function assertCanManageOtherAdmin(tx: Prisma.TransactionClient, actingUsername: string): Promise<void> {
  const topAdmin = await findTopAdmin(tx)
  if (topAdmin?.username !== actingUsername) {
    throw new ApiError(403, 'Only the top admin can manage other admins')
  }
}

export async function setUserRole(actingUsername: string, targetUsername: string, role: Role): Promise<UserDetailDto> {
  const updated = await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { username: targetUsername } })
      if (!target) throw new ApiError(404, 'User not found')

      if (target.username === actingUsername) {
        if (role !== 'admin') {
          const otherActiveAdmins = await tx.user.count({
            where: { role: 'admin', blocked: false, username: { not: actingUsername } },
          })
          if (otherActiveAdmins === 0) {
            throw new ApiError(409, 'Cannot demote yourself — no other active admin exists')
          }
        }
      } else if (target.role === 'admin') {
        await assertCanManageOtherAdmin(tx, actingUsername)
      }

      return tx.user.update({
        where: { username: targetUsername },
        data: { role },
        include: { _count: { select: { projects: true } } },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
  return toUserDetail(updated, updated._count.projects)
}

export async function setUserBlocked(actingUsername: string, targetUsername: string, blocked: boolean): Promise<UserDetailDto> {
  const updated = await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { username: targetUsername } })
      if (!target) throw new ApiError(404, 'User not found')
      if (target.username === actingUsername) throw new ApiError(400, 'Cannot block your own account')
      if (target.role === 'admin') await assertCanManageOtherAdmin(tx, actingUsername)

      return tx.user.update({
        where: { username: targetUsername },
        data: { blocked },
        include: { _count: { select: { projects: true } } },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )

  if (blocked) await revokeAllSessionsForUser(targetUsername)
  return toUserDetail(updated, updated._count.projects)
}

export async function removeUserAccount(
  actingUsername: string,
  targetUsername: string,
): Promise<{ transferredProjects: number }> {
  return prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { username: targetUsername } })
      if (!target) throw new ApiError(404, 'User not found')

      const isSelf = actingUsername === targetUsername
      if (!isSelf) {
        const actingUser = await tx.user.findUnique({ where: { username: actingUsername } })
        if (!actingUser || actingUser.role !== 'admin') throw new ApiError(403, 'Admin access required')
        if (target.role === 'admin') await assertCanManageOtherAdmin(tx, actingUsername)
      }

      let transferTo: string
      if (!isSelf) {
        transferTo = actingUsername
      } else if (target.role === 'admin') {
        const other = await tx.user.findFirst({
          where: { role: 'admin', blocked: false, username: { not: targetUsername } },
          orderBy: { joinedAt: 'asc' },
        })
        if (!other) {
          throw new ApiError(409, 'Cannot delete your account — no other active admin exists to transfer your projects to')
        }
        transferTo = other.username
      } else {
        const top = await findTopAdmin(tx)
        if (!top) throw new ApiError(500, 'No active admin exists to receive transferred projects')
        transferTo = top.username
      }

      const { count } = await tx.project.updateMany({
        where: { ownerUsername: targetUsername },
        data: { ownerUsername: transferTo },
      })
      await tx.session.deleteMany({ where: { username: targetUsername } })
      await tx.user.delete({ where: { username: targetUsername } })
      return { transferredProjects: count }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

export async function deleteProjectsForUser(username: string): Promise<{ deleted: number }> {
  const { count } = await prisma.project.deleteMany({ where: { ownerUsername: username } })
  return { deleted: count }
}
