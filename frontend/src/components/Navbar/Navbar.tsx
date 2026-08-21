import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo/Logo'
import UserMenu from '../UserMenu/UserMenu'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import NotificationBell from '../NotificationBell/NotificationBell'
import { MenuFoldIcon, MenuUnfoldIcon } from '../Icons/Icons'

interface NavbarProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex items-center justify-between border-b border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-3">
      <div className="flex items-center gap-2">
        {user && (
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
    </header>
  )
}

export default Navbar
