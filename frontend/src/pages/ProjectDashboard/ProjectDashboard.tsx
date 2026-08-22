import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  FolderIcon,
  ExternalLinkIcon,
  PencilIcon,
  CopyIcon,
  TrashIcon,
  UploadIcon,
  CheckCircleIcon,
} from '../../components/Icons/Icons'
import RowActionsMenu, {
  menuItemClass,
  menuItemDangerClass,
  menuIconClass,
} from '../../components/RowActionsMenu/RowActionsMenu'
import { usePageHeaderActions } from '../../hooks/usePageHeaderActions'
import { listVisibleProjects, updateProject, deleteProject, duplicateProject, importProject } from '../../services/projectService'
import { readProjectZip } from '../../lib/importProject'
import { listUsers, type UserSummary } from '../../services/userService'
import { listExports, getExportCount, type ExportRecord } from '../../services/exportService'
import { REACT_TEMPLATE, HTML_TEMPLATE } from '../../constants/projectTemplates'
import type { Project } from '../../types/project'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import PromptDialog from '../../components/PromptDialog/PromptDialog'
import Select from '../../components/Select/Select'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import { getCached, setCached } from '../../lib/dataCache'

const BASE_COLUMNS = [
  'Project Name',
  'Description',
  'Technology',
  'Last Modified',
  'Created',
  'Status',
  'Version',
  'Actions',
]

const ALL_USERS_VALUE = 'all'

type DialogRequest =
  | { kind: 'prompt'; title: string; defaultValue?: string; onSubmit: (value: string) => void }
  | { kind: 'confirm'; title: string; message: string; onConfirm: () => void }
  | { kind: 'exportHistory'; projectName: string; records: ExportRecord[] }
  | { kind: 'error'; title: string; message: string }
  | null

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ProjectDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const projectsCacheKey = user ? `projects:${user.username}` : null
  const cachedProjects = projectsCacheKey ? getCached<Project[]>(projectsCacheKey) : undefined
  const [allProjects, setAllProjects] = useState<Project[]>(cachedProjects ?? [])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(cachedProjects ? 'ready' : 'loading')
  const [userOptions, setUserOptions] = useState<UserSummary[]>([])
  const [exportCountByProjectId, setExportCountByProjectId] = useState<Map<string, number>>(new Map())
  const [selectedUsername, setSelectedUsername] = useState(ALL_USERS_VALUE)
  const [dialog, setDialog] = useState<DialogRequest>(null)
  const [importProgress, setImportProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  usePageHeaderActions(
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) handleImportZip(file)
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
      >
        <UploadIcon className="h-3.5 w-3.5" />
        Import project
      </button>
      <Link
        to="/projects/new"
        className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
      >
        + Create Project
      </Link>
    </div>,
  )

  async function refreshProjects() {
    if (!user) return
    try {
      const data = await listVisibleProjects(user)
      setCached(`projects:${user.username}`, data)
      setAllProjects(data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    refreshProjects()
  }, [user])

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) listUsers().then(setUserOptions)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || allProjects.length === 0) return
    Promise.all(allProjects.map((project) => getExportCount(project.id).then((count) => [project.id, count] as const))).then(
      (entries) => setExportCountByProjectId(new Map(entries)),
    )
  }, [isAdmin, allProjects])

  if (!user) return null

  const currentUser = user
  const profileComplete = Boolean(currentUser.name?.trim() && currentUser.email?.trim())
  const usersWithNames = userOptions.filter((entry) => entry.name)
  const tableColumns = isAdmin
    ? ['Name', 'Project Name', 'Role', ...BASE_COLUMNS.slice(1, -1), 'Exported', 'Actions']
    : BASE_COLUMNS
  const projects =
    isAdmin && selectedUsername !== ALL_USERS_VALUE
      ? allProjects.filter((project) => project.ownerUsername === selectedUsername)
      : allProjects

  async function handleImportZip(file: File) {
    if (!profileComplete) {
      setDialog({
        kind: 'error',
        title: 'Complete your profile first',
        message: 'Add your name and email in Account Settings before importing a project.',
      })
      return
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setDialog({ kind: 'error', title: 'Import failed', message: 'Only .zip files are supported.' })
      return
    }

    setImportProgress(0)
    try {
      const { files } = await readProjectZip(file, setImportProgress)

      const projectName = file.name.replace(/\.zip$/i, '').trim() || 'Imported project'
      const template = files.some((f) => f.path === 'index.html') ? HTML_TEMPLATE : REACT_TEMPLATE
      const { project } = await importProject({ name: projectName, template, entries: files })

      // Hold the overlay at 100% (showing the success state) for a moment
      // rather than dismissing it immediately, so there's no gap between
      // "import finished" and the Playground actually being on screen.
      setImportProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 900))
      navigate(`/projects/${project.id}`)
    } catch (error) {
      setImportProgress(null)
      const message = error instanceof Error ? error.message : 'Could not read this zip file.'
      setDialog({ kind: 'error', title: 'Import failed', message })
    }
  }

  function handleOpen(id: string) {
    navigate(`/projects/${id}`)
  }

  function handleRename(id: string, currentName: string) {
    setDialog({
      kind: 'prompt',
      title: 'Rename project',
      defaultValue: currentName,
      onSubmit: async (name) => {
        if (name !== currentName) {
          try {
            await updateProject(id, { name })
            await refreshProjects()
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not rename this project')
          }
        }
        setDialog(null)
      },
    })
  }

  async function handleDuplicate(id: string) {
    try {
      const copy = await duplicateProject(id)
      if (!copy) return
      await refreshProjects()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not duplicate this project')
    }
  }

  function handleDelete(id: string, name: string) {
    setDialog({
      kind: 'confirm',
      title: 'Delete project',
      message: `Delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteProject(id)
          await refreshProjects()
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Could not delete this project')
        }
        setDialog(null)
      },
    })
  }

  async function handleShowExportHistory(projectId: string, projectName: string) {
    try {
      const records = await listExports(projectId)
      setDialog({ kind: 'exportHistory', projectName, records })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load export history')
    }
  }

  return (
    <div>
      {dialog?.kind === 'prompt' && (
        <PromptDialog
          open
          title={dialog.title}
          defaultValue={dialog.defaultValue}
          confirmLabel="Rename"
          onSubmit={dialog.onSubmit}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'error' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setDialog(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">{dialog.title}</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{dialog.message}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {importProgress !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl">
            {importProgress === 100 ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <CheckCircleIcon className="h-8 w-8 text-[var(--color-primary)]" />
                <p className="text-sm font-medium">Import successful — opening project…</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">Importing project…</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--border-panel)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary-strong)] transition-all"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-xs text-[var(--color-muted)]">{importProgress}%</p>
              </>
            )}
          </div>
        </div>
      )}

      {dialog?.kind === 'confirm' && (
        <ConfirmDialog
          open
          title={dialog.title}
          message={dialog.message}
          confirmLabel="Delete"
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'exportHistory' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setDialog(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Export history — {dialog.projectName}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Exported {dialog.records.length} time{dialog.records.length === 1 ? '' : 's'}
            </p>

            <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-[var(--border-panel)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-app)]">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">Version</th>
                    <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">Exported at</th>
                    <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">File size</th>
                  </tr>
                </thead>
                <tbody>
                  {dialog.records.map((record) => (
                    <tr key={record.id} className="border-t border-[var(--border-panel)]">
                      <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1">v{record.version}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 text-[var(--color-muted)]">
                        {new Date(record.exportedAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 text-[var(--color-muted)]">
                        {formatFileSize(record.fileSizeBytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={selectedUsername}
              onChange={setSelectedUsername}
              options={[
                { value: ALL_USERS_VALUE, label: 'By Names' },
                ...usersWithNames.map((entry) => ({
                  value: entry.username,
                  label: entry.name ?? entry.username,
                })),
              ]}
            />
          </div>
        </div>
      )}

      {status === 'loading' ? (
        <LoadingOverlay />
      ) : status === 'error' ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] p-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">Couldn't load projects.</p>
          <button
            type="button"
            onClick={refreshProjects}
            className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
            <FolderIcon className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-medium">No projects yet</h2>
          <p className="max-w-sm text-sm text-[var(--color-muted)]">
            {isAdmin && selectedUsername !== ALL_USERS_VALUE && selectedUsername !== currentUser.username
              ? `"${selectedUsername}" hasn't created any projects yet.`
              : 'Start your first project and begin building in Hash Playground.'}
          </p>
          <Link
            to="/projects/new"
            className="mt-2 cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            + Create Project
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border-panel)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-panel)]">
              <tr>
                {tableColumns.map((col) => (
                  <th key={col} className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const exportCount = exportCountByProjectId.get(project.id) ?? 0

                return (
                <tr key={project.id} className="border-t border-[var(--border-panel)]">
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">
                      {project.owner.name ?? '—'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">{project.name}</td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)] capitalize">
                      {project.owner.role}
                    </td>
                  )}
                  <td
                    className="max-w-[220px] truncate px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]"
                    title={project.description || undefined}
                  >
                    {project.description || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">{project.technology}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">
                    {new Date(project.updatedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">
                    {new Date(project.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">&mdash;</td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">v{project.version ?? '0.0.0'}</td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5">
                      {exportCount === 0 ? (
                        <span className="text-[var(--color-muted)]">Not exported</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleShowExportHistory(project.id, project.name)}
                          className="cursor-pointer font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                        >
                          {exportCount}
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5">
                    <RowActionsMenu>
                      <button type="button" onClick={() => handleOpen(project.id)} className={menuItemClass}>
                        <ExternalLinkIcon className={menuIconClass} />
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRename(project.id, project.name)}
                        className={menuItemClass}
                      >
                        <PencilIcon className={menuIconClass} />
                        Rename
                      </button>
                      <button type="button" onClick={() => handleDuplicate(project.id)} className={menuItemClass}>
                        <CopyIcon className={menuIconClass} />
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id, project.name)}
                        className={menuItemDangerClass}
                      >
                        <TrashIcon className={menuIconClass} />
                        Delete
                      </button>
                    </RowActionsMenu>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProjectDashboard
