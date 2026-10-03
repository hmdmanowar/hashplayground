import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import FaqList from '../components/FaqList'
import { GuideBody, readingMinutes } from '../components/TemplateGuide'
import { ArrowRightIcon } from '../components/Icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { GUIDES, guideMeta, type Guide } from '../lib/guides'
import { findTemplate, GENERATOR_PATH } from '../lib/templates'

// StrictMode runs mount effects twice in dev; count each guide once per load.
const viewed = new Set<string>()

function GuidePage({ guide }: { guide: Guide }) {
  usePageMeta(guideMeta(guide))
  const minutes = readingMinutes(guide.sections, guide.intro)
  const related = guide.related.map(findTemplate).filter((template) => template !== undefined)
  const more = GUIDES.filter((other) => other.slug !== guide.slug).slice(0, 3)

  useEffect(() => {
    if (viewed.has(guide.slug)) return
    viewed.add(guide.slug)
    trackEvent('page_view', `guides/${guide.slug}`)
  }, [guide.slug])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <Link to="/" className="text-[var(--color-primary)] hover:text-[var(--color-accent)]">
          BillFlow
        </Link>
        <span className="text-[var(--color-muted)]">/</span>
        <Link to="/guides/" className="text-[var(--color-primary)] hover:text-[var(--color-accent)]">
          Guides
        </Link>
      </nav>

      <header className="mt-3 max-w-3xl">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
          Guide · {minutes} min read
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{guide.h1}</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">{guide.intro}</p>
        <Link
          to={GENERATOR_PATH}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          Create a free invoice
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </header>

      <GuideBody guide={guide.sections} className="mt-12" />

      {guide.faq.length > 0 && (
        <section className="mt-16" aria-labelledby="guide-faq">
          <h2 id="guide-faq" className="text-xl font-semibold">
            Frequently asked questions
          </h2>
          <div className="mt-4">
            <FaqList items={guide.faq} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="guide-templates">
          <h2 id="guide-templates" className="text-xl font-semibold">
            Templates to start from
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((template) => (
              <li key={template.slug}>
                <Link
                  to={`/${template.slug}/`}
                  className="bf-card group flex h-full items-start justify-between gap-3 transition-colors hover:border-[var(--color-primary)]"
                >
                  <span>
                    <span className="block text-sm font-semibold">{template.h1}</span>
                    <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted)]">{template.intro}</span>
                  </span>
                  <ArrowRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {more.length > 0 && (
        <section className="mt-16" aria-labelledby="more-guides">
          <h2 id="more-guides" className="text-xl font-semibold">
            More guides
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {more.map((other) => (
              <li key={other.slug}>
                <Link
                  to={`/guides/${other.slug}/`}
                  className="bf-card block h-full transition-colors hover:border-[var(--color-primary)]"
                >
                  <span className="block text-sm font-semibold">{other.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted)]">{other.intro}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default GuidePage
