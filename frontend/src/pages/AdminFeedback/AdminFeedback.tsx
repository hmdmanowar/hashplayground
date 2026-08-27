import { useEffect, useState } from 'react'
import {
  listFeedback,
  updateFeedbackStatus,
  type FeedbackRecord,
  type FeedbackStatus,
} from '../../services/feedbackService'
import { sendNotification } from '../../services/notificationService'
import { useToast } from '../../context/ToastContext'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import NotifyDialog from '../../components/NotifyDialog/NotifyDialog'
import { ImageIcon, EnvelopeIcon, EyeIcon, ClockIcon } from '../../components/Icons/Icons'

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

const STATUS_BADGE_CLASSES: Record<FeedbackStatus, string> = {
  open: 'bg-[var(--hover-overlay)] text-[var(--color-muted)]',
  in_progress: 'bg-amber-500/10 text-amber-500',
  resolved: 'bg-emerald-500/10 text-emerald-500',
}

function AdminFeedback() {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<FeedbackRecord[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [notifyTarget, setNotifyTarget] = useState<FeedbackRecord | null>(null)
  const [messageTarget, setMessageTarget] = useState<FeedbackRecord | null>(null)
  const [timelineTarget, setTimelineTarget] = useState<FeedbackRecord | null>(null)

  useEffect(() => {
    listFeedback()
      .then((data) => {
        setEntries(data)
        setLoadStatus('ready')
      })
      .catch(() => setLoadStatus('error'))
  }, [])

  async function handleStatusChange(entry: FeedbackRecord, status: FeedbackStatus) {
    if (status === entry.status) return
    try {
      const updated = await updateFeedbackStatus(entry.id, status)
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update status')
    }
  }

  async function handleSendMessage(kind: 'message' | 'alert', message: string) {
    if (!notifyTarget) return
    try {
      await sendNotification(notifyTarget.username, kind, message)
      showToast(`Message sent to ${notifyTarget.name ?? notifyTarget.username}.`, { kind: 'success' })
      setNotifyTarget(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send message')
    }
  }

  if (loadStatus === 'loading') return <LoadingOverlay />

  if (loadStatus === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] p-10 text-center">
        <p className="text-sm text-[var(--color-muted)]">Couldn't load feedback.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-[var(--color-muted)]">Bug reports and feature requests submitted by users.</p>

      {entries.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] p-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border-panel)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-app)]">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Task Type</th>
                <th className="px-3 py-2 font-medium">Task Descriptions</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Image</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Reported By</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Submitted</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Task Action</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Task Status</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[var(--border-panel)]">
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        entry.type === 'bug'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      }`}
                    >
                      {entry.type === 'bug' ? 'Bug' : 'Feature'}
                    </span>
                  </td>
                  <td className="max-w-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{entry.message}</span>
                      <button
                        type="button"
                        onClick={() => setMessageTarget(entry)}
                        aria-label="View full message"
                        title="View full message"
                        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {entry.imageData ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(entry.imageData!)}
                        aria-label="View attached screenshot"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center text-[var(--color-muted)]">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--color-muted)]">
                    {entry.name ?? entry.username}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--color-muted)]">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <select
                      value={entry.status}
                      onChange={(event) => handleStatusChange(entry, event.target.value as FeedbackStatus)}
                      className="cursor-pointer rounded border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-xs transition-colors hover:border-[var(--color-primary)]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE_CLASSES[entry.status]}`}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {new Date(entry.statusUpdatedAt).toLocaleString()}
                      </span>
                      {entry.statusHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTimelineTarget(entry)}
                          aria-label="View status timeline"
                          title="View status timeline"
                          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setNotifyTarget(entry)}
                      aria-label={`Message ${entry.name ?? entry.username}`}
                      title="Send a message"
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Attached screenshot, full size" className="max-h-[85vh] max-w-full rounded-lg" />
        </div>
      )}

      {messageTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setMessageTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    messageTarget.type === 'bug'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  }`}
                >
                  {messageTarget.type === 'bug' ? 'Bug' : 'Feature'}
                </span>
                <span className="text-sm font-medium">{messageTarget.name ?? messageTarget.username}</span>
              </div>
              <button
                type="button"
                onClick={() => setMessageTarget(null)}
                aria-label="Close"
                className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--text-app)]"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Submitted {new Date(messageTarget.createdAt).toLocaleString()}
            </p>
            <p className="mt-4 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words text-sm">
              {messageTarget.message}
            </p>
          </div>
        </div>
      )}

      {timelineTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setTimelineTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Status timeline</h2>
              <button
                type="button"
                onClick={() => setTimelineTarget(null)}
                aria-label="Close"
                className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--text-app)]"
              >
                ×
              </button>
            </div>
            <ul className="mt-4 min-h-0 overflow-y-auto">
              {timelineTarget.statusHistory.map((change, index) => (
                <li key={index} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < timelineTarget.statusHistory.length - 1 && (
                    <span className="absolute left-[3px] top-3 h-full w-px bg-[var(--border-panel)]" aria-hidden="true" />
                  )}
                  <span className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                  <div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE_CLASSES[change.status]}`}
                    >
                      {STATUS_LABELS[change.status]}
                    </span>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {new Date(change.changedAt).toLocaleString()}
                      {change.changedByUsername && (
                        <>
                          {' · by '}
                          {change.changedByName ? `${change.changedByName} ` : ''}
                          <span className="font-mono">@{change.changedByUsername}</span>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {notifyTarget && (
        <NotifyDialog
          targetLabel={notifyTarget.name ?? notifyTarget.username}
          onSend={handleSendMessage}
          onCancel={() => setNotifyTarget(null)}
        />
      )}
    </div>
  )
}

export default AdminFeedback
