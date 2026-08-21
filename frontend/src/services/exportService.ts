import { request } from '../lib/apiClient'

export interface ExportRecord {
  id: string
  version: string
  exportedAt: string
  fileSizeBytes: number
}

export async function recordExport(projectId: string, version: string, fileSizeBytes: number): Promise<ExportRecord> {
  return request<ExportRecord>(`/projects/${projectId}/exports`, { method: 'POST', body: { version, fileSizeBytes } })
}

export async function listExports(projectId: string): Promise<ExportRecord[]> {
  return request<ExportRecord[]>(`/projects/${projectId}/exports`)
}

export async function getExportCount(projectId: string): Promise<number> {
  return (await listExports(projectId)).length
}
