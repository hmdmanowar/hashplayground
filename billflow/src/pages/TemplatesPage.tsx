import { useEffect } from 'react'
import TemplateCard from '../components/TemplateCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackEvent } from '../lib/api'
import { GALLERY_PAGE, TEMPLATES } from '../lib/templates'

const STEPS = ['Pick a template', 'Fill in your details', 'Download the PDF']

let viewed = false

function TemplatesPage() {
  usePageMeta(GALLERY_PAGE)

  useEffect(() => {
    if (viewed) return
    viewed = true
    trackEvent('page_view', GALLERY_PAGE.slug)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
          {TEMPLATES.length} templates · Free · No sign-up
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{GALLERY_PAGE.h1}</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)] sm:text-base">{GALLERY_PAGE.intro}</p>
        <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[10px] font-semibold text-[var(--color-accent)]">
                {index + 1}
              </span>
              {step}
              {index < STEPS.length - 1 && <span className="text-[var(--color-muted)]">→</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </div>
    </div>
  )
}

export default TemplatesPage
