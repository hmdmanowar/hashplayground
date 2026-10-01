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
}

export const SITE_ORIGIN = data.siteOrigin
export const TEMPLATES = data.templates as InvoiceTemplate[]

// The /billflow/templates/ gallery page.
export const GALLERY_PAGE = data.galleryPage

export function findTemplate(slug: string): InvoiceTemplate | undefined {
  return TEMPLATES.find((template) => template.slug === slug)
}

export function canonicalUrl(slug: string): string {
  return `${data.siteOrigin}${data.basePath}${slug ? `${slug}/` : ''}`
}
