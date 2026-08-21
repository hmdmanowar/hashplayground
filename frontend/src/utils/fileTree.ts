import type { ProjectFile } from '../types/project'

export interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children: FileTreeNode[]
}

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  const folderIndex = new Map<string, FileTreeNode>()

  function ensureFolder(path: string, name: string, siblings: FileTreeNode[]): FileTreeNode {
    const existing = folderIndex.get(path)
    if (existing) return existing

    const node: FileTreeNode = { id: `virtual:${path}`, name, path, type: 'folder', children: [] }
    folderIndex.set(path, node)
    siblings.push(node)
    return node
  }

  function resolveParentSiblings(path: string): FileTreeNode[] {
    const segments = path.split('/')
    segments.pop()

    let siblings = root
    let current = ''
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment
      siblings = ensureFolder(current, segment, siblings).children
    }
    return siblings
  }

  for (const file of files) {
    const siblings = resolveParentSiblings(file.path)

    if (file.type === 'folder') {
      const existing = folderIndex.get(file.path)
      if (existing) {
        existing.id = file.id
      } else {
        const node: FileTreeNode = { id: file.id, name: file.name, path: file.path, type: 'folder', children: [] }
        folderIndex.set(file.path, node)
        siblings.push(node)
      }
    } else {
      siblings.push({ id: file.id, name: file.name, path: file.path, type: 'file', children: [] })
    }
  }

  sortTree(root)
  return root
}

export function allFolderPaths(files: ProjectFile[]): string[] {
  const paths = new Set<string>()
  for (const file of files) {
    const segments = file.path.split('/')
    segments.pop()
    let current = ''
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment
      paths.add(current)
    }
  }
  return [...paths]
}

function sortTree(nodes: FileTreeNode[]) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  nodes.forEach((node) => sortTree(node.children))
}
