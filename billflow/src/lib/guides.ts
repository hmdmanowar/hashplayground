import guidesData from '../data/guides.json'
import pagesData from '../data/pages.json'
import type { GuideSection, PageMeta } from './templates'

// Guide articles (/billflow/guides/<slug>/) and the static About / Privacy
// pages. Like templates.json, these JSON files also feed scripts/prerender.mjs.
export interface Guide {
  slug: string // URL segment under /guides/
  label: string
  metaTitle: string
  metaDescription: string
  h1: string
  intro: string
  sections: GuideSection[]
  faq: { q: string; a: string }[]
  related: string[] // template slugs
}

export interface InfoPage extends PageMeta {
  h1: string
  intro: string
  sections: GuideSection[]
}

export const GUIDES = guidesData as Guide[]
export const GUIDES_HUB = pagesData.hub
export const ABOUT_PAGE = pagesData.about as InfoPage
export const PRIVACY_PAGE = pagesData.privacy as InfoPage

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug)
}

// PageMeta for usePageMeta: the canonical path is guides/<slug>/.
export function guideMeta(guide: Guide): PageMeta {
  return { slug: `guides/${guide.slug}`, metaTitle: guide.metaTitle, metaDescription: guide.metaDescription }
}

// Guides that point at a template, for "Helpful guides" on its page.
export function guidesForTemplate(templateSlug: string): Guide[] {
  return GUIDES.filter((guide) => guide.related.includes(templateSlug))
}
