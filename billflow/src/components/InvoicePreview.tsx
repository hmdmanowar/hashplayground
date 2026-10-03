import type { CSSProperties } from 'react'
import {
  amountInWords,
  computeTotals,
  formatDate,
  formatMoney,
  formatQuantity,
  hasTax,
  paymentLines,
  taxIdLabel,
  toMinor,
  type InvoiceDraft,
  type Party,
} from '../lib/invoice'
import { getInvoiceStyle } from '../lib/invoiceStyles'
import { useScanToPayQr } from '../lib/upi'

// A paper-white sheet in both themes — it previews a printed document, so
// it deliberately ignores the app's dark palette. Mirrors generatePdf.ts:
// both read the same style config from lib/invoiceStyles.ts.

function PartyBlock({ title, party, taxLabel, labelColor }: { title: string; party: Party; taxLabel: string; labelColor: string }) {
  const empty = !party.name && !party.address && !party.taxId && !party.email && !party.phone
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-wider" style={{ color: labelColor }}>
        {title}
      </p>
      {empty ? (
        <p className="mt-1 text-xs italic text-gray-400">Not filled in yet</p>
      ) : (
        <div className="mt-1 space-y-0.5 text-xs text-gray-600">
          {party.name && <p className="text-sm font-semibold break-words text-gray-900">{party.name}</p>}
          {party.address && <p className="whitespace-pre-line break-words">{party.address}</p>}
          {party.taxId && (
            <p>
              {taxLabel}: {party.taxId}
            </p>
          )}
          {party.email && <p className="break-all">{party.email}</p>}
          {party.phone && <p>{party.phone}</p>}
        </div>
      )}
    </div>
  )
}

// printable=false for scaled-down samples (style gallery) so Print only
// ever picks up the real invoice sheet.
function InvoicePreview({
  draft,
  printable = true,
  logoPlaceholder = false,
}: {
  draft: InvoiceDraft
  printable?: boolean
  logoPlaceholder?: boolean
}) {
  const totals = computeTotals(draft)
  const taxed = hasTax(draft.taxMode)
  const showHsn = draft.items.some((item) => item.hsn.trim())
  const money = (minor: number) => formatMoney(minor, draft.currency)
  const taxLabel = taxIdLabel(draft.taxMode, draft.taxLabel)
  const upi = useScanToPayQr(draft)
  const payLines = paymentLines(draft.payment)
  const look = getInvoiceStyle(draft.style)
  const topTitle = look.layout !== 'split'

  // Row padding (dense styles are tighter) plus the style's cell borders:
  // full grid, column lines only, or none.
  const pad = look.dense ? '4px' : '8px'
  const ruleLine = `1px solid ${look.rule}`
  const cell: CSSProperties = {
    paddingTop: pad,
    paddingBottom: pad,
    ...(look.grid ? { border: ruleLine } : look.columnLines ? { borderLeft: ruleLine, borderRight: ruleLine } : {}),
  }
  const headCell: CSSProperties = { ...cell, ...(look.grid || look.columnLines ? { border: ruleLine } : {}) }
  const labelStyle: CSSProperties = { color: look.label }

  const titleEl = (
    <h2
      className={`tracking-wide uppercase ${look.title.bold ? 'font-bold' : 'font-normal'}`}
      style={{ color: look.title.color, fontSize: `clamp(18px, 4.5vw, ${look.title.size * 1.25}px)`, lineHeight: 1.15 }}
    >
      {draft.documentTitle || 'Invoice'}
    </h2>
  )

  const metaRows = [
    ['Invoice no.', draft.invoiceNumber],
    ['Date', formatDate(draft.issueDate)],
    ['Due date', formatDate(draft.dueDate)],
  ].filter(([, value]) => value)

  const metaEl = (
    <dl className={`mt-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs ${topTitle ? 'justify-start' : 'justify-end'}`}>
      {metaRows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-gray-500">{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  )

  // With logoPlaceholder (the generator's live preview) an empty logo slot
  // shows a dashed "Your logo" hint. It is screen-only: never printed and
  // never part of the PDF.
  const logoPlaceholderEl = logoPlaceholder ? (
    <div
      className={`flex h-12 w-28 items-center justify-center rounded-md border-2 border-dashed text-[10px] font-medium print:hidden ${
        look.layout === 'banner' ? 'border-white/60 text-white/80' : 'border-gray-300 text-gray-400'
      }`}
    >
      Your logo
    </div>
  ) : null

  const logoEl = draft.logoDataUrl ? (
    <img src={draft.logoDataUrl} alt="" className="max-h-14 max-w-[160px] object-contain" />
  ) : (
    logoPlaceholderEl
  )

  return (
    <article
      aria-label="Invoice preview"
      className={`${printable ? 'billflow-print-area' : ''} rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm sm:p-7 ${
        look.serif ? 'font-serif' : ''
      }`}
    >
      {look.recipientTag && (
        <p className="mb-2 text-right text-[9px] font-semibold tracking-wider text-gray-500">ORIGINAL FOR RECIPIENT</p>
      )}
      {look.layout === 'banner' ? (
        <>
          <header
            className="-mx-5 -mt-5 mb-3 rounded-t-xl px-5 pt-5 pb-4 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-6"
            style={{ backgroundColor: look.bannerBg ?? look.accent }}
          >
            {/* Logo sits on a white chip so any logo stays legible on the
                coloured banner (the PDF draws the same chip). */}
            {draft.logoDataUrl ? (
              <span className="mb-2 inline-block rounded-md bg-white px-1.5 py-1">
                <img src={draft.logoDataUrl} alt="" className="max-h-8 max-w-[140px] object-contain" />
              </span>
            ) : (
              logoPlaceholderEl && <div className="mb-2">{logoPlaceholderEl}</div>
            )}
            {titleEl}
          </header>
          {metaEl}
        </>
      ) : topTitle ? (
        <header>
          <div className={look.layout === 'centered' ? 'text-center' : 'text-left'}>{titleEl}</div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            {metaEl}
            {logoEl}
          </div>
        </header>
      ) : (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-h-10">{logoEl}</div>
          <div className="text-right">
            {titleEl}
            {metaEl}
          </div>
        </header>
      )}

      <div
        className={`mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 ${look.boxed ? 'border p-3' : ''}`}
        style={look.boxed ? { borderColor: look.rule } : undefined}
      >
        <PartyBlock title="FROM" party={draft.from} taxLabel={taxLabel} labelColor={look.label} />
        <div className={look.boxed ? 'sm:border-l sm:pl-5' : ''} style={look.boxed ? { borderColor: look.rule } : undefined}>
          <PartyBlock title="BILL TO" party={draft.to} taxLabel={taxLabel} labelColor={look.label} />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table
          className="w-full min-w-[420px] border-collapse text-xs"
          style={look.columnLines ? { borderBottom: ruleLine } : undefined}
        >
          <thead>
            <tr
              className="text-left text-[10px] font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: look.head.bg,
                color: look.head.text,
                borderTop: look.headRule ? `2px solid ${look.accent}` : undefined,
                borderBottom: look.headRule ? `2px solid ${look.accent}` : undefined,
              }}
            >
              <th className="px-2" style={headCell}>#</th>
              <th className="px-2" style={headCell}>Description</th>
              {showHsn && <th className="px-2" style={headCell}>HSN/SAC</th>}
              <th className="px-2 text-right" style={headCell}>Qty</th>
              <th className="px-2 text-right" style={headCell}>Rate</th>
              {taxed && <th className="px-2 text-right" style={headCell}>Tax %</th>}
              <th className="px-2 text-right" style={headCell}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((item, index) => (
              <tr
                key={item.id}
                className="align-top"
                style={{
                  backgroundColor: look.zebra && index % 2 === 1 ? look.zebra : undefined,
                  borderBottom: look.grid || look.columnLines ? undefined : ruleLine,
                }}
              >
                <td className="px-2 text-gray-500" style={cell}>{index + 1}</td>
                <td className="px-2 break-words" style={cell}>
                  {item.description || <span className="text-gray-400">—</span>}
                </td>
                {showHsn && <td className="px-2" style={cell}>{item.hsn}</td>}
                <td className="px-2 text-right" style={cell}>{formatQuantity(item.quantity)}</td>
                <td className="px-2 text-right whitespace-nowrap" style={cell}>{money(toMinor(item.rate))}</td>
                {taxed && <td className="px-2 text-right" style={cell}>{formatQuantity(item.taxRate)}%</td>}
                <td className="px-2 text-right font-medium whitespace-nowrap" style={cell}>
                  {money(totals.lines[index].amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <dl
          className={`w-full max-w-xs space-y-1 text-xs ${look.boxed ? 'border p-2' : ''}`}
          style={look.boxed ? { borderColor: look.rule } : undefined}
        >
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Subtotal</dt>
            <dd>{money(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Discount ({formatQuantity(draft.discountPercent)}%)</dt>
                <dd>-{money(totals.discount)}</dd>
              </div>
              {taxed && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Taxable amount</dt>
                  <dd>{money(totals.taxable)}</dd>
                </div>
              )}
            </>
          )}
          {totals.taxLines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-gray-500">{line.label}</dt>
              <dd>{money(line.amount)}</dd>
            </div>
          ))}
          {look.totalBand ? (
            <div
              className="!mt-2 flex justify-between gap-4 rounded-sm px-2 text-sm font-bold"
              style={{ backgroundColor: look.totalBand.bg, color: look.totalBand.text }}
            >
              <dt>Total ({draft.currency})</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          ) : (
            <div className="flex justify-between gap-4 pt-2 text-sm font-bold" style={{ borderTop: `2px solid ${look.accent}` }}>
              <dt>Total ({draft.currency})</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-4 text-xs text-gray-500 italic">Amount in words: {amountInWords(totals.total, draft.currency)}</p>

      {payLines.length > 0 && (
        <section className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[10px] font-semibold tracking-wider" style={labelStyle}>
              PAYMENT DETAILS
            </h3>
            <div className="mt-1 space-y-0.5 text-xs break-words">
              {payLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
          {upi.payment && upi.dataUrl && (
            <figure className="shrink-0 text-center">
              <img src={upi.dataUrl} alt={upi.payment.alt} className="h-24 w-24" />
              <figcaption className="mt-1 text-[10px] leading-tight text-gray-500">
                Scan to pay
                {upi.payment.amountMinor > 0 && (
                  <>
                    <br />
                    <span className="font-semibold text-gray-700">{money(upi.payment.amountMinor)}</span>
                  </>
                )}
                <br />
                {upi.payment.via}
              </figcaption>
            </figure>
          )}
        </section>
      )}
      {draft.notes.trim() && (
        <section className="mt-4">
          <h3 className="text-[10px] font-semibold tracking-wider" style={labelStyle}>
            NOTES
          </h3>
          <p className="mt-1 text-xs whitespace-pre-line">{draft.notes}</p>
        </section>
      )}
    </article>
  )
}

export default InvoicePreview
