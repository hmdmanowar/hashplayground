import { useEffect, useState } from 'react'
import { computeTotals, normalizePaymentLink, type InvoiceDraft } from './invoice'
import { linkWithAmount } from './payLink'

// A UPI ID is handle@psp, e.g. "name@okaxis" or "98765@ybl". The PSP part
// never contains a dot, which is how "name@gmail.com" is told apart from it.
const UPI_ID = '[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9]{1,63}'
const UPI_ID_IN_TEXT = new RegExp(`(?<![\\w.@-])(${UPI_ID})(?![\\w.@-])`)
const UPI_ID_EXACT = new RegExp(`^${UPI_ID}$`)

// Pulls a UPI ID out of free text (used to migrate old free-text drafts).
export function findUpiId(text: string): string | null {
  return UPI_ID_IN_TEXT.exec(text)?.[1] ?? null
}

export function isValidUpiId(value: string): boolean {
  return UPI_ID_EXACT.test(value.trim())
}

// Indian mobile, optionally +91 / 0 prefixed, with optional space or dash.
const MOBILE_EXACT = /^(?:\+?91[\s-]?|0)?([6-9]\d{4}[\s-]?\d{5})$/

// A bare phone number can't go into a UPI QR: the @handle depends on the
// payer's app and can't be guessed. Detect it so the form can ask for it.
export function barePhoneNumber(value: string): string | null {
  const match = MOBILE_EXACT.exec(value.trim())
  return match ? match[1].replace(/[\s-]/g, '') : null
}

export interface UpiPayment {
  upiId: string
  uri: string
  amountMinor: number
}

// What the invoice's scan-to-pay QR encodes: a UPI deep link (India, INR)
// or, failing that, the seller's payment link (PayPal, Stripe, Wise…).
export interface ScanToPay {
  kind: 'upi' | 'link'
  uri: string
  amountMinor: number
  alt: string
  via: string // caption's last line
}

export function scanToPayFor(draft: InvoiceDraft): ScanToPay | null {
  const upi = upiPaymentFor(draft)
  if (upi) return { kind: 'upi', uri: upi.uri, amountMinor: upi.amountMinor, alt: `UPI QR code to pay ${upi.upiId}`, via: 'with any UPI app' }
  const link = draft.payment.link ? normalizePaymentLink(draft.payment.linkUrl) : null
  if (!link) return null
  const amountMinor = computeTotals(draft).total
  // PayPal.me, Cash App and Monzo links get the total added, so the payer's
  // app opens with it filled in; other links are encoded unchanged.
  return { kind: 'link', uri: linkWithAmount(link, amountMinor, draft.currency), amountMinor, alt: 'QR code for the payment link', via: 'online' }
}

// UPI only settles in INR, so a USD/EUR invoice gets no QR.
export function upiPaymentFor(draft: InvoiceDraft): UpiPayment | null {
  const upiId = draft.payment.upiId.trim()
  if (!draft.payment.upi || !isValidUpiId(upiId) || draft.currency !== 'INR') return null
  const amountMinor = computeTotals(draft).total
  // NPCI's standard deep link: every UPI app (GPay, PhonePe, Paytm, BHIM…)
  // opens it with payee, amount and note prefilled.
  const params = [
    ['pa', upiId],
    ['pn', draft.from.name.trim() || upiId],
    ...(amountMinor > 0 ? [['am', (amountMinor / 100).toFixed(2)]] : []),
    ['cu', 'INR'],
    ['tn', draft.invoiceNumber ? `Invoice ${draft.invoiceNumber}` : 'Invoice payment'],
  ]
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
  return { upiId, uri: `upi://pay?${query}`, amountMinor }
}

// qrcode is loaded on demand — only invoices with a UPI ID or pay link need it.
export async function qrDataUrl(text: string): Promise<string> {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
}

export function useScanToPayQr(draft: InvoiceDraft): { payment: ScanToPay | null; dataUrl: string | null } {
  const payment = scanToPayFor(draft)
  const uri = payment?.uri ?? null
  const [qr, setQr] = useState<{ uri: string; dataUrl: string } | null>(null)

  useEffect(() => {
    if (!uri) return
    let cancelled = false
    // Debounced: the QR encodes the total, which changes on every keystroke.
    const timer = setTimeout(() => {
      qrDataUrl(uri)
        .then((dataUrl) => {
          if (!cancelled) setQr({ uri, dataUrl })
        })
        .catch(() => {})
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [uri])

  // Keeps showing the previous QR for the ~250ms it takes to regenerate, so
  // the preview doesn't flicker while typing. The PDF always encodes fresh.
  return { payment, dataUrl: uri && qr ? qr.dataUrl : null }
}
