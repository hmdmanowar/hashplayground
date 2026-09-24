import { useEffect, useMemo, useState } from 'react'
import {
  getWorkerState,
  setWorkerEnabled,
  listTasks,
  queueTask,
  cancelTask,
  listCycles,
  clearHistory,
  type WorkerState,
  type AutonomousTask,
  type CycleLogEntry,
} from '../../services/autonomousWorkerService'
import { useToast } from '../../context/ToastContext'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import Select from '../../components/Select/Select'
import { BotIcon, ClockIcon, TrashIcon, PlayIcon, PauseIcon } from '../../components/Icons/Icons'

const TASK_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'status', label: 'By status' },
]

const CYCLE_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'outcome', label: 'By outcome' },
]

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

// A 'done' task can still mean nothing actually landed (reverted because
// tests/build failed, or no-changes because the model found nothing to do)
// — worth its own label/color rather than a flat "Done" that reads as
// "your change is live" regardless of which of those actually happened.
const TASK_OUTCOME_LABELS: Record<string, string> = {
  pushed: 'Done — pushed',
  reverted: 'Done — reverted (failed tests/build)',
  'no-changes': 'Done — no changes made',
  error: 'Failed — error',
}

const TASK_OUTCOME_CLASSES: Record<string, string> = {
  pushed: 'bg-emerald-500/10 text-emerald-500',
  reverted: 'bg-amber-500/10 text-amber-500',
  'no-changes': 'bg-[var(--hover-overlay)] text-[var(--color-muted)]',
  error: 'bg-red-500/10 text-red-500',
}

// Surfaces what still needs attention first: something actively running,
// then something waiting to run, ahead of tasks that are already settled.
const TASK_STATUS_SORT_PRIORITY: Record<AutonomousTask['status'], number> = {
  in_progress: 0,
  pending: 1,
  failed: 2,
  done: 3,
}

const CYCLE_OUTCOME_CLASSES: Record<CycleLogEntry['outcome'], string> = {
  pushed: 'bg-emerald-500/10 text-emerald-500',
  reverted: 'bg-amber-500/10 text-amber-500',
  'no-changes': 'bg-[var(--hover-overlay)] text-[var(--color-muted)]',
  error: 'bg-red-500/10 text-red-500',
}

// Same idea as TASK_STATUS_SORT_PRIORITY: surface what's worth a look first
// — an error or a failed/reverted change ahead of a routine no-op cycle.
const CYCLE_OUTCOME_SORT_PRIORITY: Record<CycleLogEntry['outcome'], number> = {
  error: 0,
  reverted: 1,
  pushed: 2,
  'no-changes': 3,
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
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false)
  const [taskSort, setTaskSort] = useState<'newest' | 'status'>('newest')
  const [cycleSort, setCycleSort] = useState<'newest' | 'outcome'>('newest')

  const sortedTasks = useMemo(() => {
    if (taskSort === 'newest') return tasks
    return [...tasks].sort((a, b) => {
      const byStatus = TASK_STATUS_SORT_PRIORITY[a.status] - TASK_STATUS_SORT_PRIORITY[b.status]
      if (byStatus !== 0) return byStatus
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [tasks, taskSort])

  const sortedCycles = useMemo(() => {
    if (cycleSort === 'newest') return cycles
    return [...cycles].sort((a, b) => {
      const byOutcome = CYCLE_OUTCOME_SORT_PRIORITY[a.outcome] - CYCLE_OUTCOME_SORT_PRIORITY[b.outcome]
      if (byOutcome !== 0) return byOutcome
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [cycles, cycleSort])

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

  async function handleClearHistory() {
    setIsClearingHistory(true)
    try {
      await clearHistory()
      setTasks((prev) => prev.filter((task) => task.status === 'pending' || task.status === 'in_progress'))
      setCycles([])
      showToast('History cleared.', { kind: 'success' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not clear history')
    } finally {
      setIsClearingHistory(false)
      setClearHistoryOpen(false)
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
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
            <BotIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-app)]">Jarvis autonomous worker</p>
            <p className="truncate text-xs text-[var(--color-muted)]">
              {lastActivity ? `Last activity: ${formatTimestamp(lastActivity)}` : 'No activity reported yet.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isTogglingState}
          aria-label={state.enabled ? 'Enabled — turn off' : 'Disabled — turn on'}
          title={state.enabled ? 'Enabled — turn off' : 'Disabled — turn on'}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white disabled:opacity-50 sm:px-4 ${
            state.enabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[var(--color-muted)] hover:opacity-90'
          }`}
        >
          {state.enabled ? <PauseIcon className="h-4 w-4 shrink-0" /> : <PlayIcon className="h-4 w-4 shrink-0" />}
          <span className="hidden sm:inline">{state.enabled ? 'Enabled — turn off' : 'Disabled — turn on'}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
        <p className="text-xs text-[var(--color-muted)]">
          This page doesn't run the worker itself — it just controls whatever's already running `npm run autonomous`
          elsewhere, which polls this state before each cycle. It won't react instantly; the worker checks in once per
          its own cycle interval.
        </p>

        <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)]">
        <div className="sticky top-0 z-10 rounded-t-lg border-b border-[var(--border-panel)] bg-[var(--bg-panel)]/95 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="shrink-0 text-sm font-medium text-[var(--text-app)]">Queue a task</p>
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <Select value={taskSort} onChange={(value) => setTaskSort(value as 'newest' | 'status')} options={TASK_SORT_OPTIONS} />
              <button
                type="button"
                onClick={() => setClearHistoryOpen(true)}
                aria-label="Clear history"
                title="Clear history"
                className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-muted)] hover:text-red-500"
              >
                <TrashIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Clear history</span>
              </button>
            </div>
          </div>
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
        </div>

        <div className="space-y-2 p-4 pt-4">
          {sortedTasks.length === 0 && <p className="text-sm text-[var(--color-muted)]">No tasks queued yet.</p>}
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-1 rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.outcome && TASK_OUTCOME_CLASSES[task.outcome]
                        ? TASK_OUTCOME_CLASSES[task.outcome]
                        : TASK_STATUS_CLASSES[task.status]
                    }`}
                  >
                    {task.outcome && TASK_OUTCOME_LABELS[task.outcome]
                      ? TASK_OUTCOME_LABELS[task.outcome]
                      : TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">{formatTimestamp(task.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-app)]">{task.description}</p>
                {task.resultSummary && <p className="mt-1 text-xs text-[var(--color-muted)]">{task.resultSummary}</p>}
                {task.outcome === 'pushed' && task.commitHash && (
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Commit <code className="rounded bg-[var(--hover-overlay)] px-1 py-0.5">{task.commitHash.slice(0, 7)}</code> on{' '}
                    <code className="rounded bg-[var(--hover-overlay)] px-1 py-0.5">jarvis-auto</code>
                  </p>
                )}
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

      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-lg border-b border-[var(--border-panel)] bg-[var(--bg-panel)]/95 p-4 backdrop-blur">
          <p className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--text-app)]">
            <ClockIcon className="h-4 w-4" />
            Recent cycles
          </p>
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <Select value={cycleSort} onChange={(value) => setCycleSort(value as 'newest' | 'outcome')} options={CYCLE_SORT_OPTIONS} />
            <button
              type="button"
              onClick={() => setClearHistoryOpen(true)}
              aria-label="Clear history"
              title="Clear history"
              className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-muted)] hover:text-red-500"
            >
              <TrashIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Clear history</span>
            </button>
          </div>
        </div>
        <div className="p-4 pt-4">
        {sortedCycles.length === 0 && <p className="text-sm text-[var(--color-muted)]">No cycles reported yet.</p>}
        <div className="space-y-2">
          {sortedCycles.map((cycle) => (
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
      </div>

      <ConfirmDialog
        open={clearHistoryOpen}
        title="Clear history?"
        message="This permanently deletes all completed/failed tasks and the recent cycles log. Pending or in-progress tasks are left untouched."
        confirmLabel={isClearingHistory ? 'Clearing…' : 'Clear history'}
        onConfirm={handleClearHistory}
        onCancel={() => setClearHistoryOpen(false)}
      />
    </div>
  )
}

export default AdminAutonomousWorker
