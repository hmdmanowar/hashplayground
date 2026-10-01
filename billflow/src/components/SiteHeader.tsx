import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { GENERATOR_PATH } from '../lib/templates'
import { MoonIcon, SunIcon } from './Icons'

const LOGO_LIGHT = `${import.meta.env.BASE_URL}billflow-logo.png`
const LOGO_DARK = `${import.meta.env.BASE_URL}billflow-logo-dark.png`

function SiteHeader() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-panel)] bg-[var(--bg-panel)]/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        {/* Router-relative "/" = the BillFlow home (/billflow/), never the
            main Hash Playground site. */}
        <Link to="/" aria-label="BillFlow home" className="flex shrink-0 items-center">
          <img
            src={theme === 'dark' ? LOGO_DARK : LOGO_LIGHT}
            alt="BillFlow"
            width={539}
            height={120}
            className="h-7 w-auto sm:h-9"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <NavLink
            to="/templates/"
            className={({ isActive }) =>
              `rounded px-2 py-1 text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
              }`
            }
          >
            Templates
          </NavLink>
          <Link
            to={GENERATOR_PATH}
            className="rounded-full bg-[var(--color-primary-strong)] px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90 sm:px-4"
          >
            Create<span className="hidden sm:inline"> invoice</span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] transition-colors hover:border-[var(--color-primary)]"
          >
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
