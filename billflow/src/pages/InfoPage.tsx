import { Link } from 'react-router-dom'
import { CheckIcon } from '../components/Icons'
import { usePageMeta } from '../hooks/usePageMeta'
import type { InfoPage as InfoPageData } from '../lib/guides'
import { GENERATOR_PATH } from '../lib/templates'

// Plain prose pages: About and Privacy.
function InfoPage({ page }: { page: InfoPageData }) {
  usePageMeta(page)
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">{page.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--color-muted)]">{page.intro}</p>

      <div className="mt-10 space-y-5">
        {page.sections.map((section) => (
          <section key={section.h} className="rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{section.h}</h2>
            {section.p.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="mt-3 space-y-2">
                {section.list.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[15px] leading-relaxed">
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm">
        <Link to={GENERATOR_PATH} className="font-semibold text-[var(--color-accent)] hover:underline">
          Create a free invoice →
        </Link>
      </p>
    </div>
  )
}

export default InfoPage
