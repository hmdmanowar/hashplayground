import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

interface ProjectCardProps {
  icon: ComponentType<{ className?: string }>
  label: string
  description: string
  path: string
  accessLabel: string
  userCount: number
}

function ProjectCard({ icon: Icon, label, description, path, accessLabel, userCount }: ProjectCardProps) {
  return (
    <Link
      to={path}
      className="flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--color-primary)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-[var(--border-panel)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
          {accessLabel}
        </span>
      </div>
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
      </div>
      <p className="text-xs text-[var(--color-muted)]">{userCount} total users</p>
    </Link>
  )
}

export default ProjectCard
