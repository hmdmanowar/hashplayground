import { jsPDF } from 'jspdf'
import {
  amountInWords,
  computeTotals,
  formatDate,
  formatMoney,
  formatQuantity,
  hasTax,
  paymentLines,
  resolvePaper,
  taxIdLabel,
  toMinor,
  type InvoiceDraft,
  type Party,
} from './invoice'
import { qrDataUrl, scanToPayFor } from './upi'
import { getInvoiceStyle, hexToRgb } from './invoiceStyles'

// Draws the invoice directly with jsPDF (same approach as the main app's
// Portfolio/generateResumePdf.ts) rather than screenshotting the preview:
// real selectable text, small files and identical output in every browser.

// Page sizes in mm. Everything below is laid out relative to these.
const PAPER = { a4: { width: 210, height: 297 }, letter: { width: 215.9, height: 279.4 } } as const
const MARGIN = 14
const LINE = 4.6
const PT_TO_MM = 25.4 / 72
const COLOR_TEXT: [number, number, number] = [30, 32, 38]
const COLOR_MUTED: [number, number, number] = [100, 104, 115]
const FOOTER_TEXT = 'Created with BillFlow, the free invoice generator at hashplayground.in/billflow'

// Helvetica (the only font jsPDF ships) covers Latin-1 only; swap the common
// characters it can't draw so they don't come out as garbage glyphs.
function pdfSafe(value: string): string {
  return value
    .replace(/₹\s?/g, 'Rs. ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
}

function loadImageSize(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

interface Column {
  key: 'index' | 'description' | 'hsn' | 'quantity' | 'rate' | 'taxRate' | 'amount'
  label: string
  width: number
  align: 'left' | 'right'
}

export async function generateInvoicePdf(draft: InvoiceDraft): Promise<void> {
  const paper = resolvePaper(draft)
  const PAGE_WIDTH = PAPER[paper].width
  const PAGE_HEIGHT = PAPER[paper].height
  const RIGHT = PAGE_WIDTH - MARGIN
  const doc = new jsPDF({ unit: 'mm', format: paper })
  const totals = computeTotals(draft)
  const taxed = hasTax(draft.taxMode)
  const money = (minor: number) => formatMoney(minor, draft.currency, 'pdf')
  const look = getInvoiceStyle(draft.style)
  const font = look.serif ? 'times' : 'helvetica'
  const COLOR_ACCENT = hexToRgb(look.accent)
  const COLOR_RULE = hexToRgb(look.rule)
  const COLOR_LABEL = hexToRgb(look.label)
  let y = MARGIN + 4

  function fill(hex: string, x: number, top: number, width: number, height: number) {
    const [r, g, b] = hexToRgb(hex)
    doc.setFillColor(r, g, b)
    doc.rect(x, top, width, height, 'F')
  }

  function setText(size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color = COLOR_TEXT) {
    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
  }

  function rule(atY: number) {
    doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2])
    doc.setLineWidth(0.3)
    doc.line(MARGIN, atY, RIGHT, atY)
  }

  function ensureSpace(height: number): boolean {
    if (y + height <= PAGE_HEIGHT - MARGIN - 8) return false
    doc.addPage()
    y = MARGIN + 4
    return true
  }

  // ------------------------------------------------------------ header
  // "centered" and "stacked" both put the title on its own line at the top,
  // with meta on the left and the logo on the right underneath.
  const topTitle = look.layout !== 'split'
  const centered = topTitle
  const title = pdfSafe(draft.documentTitle || 'Invoice').toUpperCase()
  const meta: [string, string][] = [
    ['Invoice no.', draft.invoiceNumber],
    ['Date', formatDate(draft.issueDate)],
    ['Due date', formatDate(draft.dueDate)],
  ]

  if (look.recipientTag) {
    setText(7, 'bold', COLOR_MUTED)
    doc.text('ORIGINAL FOR RECIPIENT', RIGHT, MARGIN - 3, { align: 'right' })
  }

  // "banner": full-width colour band on top with the logo and title in it;
  // meta follows below on the left.
  const banner = look.layout === 'banner'
  const BANNER_HEIGHT = 32
  if (banner) fill(look.bannerBg ?? look.accent, 0, 0, PAGE_WIDTH, BANNER_HEIGHT)

  // "split": logo left, title + meta right-aligned.
  setText(look.title.size, look.title.bold ? 'bold' : 'normal', hexToRgb(look.title.color))
  if (banner) doc.text(title, MARGIN, draft.logoDataUrl ? 26 : 19)
  else if (look.layout === 'centered') doc.text(title, PAGE_WIDTH / 2, y + 2, { align: 'center' })
  else if (look.layout === 'stacked') doc.text(title, MARGIN, y + 1)
  else doc.text(title, RIGHT, y + 2, { align: 'right' })
  const blockTop = banner ? BANNER_HEIGHT + 8 : topTitle ? y + (look.title.size < 16 ? 9 : 12) : y

  let logoBottom = blockTop
  if (draft.logoDataUrl) {
    const size = await loadImageSize(draft.logoDataUrl)
    if (size && size.width > 0 && size.height > 0) {
      const scale = banner ? Math.min(40 / size.width, 11 / size.height) : Math.min(42 / size.width, 20 / size.height)
      const width = size.width * scale
      const height = size.height * scale
      const format = draft.logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      const logoX = banner ? MARGIN : centered ? RIGHT - width : MARGIN
      const logoTop = banner ? 7 : centered ? blockTop - 3 : y - 4
      try {
        if (banner) {
          // White chip keeps any logo legible on the coloured banner
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(logoX - 1.5, logoTop - 1.2, width + 3, height + 2.4, 1.5, 1.5, 'F')
        }
        doc.addImage(draft.logoDataUrl, format, logoX, logoTop, width, height, 'logo', 'FAST')
        if (!banner) logoBottom = logoTop + height
      } catch {
        // unreadable image — skip the logo rather than fail the download
      }
    }
  }

  let metaY = centered ? blockTop : y + 9
  for (const [label, value] of meta) {
    if (!value) continue
    setText(9.5, 'normal', COLOR_MUTED)
    if (centered) {
      doc.text(`${label}:`, MARGIN, metaY)
      setText(9.5, 'bold')
      doc.text(pdfSafe(value), MARGIN + 24, metaY)
    } else {
      doc.text(`${label}:`, RIGHT - 32, metaY, { align: 'right' })
      setText(9.5, 'bold')
      doc.text(pdfSafe(value), RIGHT, metaY, { align: 'right' })
    }
    metaY += LINE + 0.6
  }
  y = Math.max(logoBottom, metaY) + 6

  // ------------------------------------------------------------ parties
  function party(title: string, data: Party, x: number, width: number): number {
    let py = y
    setText(8, 'bold', COLOR_LABEL)
    doc.text(title, x, py)
    py += LINE + 0.6
    if (data.name) {
      setText(11, 'bold')
      const nameLines = doc.splitTextToSize(pdfSafe(data.name), width) as string[]
      doc.text(nameLines, x, py, { lineHeightFactor: 5 / (11 * PT_TO_MM) })
      py += nameLines.length * 5
    }
    setText(9.5, 'normal', COLOR_MUTED)
    const rows = [
      ...data.address.split('\n').filter((line) => line.trim()),
      data.taxId ? `${taxIdLabel(draft.taxMode, draft.taxLabel)}: ${data.taxId.toUpperCase()}` : '',
      data.email,
      data.phone,
    ].filter(Boolean)
    for (const row of rows) {
      const lines = doc.splitTextToSize(pdfSafe(row), width) as string[]
      doc.text(lines, x, py, { lineHeightFactor: LINE / (9.5 * PT_TO_MM) })
      py += lines.length * LINE
    }
    return py
  }

  const half = (RIGHT - MARGIN - 10) / 2
  if (look.boxed) y += 2
  const partiesTop = y - 4.5
  const fromBottom = party('FROM', draft.from, MARGIN + (look.boxed ? 3 : 0), half - (look.boxed ? 3 : 0))
  const toBottom = party('BILL TO', draft.to, MARGIN + half + 10, half - (look.boxed ? 3 : 0))
  y = Math.max(fromBottom, toBottom) + 5
  if (look.boxed) {
    // Boxed register look: border round both parties with a divider between
    const boxBottom = y - 3
    doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2])
    doc.setLineWidth(0.3)
    doc.rect(MARGIN, partiesTop, RIGHT - MARGIN, boxBottom - partiesTop)
    doc.line(MARGIN + half + 5, partiesTop, MARGIN + half + 5, boxBottom)
    y += 2
  }

  // ------------------------------------------------------------ items table
  const showHsn = draft.items.some((item) => item.hsn.trim())
  const fixed: Column[] = [
    ...(showHsn ? [{ key: 'hsn', label: 'HSN/SAC', width: 20, align: 'left' } as Column] : []),
    { key: 'quantity', label: 'Qty', width: 14, align: 'right' },
    { key: 'rate', label: 'Rate', width: 28, align: 'right' },
    ...(taxed ? [{ key: 'taxRate', label: 'Tax %', width: 14, align: 'right' } as Column] : []),
    { key: 'amount', label: 'Amount', width: 30, align: 'right' },
  ]
  const indexColumn: Column = { key: 'index', label: '#', width: 8, align: 'left' }
  const descriptionWidth = RIGHT - MARGIN - indexColumn.width - fixed.reduce((sum, col) => sum + col.width, 0)
  const columns: Column[] = [indexColumn, { key: 'description', label: 'Description', width: descriptionWidth, align: 'left' }, ...fixed]

  const columnX = (index: number) => MARGIN + columns.slice(0, index).reduce((sum, col) => sum + col.width, 0)
  const cellX = (index: number) =>
    columns[index].align === 'right' ? columnX(index) + columns[index].width - 1.5 : columnX(index) + 1.5

  // Table layout works from each row's top edge (y) rather than a text
  // baseline, so text can be centred vertically between the row rules:
  // baseline = top + padding + cap height of the font.
  const capHeight = (size: number) => size * PT_TO_MM * 0.72
  const HEADER_HEIGHT = 7
  const CELL_PAD = look.dense ? 1.4 : 2.3

  // "grid" styles rule every cell: outer box plus a line at each column edge.
  // "columnLines" styles draw only the vertical column edges (plus a box
  // round the header), leaving rows unruled.
  function cellBorders(top: number, height: number, isHeader = false) {
    if (!look.grid && !look.columnLines) return
    doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2])
    doc.setLineWidth(0.3)
    if (look.grid || isHeader) doc.rect(MARGIN, top, RIGHT - MARGIN, height)
    else {
      doc.line(MARGIN, top, MARGIN, top + height)
      doc.line(RIGHT, top, RIGHT, top + height)
    }
    for (let index = 1; index < columns.length; index++) doc.line(columnX(index), top, columnX(index), top + height)
  }

  function tableHeader() {
    fill(look.head.bg, MARGIN, y, RIGHT - MARGIN, HEADER_HEIGHT)
    cellBorders(y, HEADER_HEIGHT, true)
    if (look.headRule) {
      doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2])
      doc.setLineWidth(0.5)
      doc.line(MARGIN, y, RIGHT, y)
      doc.line(MARGIN, y + HEADER_HEIGHT, RIGHT, y + HEADER_HEIGHT)
    }
    setText(8.5, 'bold', hexToRgb(look.head.text))
    const baseline = y + (HEADER_HEIGHT + capHeight(8.5)) / 2
    columns.forEach((col, index) => doc.text(col.label, cellX(index), baseline, { align: col.align }))
    y += HEADER_HEIGHT
  }

  y -= 4.5 // previous blocks leave y on a text baseline; the table starts at its top edge
  tableHeader()
  draft.items.forEach((item, itemIndex) => {
    setText(9.5)
    const descLines = doc.splitTextToSize(pdfSafe(item.description || '-'), descriptionWidth - 3) as string[]
    const rowHeight = CELL_PAD * 2 + capHeight(9.5) + (descLines.length - 1) * LINE
    if (ensureSpace(rowHeight)) tableHeader()
    const values: Record<Column['key'], string | string[]> = {
      index: String(itemIndex + 1),
      description: descLines,
      hsn: pdfSafe(item.hsn),
      quantity: formatQuantity(item.quantity),
      rate: money(toMinor(item.rate)),
      taxRate: `${formatQuantity(item.taxRate)}%`,
      amount: money(totals.lines[itemIndex].amount),
    }
    if (look.zebra && itemIndex % 2 === 1) fill(look.zebra, MARGIN, y, RIGHT - MARGIN, rowHeight)
    cellBorders(y, rowHeight)
    setText(9.5)
    const baseline = y + CELL_PAD + capHeight(9.5)
    columns.forEach((col, index) =>
      doc.text(values[col.key], cellX(index), baseline, { align: col.align, lineHeightFactor: LINE / (9.5 * PT_TO_MM) }),
    )
    y += rowHeight
    if (!look.grid && !look.columnLines) rule(y)
  })
  if (look.columnLines) rule(y)
  y += 6.4

  // ------------------------------------------------------------ totals
  const summary: { label: string; value: string; strong?: boolean }[] = [
    { label: 'Subtotal', value: money(totals.subtotal) },
  ]
  if (totals.discount > 0) {
    summary.push({ label: `Discount (${formatQuantity(draft.discountPercent)}%)`, value: `-${money(totals.discount)}` })
    if (taxed) summary.push({ label: 'Taxable amount', value: money(totals.taxable) })
  }
  totals.taxLines.forEach((line) => summary.push({ label: line.label, value: money(line.amount) }))

  ensureSpace(summary.length * 5.5 + 16)
  const totalsTop = y - 4.5
  // Boxed styles keep amounts clear of the box's right border.
  const valueX = look.boxed ? RIGHT - 2.5 : RIGHT
  for (const row of summary) {
    setText(9.5, 'normal', COLOR_MUTED)
    doc.text(pdfSafe(row.label), RIGHT - 40, y, { align: 'right' })
    setText(9.5)
    doc.text(row.value, valueX, y, { align: 'right' })
    y += 5.5
  }
  if (look.totalBand) {
    // Highlighted "balance due" band behind the total row
    fill(look.totalBand.bg, RIGHT - 84, y - 1.5, 84, 9.5)
    y += 4.5
    setText(12, 'bold', hexToRgb(look.totalBand.text))
    doc.text(`Total (${draft.currency})`, RIGHT - 40, y, { align: 'right' })
    doc.text(money(totals.total), RIGHT - 2, y, { align: 'right' })
    y += 9
  } else {
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2])
    doc.setLineWidth(0.5)
    doc.line(RIGHT - 80, y - 2, RIGHT, y - 2)
    y += 3.5
    setText(12, 'bold')
    doc.text(`Total (${draft.currency})`, RIGHT - 40, y, { align: 'right' })
    doc.text(money(totals.total), valueX, y, { align: 'right' })
    y += 8
  }
  if (look.boxed) {
    doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2])
    doc.setLineWidth(0.3)
    doc.rect(RIGHT - 86, totalsTop, 86, y - 4 - totalsTop)
    y += 2
  }

  setText(9, 'italic', COLOR_MUTED)
  const words = doc.splitTextToSize(`Amount in words: ${amountInWords(totals.total, draft.currency)}`, RIGHT - MARGIN) as string[]
  ensureSpace(words.length * LINE)
  doc.text(words, MARGIN, y, { lineHeightFactor: LINE / (9 * PT_TO_MM) })
  y += words.length * LINE + 4

  // ------------------------------------------------------------ notes
  // An optional QR sits at the block's right edge; text wraps beside it.
  const QR_SIZE = 30
  const QR_CAPTION_HEIGHT = 8

  function block(title: string, body: string, qr?: { dataUrl: string; caption: string[] }) {
    if (!body.trim()) return
    setText(9.5)
    const textWidth = qr ? RIGHT - MARGIN - QR_SIZE - 8 : RIGHT - MARGIN
    const lines = doc.splitTextToSize(pdfSafe(body), textWidth) as string[]
    const textHeight = LINE + 0.4 + lines.length * LINE
    const blockHeight = qr ? Math.max(textHeight, QR_SIZE + QR_CAPTION_HEIGHT) : textHeight
    ensureSpace(blockHeight + 4)
    const top = y
    setText(8, 'bold', COLOR_LABEL)
    doc.text(title, MARGIN, y)
    y += LINE + 0.4
    setText(9.5)
    doc.text(lines, MARGIN, y, { lineHeightFactor: LINE / (9.5 * PT_TO_MM) })
    if (qr) {
      const qrX = RIGHT - QR_SIZE
      const qrTop = top - capHeight(8)
      doc.addImage(qr.dataUrl, 'PNG', qrX, qrTop, QR_SIZE, QR_SIZE, 'upi-qr', 'FAST')
      setText(7.5, 'normal', COLOR_MUTED)
      doc.text(qr.caption, qrX + QR_SIZE / 2, qrTop + QR_SIZE + 3, {
        align: 'center',
        lineHeightFactor: 3.2 / (7.5 * PT_TO_MM),
      })
    }
    y = top + blockHeight + 4
  }

  const upi = scanToPayFor(draft)
  const upiQr = upi
    ? {
        dataUrl: await qrDataUrl(upi.uri),
        caption: [upi.amountMinor > 0 ? `Scan to pay ${money(upi.amountMinor)}` : 'Scan to pay', upi.via],
      }
    : undefined
  block('PAYMENT DETAILS', paymentLines(draft.payment).join('\n'), upiQr)
  block('NOTES', draft.notes)

  // ------------------------------------------------------------ footer
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    setText(7.5, 'normal', COLOR_MUTED)
    doc.text(FOOTER_TEXT, PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: 'center' })
    if (pages > 1) doc.text(`Page ${page} of ${pages}`, RIGHT, PAGE_HEIGHT - 8, { align: 'right' })
  }

  const fileName = (draft.invoiceNumber || 'invoice').replace(/[^\w.-]+/g, '_')
  doc.save(`${fileName}.pdf`)
}
