import { useEffect } from 'react'
import { canonicalUrl, type InvoiceTemplate } from '../lib/templates'

function setMeta(selector: string, attribute: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attribute, value)
}

// Direct loads already get the right <head> from the prerendered HTML; this
// keeps it correct when moving between templates client-side.
export function usePageMeta(template: InvoiceTemplate) {
  useEffect(() => {
    const url = canonicalUrl(template.slug)
    document.title = template.metaTitle
    setMeta('meta[name="description"]', 'content', template.metaDescription)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', template.metaTitle)
    setMeta('meta[property="og:description"]', 'content', template.metaDescription)
    setMeta('meta[name="twitter:title"]', 'content', template.metaTitle)
    setMeta('meta[name="twitter:description"]', 'content', template.metaDescription)
  }, [template])
}
