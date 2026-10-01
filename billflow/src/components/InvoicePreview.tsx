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
import { useUpiQr } from '../lib/upi'

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

function InvoicePreview({ draft }: { draft: InvoiceDraft }) {
  const totals = computeTotals(draft)
  const taxed = hasTax(draft.taxMode)
  const showHsn = draft.items.some((item) => item.hsn.trim())
  const money = (minor: number) => formatMoney(minor, draft.currency)
  const taxLabel = taxIdLabel(draft.taxMode)
  const upi = useUpiQr(draft)
  const payLines = paymentLines(draft.payment)
  const look = getInvoiceStyle(draft.style)
  const centered = look.layout === 'centered'

  const cell: CSSProperties = look.grid ? { border: `1px solid ${look.rule}` } : {}
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
    <dl className={`mt-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs ${centered ? 'justify-start' : 'justify-end'}`}>
      {metaRows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-gray-500">{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  )

  const logoEl = draft.logoDataUrl ? (
    <img src={draft.logoDataUrl} alt="" className="max-h-14 max-w-[160px] object-contain" />
  ) : null

  return (
    <article
      aria-label="Invoice preview"
      className={`billflow-print-area rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm sm:p-7 ${
        look.serif ? 'font-serif' : ''
      }`}
    >
      {centered ? (
        <header>
          <div className="text-center">{titleEl}</div>
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

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <PartyBlock title="FROM" party={draft.from} taxLabel={taxLabel} labelColor={look.label} />
        <PartyBlock title="BILL TO" party={draft.to} taxLabel={taxLabel} labelColor={look.label} />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-xs">
          <thead>
            <tr
              className="text-left text-[10px] font-semibold tracking-wide uppercase"
              style={{ backgroundColor: look.head.bg, color: look.head.text }}
            >
              <th className="px-2 py-2" style={cell}>#</th>
              <th className="px-2 py-2" style={cell}>Description</th>
              {showHsn && <th className="px-2 py-2" style={cell}>HSN/SAC</th>}
              <th className="px-2 py-2 text-right" style={cell}>Qty</th>
              <th className="px-2 py-2 text-right" style={cell}>Rate</th>
              {taxed && <th className="px-2 py-2 text-right" style={cell}>Tax %</th>}
              <th className="px-2 py-2 text-right" style={cell}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((item, index) => (
              <tr
                key={item.id}
                className="align-top"
                style={{
                  backgroundColor: look.zebra && index % 2 === 1 ? look.zebra : undefined,
                  borderBottom: look.grid ? undefined : `1px solid ${look.rule}`,
                }}
              >
                <td className="px-2 py-2 text-gray-500" style={cell}>{index + 1}</td>
                <td className="px-2 py-2 break-words" style={cell}>
                  {item.description || <span className="text-gray-400">—</span>}
                </td>
                {showHsn && <td className="px-2 py-2" style={cell}>{item.hsn}</td>}
                <td className="px-2 py-2 text-right" style={cell}>{formatQuantity(item.quantity)}</td>
                <td className="px-2 py-2 text-right whitespace-nowrap" style={cell}>{money(toMinor(item.rate))}</td>
                {taxed && <td className="px-2 py-2 text-right" style={cell}>{formatQuantity(item.taxRate)}%</td>}
                <td className="px-2 py-2 text-right font-medium whitespace-nowrap" style={cell}>
                  {money(totals.lines[index].amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-xs space-y-1 text-xs">
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
              className="!mt-2 flex justify-between gap-4 rounded-sm px-2 py-2 text-sm font-bold"
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
              <img src={upi.dataUrl} alt={`UPI QR code to pay ${upi.payment.upiId}`} className="h-24 w-24" />
              <figcaption className="mt-1 text-[10px] leading-tight text-gray-500">
                Scan to pay
                {upi.payment.amountMinor > 0 && (
                  <>
                    <br />
                    <span className="font-semibold text-gray-700">{money(upi.payment.amountMinor)}</span>
                  </>
                )}
                <br />
                with any UPI app
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
