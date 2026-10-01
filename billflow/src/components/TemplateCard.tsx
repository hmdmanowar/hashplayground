import { Link } from 'react-router-dom'
import { computeTotals, formatMoney, type InvoiceDraft } from '../lib/invoice'
import type { InvoiceTemplate } from '../lib/templates'

const TAX_BADGE: Record<InvoiceTemplate['taxMode'], string> = {
  gst_intra: 'GST · CGST + SGST',
  gst_inter: 'GST · IGST',
  none: 'No tax',
  custom: '',
}

const PREVIEW_ROWS = 3

export function templatePath(slug: string): string {
  return `/${slug}/`
}

// Just the fields computeTotals reads — enough to price the sample items.
function sampleTotal(template: InvoiceTemplate): number {
  return computeTotals({
    taxMode: template.taxMode,
    taxLabel: template.taxLabel,
    discountPercent: '',
    items: template.items.map((item, index) => ({ ...item, id: String(index) })),
  } as InvoiceDraft).total
}

function TemplateCard({ template, focusable = true }: { template: InvoiceTemplate; focusable?: boolean }) {
  const money = (minor: number) => formatMoney(minor, template.currency)
  const taxBadge = template.taxMode === 'custom' ? template.taxLabel || 'Tax' : TAX_BADGE[template.taxMode]

  return (
    <Link
      to={templatePath(template.slug)}
      tabIndex={focusable ? undefined : -1}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-lg focus-visible:border-[var(--color-primary)] focus-visible:outline-none"
    >
      {/* Miniature of the invoice this template produces */}
      <div className="border-b border-[var(--border-panel)] bg-[var(--bg-app)] px-5 pt-5" aria-hidden="true">
        <div className="rounded-t-lg bg-white px-4 pt-3 pb-4 text-[9px] text-gray-600 shadow-sm transition-transform group-hover:-translate-y-0.5">
          <div className="flex items-start justify-between">
            <span className="mt-0.5 h-3 w-8 rounded-sm bg-gray-200" />
            <span className="font-bold tracking-wide text-[#3d52a0] uppercase">{template.documentTitle}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <span className="h-1.5 w-3/4 rounded-full bg-gray-200" />
            <span className="h-1.5 w-2/3 justify-self-end rounded-full bg-gray-200" />
          </div>
          {/* Always three rows (blank ones padded) so every card's preview is
              the same height and the cards line up in the grid. */}
          <div className="mt-3 space-y-1">
            {Array.from({ length: PREVIEW_ROWS }, (_, index) => template.items[index]).map((item, index) => (
              <div key={index} className="h-4 truncate border-b border-gray-100 pb-1">
                {item?.description ?? ''}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{money(sampleTotal(template))}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-sm font-semibold">{template.label}</h2>
        <p className="mt-1 line-clamp-3 text-xs text-[var(--color-muted)]">{template.intro}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[taxBadge, template.currency].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[var(--border-panel)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
            >
              {badge}
            </span>
          ))}
        </div>
        <span className="mt-auto pt-4 text-xs font-semibold text-[var(--color-accent)] group-hover:underline">
          Use this template →
        </span>
      </div>
    </Link>
  )
}

export default TemplateCard
