import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { readingMinutes } from '../components/TemplateGuide'
import { ArrowRightIcon, FileTextIcon } from '../components/Icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { GUIDES, GUIDES_HUB } from '../lib/guides'
import { GALLERY_PAGE } from '../lib/templates'

let viewed = false

// /billflow/guides/ — the index of every guide article.
function GuidesPage() {
  usePageMeta(GUIDES_HUB)

  useEffect(() => {
    if (viewed) return
    viewed = true
    trackEvent('page_view', GUIDES_HUB.slug)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
          {GUIDES.length} guides
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{GUIDES_HUB.h1}</h1>
        <p className="mt-4 text-base text-[var(--color-muted)] sm:text-lg">{GUIDES_HUB.intro}</p>
      </header>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide, index) => (
          <li key={guide.slug}>
            <Link
              to={`/guides/${guide.slug}/`}
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
              className="bf-fade-in group flex h-full flex-col rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-xl motion-reduce:transition-none"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-accent)]">
                <FileTextIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg leading-snug font-semibold">{guide.h1}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-[var(--color-muted)]">{guide.intro}</p>
              <span className="mt-auto flex items-center justify-between pt-5 text-xs font-medium text-[var(--color-muted)]">
                {readingMinutes(guide.sections, guide.intro)} min read
                <span className="flex items-center gap-1 text-[var(--color-accent)]">
                  Read
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-14 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#3d52a0] to-[#7091e6] px-6 py-8 text-center text-white sm:flex-row sm:text-left">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Ready to send one?</h2>
          <p className="mt-1 text-sm text-indigo-100">Start from a template with the right tax and wording already filled in.</p>
        </div>
        <Link
          to={`/${GALLERY_PAGE.slug}/`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3d52a0] transition-transform duration-300 hover:-translate-y-0.5"
        >
          Browse templates
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}

export default GuidesPage
