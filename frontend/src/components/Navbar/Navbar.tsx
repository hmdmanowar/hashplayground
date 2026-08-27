import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo/Logo'
import UserMenu from '../UserMenu/UserMenu'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import NotificationBell from '../NotificationBell/NotificationBell'
import FeedbackDialog from '../FeedbackDialog/FeedbackDialog'
import { MenuFoldIcon, MenuUnfoldIcon, MegaphoneIcon } from '../Icons/Icons'
import { listUsers, isTopAdmin, ADMIN_USERS_CACHE_KEY, type UserSummary } from '../../services/userService'
import { getCached, setCached } from '../../lib/dataCache'

interface NavbarProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The portfolio page is a standalone resume view — the global sidebar is
  // already hidden there (see Layout.tsx), so there's nothing left for the
  // sidebar-toggle button to do, and the product's own Documentation link
  // doesn't belong on a page meant to be shared outside the app.
  const isPortfolioPage = pathname === '/portfolio'
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [isSuperiorAdmin, setIsSuperiorAdmin] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setIsSuperiorAdmin(false)
      return
    }
    const cached = getCached<UserSummary[]>(ADMIN_USERS_CACHE_KEY)
    if (cached) {
      setIsSuperiorAdmin(isTopAdmin(cached, user.username))
      return
    }
    listUsers()
      .then((users) => {
        setCached(ADMIN_USERS_CACHE_KEY, users)
        setIsSuperiorAdmin(isTopAdmin(users, user.username))
      })
      .catch(() => { })
  }, [user?.role, user?.username])

  async function handleLogout() {
    // Must await — navigating before `user` is actually cleared lets Login's
    // own `if (user) redirect to /dashboard` guard fire first, bouncing
    // through the dashboard before the real logout finishes and kicks back
    // out to /login.
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="flex items-center justify-between border-b border-[var(--border-panel)] px-4 py-3">
      <div className="flex items-center gap-2">
        {user && !isPortfolioPage && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded"
          >
            {collapsed ? <MenuUnfoldIcon className="h-6 w-6" /> : <MenuFoldIcon className="h-6 w-6" />}
          </button>
        )}
        <Logo />
      </div>
      <div className="flex items-center gap-4">
        {!isPortfolioPage && (
          <NavLink
            to="/docs"
            className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
          >
            Documentation
          </NavLink>
        )}
        {user && !isSuperiorAdmin && (
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            aria-label="Share feedback"
            title="Share feedback"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] transition-colors hover:border-[var(--color-primary)]"
          >
            <MegaphoneIcon className="h-5 w-5" />
          </button>
        )}
        <ThemeToggle />
        {user && <NotificationBell />}
        {user ? (
          <>
            <button
              className="cursor-pointer rounded border border-transparent bg-[var(--color-primary-strong)] px-3 py-1 text-sm font-medium text-neutral-100 transition-colors hover:border-[var(--color-primary)]"
              onClick={handleLogout}
            >
              Log out
            </button>
            <UserMenu />
          </>
        ) : (
          <Link
            to="/login"
            className="cursor-pointer rounded border border-transparent bg-[var(--color-primary-strong)] px-3 py-1 text-sm font-medium text-neutral-100 transition-colors hover:border-[var(--color-primary)]"
          >
            Log in
          </Link>
        )}
      </div>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  )
}

export default Navbar
