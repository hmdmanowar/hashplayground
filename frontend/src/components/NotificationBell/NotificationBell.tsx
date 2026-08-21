import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  listNotificationsForUser,
  getUnreadCount,
  markAllAsRead,
  type Notification,
} from '../../services/notificationService'
import { BellIcon, EnvelopeIcon, AlertTriangleIcon } from '../Icons/Icons'

const POLL_INTERVAL_MS = 5000

function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const username = user?.username

  useEffect(() => {
    if (!username) return

    async function refresh() {
      const [list, count] = await Promise.all([listNotificationsForUser(), getUnreadCount()])
      setNotifications(list)
      setUnreadCount(count)
    }

    refresh()
    // Server-side now — a same-browser "storage" event (the old localStorage
    // cross-tab trick) no longer means anything; the poll alone covers it.
    const timer = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [username])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!username) return null

  async function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) {
      await markAllAsRead()
      setNotifications(await listNotificationsForUser())
      setUnreadCount(0)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-1 shadow-lg">
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Notifications
          </p>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-3 text-sm text-[var(--color-muted)]">No notifications yet</p>
            ) : (
              notifications.map((entry) => {
                const content = (
                  <>
                    {entry.kind === 'alert' ? (
                      <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : entry.kind === 'activity' ? (
                      <BellIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                    ) : (
                      <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{entry.message}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        From {entry.fromUsername} · {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </>
                )

                return entry.link ? (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      navigate(entry.link as string)
                    }}
                    className="flex w-full cursor-pointer items-start gap-2 rounded px-2 py-2 text-left hover:bg-[var(--hover-overlay)]"
                  >
                    {content}
                  </button>
                ) : (
                  <div key={entry.id} className="flex items-start gap-2 rounded px-2 py-2 hover:bg-[var(--hover-overlay)]">
                    {content}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
