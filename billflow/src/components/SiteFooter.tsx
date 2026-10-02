import { Link } from 'react-router-dom'

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border-panel)] bg-[var(--bg-panel)] print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-[var(--color-muted)]">
        <p>© {new Date().getFullYear()} BillFlow, a Hash Playground product.</p>
        <div className="flex gap-4">
          <Link to="/templates/" className="hover:text-[var(--color-primary)]">
            Invoice templates
          </Link>
          <a href="/" className="hover:text-[var(--color-primary)]">
            Hash Playground
          </a>
          <a href="/docs" className="hover:text-[var(--color-primary)]">
            Docs
          </a>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
