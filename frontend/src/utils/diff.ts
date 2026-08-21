import type { ProjectFile, ProjectVersion } from '../types/project'

export type ChangeStatus = 'added' | 'modified' | 'deleted'

export interface ChangedFile {
  path: string
  name: string
  status: ChangeStatus
}

export function computeChangedFiles(currentFiles: ProjectFile[], latestVersion: ProjectVersion | undefined): ChangedFile[] {
  if (!latestVersion) return []

  const currentByPath = new Map(currentFiles.filter((file) => file.type === 'file').map((file) => [file.path, file]))
  const versionByPath = new Map(latestVersion.files.filter((file) => file.type === 'file').map((file) => [file.path, file]))
  const paths = new Set([...currentByPath.keys(), ...versionByPath.keys()])

  const changed: ChangedFile[] = []
  paths.forEach((path) => {
    const current = currentByPath.get(path)
    const original = versionByPath.get(path)

    if (current && !original) {
      changed.push({ path, name: current.name, status: 'added' })
    } else if (!current && original) {
      changed.push({ path, name: original.name, status: 'deleted' })
    } else if (current && original && current.content !== original.content) {
      changed.push({ path, name: current.name, status: 'modified' })
    }
  })

  return changed.sort((a, b) => a.path.localeCompare(b.path))
}
