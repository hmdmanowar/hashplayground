import { EMPTY_PAYMENT, toIsoDate, type InvoiceDraft } from './invoice'
import type { InvoiceStyleId } from './invoiceStyles'
import { SAMPLE_LOGO } from './sampleLogo'
import type { InvoiceTemplate } from './templates'

// A filled-in showcase invoice for a template (sample seller + client and the
// template's own items/tax setup) — used for gallery previews only.
export function sampleDraftFor(template: InvoiceTemplate, style: InvoiceStyleId): InvoiceDraft {
  const today = new Date()
  const due = new Date(today)
  due.setDate(due.getDate() + 15)
  const party = { address: '', taxId: '', email: '', phone: '' }
  return {
    documentTitle: template.documentTitle,
    invoiceNumber: 'INV-0042',
    issueDate: toIsoDate(today),
    dueDate: toIsoDate(due),
    currency: template.currency,
    taxMode: template.taxMode,
    taxLabel: template.taxLabel,
    discountPercent: '',
    from: { ...party, name: 'Your Studio', address: 'Bengaluru, Karnataka' },
    to: { ...party, name: 'Acme Clients Pvt Ltd', address: 'Mumbai, Maharashtra' },
    items: template.items.map((item, index) => ({ ...item, id: `${template.slug}-${index}` })),
    notes: template.notes,
    payment: { ...EMPTY_PAYMENT, upi: false },
    logoDataUrl: SAMPLE_LOGO,
    style,
  }
}
