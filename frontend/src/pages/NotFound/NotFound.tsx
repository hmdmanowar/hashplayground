import { Link, useLocation } from 'react-router-dom'
import HeroCanvas from '../../components/HeroCanvas/HeroCanvas'

// Catch-all page for any route the app doesn't know. Same backdrop as the
// home page (masked grid + glow + particle field) so it feels on-brand.
function NotFound() {
  const { pathname } = useLocation()

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-16">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0 overflow-hidden opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle, black, transparent 75%)',
          }}
        >
          <div className="grid-glow" />
        </div>
        <HeroCanvas />
      </div>

      <div className="relative max-w-lg text-center">
        <p className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] bg-clip-text text-8xl font-extrabold tracking-tight text-transparent sm:text-9xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">This page wandered off</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)] sm:text-base">
          We couldn’t find <code className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 text-xs break-all">{pathname}</code>. It
          may have moved, or the link might be mistyped.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            to="/docs"
            className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]"
          >
            Documentation
          </Link>
          {/* Plain <a>: BillFlow is a separate app */}
          <a
            href="/billflow/"
            className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]"
          >
            Invoice Generator
          </a>
        </div>
      </div>
    </div>
  )
}

export default NotFound
