import { formatMoney } from './invoice'
import { detectCountry, localPrice, regionDefaults } from './region'

// Numbers and wording for the landing page's illustrated mock-ups (the
// "How it works" cards and the phone), matched to the visitor's country so
// an Indian visitor sees ₹ + GST + UPI and everyone else their own currency,
// usual tax and a pay link. Mirrors the hero's sample invoice.
function buildDemo() {
  const country = detectCountry()
  const local = regionDefaults(country)
  const india = country === 'IN'
  const design = india ? 40000 : Number(localPrice('1200', local.currency))
  const maintenance = 3 * (india ? 2500 : Number(localPrice('150', local.currency)))
  const rate = india ? 18 : local.taxName === 'Sales tax' ? 0 : Number(local.vatRate)
  const money = (major: number) => formatMoney(Math.round(major * 100), local.currency).replace(/\.00$/, '')
  const subtotal = design + maintenance
  const tax = Math.round(subtotal * rate) / 100

  return {
    india,
    docTitle: india ? 'Tax invoice' : rate ? (local.taxName === 'VAT' ? 'VAT invoice' : 'Tax invoice') : 'Invoice',
    client: local.client.name,
    design: money(design),
    maintenance: money(maintenance),
    taxLine: india ? 'CGST + SGST 18%' : rate ? `${local.taxName} ${rate}%` : 'No tax',
    tax: money(tax),
    total: money(subtotal + tax),
    // The "How it works" card bills the design line alone.
    designTotal: money(design + (design * rate) / 100),
    taxStep: india
      ? 'GST 18% → CGST 9% + SGST 9%'
      : rate
        ? `${local.taxName} ${rate}% on every line`
        : 'Add VAT, GST or sales tax if you charge it',
    taxChip: india ? 'CGST 9% + SGST 9%' : rate ? `${local.taxName} ${rate}%` : 'VAT · GST · Sales tax',
    payApps: india ? 'GPay · PhonePe · Paytm · BHIM' : 'PayPal · Stripe · Wise',
    payHint: india ? 'Any UPI app · exact amount' : 'Opens your pay link',
    free: india ? '₹0' : formatMoney(0, local.currency).replace(/\.00$/, ''),
  }
}

export const DEMO = buildDemo()
