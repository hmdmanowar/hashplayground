import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { loadAccessibleProject } from '../projects/projects.service.js'
import { computeChangedFiles } from '../../lib/diff.js'
import { bumpVersion } from '../../lib/version.js'
import { notifyOtherAdmins } from '../../lib/notify.js'
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

// "Update Project" — atomically diffs current files against the latest
// snapshot, and only if changed (or this is the very first version ever):
// bumps Project.version, records the new snapshot, trims to
// MAX_VERSIONS_PER_PROJECT, and notifies other admins. Collapses what was
// three separate, non-atomic client calls (increment -> record -> notify)
// into one transaction, so a bumped version can never exist without its
// snapshot.
export async function publishVersion(
  projectId: string,
  viewer: AuthenticatedUser,
): Promise<{ changed: boolean; version?: string }> {
  await loadAccessibleProject(projectId, viewer)

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

    await notifyOtherAdmins(tx, viewer.username, `${viewer.username} updated "${project.name}" to v${nextVersion}`, `/projects/${projectId}`)

    return { changed: true, version: nextVersion }
  })
}
