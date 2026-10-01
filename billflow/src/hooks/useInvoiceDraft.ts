import { useCallback, useEffect, useState } from 'react'
import { newId, toIsoDate, type InvoiceDraft, type LineItem, type Party } from '../lib/invoice'
import type { InvoiceTemplate } from '../lib/templates'
import { readJson, removeKey, writeJson } from '../lib/storage'

// Two storage scopes: the seller's own details (business, logo, payment
// info) are shared by every template page, while the invoice body is saved
// per template — so opening a different template prefills its sample lines
// without wiping the user's business details.
const BUSINESS_KEY = 'billflow:business'
const draftKey = (slug: string) => `billflow:draft:${slug || 'main'}`
const SAVE_DELAY_MS = 400

type BusinessFields = Pick<InvoiceDraft, 'from' | 'logoDataUrl' | 'paymentDetails'>

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
    paymentDetails: '',
    logoDataUrl: '',
  }
}

function loadInitial(template: InvoiceTemplate): InvoiceDraft {
  const base = buildDefault(template)
  const saved = readJson<Partial<InvoiceDraft>>(draftKey(template.slug))
  const business = readJson<Partial<BusinessFields>>(BUSINESS_KEY)
  return {
    ...base,
    ...saved,
    from: { ...EMPTY_PARTY, ...business?.from },
    to: { ...EMPTY_PARTY, ...saved?.to },
    items: saved?.items?.length ? saved.items : base.items,
    logoDataUrl: business?.logoDataUrl ?? '',
    paymentDetails: business?.paymentDetails ?? '',
  }
}

export function useInvoiceDraft(template: InvoiceTemplate) {
  const [draft, setDraft] = useState<InvoiceDraft>(() => loadInitial(template))

  const { from, logoDataUrl, paymentDetails, ...body } = draft
  const bodyJson = JSON.stringify(body)

  useEffect(() => {
    const timer = setTimeout(() => writeJson(BUSINESS_KEY, { from, logoDataUrl, paymentDetails }), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [from, logoDataUrl, paymentDetails])

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
      paymentDetails: prev.paymentDetails,
    }))
  }, [template])

  return { draft, update, updateParty, updateItem, addItem, removeItem, reset }
}
