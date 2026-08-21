import type { Project, User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../middleware/errorHandler.js'
import { seedFilesForTemplate, REACT_TEMPLATE, HTML_TEMPLATE } from './seedFiles.js'
import { notifyOtherAdmins } from '../../lib/notify.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'

export interface ProjectOwnerDto {
  username: string
  role: 'admin' | 'user'
  name?: string
  email?: string
  joinedAt: string
}

export interface ProjectDto {
  id: string
  name: string
  description?: string
  template: string
  // Derived from the project's actual current files (root index.html or
  // not), not just the label picked at creation — stays accurate even if
  // content changes since then. See ProjectDashboard's Technology column.
  technology: string
  version: string
  ownerUsername: string
  owner: ProjectOwnerDto
  createdAt: string
  updatedAt: string
}

type ProjectWithOwner = Project & { owner: User }

function toProjectDto(project: ProjectWithOwner, hasIndexHtml: boolean): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? undefined,
    template: project.template,
    technology: hasIndexHtml ? HTML_TEMPLATE : REACT_TEMPLATE,
    version: project.version,
    ownerUsername: project.ownerUsername,
    owner: {
      username: project.owner.username,
      role: project.owner.role,
      name: project.owner.name ?? undefined,
      email: project.owner.email ?? undefined,
      joinedAt: project.owner.joinedAt.toISOString(),
    },
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

async function hasRootIndexHtml(projectId: string): Promise<boolean> {
  return (await prisma.projectFile.findFirst({ where: { projectId, path: 'index.html' } })) !== null
}

export async function listVisibleProjects(viewer: AuthenticatedUser, ownerUsernameFilter?: string): Promise<ProjectDto[]> {
  const where = viewer.role === 'admin' ? (ownerUsernameFilter ? { ownerUsername: ownerUsernameFilter } : {}) : { ownerUsername: viewer.username }

  const projects = await prisma.project.findMany({
    where,
    include: { owner: true },
    orderBy: { updatedAt: 'desc' },
  })
  const indexHtmlProjectIds = new Set(
    (
      await prisma.projectFile.findMany({
        where: { projectId: { in: projects.map((p) => p.id) }, path: 'index.html' },
        select: { projectId: true },
      })
    ).map((f) => f.projectId),
  )
  return projects.map((project) => toProjectDto(project, indexHtmlProjectIds.has(project.id)))
}

// Shared by the files/versions/exports modules too — throws 404 uniformly
// for "doesn't exist" and "exists but you can't see it," so unauthorized
// requests never learn a project id is real.
export async function loadAccessibleProject(projectId: string, viewer: AuthenticatedUser): Promise<ProjectWithOwner> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { owner: true } })
  if (!project) throw new ApiError(404, 'Project not found')
  if (viewer.role !== 'admin' && project.ownerUsername !== viewer.username) {
    throw new ApiError(404, 'Project not found')
  }
  return project
}

export async function getProject(projectId: string, viewer: AuthenticatedUser): Promise<ProjectDto> {
  const project = await loadAccessibleProject(projectId, viewer)
  return toProjectDto(project, await hasRootIndexHtml(projectId))
}

export async function createProject(
  ownerUsername: string,
  input: { name: string; description?: string; template: string },
): Promise<{ project: ProjectDto; files: { id: string; name: string; path: string; content: string; type: string }[] }> {
  const seedFiles = seedFilesForTemplate(input.template)

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name: input.name, description: input.description, template: input.template, ownerUsername },
      include: { owner: true },
    })
    const files = await Promise.all(
      seedFiles.map((file) =>
        tx.projectFile.create({ data: { projectId: project.id, name: file.name, path: file.path, content: file.content } }),
      ),
    )
    await notifyOtherAdmins(tx, ownerUsername, `${ownerUsername} created a new project "${project.name}"`, `/projects/${project.id}`)
    return { project, files }
  })

  const hasIndexHtml = result.files.some((f) => f.path === 'index.html')
  return { project: toProjectDto(result.project, hasIndexHtml), files: result.files }
}

export async function importProject(
  ownerUsername: string,
  input: { name: string; template: string; entries: { path: string; name: string; content: string }[] },
): Promise<{ project: ProjectDto; files: { id: string; name: string; path: string; content: string; type: string }[] }> {
  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name: input.name, description: 'Imported from a .zip file', template: input.template, ownerUsername },
      include: { owner: true },
    })
    const files = await Promise.all(
      input.entries.map((entry) =>
        tx.projectFile.create({ data: { projectId: project.id, name: entry.name, path: entry.path, content: entry.content } }),
      ),
    )
    return { project, files }
  })

  const hasIndexHtml = result.files.some((f) => f.path === 'index.html')
  return { project: toProjectDto(result.project, hasIndexHtml), files: result.files }
}

export async function updateProject(
  projectId: string,
  viewer: AuthenticatedUser,
  changes: { name?: string; description?: string },
): Promise<ProjectDto> {
  await loadAccessibleProject(projectId, viewer)
  const updated = await prisma.project.update({ where: { id: projectId }, data: changes, include: { owner: true } })
  return toProjectDto(updated, await hasRootIndexHtml(projectId))
}

export async function deleteProject(projectId: string, viewer: AuthenticatedUser): Promise<void> {
  await loadAccessibleProject(projectId, viewer)
  await prisma.project.delete({ where: { id: projectId } }) // FK cascades handle files/versions/exports
}

export async function duplicateProject(
  projectId: string,
  viewer: AuthenticatedUser,
): Promise<{ project: ProjectDto; files: { id: string; name: string; path: string; content: string; type: string }[] }> {
  const source = await loadAccessibleProject(projectId, viewer)
  const sourceFiles = await prisma.projectFile.findMany({ where: { projectId } })

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: `${source.name} (copy)`,
        description: source.description,
        template: source.template,
        ownerUsername: source.ownerUsername,
        version: '0.0.0', // fresh lineage, no copied version/export history — matches today's behavior
      },
      include: { owner: true },
    })
    const files = await Promise.all(
      sourceFiles.map((file) =>
        tx.projectFile.create({
          data: { projectId: project.id, name: file.name, path: file.path, content: file.content, type: file.type },
        }),
      ),
    )
    return { project, files }
  })

  const hasIndexHtml = result.files.some((f) => f.path === 'index.html')
  return { project: toProjectDto(result.project, hasIndexHtml), files: result.files }
}
