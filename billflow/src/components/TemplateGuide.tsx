import { useEffect, useState } from 'react'
import type { GuideSection } from '../lib/templates'
import {
  BriefcaseIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  PenIcon,
  PercentIcon,
  SparkleIcon,
  WalletIcon,
  XIcon,
} from './Icons'

type Icon = typeof CheckIcon
type ListKind = 'steps' | 'warn' | 'check'

// The guide copy is plain data (shared with the prerendered HTML), so the
// look of each section is inferred from its heading.
const ICON_RULES: [RegExp, Icon][] = [
  [/mistake|avoid|rejection/i, XIcon],
  [/\btax\b|gst|vat|sales tax|abn/i, PercentIcon],
  [/abroad|foreign|international|countries|world|outside|export/i, GlobeIcon],
  [/paid|payment|deposit|fee collection|approved/i, WalletIcon],
  [/rates?\b|retainer|hourly|billing|package|revisions|hosting|ad spend/i, BriefcaseIcon],
  [/^how |create|make|write|structure|fill/i, PenIcon],
  [/include|show|fields|put on|line items|required/i, FileTextIcon],
]

function iconFor(heading: string): Icon {
  return ICON_RULES.find(([pattern]) => pattern.test(heading))?.[1] ?? SparkleIcon
}

function listKind(heading: string): ListKind {
  if (/mistake|avoid|rejection/i.test(heading)) return 'warn'
  if (/^how to|^how .* works|^what to put/i.test(heading) && !/include|show/i.test(heading)) return 'steps'
  return 'check'
}

// "Standard Invoice" → "standard invoice", but acronyms stay: "UK invoice", "VAT invoice".
function sentenceCase(label: string): string {
  return label
    .split(' ')
    .map((word) =>
      /^[A-Z]{2,}/.test(word) || word.startsWith('(') || /^(Australian|Indian|British|American)$/.test(word)
        ? word
        : word.toLowerCase(),
    )
    .join(' ')
}

const sectionId = (index: number) => `guide-${index + 1}`

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-5 space-y-0">
      {items.map((item, index) => (
        <li key={item} className="relative flex gap-4 pb-5 last:pb-0">
          {/* Connector line between the numbered dots */}
          {index < items.length - 1 && (
            <span className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-[var(--border-panel)]" aria-hidden="true" />
          )}
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-xs font-bold text-white shadow-sm">
            {index + 1}
          </span>
          <p className="pt-1 text-sm leading-relaxed sm:text-[15px]">{item}</p>
        </li>
      ))}
    </ol>
  )
}

function Bullets({ items, kind }: { items: string[]; kind: 'warn' | 'check' }) {
  const warn = kind === 'warn'
  return (
    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-snug ${
            warn
              ? 'border-amber-500/25 bg-amber-500/[0.06]'
              : 'border-[var(--border-panel)] bg-[var(--bg-app)]'
          }`}
        >
          <span
            className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              warn ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-[var(--color-primary-soft)] text-[var(--color-accent)]'
            }`}
          >
            {warn ? <XIcon className="h-3 w-3" /> : <CheckIcon className="h-3 w-3" />}
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

// A ready-to-copy sample (email, numbering scheme, line format).
function Example({ title, lines }: { title?: string; lines: string[] }) {
  const [copied, setCopied] = useState(false)
  const text = lines.join('\n')
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the text is still selectable.
    }
  }
  return (
    <figure className="mt-5 overflow-hidden rounded-xl border border-[var(--border-panel)] bg-[var(--bg-app)]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-[var(--border-panel)] px-4 py-2">
        <span className="text-xs font-semibold text-[var(--color-muted)]">{title ?? 'Example'}</span>
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-primary-soft)]"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-3 font-sans text-sm leading-relaxed whitespace-pre-wrap">{text}</pre>
    </figure>
  )
}

function GuideCard({ section, index }: { section: GuideSection; index: number }) {
  const Icon = iconFor(section.h)
  const kind = listKind(section.h)
  const [lead, ...rest] = section.p
  return (
    <section
      id={sectionId(index)}
      aria-labelledby={`${sectionId(index)}-title`}
      className="scroll-mt-24 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            kind === 'warn' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-[var(--color-primary-soft)] text-[var(--color-accent)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-widest text-[var(--color-muted)] uppercase">
            Part {index + 1}
          </p>
          <h3 id={`${sectionId(index)}-title`} className="mt-0.5 text-lg font-semibold leading-snug sm:text-xl">
            {section.h}
          </h3>
        </div>
      </div>

      {lead && <p className="mt-4 text-[15px] leading-relaxed sm:text-base">{lead}</p>}
      {rest.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-sm leading-relaxed text-[var(--color-muted)] sm:text-[15px]">
          {paragraph}
        </p>
      ))}
      {section.list &&
        (kind === 'steps' ? <Steps items={section.list} /> : <Bullets items={section.list} kind={kind} />)}
      {section.example && <Example title={section.example.title} lines={section.example.lines} />}
    </section>
  )
}

// Highlights the contents entry for the section currently on screen.
function useActiveSection(count: number): number {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const elements = Array.from({ length: count }, (_, i) => document.getElementById(sectionId(i))).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (!elements.length || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (!visible.length) return
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        setActive(elements.indexOf(top.target as HTMLElement))
      },
      { rootMargin: '-20% 0px -60% 0px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [count])
  return active
}

export function readingMinutes(sections: GuideSection[], extra = ''): number {
  const words = [extra, ...sections.flatMap((section) => [section.h, ...section.p, ...(section.list ?? []), ...(section.example?.lines ?? [])])]
    .join(' ')
    .split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function TemplateGuide({ guide, label }: { guide: GuideSection[]; label: string }) {
  const minutes = readingMinutes(guide)

  return (
    <section className="mt-20 print:hidden" aria-labelledby="guide-title">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
          Guide · {minutes} min read
        </p>
        <h2 id="guide-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Everything to know about your <span className="text-[var(--color-accent)]">{sentenceCase(label)}</span>
        </h2>
      </div>

      <GuideBody guide={guide} className="mt-8" />
    </section>
  )
}

// Contents + section cards. Used under every template and on guide articles.
export function GuideBody({ guide, className = '' }: { guide: GuideSection[]; className?: string }) {
  const active = useActiveSection(guide.length)
  return (
      <div className={`grid grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] ${className}`}>
        {/* Contents: sticky list on desktop, scrollable chips on phones */}
        <nav aria-label="Guide contents" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
            {guide.map((section, index) => (
              <li key={section.h} className="shrink-0 lg:shrink">
                {/* A button rather than a #hash link, so the address bar stays clean */}
                <button
                  type="button"
                  aria-current={index === active ? 'true' : undefined}
                  onClick={() => document.getElementById(sectionId(index))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors lg:rounded-xl lg:border-transparent lg:py-2 lg:text-sm ${
                    index === active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-accent)]'
                      : 'border-[var(--border-panel)] text-[var(--color-muted)] hover:text-[var(--text-app)]'
                  }`}
                >
                  <span className="font-semibold tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{section.h}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-5">
          {guide.map((section, index) => (
            <GuideCard key={section.h} section={section} index={index} />
          ))}
        </div>
      </div>
  )
}

export default TemplateGuide
