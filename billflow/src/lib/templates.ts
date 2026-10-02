import data from '../data/templates.json'
import type { CurrencyCode, TaxMode } from './invoice'

// templates.json is the single source for both this app and the build-time
// prerender (scripts/prerender.mjs), which turns each entry into a static
// /billflow/<slug>/index.html with its own title, meta tags and FAQ markup.
export interface PageMeta {
  slug: string
  metaTitle: string
  metaDescription: string
}

export interface InvoiceTemplate extends PageMeta {
  label: string
  h1: string
  intro: string
  documentTitle: string
  taxMode: TaxMode
  taxLabel: string
  currency: CurrencyCode
  items: { description: string; hsn: string; quantity: string; rate: string; taxRate: string }[]
  notes: string
  faq: { q: string; a: string }[]
  // Template-specific "what's included" points (shown on the page and in
  // the prerendered HTML, so each template page has its own content).
  highlights: string[]
  // Long-form how-to guide below the generator (also prerendered), so each
  // long-tail page has enough unique text to rank.
  guide: GuideSection[]
}

export interface GuideSection {
  h: string
  p: string[]
  list?: string[]
}

export const SITE_ORIGIN = data.siteOrigin
export const TEMPLATES = data.templates as InvoiceTemplate[]

// The /billflow/ landing page and the /billflow/templates/ gallery page.
export const LANDING_PAGE = data.landingPage
export const GALLERY_PAGE = data.galleryPage

// The plain, all-purpose generator every "Create invoice" button opens.
export const GENERATOR_SLUG = 'invoice-generator'
export const GENERATOR_PATH = `/${GENERATOR_SLUG}/`

export function findTemplate(slug: string): InvoiceTemplate | undefined {
  return TEMPLATES.find((template) => template.slug === slug)
}

export function canonicalUrl(slug: string): string {
  return `${data.siteOrigin}${data.basePath}${slug ? `${slug}/` : ''}`
}
