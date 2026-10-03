import data from '../data/templates.json'
import type { CurrencyCode, TaxMode } from './invoice'
import { detectCountry, localPrice, regionDefaults } from './region'

// 'global' templates are written in USD and localised to the visitor's
// country at runtime; the others are tied to one country's rules.
export type TemplateRegion = 'global' | 'IN' | 'GB' | 'US' | 'AU' | 'AE'

// templates.json is the single source for both this app and the build-time
// prerender (scripts/prerender.mjs), which turns each entry into a static
// /billflow/<slug>/index.html with its own title, meta tags and FAQ markup.
export interface PageMeta {
  slug: string
  metaTitle: string
  metaDescription: string
}

export interface InvoiceTemplate extends PageMeta {
  region: TemplateRegion
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
  // A ready-to-copy sample (email template, numbering scheme…), guides only.
  example?: { title?: string; lines: string[] }
}

export const SITE_ORIGIN = data.siteOrigin
// A global template in the visitor's own currency, with prices converted
// and any VAT-style tax renamed and re-rated to what's usual locally (an
// Australian visitor's VAT invoice becomes GST at 10%).
function localize(template: InvoiceTemplate): InvoiceTemplate {
  if (template.region !== 'global') return template
  const local = regionDefaults(detectCountry())
  const taxed = template.taxMode === 'custom'
  return {
    ...template,
    currency: local.currency,
    taxLabel: taxed ? local.taxName : template.taxLabel,
    documentTitle:
      taxed && template.documentTitle === 'VAT Invoice'
        ? local.taxName === 'VAT'
          ? 'VAT Invoice'
          : local.taxName === 'GST'
            ? 'Tax Invoice'
            : 'Invoice'
        : template.documentTitle,
    items: template.items.map((item) => ({
      ...item,
      rate: localPrice(item.rate, local.currency),
      taxRate: taxed ? local.vatRate : item.taxRate,
    })),
  }
}

export const TEMPLATES = (data.templates as InvoiceTemplate[]).map(localize)

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
