import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo/Logo'
import UserMenu from '../UserMenu/UserMenu'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import NotificationBell from '../NotificationBell/NotificationBell'
import FeedbackDialog from '../FeedbackDialog/FeedbackDialog'
import { MenuFoldIcon, MenuUnfoldIcon, MegaphoneIcon, BotIcon } from '../Icons/Icons'
import { listUsers, isTopAdmin, ADMIN_USERS_CACHE_KEY, type UserSummary } from '../../services/userService'
import { getCached, setCached } from '../../lib/dataCache'
import { usePageJarvisToggleValue } from '../../context/PageHeaderContext'

interface NavbarProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Set only while Playground is mounted (see usePageJarvisToggle) — lets
  // the Jarvis button open that project's own panel instead of navigating
  // away to the standalone page.
  const jarvisToggle = usePageJarvisToggleValue()
  // The portfolio page is a standalone resume view — the global sidebar is
  // already hidden there (see Layout.tsx), so there's nothing left for the
  // sidebar-toggle button to do, and the product's own Documentation link
  // doesn't belong on a page meant to be shared outside the app.
  const isPortfolioPage = pathname === '/portfolio'
  // Jarvis has its own conversation sidebar and hides the global one too
  // (see Layout.tsx) — same reasoning as Portfolio for the toggle button.
  const isJarvisPage = pathname === '/jarvis'
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
        {user && !isPortfolioPage && !isJarvisPage && (
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
        {!isPortfolioPage &&
          (jarvisToggle ? (
            <button
              type="button"
              onClick={jarvisToggle}
              title="Jarvis"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] px-3 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <BotIcon className="h-5 w-5" />
              Jarvis
            </button>
          ) : (
            <NavLink
              to="/jarvis"
              title="Jarvis"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] px-3 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <BotIcon className="h-5 w-5" />
              Jarvis
            </NavLink>
          ))}
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
