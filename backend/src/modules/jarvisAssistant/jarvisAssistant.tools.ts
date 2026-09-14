import type { Tool } from 'jarvis'
import { prisma } from '../../lib/prisma.js'

// Real tool access for the personal assistant page, but scoped to a
// per-account scratch workspace backed by Postgres (JarvisWorkspaceFile) —
// not a real filesystem and not shell access. See the plan's reasoning: any
// signed-up visitor getting real shell/fs access on the shared production
// server is a very different (and much riskier) thing than an AI agent on
// someone's own laptop, so this deliberately stops at Prisma-backed files.
export function createPersonalWorkspaceTools(ownerUsername: string): Tool[] {
  const listTool: Tool<Record<string, never>, { files: string[] }> = {
    name: 'list_files',
    description: "List the paths of all files in the user's personal Jarvis workspace.",
    inputSchema: {},
    risk: 'low',
    async execute() {
      const files = await prisma.jarvisWorkspaceFile.findMany({
        where: { ownerUsername },
        select: { path: true },
        orderBy: { path: 'asc' },
      })
      return { files: files.map((file) => file.path) }
    },
  }

  const readTool: Tool<{ path: string }, { content: string }> = {
    name: 'read_file',
    description: "Read the contents of a file in the user's personal Jarvis workspace.",
    inputSchema: { path: 'string' },
    risk: 'low',
    async execute({ path }) {
      const file = await prisma.jarvisWorkspaceFile.findUnique({
        where: { ownerUsername_path: { ownerUsername, path } },
      })
      if (!file) throw new Error(`No file at "${path}"`)
      return { content: file.content }
    },
  }

  const writeTool: Tool<{ path: string; content: string }, { path: string }> = {
    name: 'write_file',
    description: "Create or overwrite a file in the user's personal Jarvis workspace.",
    inputSchema: { path: 'string', content: 'string' },
    risk: 'medium',
    async execute({ path, content }) {
      await prisma.jarvisWorkspaceFile.upsert({
        where: { ownerUsername_path: { ownerUsername, path } },
        create: { ownerUsername, path, content },
        update: { content },
      })
      return { path }
    },
  }

  const deleteTool: Tool<{ path: string }, { path: string }> = {
    name: 'delete_file',
    description: "Permanently delete a file from the user's personal Jarvis workspace.",
    inputSchema: { path: 'string' },
    risk: 'high',
    async execute({ path }) {
      const file = await prisma.jarvisWorkspaceFile.findUnique({
        where: { ownerUsername_path: { ownerUsername, path } },
      })
      if (!file) throw new Error(`No file at "${path}"`)
      await prisma.jarvisWorkspaceFile.delete({ where: { id: file.id } })
      return { path }
    },
  }

  return [listTool, readTool, writeTool, deleteTool]
}
