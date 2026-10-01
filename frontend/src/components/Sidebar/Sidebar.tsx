import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HomeIcon, GridIcon, ShieldIcon, SettingsIcon, ClipboardListIcon, BotIcon, WalletIcon } from '../Icons/Icons'
import { isMobileViewport } from '../../lib/viewport'
import { listUsers, isTopAdmin, ADMIN_USERS_CACHE_KEY, type UserSummary } from '../../services/userService'
import { getCached, setCached } from '../../lib/dataCache'
import './Sidebar.scss'

interface SidebarProps {
  collapsed: boolean
  // Mobile only: expanding the sidebar opens it as a floating overlay above
  // the page instead of squeezing main content aside (there's no room to
  // spare on a phone-width screen) — this closes it when the backdrop
  // behind that overlay is tapped. Desktop ignores it; the sidebar there
  // stays a normal in-flow panel that's fine to push content over.
  onCloseOverlay?: () => void
}

function Sidebar({ collapsed, onCloseOverlay }: SidebarProps) {
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

  if (!user) return null

  function linkClass({ isActive }: { isActive: boolean }, heading = false) {
    return [
      'sidebar-link',
      isActive && 'sidebar-link-active',
      heading && 'font-medium',
      collapsed && 'sidebar-link-collapsed',
    ]
      .filter(Boolean)
      .join(' ')
  }

  function handleNavigate() {
    if (isMobileViewport()) onCloseOverlay?.()
  }

  return (
    <>
      {!collapsed && (
        <div
          onClick={onCloseOverlay}
          aria-hidden="true"
          className="absolute inset-0 z-20 bg-black/50 sm:hidden"
        />
      )}
      <aside
        className={`flex h-full shrink-0 flex-col border-r border-[var(--border-panel)] py-4 max-[1281px]:py-3 transition-[width] duration-300 ${
          collapsed
            ? 'relative w-16 px-2 max-[1281px]:w-14'
            : 'absolute inset-y-0 left-0 z-30 w-60 bg-[var(--bg-app)] px-4 shadow-2xl sm:static sm:z-auto sm:bg-transparent sm:shadow-none max-[1281px]:w-48 max-[1281px]:px-3'
        }`}
      >
      <NavLink to="/" end title="Home" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
        <HomeIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
        {!collapsed && <span className="min-w-0 flex-1 truncate">Home</span>}
      </NavLink>

      <NavLink to="/dashboard" title="Project Dashboard" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
        <GridIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
        {!collapsed && <span className="min-w-0 flex-1 truncate">Project Dashboard</span>}
      </NavLink>

      <div className="mt-auto border-t border-[var(--border-panel)] pt-4 max-[1281px]:pt-3">
        {isTopAdminUser && (
          <NavLink to="/admin/billflow" title="BillFlow" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
            <WalletIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">BillFlow</span>}
          </NavLink>
        )}
        {user.role === 'admin' && (
          <NavLink to="/admin/feedback" title="Feedback" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
            <ClipboardListIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">Feedback</span>}
          </NavLink>
        )}
        {user.role === 'admin' && (
          <NavLink to="/admin" end title="Admin Dashboard" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
            <ShieldIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">Admin Dashboard</span>}
          </NavLink>
        )}
        {isTopAdminUser && (
          <NavLink to="/admin/autonomous-worker" title="Autonomous Worker" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
            <BotIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">Autonomous Worker</span>}
          </NavLink>
        )}
        <NavLink to="/settings" title="Account Settings" onClick={handleNavigate} className={(state) => linkClass(state, true)}>
          <SettingsIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
          {!collapsed && <span className="min-w-0 flex-1 truncate">Account Settings</span>}
        </NavLink>
      </div>
      </aside>
    </>
  )
}

export default Sidebar
