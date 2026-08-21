export interface ProjectOwner {
  username: string
  role: 'admin' | 'user'
  name?: string
  email?: string
  joinedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  template: string
  technology: string
  createdAt: string
  updatedAt: string
  version: string
  ownerUsername: string
  owner: ProjectOwner
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: 'file' | 'folder'
}

export interface ProjectVersion {
  id: string
  version: string
  createdAt: string
  files: Pick<ProjectFile, 'id' | 'name' | 'path' | 'content' | 'type'>[]
}
