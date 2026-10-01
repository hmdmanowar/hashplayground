import { useEffect, useState } from 'react'
import { computeTotals, type InvoiceDraft } from './invoice'

// A UPI ID is handle@psp, e.g. "name@okaxis" or "98765@ybl". The PSP part
// never contains a dot, which is how "name@gmail.com" is told apart from it.
const UPI_ID_PATTERN = /(?<![\w.@-])([a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9]{1,63})(?![\w.@-])/

export function findUpiId(text: string): string | null {
  return UPI_ID_PATTERN.exec(text)?.[1] ?? null
}

const UPI_MENTION = /\b(upi|gpay|google pay|phonepe|paytm|bhim)\b/i
// Indian mobile (optionally +91 / 0 prefixed), not part of a longer number
// and not already followed by an @handle.
const MOBILE_PATTERN = /(?<![\d@])(?:\+?91[\s-]?|0)?([6-9]\d{4}[\s-]?\d{5})(?![\d@])/

// A bare phone number can't go into a UPI QR: the @handle depends on the
// payer's app and can't be guessed. Detect it so the form can ask for it.
export function findUpiPhoneWithoutHandle(text: string): string | null {
  if (findUpiId(text) || !UPI_MENTION.test(text)) return null
  const match = MOBILE_PATTERN.exec(text)
  return match ? match[1].replace(/[\s-]/g, '') : null
}

export interface UpiPayment {
  upiId: string
  uri: string
  amountMinor: number
}

// UPI only settles in INR, so a USD/EUR invoice gets no QR.
export function upiPaymentFor(draft: InvoiceDraft): UpiPayment | null {
  const upiId = findUpiId(draft.paymentDetails)
  if (!upiId || draft.currency !== 'INR') return null
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

// qrcode is loaded on demand — only invoices with a UPI ID need it.
export async function qrDataUrl(text: string): Promise<string> {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
}

export function useUpiQr(draft: InvoiceDraft): { payment: UpiPayment | null; dataUrl: string | null } {
  const payment = upiPaymentFor(draft)
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
