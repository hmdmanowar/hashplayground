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
import { ImageIcon, EnvelopeIcon } from '../../components/Icons/Icons'

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

function AdminFeedback() {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<FeedbackRecord[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [notifyTarget, setNotifyTarget] = useState<FeedbackRecord | null>(null)

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
                <th className="whitespace-nowrap px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Message</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Image</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">From</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Submitted</th>
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
                  <td className="max-w-md truncate px-3 py-2" title={entry.message}>
                    {entry.message}
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
                    <div className="flex items-center gap-2">
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
                      <button
                        type="button"
                        onClick={() => setNotifyTarget(entry)}
                        aria-label={`Message ${entry.name ?? entry.username}`}
                        title="Send a message"
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
                      >
                        <EnvelopeIcon className="h-4 w-4" />
                      </button>
                    </div>
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
