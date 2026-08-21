import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getProfileCompletionPercent } from '../../utils/profileCompletion'
import Avatar from '../Avatar/Avatar'

function UserMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const rows: [string, string][] = [
    ['Name', user.name ?? '—'],
    ['Username', user.username],
    ['Email', user.email ?? '—'],
    ['Role', user.role],
    ['Joined', user.joinedAt ? new Date(user.joinedAt).toLocaleString() : '—'],
  ]

  return (
    <div className="relative" ref={menuRef}>
      <Avatar label={user.name ?? user.username} onClick={() => setOpen((prev) => !prev)} />
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-60 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-4 text-sm shadow-lg">
          <div className="mb-2 border-b border-[var(--border-panel)] pb-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>Profile completion</span>
              <span className="font-medium text-[var(--text-app)]">{getProfileCompletionPercent(user)}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-muted)]/20">
              <div
                className="h-full rounded-full bg-[var(--color-primary-strong)] transition-[width]"
                style={{ width: `${getProfileCompletionPercent(user)}%` }}
              />
            </div>
          </div>
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-1">
              <span className="text-[var(--color-muted)]">{label}</span>
              <span className={`truncate font-medium ${label === 'Role' ? 'capitalize' : ''}`}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserMenu
