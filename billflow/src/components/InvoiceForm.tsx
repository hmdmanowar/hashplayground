import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  CURRENCIES,
  TAX_PRESETS,
  BANK_CODE_TYPES,
  applyTaxPreset,
  normalizePaymentLink,
  taxPresetOf,
  type BankCodeType,
  type PaperSize,
  type TaxPreset,
  computeTotals,
  formatMoney,
  hasTax,
  isGst,
  isValidAccountNumber,
  isValidGstin,
  isValidIfsc,
  suggestedGstMode,
  taxIdLabel,
  type CurrencyCode,
  type InvoiceDraft,
  type LineItem,
  type Party,
  type PaymentInfo,
  type TaxMode,
} from '../lib/invoice'
import { barePhoneNumber, isValidUpiId } from '../lib/upi'
import { useIfscLookup } from '../lib/ifsc'
import { linkAmountSupport } from '../lib/payLink'
import { CheckIcon, PlusIcon, ResetIcon, TrashIcon, XIcon } from './Icons'

const MAX_LOGO_BYTES = 500_000

interface InvoiceFormProps {
  draft: InvoiceDraft
  update: (patch: Partial<InvoiceDraft>) => void
  updateParty: (side: 'from' | 'to', patch: Partial<Party>) => void
  updatePayment: (patch: Partial<PaymentInfo>) => void
  updateItem: (id: string, patch: Partial<LineItem>) => void
  addItem: () => void
  removeItem: (id: string) => void
  reset: () => void
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="bf-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="bf-label">{label}</span>
      {children}
      {hint}
    </label>
  )
}

function GstinHint({ value, mode }: { value: string; mode: TaxMode }) {
  if (!isGst(mode) || !value.trim() || isValidGstin(value)) return null
  return <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">This doesn’t look like a valid 15-character GSTIN.</span>
}

const WARN = 'mt-1 block text-xs text-amber-600 dark:text-amber-400'
const MUTED = 'mt-1 block text-xs text-[var(--color-muted)]'

function UpiHint({ upiId, currency }: { upiId: string; currency: CurrencyCode }) {
  const value = upiId.trim()
  const phone = barePhoneNumber(value)
  if (!value) return <span className={MUTED}>Your UPI ID puts a scan-to-pay QR code on the invoice.</span>
  if (phone) {
    return (
      <span className={WARN}>
        Add your app’s handle to get a scan-to-pay QR code, e.g. <strong>{phone}@ybl</strong> (PhonePe),{' '}
        <strong>{phone}@paytm</strong> (Paytm) or <strong>@okaxis</strong> (Google Pay). You’ll find your exact UPI
        ID in your UPI app’s profile.
      </span>
    )
  }
  if (!isValidUpiId(value)) return <span className={WARN}>Enter a full UPI ID, like name@okaxis.</span>
  if (currency !== 'INR') return <span className={WARN}>UPI only works in INR, so no QR code is added to {currency} invoices.</span>
  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
      <CheckIcon className="h-3.5 w-3.5 shrink-0" />
      A scan-to-pay QR code with the invoice total is added to the invoice.
    </span>
  )
}

const PAYMENT_METHODS: { key: 'bank' | 'link' | 'upi' | 'other'; label: string }[] = [
  { key: 'bank', label: 'Bank transfer' },
  { key: 'link', label: 'Payment link' },
  { key: 'upi', label: 'UPI (India)' },
  { key: 'other', label: 'Other' },
]

// Static class names so Tailwind keeps them.
const ITEM_COLUMNS: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }

const PAPER_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'auto', label: 'Auto (Letter for USD/CAD, else A4)' },
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'US Letter' },
]

function LinkHint({ url, hasUpiQr, currency }: { url: string; hasUpiQr: boolean; currency: CurrencyCode }) {
  if (!url.trim()) return <span className={MUTED}>A PayPal.me, Stripe, Wise or other pay link. It prints with a scan-to-pay QR code.</span>
  const link = normalizePaymentLink(url)
  if (!link) return <span className={WARN}>Enter a full link, like paypal.me/yourname.</span>
  if (hasUpiQr) return <span className={MUTED}>The UPI QR code is shown on the invoice; this link is printed as text.</span>
  const { support, service } = linkAmountSupport(link, currency)
  return (
    <span className="mt-1 flex items-start gap-1 text-xs text-green-700 dark:text-green-400">
      <CheckIcon className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>
        A scan-to-pay QR code is added to the invoice.{' '}
        {support === 'added' && `It opens ${service} with the invoice total already filled in.`}
        {support === 'wrong-currency' && (
          <span className="text-amber-600 dark:text-amber-400">
            {service} can’t prefill a {currency} amount, so your client enters it.
          </span>
        )}
        {support === 'fixed' && (
          <span className="text-[var(--color-muted)]">
            The amount comes from the link itself, so set it to the invoice total when you create it (Stripe, Wise, Razorpay…).
          </span>
        )}
      </span>
    </span>
  )
}

function PaymentFields({
  payment,
  currency,
  updatePayment,
}: {
  payment: PaymentInfo
  currency: CurrencyCode
  updatePayment: (patch: Partial<PaymentInfo>) => void
}) {
  const accountNumber = payment.accountNumber.trim()
  const ifsc = payment.ifsc.trim()
  const isIfsc = payment.codeType === 'ifsc'
  const ifscLookup = useIfscLookup(payment.bank && isIfsc ? ifsc : '')
  const codeType = BANK_CODE_TYPES.find((type) => type.value === payment.codeType) ?? BANK_CODE_TYPES[0]
  const hasUpiQr = payment.upi && isValidUpiId(payment.upiId) && currency === 'INR'

  // Fill bank name / branch from the IFSC, but never clobber something the
  // user typed: only fields that are empty or still hold our last auto-fill.
  const lastAutofill = useRef({ bank: '', branch: '' })
  const found = ifscLookup.status === 'found' ? ifscLookup.info : null
  useEffect(() => {
    if (!found) return
    const patch: Partial<PaymentInfo> = {}
    const bankName = payment.bankName.trim()
    const branch = payment.branch.trim()
    if (!bankName || bankName === lastAutofill.current.bank) patch.bankName = found.bank
    if (!branch || branch === lastAutofill.current.branch) patch.branch = found.branch
    lastAutofill.current = { bank: found.bank, branch: found.branch }
    if (patch.bankName !== undefined || patch.branch !== undefined) updatePayment(patch)
    // Runs once per looked-up IFSC; current field values are read, not watched.
  }, [found])

  let ifscHint: ReactNode
  if (!isIfsc) ifscHint = undefined
  else if (ifsc && !isValidIfsc(ifsc)) ifscHint = <span className={WARN}>IFSC is 11 characters, like HDFC0001234.</span>
  else if (ifscLookup.status === 'loading') ifscHint = <span className={MUTED}>Looking up bank…</span>
  else if (ifscLookup.status === 'not_found')
    ifscHint = <span className={WARN}>IFSC not found. Please check the code.</span>
  else if (found)
    ifscHint = (
      <span className="mt-1 flex items-start gap-1 text-xs text-green-700 dark:text-green-400">
        <CheckIcon className="mt-px h-3.5 w-3.5 shrink-0" />
        {found.bank}, {found.branch}
      </span>
    )

  return (
    <div className="space-y-3">
      <div>
        <span className="bf-label">How can your client pay you?</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Payment methods">
          {PAYMENT_METHODS.map((method) => {
            const active = payment[method.key]
            return (
              <button
                key={method.key}
                type="button"
                aria-pressed={active}
                onClick={() => updatePayment({ [method.key]: !active })}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--border-panel)] text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                }`}
              >
                {active && <CheckIcon className="h-3.5 w-3.5" />}
                {method.label}
              </button>
            )
          })}
        </div>
      </div>

      {payment.upi && (
        <Field label="UPI ID" hint={<UpiHint upiId={payment.upiId} currency={currency} />}>
          <input
            className="bf-input"
            placeholder="yourname@okaxis"
            autoComplete="off"
            spellCheck={false}
            value={payment.upiId}
            onChange={(e) => updatePayment({ upiId: e.target.value })}
          />
        </Field>
      )}

      {payment.bank && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Account holder name (optional)">
              <input
                className="bf-input"
                value={payment.accountName}
                onChange={(e) => updatePayment({ accountName: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Account number or IBAN"
              hint={
                isIfsc && accountNumber && !isValidAccountNumber(accountNumber) ? (
                  <span className={WARN}>Indian account numbers are usually 9–18 digits.</span>
                ) : undefined
              }
            >
              <input
                className="bf-input"
                autoComplete="off"
                spellCheck={false}
                value={payment.accountNumber}
                onChange={(e) => updatePayment({ accountNumber: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Bank code type">
            <select
              className="bf-input"
              value={payment.codeType}
              onChange={(e) => updatePayment({ codeType: e.target.value as BankCodeType })}
            >
              {BANK_CODE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`${codeType.label.replace(/ \(.*\)$/, '')} (optional)`} hint={ifscHint}>
            <input
              className="bf-input uppercase placeholder:normal-case"
              maxLength={isIfsc ? 11 : 34}
              autoComplete="off"
              spellCheck={false}
              placeholder={codeType.placeholder}
              value={payment.ifsc}
              onChange={(e) => updatePayment({ ifsc: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Bank name (optional)">
            <input className="bf-input" value={payment.bankName} onChange={(e) => updatePayment({ bankName: e.target.value })} />
          </Field>
          <Field label="Branch (optional)">
            <input className="bf-input" value={payment.branch} onChange={(e) => updatePayment({ branch: e.target.value })} />
          </Field>
        </div>
      )}

      {payment.link && (
        <Field label="Payment link" hint={<LinkHint url={payment.linkUrl} hasUpiQr={hasUpiQr} currency={currency} />}>
          <input
            className="bf-input"
            type="url"
            inputMode="url"
            placeholder="paypal.me/yourname"
            autoComplete="off"
            spellCheck={false}
            value={payment.linkUrl}
            onChange={(e) => updatePayment({ linkUrl: e.target.value })}
          />
        </Field>
      )}

      {payment.other && (
        <Field label="Other payment details">
          <textarea
            className="bf-input resize-y"
            rows={2}
            placeholder="Cheque, cash, payment terms…"
            value={payment.otherText}
            onChange={(e) => updatePayment({ otherText: e.target.value })}
          />
        </Field>
      )}
    </div>
  )
}

function PartyFields({
  side,
  party,
  mode,
  taxLabel,
  updateParty,
}: {
  side: 'from' | 'to'
  party: Party
  mode: TaxMode
  taxLabel: string
  updateParty: InvoiceFormProps['updateParty']
}) {
  const set = (patch: Partial<Party>) => updateParty(side, patch)
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label={side === 'from' ? 'Business / your name' : 'Client name'}>
          <input className="bf-input" value={party.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Address">
          <textarea
            className="bf-input resize-y"
            rows={2}
            value={party.address}
            onChange={(e) => set({ address: e.target.value })}
          />
        </Field>
      </div>
      <Field label={`${taxIdLabel(mode, taxLabel)} (optional)`} hint={<GstinHint value={party.taxId} mode={mode} />}>
        <input
          className="bf-input uppercase"
          value={party.taxId}
          maxLength={20}
          onChange={(e) => set({ taxId: e.target.value.toUpperCase() })}
        />
      </Field>
      <Field label="Email (optional)">
        <input className="bf-input" type="email" value={party.email} onChange={(e) => set({ email: e.target.value })} />
      </Field>
      {side === 'from' && (
        <Field label="Phone (optional)">
          <input className="bf-input" type="tel" value={party.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
      )}
    </div>
  )
}

function InvoiceForm({
  draft,
  update,
  updateParty,
  updatePayment,
  updateItem,
  addItem,
  removeItem,
  reset,
}: InvoiceFormProps) {
  const [logoError, setLogoError] = useState('')
  const totals = computeTotals(draft)
  const taxed = hasTax(draft.taxMode)
  const suggestion = isGst(draft.taxMode) ? suggestedGstMode(draft.from.taxId, draft.to.taxId) : null
  // HSN/SAC codes are an Indian GST field: offer them on INR / GST invoices,
  // or wherever a line already has one.
  const showHsn = (hsn: string) => isGst(draft.taxMode) || draft.currency === 'INR' || Boolean(hsn.trim())

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setLogoError('Please choose a PNG or JPG image.')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be under 500 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        update({ logoDataUrl: reader.result })
        setLogoError('')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <Section
        title="Invoice details"
        action={
          <button
            type="button"
            onClick={reset}
            className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
            title="Start a new invoice (keeps your business details)"
          >
            <ResetIcon className="h-3.5 w-3.5" />
            New invoice
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Document title">
            <input className="bf-input" value={draft.documentTitle} onChange={(e) => update({ documentTitle: e.target.value })} />
          </Field>
          <Field label="Invoice number">
            <input className="bf-input" value={draft.invoiceNumber} onChange={(e) => update({ invoiceNumber: e.target.value })} />
          </Field>
          <Field label="Invoice date">
            <input className="bf-input" type="date" value={draft.issueDate} onChange={(e) => update({ issueDate: e.target.value })} />
          </Field>
          <Field label="Due date">
            <input className="bf-input" type="date" value={draft.dueDate} onChange={(e) => update({ dueDate: e.target.value })} />
          </Field>
          <Field label="Currency">
            <select
              className="bf-input"
              value={draft.currency}
              onChange={(e) => update({ currency: e.target.value as CurrencyCode })}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tax">
            <select
              className="bf-input"
              value={taxPresetOf(draft.taxMode, draft.taxLabel)}
              onChange={(e) => update(applyTaxPreset(e.target.value as TaxPreset, draft.taxLabel))}
            >
              {TAX_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </Field>
          {taxPresetOf(draft.taxMode, draft.taxLabel) === 'custom' && (
            <Field label="Tax name">
              <input
                className="bf-input"
                placeholder="VAT"
                value={draft.taxLabel}
                onChange={(e) => update({ taxLabel: e.target.value })}
              />
            </Field>
          )}
          <Field label="Paper size">
            <select className="bf-input" value={draft.paper} onChange={(e) => update({ paper: e.target.value as PaperSize })}>
              {PAPER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Discount % (optional)">
            <input
              className="bf-input"
              inputMode="decimal"
              value={draft.discountPercent}
              onChange={(e) => update({ discountPercent: e.target.value })}
            />
          </Field>
        </div>
        {suggestion && suggestion !== draft.taxMode && (
          <p className="mt-3 rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-xs">
            The GSTINs show {suggestion === 'gst_inter' ? 'different states, so this supply should use IGST' : 'the same state, so this supply should use CGST + SGST'}.{' '}
            <button
              type="button"
              className="cursor-pointer font-semibold text-[var(--color-accent)] underline"
              onClick={() => update({ taxMode: suggestion })}
            >
              Switch
            </button>
          </p>
        )}
      </Section>

      <Section title="Your business">
        <div className="mb-3 flex items-center gap-3">
          {draft.logoDataUrl ? (
            <div className="relative">
              <img src={draft.logoDataUrl} alt="Your logo" className="h-12 max-w-[140px] rounded object-contain" />
              <button
                type="button"
                onClick={() => update({ logoDataUrl: '' })}
                aria-label="Remove logo"
                className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[var(--bg-app)] shadow"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ) : null}
          <label className="cursor-pointer rounded-full border border-dashed border-[var(--border-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
            {draft.logoDataUrl ? 'Change logo' : 'Upload logo (PNG/JPG)'}
            <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleLogo} />
          </label>
          {logoError && <span className="text-xs text-red-600 dark:text-red-400">{logoError}</span>}
        </div>
        <PartyFields side="from" party={draft.from} mode={draft.taxMode} taxLabel={draft.taxLabel} updateParty={updateParty} />
      </Section>

      <Section title="Bill to">
        <PartyFields side="to" party={draft.to} mode={draft.taxMode} taxLabel={draft.taxLabel} updateParty={updateParty} />
      </Section>

      <Section title="Items">
        <div className="space-y-3">
          {draft.items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-[var(--border-panel)] bg-[var(--bg-app)] p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2 w-5 shrink-0 text-xs font-semibold text-[var(--color-muted)]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <input
                    className="bf-input"
                    placeholder="Description of goods or services"
                    aria-label={`Item ${index + 1} description`}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  />
                  <div className={`mt-2 grid grid-cols-2 gap-2 ${ITEM_COLUMNS[2 + Number(showHsn(item.hsn)) + Number(taxed)]}`}>
                    {showHsn(item.hsn) && (
                      <Field label="HSN/SAC">
                        <input className="bf-input" value={item.hsn} onChange={(e) => updateItem(item.id, { hsn: e.target.value })} />
                      </Field>
                    )}
                    <Field label="Qty">
                      <input
                        className="bf-input"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                      />
                    </Field>
                    <Field label="Rate">
                      <input
                        className="bf-input"
                        inputMode="decimal"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, { rate: e.target.value })}
                      />
                    </Field>
                    {taxed && (
                      <Field label="Tax %">
                        <input
                          className="bf-input"
                          inputMode="decimal"
                          value={item.taxRate}
                          onChange={(e) => updateItem(item.id, { taxRate: e.target.value })}
                        />
                      </Field>
                    )}
                  </div>
                  <p className="mt-2 text-right text-xs text-[var(--color-muted)]">
                    Amount: <span className="font-semibold text-[var(--text-app)]">{formatMoney(totals.lines[index].amount, draft.currency)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={draft.items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                  className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--hover-overlay)] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border-panel)] py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <PlusIcon className="h-4 w-4" />
          Add item
        </button>
      </Section>

      <Section title="Payment details & notes">
        <div className="space-y-4">
          <PaymentFields payment={draft.payment} currency={draft.currency} updatePayment={updatePayment} />
          <Field label="Notes / terms">
            <textarea
              className="bf-input resize-y"
              rows={2}
              value={draft.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </Field>
        </div>
      </Section>
    </div>
  )
}

export default InvoiceForm
