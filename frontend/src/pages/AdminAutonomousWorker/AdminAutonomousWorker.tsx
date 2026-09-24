import { useEffect, useState } from 'react'
import {
  getWorkerState,
  setWorkerEnabled,
  listTasks,
  queueTask,
  cancelTask,
  listCycles,
  type WorkerState,
  type AutonomousTask,
  type CycleLogEntry,
} from '../../services/autonomousWorkerService'
import { useToast } from '../../context/ToastContext'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import { BotIcon, ClockIcon } from '../../components/Icons/Icons'

const TASK_STATUS_LABELS: Record<AutonomousTask['status'], string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
  failed: 'Failed',
}

const TASK_STATUS_CLASSES: Record<AutonomousTask['status'], string> = {
  pending: 'bg-[var(--hover-overlay)] text-[var(--color-muted)]',
  in_progress: 'bg-amber-500/10 text-amber-500',
  done: 'bg-emerald-500/10 text-emerald-500',
  failed: 'bg-red-500/10 text-red-500',
}

const CYCLE_OUTCOME_CLASSES: Record<CycleLogEntry['outcome'], string> = {
  pushed: 'bg-emerald-500/10 text-emerald-500',
  reverted: 'bg-amber-500/10 text-amber-500',
  'no-changes': 'bg-[var(--hover-overlay)] text-[var(--color-muted)]',
  error: 'bg-red-500/10 text-red-500',
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

function AdminAutonomousWorker() {
  const { showToast } = useToast()
  const [state, setState] = useState<WorkerState | null>(null)
  const [tasks, setTasks] = useState<AutonomousTask[]>([])
  const [cycles, setCycles] = useState<CycleLogEntry[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [taskDescription, setTaskDescription] = useState('')
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [isTogglingState, setIsTogglingState] = useState(false)

  function refresh() {
    return Promise.all([getWorkerState(), listTasks(), listCycles()]).then(([nextState, nextTasks, nextCycles]) => {
      setState(nextState)
      setTasks(nextTasks)
      setCycles(nextCycles)
    })
  }

  useEffect(() => {
    refresh()
      .then(() => setLoadStatus('ready'))
      .catch(() => setLoadStatus('error'))
  }, [])

  async function handleToggle() {
    if (!state || isTogglingState) return
    setIsTogglingState(true)
    try {
      const next = await setWorkerEnabled(!state.enabled)
      setState(next)
      showToast(next.enabled ? 'Autonomous worker enabled.' : 'Autonomous worker disabled.', { kind: 'success' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not change worker state')
    } finally {
      setIsTogglingState(false)
    }
  }

  async function handleQueueTask(event: React.FormEvent) {
    event.preventDefault()
    const description = taskDescription.trim()
    if (!description || isSubmittingTask) return
    setIsSubmittingTask(true)
    try {
      const task = await queueTask(description)
      setTasks((prev) => [task, ...prev])
      setTaskDescription('')
      showToast('Task queued.', { kind: 'success' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not queue task')
    } finally {
      setIsSubmittingTask(false)
    }
  }

  async function handleCancelTask(task: AutonomousTask) {
    try {
      await cancelTask(task.id)
      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      showToast('Task cancelled.', { kind: 'success' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not cancel task')
    }
  }

  if (loadStatus === 'loading') return <LoadingOverlay />

  if (loadStatus === 'error' || !state) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] p-10 text-center">
        <p className="text-sm text-[var(--color-muted)]">Couldn't load the autonomous worker's state.</p>
      </div>
    )
  }

  const lastActivity = cycles[0]?.timestamp

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
            <BotIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--text-app)]">Jarvis autonomous worker</p>
            <p className="text-xs text-[var(--color-muted)]">
              {lastActivity ? `Last activity: ${formatTimestamp(lastActivity)}` : 'No activity reported yet.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isTogglingState}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            state.enabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[var(--color-muted)] hover:opacity-90'
          }`}
        >
          {state.enabled ? 'Enabled — turn off' : 'Disabled — turn on'}
        </button>
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        This page doesn't run the worker itself — it just controls whatever's already running `npm run autonomous`
        elsewhere, which polls this state before each cycle. It won't react instantly; the worker checks in once per
        its own cycle interval.
      </p>

      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4">
        <p className="mb-3 text-sm font-medium text-[var(--text-app)]">Queue a task</p>
        <form onSubmit={handleQueueTask} className="flex flex-col gap-2 sm:flex-row">
          <textarea
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="e.g. Add a test for the SearchTool's max-results cap"
            rows={2}
            className="flex-1 resize-none rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-app)] outline-none focus:border-[var(--color-primary-strong)]"
          />
          <button
            type="submit"
            disabled={isSubmittingTask || !taskDescription.trim()}
            className="shrink-0 rounded-md bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Queue task
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {tasks.length === 0 && <p className="text-sm text-[var(--color-muted)]">No tasks queued yet.</p>}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-1 rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_CLASSES[task.status]}`}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">{formatTimestamp(task.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-app)]">{task.description}</p>
                {task.resultSummary && <p className="mt-1 text-xs text-[var(--color-muted)]">{task.resultSummary}</p>}
              </div>
              {task.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleCancelTask(task)}
                  className="shrink-0 text-xs text-[var(--color-muted)] hover:text-red-500"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[var(--text-app)]">
          <ClockIcon className="h-4 w-4" />
          Recent cycles
        </p>
        {cycles.length === 0 && <p className="text-sm text-[var(--color-muted)]">No cycles reported yet.</p>}
        <div className="space-y-2">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CYCLE_OUTCOME_CLASSES[cycle.outcome]}`}>
                  {cycle.outcome}
                </span>
                <span className="text-xs text-[var(--color-muted)]">{formatTimestamp(cycle.timestamp)}</span>
                {cycle.commitHash && (
                  <span className="text-xs text-[var(--color-muted)]">commit {cycle.commitHash.slice(0, 8)}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--text-app)]">{cycle.summary}</p>
              {cycle.detail && <p className="mt-1 text-xs text-[var(--color-muted)]">{cycle.detail}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminAutonomousWorker
