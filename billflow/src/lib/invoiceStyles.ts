// Visual styles for the invoice. One config drives BOTH the live preview
// (InvoicePreview) and the PDF (generatePdf) so the download always matches
// what the user picked and saw.

export type InvoiceStyleId =
  | 'classic'
  | 'bold'
  | 'minimal'
  | 'elegant'
  | 'vibrant'
  | 'vintage'
  | 'modern'
  | 'service'

export interface InvoiceStyle {
  id: InvoiceStyleId
  name: string
  description: string
  serif: boolean
  // 'split': logo left, title + meta right. 'centered' / 'stacked': title
  // across the top (centred / left-aligned), then meta left and logo right.
  layout: 'split' | 'centered' | 'stacked'
  title: { color: string; bold: boolean; size: number }
  head: { bg: string; text: string }
  headRule: boolean // table header marked by accent rules above/below instead of a fill
  recipientTag: boolean // small "ORIGINAL FOR RECIPIENT" tag top-right
  boxed: boolean // parties and totals drawn inside bordered boxes
  grid: boolean // fully ruled table (cell borders) instead of row rules
  zebra: string | null // alternate row fill
  rule: string
  label: string // small section labels (FROM, BILL TO, …)
  accent: string // line above the total when there's no total band
  totalBand: { bg: string; text: string } | null
}

export const INVOICE_STYLES: InvoiceStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Indigo title, soft grey table header',
    serif: false,
    layout: 'split',
    title: { color: '#3d52a0', bold: true, size: 20 },
    head: { bg: '#f0f2f8', text: '#646873' },
    headRule: false,
    recipientTag: false,
    boxed: false,
    grid: false,
    zebra: null,
    rule: '#d6d9e0',
    label: '#646873',
    accent: '#3d52a0',
    totalBand: null,
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Big black title, deep-blue table header',
    serif: false,
    layout: 'split',
    title: { color: '#111827', bold: true, size: 24 },
    head: { bg: '#1e3a8a', text: '#ffffff' },
    headRule: false,
    recipientTag: false,
    boxed: false,
    grid: false,
    zebra: null,
    rule: '#d6d9e0',
    label: '#1e3a8a',
    accent: '#1e3a8a',
    totalBand: { bg: '#e6ebf7', text: '#111827' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Monochrome with a fully ruled table',
    serif: false,
    layout: 'split',
    title: { color: '#111827', bold: false, size: 22 },
    head: { bg: '#ffffff', text: '#111827' },
    headRule: false,
    recipientTag: false,
    boxed: false,
    grid: true,
    zebra: null,
    rule: '#b8bcc6',
    label: '#6b7280',
    accent: '#111827',
    totalBand: null,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Serif type, black header, grey total band',
    serif: true,
    layout: 'split',
    title: { color: '#111111', bold: false, size: 24 },
    head: { bg: '#111111', text: '#ffffff' },
    headRule: false,
    recipientTag: false,
    boxed: false,
    grid: false,
    zebra: null,
    rule: '#d4d4d4',
    label: '#6b6b6b',
    accent: '#111111',
    totalBand: { bg: '#efefef', text: '#111111' },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Centred title, orange header, striped rows',
    serif: false,
    layout: 'centered',
    title: { color: '#1f2937', bold: true, size: 22 },
    head: { bg: '#f59e0b', text: '#1f2937' },
    headRule: false,
    recipientTag: false,
    boxed: false,
    grid: false,
    zebra: '#fff7ed',
    rule: '#f3dcc0',
    label: '#b45309',
    accent: '#f59e0b',
    totalBand: { bg: '#fff1dc', text: '#1f2937' },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Fully boxed GST register layout',
    serif: false,
    layout: 'centered',
    title: { color: '#1d4ed8', bold: true, size: 13 },
    head: { bg: '#f3f4f6', text: '#111827' },
    headRule: false,
    recipientTag: true,
    boxed: true,
    grid: true,
    zebra: null,
    rule: '#4b5563',
    label: '#111827',
    accent: '#111827',
    totalBand: null,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Small title top-left, ruled table header',
    serif: false,
    layout: 'stacked',
    title: { color: '#1e3a8a', bold: true, size: 12 },
    head: { bg: '#ffffff', text: '#111827' },
    headRule: true,
    recipientTag: true,
    boxed: false,
    grid: false,
    zebra: null,
    rule: '#e5e7eb',
    label: '#6b7280',
    accent: '#1e3a8a',
    totalBand: null,
  },
  {
    id: 'service',
    name: 'Service',
    description: 'Compact, ruled header, soft total band',
    serif: false,
    layout: 'split',
    title: { color: '#1e3a8a', bold: true, size: 14 },
    head: { bg: '#ffffff', text: '#111827' },
    headRule: true,
    recipientTag: false,
    boxed: false,
    grid: false,
    zebra: null,
    rule: '#e5e7eb',
    label: '#1e3a8a',
    accent: '#1e3a8a',
    totalBand: { bg: '#eef2ff', text: '#1e3a8a' },
  },
]

export const DEFAULT_STYLE: InvoiceStyleId = 'classic'

export function getInvoiceStyle(id: string | undefined): InvoiceStyle {
  return INVOICE_STYLES.find((style) => style.id === id) ?? INVOICE_STYLES[0]
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
