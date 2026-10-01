import { INVOICE_STYLES, type InvoiceStyle, type InvoiceStyleId } from '../lib/invoiceStyles'
import { CheckIcon } from './Icons'

// A miniature page drawn from the same style config the preview and PDF use,
// so each tile is an honest thumbnail of what that style produces.
function Thumbnail({ look }: { look: InvoiceStyle }) {
  const centered = look.layout === 'centered'
  return (
    <div className="flex h-24 w-full flex-col gap-1 rounded-md bg-white p-2 shadow-sm ring-1 ring-gray-200" aria-hidden="true">
      <div className={`flex items-start ${centered ? 'flex-col items-center gap-1' : 'justify-between'}`}>
        {!centered && <span className="h-2.5 w-3 rounded-sm bg-gray-300" />}
        <span
          className="h-1.5 rounded-full"
          style={{ width: look.title.bold ? 26 : 22, backgroundColor: look.title.color, opacity: look.title.bold ? 1 : 0.75 }}
        />
        {centered && (
          <span className="flex w-full justify-between">
            <span className="h-1 w-5 rounded-full bg-gray-200" />
            <span className="h-2.5 w-3 rounded-sm" style={{ backgroundColor: look.accent }} />
          </span>
        )}
      </div>
      <div className="mt-0.5 grid grid-cols-2 gap-1.5">
        <span className="h-1 rounded-full bg-gray-200" />
        <span className="h-1 rounded-full bg-gray-200" />
      </div>
      <div
        className="mt-1 h-2 rounded-[1px]"
        style={{ backgroundColor: look.head.bg, border: look.grid ? `1px solid ${look.rule}` : look.head.bg === '#ffffff' ? `1px solid ${look.rule}` : undefined }}
      />
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="h-1.5"
          style={{
            backgroundColor: look.zebra && row % 2 === 1 ? look.zebra : undefined,
            borderBottom: `1px solid ${look.rule}`,
            borderLeft: look.grid ? `1px solid ${look.rule}` : undefined,
            borderRight: look.grid ? `1px solid ${look.rule}` : undefined,
          }}
        />
      ))}
      <div className="mt-auto flex justify-end">
        <span
          className="h-2 w-8 rounded-[1px]"
          style={
            look.totalBand
              ? { backgroundColor: look.totalBand.bg, borderTop: undefined }
              : { borderTop: `2px solid ${look.accent}` }
          }
        />
      </div>
    </div>
  )
}

function StylePicker({ value, onChange }: { value: InvoiceStyleId; onChange: (id: InvoiceStyleId) => void }) {
  return (
    <div className="print:hidden">
      <p className="bf-label">Invoice style (the PDF uses the style you pick)</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Invoice style">
        {INVOICE_STYLES.map((look) => {
          const selected = look.id === value
          return (
            <button
              key={look.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={look.description}
              onClick={() => onChange(look.id)}
              className={`relative cursor-pointer rounded-xl border p-1.5 text-left transition-all duration-200 ${
                selected
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)]/40'
                  : 'border-[var(--border-panel)] bg-[var(--bg-panel)] hover:border-[var(--color-primary)]'
              }`}
            >
              <Thumbnail look={look} />
              <span className={`mt-1.5 block text-center text-xs font-medium ${look.serif ? 'font-serif' : ''}`}>{look.name}</span>
              {selected && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default StylePicker
