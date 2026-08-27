import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listUsers, isTopAdmin, ADMIN_USERS_CACHE_KEY, type UserSummary } from '../services/userService'
import { getCached, setCached } from '../lib/dataCache'

// Whether the current user is the top admin — the only admin who can
// publish another user's project directly, or approve/reject a pending
// update request (see PendingUpdateBanner). Shares the same admin-list
// cache as Navbar/AdminDashboard so this never triggers a redundant fetch.
export function useIsTopAdmin(): boolean {
  const { user } = useAuth()
  const [isTop, setIsTop] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setIsTop(false)
      return
    }
    const cached = getCached<UserSummary[]>(ADMIN_USERS_CACHE_KEY)
    if (cached) {
      setIsTop(isTopAdmin(cached, user.username))
      return
    }
    listUsers()
      .then((users) => {
        setCached(ADMIN_USERS_CACHE_KEY, users)
        setIsTop(isTopAdmin(users, user.username))
      })
      .catch(() => {})
  }, [user?.role, user?.username])

  return isTop
}
