import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRightIcon } from '../components/Icons'
import { GENERATOR_PATH } from '../lib/templates'

// BillFlow's 404 — same look as the main Hash Playground one, with links
// back into BillFlow.
function NotFoundPage() {
  const { pathname } = useLocation()

  useEffect(() => {
    const previous = document.title
    document.title = 'Page not found | BillFlow'
    // Keep stray URLs out of search results.
    const robots = document.head.querySelector('meta[name="robots"]')
    const previousRobots = robots?.getAttribute('content')
    robots?.setAttribute('content', 'noindex, follow')
    return () => {
      document.title = previous
      if (robots && previousRobots) robots.setAttribute('content', previousRobots)
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] bg-clip-text text-8xl font-extrabold tracking-tight text-transparent sm:text-9xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">This page wandered off</h1>
      <p className="mt-3 text-sm text-[var(--color-muted)] sm:text-base">
        We couldn’t find <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 text-xs break-all">/billflow{pathname}</code>
        . It may have moved, or the link might be mistyped.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to={GENERATOR_PATH}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Create an invoice
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <Link
          to="/templates/"
          className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]"
        >
          Browse templates
        </Link>
        <Link
          to="/"
          className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]"
        >
          BillFlow home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
