import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { loadAccessibleProject } from '../projects/projects.service.js'
import { computeChangedFiles } from '../../lib/diff.js'
import { bumpVersion } from '../../lib/version.js'
import { notifyOtherAdmins } from '../../lib/notify.js'
import { verifyPasswordHash } from '../../lib/password.js'
import { getTopAdminUsername } from '../users/users.service.js'
import { sendNotification } from '../notifications/notifications.service.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'

const MAX_VERSIONS_PER_PROJECT = 50

interface VersionFileSnapshot {
  id: string
  name: string
  path: string
  content: string
  type: string
}

export interface VersionSummaryDto {
  id: string
  version: string
  createdAt: string
  fileCount: number
}

export interface VersionDetailDto {
  id: string
  version: string
  createdAt: string
  files: VersionFileSnapshot[]
}

export interface PendingUpdateRequestDto {
  id: string
  requestedByUsername: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export async function listVersions(projectId: string, viewer: AuthenticatedUser): Promise<VersionSummaryDto[]> {
  await loadAccessibleProject(projectId, viewer)
  const versions = await prisma.projectVersion.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } })
  return versions.map((version) => ({
    id: version.id,
    version: version.version,
    createdAt: version.createdAt.toISOString(),
    fileCount: (version.files as unknown as VersionFileSnapshot[]).length,
  }))
}

export async function getLatestVersion(projectId: string, viewer: AuthenticatedUser): Promise<VersionDetailDto | null> {
  await loadAccessibleProject(projectId, viewer)
  const latest = await prisma.projectVersion.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } })
  if (!latest) return null
  return {
    id: latest.id,
    version: latest.version,
    createdAt: latest.createdAt.toISOString(),
    files: latest.files as unknown as VersionFileSnapshot[],
  }
}

export async function getVersion(projectId: string, viewer: AuthenticatedUser, versionId: string): Promise<VersionDetailDto> {
  await loadAccessibleProject(projectId, viewer)
  const version = await prisma.projectVersion.findFirst({ where: { id: versionId, projectId } })
  if (!version) throw new ApiError(404, 'Version not found')
  return {
    id: version.id,
    version: version.version,
    createdAt: version.createdAt.toISOString(),
    files: version.files as unknown as VersionFileSnapshot[],
  }
}

// Shared by publishVersion (direct publish) and resolveUpdateRequest
// (publish-on-approve): atomically diffs current files against the latest
// snapshot, and only if changed (or this is the very first version ever):
// bumps Project.version, records the new snapshot, trims to
// MAX_VERSIONS_PER_PROJECT, and notifies other admins — attributed to
// `actingUsername`, which is the requester on an approved request, not
// necessarily the caller doing the approving.
async function runPublishTransaction(
  projectId: string,
  actingUsername: string,
): Promise<{ changed: boolean; version?: string }> {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({ where: { id: projectId } })
    if (!project) throw new ApiError(404, 'Project not found')

    const currentFiles = await tx.projectFile.findMany({ where: { projectId } })
    const latest = await tx.projectVersion.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } })
    const latestFiles = latest ? (latest.files as unknown as VersionFileSnapshot[]) : undefined

    const isFirstVersion = !latest
    const changedFiles = computeChangedFiles(currentFiles, latestFiles)
    if (!isFirstVersion && changedFiles.length === 0) {
      return { changed: false }
    }

    const nextVersion = bumpVersion(project.version)
    const snapshot: VersionFileSnapshot[] = currentFiles.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      content: file.content,
      type: file.type,
    }))

    await tx.project.update({ where: { id: projectId }, data: { version: nextVersion } })
    await tx.projectVersion.create({
      data: { projectId, version: nextVersion, files: snapshot as unknown as Prisma.InputJsonValue },
    })

    const allVersionIds = await tx.projectVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    if (allVersionIds.length > MAX_VERSIONS_PER_PROJECT) {
      const toTrim = allVersionIds.slice(0, allVersionIds.length - MAX_VERSIONS_PER_PROJECT)
      await tx.projectVersion.deleteMany({ where: { id: { in: toTrim.map((v) => v.id) } } })
    }

    await notifyOtherAdmins(tx, actingUsername, `${actingUsername} updated "${project.name}" to v${nextVersion}`, `/projects/${projectId}`)

    return { changed: true, version: nextVersion }
  })
}

async function requirePassword(username: string, password: string | undefined): Promise<void> {
  if (!password) {
    throw new ApiError(401, 'Your password is required to confirm this')
  }
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user?.passwordHash) {
    throw new ApiError(400, 'Your account has no password set — set one in Account Settings first')
  }
  const valid = await verifyPasswordHash(password, user.passwordHash)
  if (!valid) {
    throw new ApiError(401, 'Your password is incorrect')
  }
}

// "Update Project" for a project the caller owns (or, for an admin, one the
// top admin publishes directly). An admin can view/edit any project, but
// publishing someone else's code needs a deliberate extra step — their own
// account password, re-entered every time. A lower-level admin can't
// publish another user's project directly at all anymore — see
// requestUpdate/resolveUpdateRequest for the request-and-approve flow they
// go through instead (the top admin's approval is the actual publish).
export async function publishVersion(
  projectId: string,
  viewer: AuthenticatedUser,
  password?: string,
): Promise<{ changed: boolean; version?: string }> {
  const accessible = await loadAccessibleProject(projectId, viewer)

  if (viewer.role === 'admin' && accessible.ownerUsername !== viewer.username) {
    const topAdminUsername = await getTopAdminUsername()
    if (viewer.username !== topAdminUsername) {
      throw new ApiError(
        403,
        "Only the top admin can publish another user's project directly — send an update request instead, and the top admin can review and approve it.",
      )
    }
    await requirePassword(viewer.username, password)
  }

  return runPublishTransaction(projectId, viewer.username)
}

function toPendingUpdateRequestDto(request: {
  id: string
  requestedByUsername: string
  status: string
  createdAt: Date
}): PendingUpdateRequestDto {
  return {
    id: request.id,
    requestedByUsername: request.requestedByUsername,
    status: request.status as PendingUpdateRequestDto['status'],
    createdAt: request.createdAt.toISOString(),
  }
}

// The currently pending request for a project, if any — drives the review
// banner shown in Playground to anyone who can see the project.
export async function getPendingUpdateRequest(
  projectId: string,
  viewer: AuthenticatedUser,
): Promise<PendingUpdateRequestDto | null> {
  await loadAccessibleProject(projectId, viewer)
  const request = await prisma.pendingUpdateRequest.findFirst({
    where: { projectId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  })
  return request ? toPendingUpdateRequestDto(request) : null
}

// A lower-level admin's "pull request" — asks the top admin to publish this
// project's current files on their behalf, since they can no longer do it
// directly. No file snapshot is stored: the top admin reviews the same live
// diff Source Control already shows (current files vs. latest version), and
// approving publishes whatever is current at that time, just like a direct
// Update Project.
export async function requestUpdate(projectId: string, viewer: AuthenticatedUser): Promise<PendingUpdateRequestDto> {
  const accessible = await loadAccessibleProject(projectId, viewer)

  if (viewer.role !== 'admin' || accessible.ownerUsername === viewer.username) {
    throw new ApiError(400, 'Nothing to request — you can update this project directly')
  }

  const topAdminUsername = await getTopAdminUsername()
  if (!topAdminUsername) {
    throw new ApiError(409, 'No active top admin is available to review this request')
  }
  if (viewer.username === topAdminUsername) {
    throw new ApiError(400, 'You are the top admin — use Update Project directly')
  }

  const existing = await prisma.pendingUpdateRequest.findFirst({ where: { projectId, status: 'pending' } })
  if (existing) {
    throw new ApiError(409, 'There is already a pending update request for this project')
  }

  const request = await prisma.pendingUpdateRequest.create({
    data: { projectId, requestedByUsername: viewer.username },
  })

  await sendNotification(
    viewer.username,
    topAdminUsername,
    'message',
    `${viewer.username} requested to update "${accessible.name}" (owned by ${accessible.ownerUsername}).`,
    `/projects/${projectId}`,
  )

  return toPendingUpdateRequestDto(request)
}

// The top admin's decision on a pending request — the "PR merge" step.
// Approving requires the top admin's own password (the same deliberate
// confirmation direct publishing needs) and immediately publishes; the
// requester doesn't do anything further. Rejecting needs no extra
// confirmation, since nothing gets overwritten.
export async function resolveUpdateRequest(
  projectId: string,
  requestId: string,
  viewer: AuthenticatedUser,
  decision: 'approved' | 'rejected',
  password?: string,
): Promise<{ status: 'approved' | 'rejected'; changed?: boolean; version?: string }> {
  const accessible = await loadAccessibleProject(projectId, viewer)

  const topAdminUsername = await getTopAdminUsername()
  if (viewer.username !== topAdminUsername) {
    throw new ApiError(403, 'Only the top admin can approve or reject an update request')
  }

  const request = await prisma.pendingUpdateRequest.findUnique({ where: { id: requestId } })
  if (!request || request.projectId !== projectId) {
    throw new ApiError(404, 'Update request not found')
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'This update request has already been resolved')
  }

  if (decision === 'approved') {
    await requirePassword(viewer.username, password)

    const result = await runPublishTransaction(projectId, request.requestedByUsername)
    await prisma.pendingUpdateRequest.update({
      where: { id: requestId },
      data: { status: 'approved', resolvedAt: new Date(), resolvedByUsername: viewer.username },
    })
    await sendNotification(
      viewer.username,
      request.requestedByUsername,
      'message',
      result.changed
        ? `Your update to "${accessible.name}" was approved and published as v${result.version}.`
        : `Your update to "${accessible.name}" was approved, but there was nothing new to publish.`,
      `/projects/${projectId}`,
    )
    return { status: 'approved', changed: result.changed, version: result.version }
  }

  await prisma.pendingUpdateRequest.update({
    where: { id: requestId },
    data: { status: 'rejected', resolvedAt: new Date(), resolvedByUsername: viewer.username },
  })
  await sendNotification(
    viewer.username,
    request.requestedByUsername,
    'message',
    `Your update request for "${accessible.name}" was rejected.`,
    `/projects/${projectId}`,
  )
  return { status: 'rejected' }
}
