import type { Tool } from 'jarvis'
import type { AuthenticatedUser } from '../../middleware/authTypes.js'
import { listFiles, createFile, saveFile, deleteFile } from '../files/files.service.js'

// Real tool access scoped to one Playground project's own files — reuses
// files.service.ts's existing functions (and the ownership check they
// already do via loadAccessibleProject) rather than querying Prisma
// directly, so path-uniqueness handling and validation stay in one place.
export function createProjectFileTools(projectId: string, viewer: AuthenticatedUser): Tool[] {
  const listTool: Tool<Record<string, never>, { files: string[] }> = {
    name: 'list_project_files',
    description: "List the paths of all files in this project.",
    inputSchema: {},
    risk: 'low',
    async execute() {
      const files = await listFiles(projectId, viewer)
      return { files: files.filter((f) => f.type === 'file').map((f) => f.path) }
    },
  }

  const readTool: Tool<{ path: string }, { content: string }> = {
    name: 'read_project_file',
    description: 'Read the contents of a file in this project.',
    inputSchema: { path: 'string' },
    risk: 'low',
    async execute({ path }) {
      const files = await listFiles(projectId, viewer)
      const file = files.find((f) => f.path === path && f.type === 'file')
      if (!file) throw new Error(`No file at "${path}"`)
      return { content: file.content }
    },
  }

  const writeTool: Tool<{ path: string; content: string }, { path: string }> = {
    name: 'write_project_file',
    description: 'Create or overwrite a file in this project.',
    inputSchema: { path: 'string', content: 'string' },
    risk: 'medium',
    async execute({ path, content }) {
      const files = await listFiles(projectId, viewer)
      const existing = files.find((f) => f.path === path && f.type === 'file')
      if (existing) {
        await saveFile(projectId, viewer, existing.id, content)
      } else {
        const name = path.split('/').pop() ?? path
        const created = await createFile(projectId, viewer, name, path)
        await saveFile(projectId, viewer, created.id, content)
      }
      return { path }
    },
  }

  const deleteTool: Tool<{ path: string }, { path: string }> = {
    name: 'delete_project_file',
    description: 'Permanently delete a file from this project.',
    inputSchema: { path: 'string' },
    risk: 'high',
    async execute({ path }) {
      const files = await listFiles(projectId, viewer)
      const existing = files.find((f) => f.path === path && f.type === 'file')
      if (!existing) throw new Error(`No file at "${path}"`)
      await deleteFile(projectId, viewer, existing.id)
      return { path }
    },
  }

  return [listTool, readTool, writeTool, deleteTool]
}
