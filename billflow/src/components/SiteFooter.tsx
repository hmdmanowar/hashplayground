import { Link } from 'react-router-dom'
import { TEMPLATES } from '../lib/templates'

function SiteFooter() {
  return (
    <footer id="templates" className="mt-16 border-t border-[var(--border-panel)] bg-[var(--bg-panel)] print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-sm font-semibold">Free invoice templates</h2>
        <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => (
            <li key={template.slug || 'main'}>
              <Link
                to={template.slug ? `/${template.slug}/` : '/'}
                className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
              >
                {template.slug ? template.h1 : 'Free Invoice Generator'}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-panel)] pt-6 text-xs text-[var(--color-muted)]">
          <p>© {new Date().getFullYear()} BillFlow, a Hash Playground product.</p>
          <div className="flex gap-4">
            <a href="/" className="hover:text-[var(--color-primary)]">
              Hash Playground
            </a>
            <a href="/docs" className="hover:text-[var(--color-primary)]">
              Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
