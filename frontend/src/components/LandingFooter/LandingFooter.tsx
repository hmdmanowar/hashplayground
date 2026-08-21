import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo/Logo'
import { ArrowRightIcon } from '../Icons/Icons'

function LandingFooter() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-6xl py-6">
      {!user && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to start building?</h2>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Start building free
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-3 border-t border-[var(--border-panel)] pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo />
        <p className="text-xs text-[var(--color-muted)]">Hash Playground &mdash; Build. Experiment. Learn. Ship.</p>
        <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
          {!user && (
            <Link to="/login" className="hover:text-[var(--color-primary)]">
              Log in
            </Link>
          )}
          <span>&copy; {new Date().getFullYear()} Hash Playground</span>
        </div>
      </div>
    </div>
  )
}

export default LandingFooter
