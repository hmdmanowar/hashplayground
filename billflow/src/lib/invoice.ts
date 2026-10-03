// Pure invoice model + maths, shared by the live preview and the PDF so both
// always show identical numbers. All money is integer minor units (paise /
// cents) — inputs stay strings while editing and are converted here, which
// avoids float drift like 0.1 + 0.2 on totals.

import type { InvoiceStyleId } from './invoiceStyles'

export type TaxMode = 'none' | 'gst_intra' | 'gst_inter' | 'custom'
// Two-decimal currencies only: money is stored in hundredths everywhere, so
// zero-decimal currencies like JPY are deliberately not offered.
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'INR'
  | 'CAD'
  | 'AUD'
  | 'NZD'
  | 'SGD'
  | 'AED'
  | 'SAR'
  | 'ZAR'
  | 'CHF'
  | 'HKD'
  | 'MYR'
  | 'PHP'
  | 'NGN'
  | 'KES'

export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { code: 'PHP', label: 'PHP — Philippine Peso' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
]

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value)
}

// The tax dropdown offers named presets; under the hood they're still the
// four TaxModes (VAT / GST / Sales tax are 'custom' with that label), so
// saved drafts keep working unchanged.
export type TaxPreset = 'none' | 'vat' | 'gst' | 'sales' | 'gst_intra' | 'gst_inter' | 'custom'

export const TAX_PRESETS: { value: TaxPreset; label: string }[] = [
  { value: 'none', label: 'No tax' },
  { value: 'vat', label: 'VAT' },
  { value: 'gst', label: 'GST (Australia, NZ, Singapore, Canada…)' },
  { value: 'sales', label: 'Sales tax' },
  { value: 'gst_intra', label: 'India GST — same state (CGST + SGST)' },
  { value: 'gst_inter', label: 'India GST — other state (IGST)' },
  { value: 'custom', label: 'Other tax…' },
]

const PRESET_LABELS: Partial<Record<TaxPreset, string>> = { vat: 'VAT', gst: 'GST', sales: 'Sales tax' }

export function taxPresetOf(mode: TaxMode, label: string): TaxPreset {
  if (mode !== 'custom') return mode
  const name = label.trim().toLowerCase()
  const preset = (Object.keys(PRESET_LABELS) as TaxPreset[]).find((key) => PRESET_LABELS[key]!.toLowerCase() === name)
  return preset ?? 'custom'
}

export function applyTaxPreset(preset: TaxPreset, currentLabel: string): Pick<InvoiceDraft, 'taxMode' | 'taxLabel'> {
  if (preset === 'none' || preset === 'gst_intra' || preset === 'gst_inter') return { taxMode: preset, taxLabel: '' }
  if (preset === 'custom') {
    // Keep a label the user already typed; clear one that came from a preset.
    const fromPreset = taxPresetOf('custom', currentLabel) !== 'custom'
    return { taxMode: 'custom', taxLabel: fromPreset ? '' : currentLabel }
  }
  return { taxMode: 'custom', taxLabel: PRESET_LABELS[preset]! }
}

// US Letter for the US and Canada, A4 everywhere else, unless the user picks.
export type PaperSize = 'auto' | 'a4' | 'letter'

export function resolvePaper(draft: Pick<InvoiceDraft, 'paper' | 'currency'>): 'a4' | 'letter' {
  if (draft.paper === 'a4' || draft.paper === 'letter') return draft.paper
  return draft.currency === 'USD' || draft.currency === 'CAD' ? 'letter' : 'a4'
}

export interface LineItem {
  id: string
  description: string
  hsn: string
  quantity: string
  rate: string
  taxRate: string
}

export interface Party {
  name: string
  address: string
  taxId: string
  email: string
  phone: string
}

export interface InvoiceDraft {
  documentTitle: string
  invoiceNumber: string
  issueDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  currency: CurrencyCode
  taxMode: TaxMode
  taxLabel: string
  discountPercent: string
  from: Party
  to: Party
  items: LineItem[]
  notes: string
  payment: PaymentInfo
  logoDataUrl: string
  style: InvoiceStyleId
  paper: PaperSize
}

// Which routing code goes with the bank account. The code itself lives in
// PaymentInfo.ifsc (named before BillFlow went international; kept so saved
// details survive).
export type BankCodeType = 'ifsc' | 'swift' | 'routing' | 'sort' | 'bsb'

export const BANK_CODE_TYPES: { value: BankCodeType; label: string; printed: string; placeholder: string }[] = [
  { value: 'swift', label: 'SWIFT / BIC', printed: 'SWIFT/BIC', placeholder: 'e.g. BARCGB22' },
  { value: 'routing', label: 'Routing number (US)', printed: 'Routing no.', placeholder: '9 digits' },
  { value: 'sort', label: 'Sort code (UK)', printed: 'Sort code', placeholder: 'e.g. 20-00-00' },
  { value: 'bsb', label: 'BSB (Australia)', printed: 'BSB', placeholder: 'e.g. 062-000' },
  { value: 'ifsc', label: 'IFSC (India)', printed: 'IFSC', placeholder: 'e.g. HDFC0001234' },
]

// How the client can pay. Methods are independent toggles — freelancers
// commonly list both a bank account and UPI or a payment link.
export interface PaymentInfo {
  upi: boolean
  upiId: string
  bank: boolean
  accountName: string
  accountNumber: string
  codeType: BankCodeType
  ifsc: string // the bank code for codeType (IFSC, SWIFT, routing no., …)
  bankName: string
  branch: string
  link: boolean
  linkUrl: string
  other: boolean
  otherText: string
}

export const EMPTY_PAYMENT: PaymentInfo = {
  upi: false,
  upiId: '',
  bank: true,
  accountName: '',
  accountNumber: '',
  codeType: 'swift',
  ifsc: '',
  bankName: '',
  branch: '',
  link: false,
  linkUrl: '',
  other: false,
  otherText: '',
}

// IBANs start with a 2-letter country code and 2 check digits.
export function looksLikeIban(value: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(value.replace(/\s/g, '').toUpperCase())
}

// A payment link (PayPal.me, Stripe, Wise…) — http(s) only, so the QR code
// can never point at something like a javascript: URL.
export function normalizePaymentLink(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.hostname.includes('.') ? url.toString() : null
  } catch {
    return null
  }
}

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/

export function isValidIfsc(value: string): boolean {
  return IFSC_PATTERN.test(value.trim().toUpperCase())
}

// Indian bank account numbers are 9–18 digits.
export function isValidAccountNumber(value: string): boolean {
  return /^\d{9,18}$/.test(value.replace(/\s/g, ''))
}

// The printed "Payment details" lines, shared by the preview and the PDF.
export function paymentLines(payment: PaymentInfo): string[] {
  const lines: string[] = []
  if (payment.bank) {
    const bankName = payment.bankName.trim()
    const branch = payment.branch.trim()
    const account = payment.accountNumber.trim()
    const code = payment.ifsc.trim()
    const codeLabel = BANK_CODE_TYPES.find((type) => type.value === payment.codeType)?.printed ?? 'Bank code'
    if (payment.accountName.trim()) lines.push(`Account name: ${payment.accountName.trim()}`)
    if (account) {
      lines.push(looksLikeIban(account) ? `IBAN: ${account.toUpperCase()}` : `Account no.: ${account.replace(/\s/g, '')}`)
    }
    if (code) lines.push(`${codeLabel}: ${code.toUpperCase()}`)
    if (bankName) lines.push(`Bank: ${bankName}`)
    if (branch) lines.push(`Branch: ${branch}`)
  }
  if (payment.link) {
    const url = normalizePaymentLink(payment.linkUrl)
    if (url) lines.push(`Pay online: ${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`)
  }
  if (payment.upi && payment.upiId.trim()) lines.push(`UPI: ${payment.upiId.trim()}`)
  if (payment.other && payment.otherText.trim()) lines.push(...payment.otherText.trim().split('\n'))
  return lines
}

export interface LineTotals {
  amount: number
  taxable: number
  tax: number
}

export interface InvoiceTotals {
  lines: LineTotals[]
  subtotal: number
  discount: number
  taxable: number
  taxLines: { label: string; amount: number }[]
  taxTotal: number
  total: number
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function parseNumber(value: string): number {
  const n = Number.parseFloat(value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function toMinor(value: string): number {
  return Math.round(parseNumber(value) * 100)
}

function clampPercent(value: string): number {
  return Math.min(100, Math.max(0, parseNumber(value)))
}

export function hasTax(mode: TaxMode): boolean {
  return mode !== 'none'
}

export function isGst(mode: TaxMode): boolean {
  return mode === 'gst_intra' || mode === 'gst_inter'
}

function formatRate(rate: number): string {
  return `${Number.parseFloat(rate.toFixed(3))}%`
}

export function computeTotals(draft: InvoiceDraft): InvoiceTotals {
  const discountPct = clampPercent(draft.discountPercent)
  const taxed = hasTax(draft.taxMode)

  const byRate = new Map<number, number>()
  const lines = draft.items.map((item) => {
    const amount = Math.round(parseNumber(item.quantity) * toMinor(item.rate))
    // Discount is allocated per line (not on the grand total) so each line's
    // tax is computed on its own discounted value, as GST requires.
    const taxable = amount - Math.round((amount * discountPct) / 100)
    const rate = taxed ? clampPercent(item.taxRate) : 0
    const tax = Math.round((taxable * rate) / 100)
    if (rate > 0) byRate.set(rate, (byRate.get(rate) ?? 0) + tax)
    return { amount, taxable, tax }
  })

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
  const taxable = lines.reduce((sum, line) => sum + line.taxable, 0)

  const taxLines: { label: string; amount: number }[] = []
  for (const [rate, tax] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    if (draft.taxMode === 'gst_intra') {
      const cgst = Math.round(tax / 2)
      taxLines.push({ label: `CGST @ ${formatRate(rate / 2)}`, amount: cgst })
      taxLines.push({ label: `SGST @ ${formatRate(rate / 2)}`, amount: tax - cgst })
    } else if (draft.taxMode === 'gst_inter') {
      taxLines.push({ label: `IGST @ ${formatRate(rate)}`, amount: tax })
    } else {
      taxLines.push({ label: `${draft.taxLabel.trim() || 'Tax'} @ ${formatRate(rate)}`, amount: tax })
    }
  }
  const taxTotal = taxLines.reduce((sum, line) => sum + line.amount, 0)

  return { lines, subtotal, discount: subtotal - taxable, taxable, taxLines, taxTotal, total: taxable + taxTotal }
}

// ---------------------------------------------------------------- formatting

// Screen symbols are the familiar ones; the space-separated codes are where
// the symbol alone would be ambiguous or unfamiliar.
const SCREEN_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  AED: 'AED ',
  SAR: 'SAR ',
  ZAR: 'R ',
  CHF: 'CHF ',
  HKD: 'HK$',
  MYR: 'RM ',
  PHP: '₱',
  NGN: '₦',
  KES: 'KSh ',
}
// jsPDF's built-in fonts only cover Latin-1 (no ₹, ₱ or ₦; € and £ are
// unreliable), so the PDF uses plain-ASCII prefixes instead.
const PDF_SYMBOLS: Partial<Record<CurrencyCode, string>> = {
  USD: '$',
  INR: 'Rs. ',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  ZAR: 'R ',
  MYR: 'RM ',
  KES: 'KSh ',
}

export function formatMoney(minor: number, currency: CurrencyCode, target: 'screen' | 'pdf' = 'screen'): string {
  const formatted = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(minor) / 100)
  const symbol = target === 'pdf' ? (PDF_SYMBOLS[currency] ?? `${currency} `) : SCREEN_SYMBOLS[currency]
  return `${minor < 0 ? '-' : ''}${symbol}${formatted}`
}

export function formatQuantity(value: string): string {
  const n = parseNumber(value)
  return Number.isInteger(n) ? String(n) : String(Number.parseFloat(n.toFixed(3)))
}

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return ''
  // Built from parts (local time) — new Date('YYYY-MM-DD') parses as UTC and
  // can show the previous day in timezones west of UTC.
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// ------------------------------------------------------------ amount in words

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function belowHundred(n: number): string {
  if (n < 20) return ONES[n]
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(' ')
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  return [hundreds ? `${ONES[hundreds]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ')
}

// Indian numbering: 1,23,45,678 → crore / lakh / thousand.
function indianWords(n: number): string {
  if (n === 0) return 'Zero'
  const crore = Math.floor(n / 10_000_000)
  const lakh = Math.floor(n / 100_000) % 100
  const thousand = Math.floor(n / 1000) % 100
  const rest = n % 1000
  return [
    crore ? `${indianWords(crore)} Crore` : '',
    lakh ? `${belowHundred(lakh)} Lakh` : '',
    thousand ? `${belowHundred(thousand)} Thousand` : '',
    rest ? belowThousand(rest) : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function internationalWords(n: number): string {
  if (n === 0) return 'Zero'
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion']
  const parts: string[] = []
  let scale = 0
  while (n > 0 && scale < scales.length) {
    const chunk = n % 1000
    if (chunk) parts.unshift([belowThousand(chunk), scales[scale]].filter(Boolean).join(' '))
    n = Math.floor(n / 1000)
    scale++
  }
  return parts.join(' ')
}

const CURRENCY_WORDS: Record<CurrencyCode, { major: string; minor: string }> = {
  INR: { major: 'Rupees', minor: 'Paise' },
  USD: { major: 'US Dollars', minor: 'Cents' },
  EUR: { major: 'Euros', minor: 'Cents' },
  GBP: { major: 'Pounds', minor: 'Pence' },
  CAD: { major: 'Canadian Dollars', minor: 'Cents' },
  AUD: { major: 'Australian Dollars', minor: 'Cents' },
  NZD: { major: 'New Zealand Dollars', minor: 'Cents' },
  SGD: { major: 'Singapore Dollars', minor: 'Cents' },
  AED: { major: 'Dirhams', minor: 'Fils' },
  SAR: { major: 'Saudi Riyals', minor: 'Halalas' },
  ZAR: { major: 'Rand', minor: 'Cents' },
  CHF: { major: 'Swiss Francs', minor: 'Centimes' },
  HKD: { major: 'Hong Kong Dollars', minor: 'Cents' },
  MYR: { major: 'Ringgit', minor: 'Sen' },
  PHP: { major: 'Philippine Pesos', minor: 'Centavos' },
  NGN: { major: 'Naira', minor: 'Kobo' },
  KES: { major: 'Kenyan Shillings', minor: 'Cents' },
}

export function amountInWords(minor: number, currency: CurrencyCode): string {
  const abs = Math.abs(minor)
  const major = Math.floor(abs / 100)
  const cents = abs % 100
  const toWords = currency === 'INR' ? indianWords : internationalWords
  const names = CURRENCY_WORDS[currency]
  const main = `${names.major} ${toWords(major)}`
  const tail = cents ? ` and ${belowHundred(cents)} ${names.minor}` : ''
  return `${minor < 0 ? 'Minus ' : ''}${main}${tail} Only`
}

// ------------------------------------------------------------------- GSTIN

const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export function isValidGstin(value: string): boolean {
  return GSTIN_PATTERN.test(value.trim().toUpperCase())
}

// The first two digits of a GSTIN are the state code — same code on both
// sides means an intra-state supply (CGST + SGST), otherwise IGST.
export function suggestedGstMode(fromGstin: string, toGstin: string): TaxMode | null {
  if (!isValidGstin(fromGstin) || !isValidGstin(toGstin)) return null
  return fromGstin.trim().slice(0, 2) === toGstin.trim().slice(0, 2) ? 'gst_intra' : 'gst_inter'
}

export function taxIdLabel(mode: TaxMode, taxLabel = ''): string {
  if (isGst(mode)) return 'GSTIN'
  if (mode === 'custom' && taxLabel.trim().toUpperCase() === 'VAT') return 'VAT no.'
  return 'Tax ID'
}
