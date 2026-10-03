import type { CurrencyCode } from './invoice'

// Some "pay me" links accept the amount in the URL, so the payer's app opens
// with the invoice total already filled in. Only the formats below are
// touched; links with a fixed amount (Stripe, Wise, Razorpay…) are left as-is.
interface AmountFormat {
  name: string
  host: RegExp
  currencies: CurrencyCode[] | 'any'
  // Path segments after the host (e.g. ['name'] for paypal.me/name) → new path.
  build: (segments: string[], amount: string, currency: CurrencyCode) => string | null
}

const FORMATS: AmountFormat[] = [
  {
    // paypal.me/name/25.50USD
    name: 'PayPal.me',
    host: /^(www\.)?paypal\.me$/i,
    currencies: 'any',
    build: ([user, ...rest], amount, currency) => (user && rest.length === 0 ? `/${user}/${amount}${currency}` : null),
  },
  {
    // cash.app/$name/25.50 — US dollars only
    name: 'Cash App',
    host: /^(www\.)?cash\.app$/i,
    currencies: ['USD'],
    build: ([tag, ...rest], amount) => (tag?.startsWith('$') && rest.length === 0 ? `/${tag}/${amount}` : null),
  },
  {
    // monzo.me/name/25.50 — pounds only
    name: 'Monzo.me',
    host: /^(www\.)?monzo\.me$/i,
    currencies: ['GBP'],
    build: ([user, ...rest], amount) => (user && rest.length === 0 ? `/${user}/${amount}` : null),
  },
]

function formatFor(url: URL): AmountFormat | undefined {
  return FORMATS.find((format) => format.host.test(url.hostname))
}

export type LinkAmountSupport = 'added' | 'wrong-currency' | 'fixed'

// What happens to the amount for this link, for the form hint.
export function linkAmountSupport(link: string, currency: CurrencyCode): { support: LinkAmountSupport; service?: string } {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return { support: 'fixed' }
  }
  const format = formatFor(url)
  if (!format) return { support: 'fixed' }
  if (format.currencies !== 'any' && !format.currencies.includes(currency)) return { support: 'wrong-currency', service: format.name }
  // A link that already carries an amount (paypal.me/name/10USD) is kept as-is.
  const segments = url.pathname.split('/').filter(Boolean)
  if (!format.build(segments, '1.00', currency)) return { support: 'fixed', service: format.name }
  return { support: 'added', service: format.name }
}

// The link with the invoice total added, when the service supports it;
// otherwise the link unchanged.
export function linkWithAmount(link: string, totalMinor: number, currency: CurrencyCode): string {
  if (totalMinor <= 0) return link
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return link
  }
  const format = formatFor(url)
  if (!format || (format.currencies !== 'any' && !format.currencies.includes(currency))) return link
  const segments = url.pathname.split('/').filter(Boolean)
  const path = format.build(segments, (totalMinor / 100).toFixed(2), currency)
  if (!path) return link // already has an amount, or not a plain profile link
  url.pathname = path
  return url.toString()
}
