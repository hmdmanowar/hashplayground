import { useCallback, useEffect, useState } from 'react'
import { EMPTY_PAYMENT, newId, toIsoDate, type InvoiceDraft, type LineItem, type Party, type PaymentInfo } from '../lib/invoice'
import { findUpiId } from '../lib/upi'
import { GENERATOR_SLUG, type InvoiceTemplate } from '../lib/templates'
import { readJson, removeKey, writeJson } from '../lib/storage'

// Two storage scopes: the seller's own details (business, logo, payment
// info) are shared by every template page, while the invoice body is saved
// per template — so opening a different template prefills its sample lines
// without wiping the user's business details.
const BUSINESS_KEY = 'billflow:business'
// The standard generator used to live at /billflow/ (slug ''), saved under
// "main" — keep that key so existing drafts survive its move.
const draftKey = (slug: string) => `billflow:draft:${!slug || slug === GENERATOR_SLUG ? 'main' : slug}`
const SAVE_DELAY_MS = 400

type BusinessFields = Pick<InvoiceDraft, 'from' | 'logoDataUrl' | 'payment'>
type StoredBusiness = Partial<BusinessFields> & { paymentDetails?: string }

// Drafts saved before payment details became structured stored one free-text
// "paymentDetails" string — lift its UPI ID into the UPI field and keep the
// rest as "Other" text so nothing the user typed is lost.
function migratePayment(stored: StoredBusiness | null): PaymentInfo {
  if (stored?.payment) return { ...EMPTY_PAYMENT, ...stored.payment }
  const text = stored?.paymentDetails?.trim() ?? ''
  if (!text) return { ...EMPTY_PAYMENT }
  const upiId = findUpiId(text)
  const rest = text
    .split('\n')
    .filter((line) => !upiId || !line.includes(upiId))
    .join('\n')
    .trim()
  return { ...EMPTY_PAYMENT, upi: Boolean(upiId), upiId: upiId ?? '', other: Boolean(rest), otherText: rest }
}

const EMPTY_PARTY: Party = { name: '', address: '', taxId: '', email: '', phone: '' }

export function emptyItem(): LineItem {
  return { id: newId(), description: '', hsn: '', quantity: '1', rate: '', taxRate: '18' }
}

function buildDefault(template: InvoiceTemplate): InvoiceDraft {
  const today = new Date()
  const due = new Date(today)
  due.setDate(due.getDate() + 15)
  return {
    documentTitle: template.documentTitle,
    invoiceNumber: 'INV-0001',
    issueDate: toIsoDate(today),
    dueDate: toIsoDate(due),
    currency: template.currency,
    taxMode: template.taxMode,
    taxLabel: template.taxLabel,
    discountPercent: '',
    from: { ...EMPTY_PARTY },
    to: { ...EMPTY_PARTY },
    items: template.items.map((item) => ({ ...item, id: newId() })),
    notes: template.notes,
    payment: { ...EMPTY_PAYMENT },
    logoDataUrl: '',
  }
}

function loadInitial(template: InvoiceTemplate): InvoiceDraft {
  const base = buildDefault(template)
  const saved = readJson<Partial<InvoiceDraft>>(draftKey(template.slug))
  const business = readJson<StoredBusiness>(BUSINESS_KEY)
  return {
    ...base,
    ...saved,
    from: { ...EMPTY_PARTY, ...business?.from },
    to: { ...EMPTY_PARTY, ...saved?.to },
    items: saved?.items?.length ? saved.items : base.items,
    logoDataUrl: business?.logoDataUrl ?? '',
    payment: migratePayment(business),
  }
}

export function useInvoiceDraft(template: InvoiceTemplate) {
  const [draft, setDraft] = useState<InvoiceDraft>(() => loadInitial(template))

  const { from, logoDataUrl, payment, ...body } = draft
  const bodyJson = JSON.stringify(body)

  useEffect(() => {
    const timer = setTimeout(() => writeJson(BUSINESS_KEY, { from, logoDataUrl, payment }), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [from, logoDataUrl, payment])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(template.slug), bodyJson)
      } catch {
        // ignore
      }
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [bodyJson, template.slug])

  const update = useCallback((patch: Partial<InvoiceDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateParty = useCallback((side: 'from' | 'to', patch: Partial<Party>) => {
    setDraft((prev) => ({ ...prev, [side]: { ...prev[side], ...patch } }))
  }, [])

  const updatePayment = useCallback((patch: Partial<PaymentInfo>) => {
    setDraft((prev) => ({ ...prev, payment: { ...prev.payment, ...patch } }))
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<LineItem>) => {
    setDraft((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) }))
  }, [])

  const addItem = useCallback(() => {
    setDraft((prev) => {
      const last = prev.items[prev.items.length - 1]
      return { ...prev, items: [...prev.items, { ...emptyItem(), taxRate: last?.taxRate ?? '18' }] }
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
  }, [])

  // Starts a fresh invoice from the template but keeps the seller's details.
  const reset = useCallback(() => {
    removeKey(draftKey(template.slug))
    setDraft((prev) => ({
      ...buildDefault(template),
      from: prev.from,
      logoDataUrl: prev.logoDataUrl,
      payment: prev.payment,
    }))
  }, [template])

  return { draft, update, updateParty, updatePayment, updateItem, addItem, removeItem, reset }
}
