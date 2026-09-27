import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listUsers, isTopAdmin, ADMIN_USERS_CACHE_KEY, type UserSummary } from '../services/userService'
import { getCached, setCached } from '../lib/dataCache'

// A deterrent for casual users, not real protection — client-side JS can
// always be bypassed (disable JS, DevTools' own separate open paths, view
// page source/network directly). Anything actually sensitive is already
// protected server-side or it isn't protected at all either way. Requested
// explicitly with that tradeoff understood.
export function useDisableInspect() {
  const { user } = useAuth()
  const [isTopAdminUser, setIsTopAdminUser] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setIsTopAdminUser(false)
      return
    }
    const cached = getCached<UserSummary[]>(ADMIN_USERS_CACHE_KEY)
    if (cached) {
      setIsTopAdminUser(isTopAdmin(cached, user.username))
      return
    }
    listUsers()
      .then((users) => {
        setCached(ADMIN_USERS_CACHE_KEY, users)
        setIsTopAdminUser(isTopAdmin(users, user.username))
      })
      .catch(() => {})
  }, [user?.role, user?.username])

  useEffect(() => {
    if (isTopAdminUser) return

    function blockContextMenu(event: MouseEvent) {
      event.preventDefault()
    }

    function blockDevToolsShortcuts(event: KeyboardEvent) {
      const key = event.key.toUpperCase()
      const opensDevTools =
        event.key === 'F12' ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && (key === 'I' || key === 'J' || key === 'C')) ||
        ((event.ctrlKey || event.metaKey) && (key === 'U' || key === 'S'))
      if (opensDevTools) event.preventDefault()
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('keydown', blockDevToolsShortcuts)
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('keydown', blockDevToolsShortcuts)
    }
  }, [isTopAdminUser])
}
