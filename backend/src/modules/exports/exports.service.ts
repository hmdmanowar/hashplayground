import { prisma } from '../../lib/prisma.js'
import { loadAccessibleProject } from '../projects/projects.service.js'
import { notifyOtherAdmins } from '../../lib/notify.js'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'

export interface ExportRecordDto {
  id: string
  version: string
  exportedAt: string
  fileSizeBytes: number
}

function toExportDto(record: { id: string; version: string; exportedAt: Date; fileSizeBytes: number }): ExportRecordDto {
  return { id: record.id, version: record.version, exportedAt: record.exportedAt.toISOString(), fileSizeBytes: record.fileSizeBytes }
}

export async function listExports(projectId: string, viewer: AuthenticatedUser): Promise<ExportRecordDto[]> {
  await loadAccessibleProject(projectId, viewer)
  const records = await prisma.exportRecord.findMany({ where: { projectId }, orderBy: { exportedAt: 'desc' } })
  return records.map(toExportDto)
}

export async function recordExport(
  projectId: string,
  viewer: AuthenticatedUser,
  version: string,
  fileSizeBytes: number,
): Promise<ExportRecordDto> {
  const project = await loadAccessibleProject(projectId, viewer)

  const record = await prisma.$transaction(async (tx) => {
    const previousExport = await tx.exportRecord.findFirst({ where: { projectId }, orderBy: { exportedAt: 'desc' } })
    const created = await tx.exportRecord.create({ data: { projectId, version, fileSizeBytes } })

    const versionText =
      previousExport && previousExport.version !== version ? `v${previousExport.version} → v${version}` : `v${version}`
    await notifyOtherAdmins(
      tx,
      viewer.username,
      `${viewer.username} exported "${project.name}" (${versionText})`,
      `/projects/${projectId}`,
    )

    return created
  })

  return toExportDto(record)
}
