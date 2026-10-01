import data from '../data/templates.json'
import type { CurrencyCode, TaxMode } from './invoice'

// templates.json is the single source for both this app and the build-time
// prerender (scripts/prerender.mjs), which turns each entry into a static
// /billflow/<slug>/index.html with its own title, meta tags and FAQ markup.
export interface InvoiceTemplate {
  slug: string
  label: string
  metaTitle: string
  metaDescription: string
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

export function findTemplate(slug: string): InvoiceTemplate | undefined {
  return TEMPLATES.find((template) => template.slug === slug)
}

export function canonicalUrl(slug: string): string {
  return `${data.siteOrigin}${data.basePath}${slug ? `${slug}/` : ''}`
}
