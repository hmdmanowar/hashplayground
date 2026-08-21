import { Prisma, type ProjectFile } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { loadAccessibleProject } from '../projects/projects.service.js'
import { computeChangedFiles } from '../../lib/diff.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'

function toFileDto(file: ProjectFile) {
  return { id: file.id, name: file.name, path: file.path, content: file.content, type: file.type }
}

function isUniquePathConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export async function listFiles(projectId: string, viewer: AuthenticatedUser) {
  await loadAccessibleProject(projectId, viewer)
  const files = await prisma.projectFile.findMany({ where: { projectId } })
  return files.map(toFileDto)
}

export async function createFile(projectId: string, viewer: AuthenticatedUser, name: string, path: string) {
  await loadAccessibleProject(projectId, viewer)
  try {
    const file = await prisma.projectFile.create({ data: { projectId, name, path, type: 'file' } })
    return toFileDto(file)
  } catch (error) {
    if (isUniquePathConflict(error)) throw new ApiError(409, `A file already exists at "${path}"`)
    throw error
  }
}

export async function createFolder(projectId: string, viewer: AuthenticatedUser, name: string, path: string) {
  await loadAccessibleProject(projectId, viewer)
  try {
    const file = await prisma.projectFile.create({ data: { projectId, name, path, type: 'folder' } })
    return toFileDto(file)
  } catch (error) {
    if (isUniquePathConflict(error)) throw new ApiError(409, `A folder already exists at "${path}"`)
    throw error
  }
}

// Replaces the frontend's per-tab loop of individual saveFile() calls with
// one round trip, and folds in the separate touchProject() call.
export async function saveFilesBatch(
  projectId: string,
  viewer: AuthenticatedUser,
  entries: { fileId: string; content: string }[],
) {
  await loadAccessibleProject(projectId, viewer)
  const updated = await prisma.$transaction(async (tx) => {
    const files = await Promise.all(
      entries.map((entry) => tx.projectFile.update({ where: { id: entry.fileId }, data: { content: entry.content } })),
    )
    await tx.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } })
    return files
  })
  return updated.map(toFileDto)
}

export async function saveFile(projectId: string, viewer: AuthenticatedUser, fileId: string, content: string) {
  await loadAccessibleProject(projectId, viewer)
  const file = await prisma.projectFile.update({ where: { id: fileId }, data: { content } })
  return toFileDto(file)
}

export async function renameFile(projectId: string, viewer: AuthenticatedUser, fileId: string, name: string) {
  await loadAccessibleProject(projectId, viewer)
  const existing = await prisma.projectFile.findUnique({ where: { id: fileId } })
  if (!existing) throw new ApiError(404, 'File not found')
  const folder = existing.path.includes('/') ? existing.path.slice(0, existing.path.lastIndexOf('/') + 1) : ''
  const file = await prisma.projectFile.update({ where: { id: fileId }, data: { name, path: `${folder}${name}` } })
  return toFileDto(file)
}

export async function deleteFile(projectId: string, viewer: AuthenticatedUser, fileId: string) {
  await loadAccessibleProject(projectId, viewer)
  await prisma.projectFile.delete({ where: { id: fileId } })
}

export async function renamePathPrefix(projectId: string, viewer: AuthenticatedUser, oldPrefix: string, newPrefix: string) {
  await loadAccessibleProject(projectId, viewer)
  const files = await prisma.projectFile.findMany({ where: { projectId } })

  const updated = await prisma.$transaction(async (tx) => {
    const results: ProjectFile[] = []
    for (const file of files) {
      let newPath: string | null = null
      if (file.path === oldPrefix) newPath = newPrefix
      else if (file.path.startsWith(`${oldPrefix}/`)) newPath = `${newPrefix}${file.path.slice(oldPrefix.length)}`
      if (newPath !== null) {
        results.push(
          await tx.projectFile.update({
            where: { id: file.id },
            data: { path: newPath, name: newPath.split('/').pop() ?? newPath },
          }),
        )
      }
    }
    return results
  })

  return updated.map(toFileDto)
}

export async function deleteByPathPrefix(projectId: string, viewer: AuthenticatedUser, prefix: string) {
  await loadAccessibleProject(projectId, viewer)
  await prisma.projectFile.deleteMany({
    where: { projectId, OR: [{ path: prefix }, { path: { startsWith: `${prefix}/` } }] },
  })
}

// Reverts one or more (or, if `paths` is omitted, all) changed files back to
// the last recorded ProjectVersion snapshot — the server-side equivalent of
// the frontend's applyDiscard + syncFilesAfterRevert loop, done transactionally.
export async function discardChanges(projectId: string, viewer: AuthenticatedUser, paths?: string[]) {
  await loadAccessibleProject(projectId, viewer)

  const [currentFiles, latestVersion] = await Promise.all([
    prisma.projectFile.findMany({ where: { projectId } }),
    prisma.projectVersion.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } }),
  ])

  const versionFiles = (latestVersion?.files ?? []) as { id: string; name: string; path: string; content: string; type: string }[]
  let changed = computeChangedFiles(currentFiles, latestVersion ? versionFiles : undefined)
  if (paths) {
    const wanted = new Set(paths)
    changed = changed.filter((change) => wanted.has(change.path))
  }

  await prisma.$transaction(async (tx) => {
    for (const change of changed) {
      const versionFile = versionFiles.find((f) => f.path === change.path)
      if (change.status === 'added') {
        const existing = currentFiles.find((f) => f.path === change.path)
        if (existing) await tx.projectFile.delete({ where: { id: existing.id } })
      } else if (change.status === 'deleted' && versionFile) {
        await tx.projectFile.create({
          data: { projectId, name: versionFile.name, path: versionFile.path, content: versionFile.content, type: 'file' },
        })
      } else if (change.status === 'modified' && versionFile) {
        const existing = currentFiles.find((f) => f.path === change.path)
        if (existing) await tx.projectFile.update({ where: { id: existing.id }, data: { content: versionFile.content } })
      }
    }
  })

  const finalFiles = await prisma.projectFile.findMany({ where: { projectId } })
  return finalFiles.map(toFileDto)
}
