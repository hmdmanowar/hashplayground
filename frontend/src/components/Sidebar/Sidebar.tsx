import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HomeIcon, GridIcon, ShieldIcon, SettingsIcon, ClipboardListIcon } from '../Icons/Icons'
import './Sidebar.scss'

interface SidebarProps {
  collapsed: boolean
}

function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth()
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

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-[var(--border-panel)] bg-[var(--bg-panel)] py-4 max-[1281px]:py-3 transition-[width] duration-300 ${
        collapsed ? 'w-16 px-2 max-[1281px]:w-14' : 'w-60 px-4 max-[1281px]:w-48 max-[1281px]:px-3'
      }`}
    >
      <NavLink to="/" end title="Home" className={(state) => linkClass(state, true)}>
        <HomeIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
        {!collapsed && <span className="min-w-0 flex-1 truncate">Home</span>}
      </NavLink>

      <NavLink to="/dashboard" title="Project Dashboard" className={(state) => linkClass(state, true)}>
        <GridIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
        {!collapsed && <span className="min-w-0 flex-1 truncate">Project Dashboard</span>}
      </NavLink>

      <div className="mt-auto border-t border-[var(--border-panel)] pt-4 max-[1281px]:pt-3">
        {user.role === 'admin' && (
          <NavLink to="/admin/feedback" title="Feedback" className={(state) => linkClass(state, true)}>
            <ClipboardListIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">Feedback</span>}
          </NavLink>
        )}
        {user.role === 'admin' && (
          <NavLink to="/admin" end title="Admin Dashboard" className={(state) => linkClass(state, true)}>
            <ShieldIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">Admin Dashboard</span>}
          </NavLink>
        )}
        <NavLink to="/settings" title="Account Settings" className={(state) => linkClass(state, true)}>
          <SettingsIcon className="h-5 w-5 shrink-0 max-[1281px]:h-4 max-[1281px]:w-4" />
          {!collapsed && <span className="min-w-0 flex-1 truncate">Account Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
