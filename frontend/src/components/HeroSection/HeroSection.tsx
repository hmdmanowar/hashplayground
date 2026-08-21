import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowRightIcon } from '../Icons/Icons'

function HeroSection() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-6xl py-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Hash Playground</p>
      <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
        Build. Experiment. Learn.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--color-muted)] sm:text-base">
        Open a browser, create a real React + TypeScript project, and experiment without setup friction &mdash; write
        code, run it, and see it come to life.
      </p>
      {!user && (
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Start building free
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default HeroSection
