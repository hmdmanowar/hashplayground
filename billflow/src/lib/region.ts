import type { BankCodeType, CurrencyCode } from './invoice'

// Best guess at the visitor's country, used only to pick sensible defaults
// (currency, usual tax, bank code, sample addresses). Nothing is sent
// anywhere and the user can change every field.
export type Country = 'IN' | 'US' | 'GB' | 'AU' | 'CA' | 'NZ' | 'SG' | 'AE' | 'SA' | 'ZA' | 'CH' | 'HK' | 'MY' | 'PH' | 'NG' | 'KE' | 'EU'

const EURO_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
])

// The timezone is the stronger signal: many Indian browsers report en-US.
const TIMEZONE_COUNTRY: [RegExp, Country][] = [
  [/^Asia\/(Kolkata|Calcutta)$/, 'IN'],
  [/^Europe\/(London|Belfast)$/, 'GB'],
  [/^Australia\//, 'AU'],
  [/^Pacific\/(Auckland|Chatham)$/, 'NZ'],
  [/^Asia\/Singapore$/, 'SG'],
  [/^Asia\/Dubai$/, 'AE'],
  [/^Asia\/Riyadh$/, 'SA'],
  [/^Africa\/Johannesburg$/, 'ZA'],
  [/^Europe\/Zurich$/, 'CH'],
  [/^Asia\/Hong_Kong$/, 'HK'],
  [/^Asia\/(Kuala_Lumpur|Kuching)$/, 'MY'],
  [/^Asia\/Manila$/, 'PH'],
  [/^Africa\/Lagos$/, 'NG'],
  [/^Africa\/Nairobi$/, 'KE'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Montreal)$/, 'CA'],
  [/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana\/.+|Kentucky\/.+)|Pacific\/Honolulu)$/, 'US'],
  [/^Europe\/(Berlin|Paris|Madrid|Rome|Amsterdam|Brussels|Vienna|Dublin|Lisbon|Helsinki|Athens|Luxembourg|Bratislava|Ljubljana|Tallinn|Riga|Vilnius|Valletta|Zagreb|Nicosia)$/, 'EU'],
]

const KNOWN: Set<string> = new Set(['IN', 'US', 'GB', 'AU', 'CA', 'NZ', 'SG', 'AE', 'SA', 'ZA', 'CH', 'HK', 'MY', 'PH', 'NG', 'KE'])

function fromLanguage(): Country | null {
  const languages = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const language of languages) {
    const region = language?.split('-')[1]?.toUpperCase()
    if (!region) continue
    if (region === 'UK') return 'GB'
    if (KNOWN.has(region)) return region as Country
    if (EURO_COUNTRIES.has(region)) return 'EU'
  }
  return null
}

let cached: Country | null = null

export function detectCountry(): Country {
  if (cached) return cached
  // ?country=GB previews another region (handy for testing and support).
  try {
    const forced = new URLSearchParams(window.location.search).get('country')?.toUpperCase()
    if (forced && (KNOWN.has(forced) || forced === 'EU')) return (cached = forced as Country)
  } catch {
    // ignore
  }
  let timezone = ''
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  } catch {
    // ignore
  }
  cached = TIMEZONE_COUNTRY.find(([pattern]) => pattern.test(timezone))?.[1] ?? fromLanguage() ?? 'US'
  return cached
}

export interface RegionDefaults {
  currency: CurrencyCode
  vatRate: string // the usual VAT/GST rate, used when a template charges VAT
  taxName: string // what that tax is called locally (VAT, GST, SST…)
  codeType: BankCodeType
  upi: boolean
  seller: string
  client: { name: string; address: string }
}

const DEFAULTS: Record<Country, RegionDefaults> = {
  IN: { currency: 'INR', vatRate: '18', taxName: 'GST', codeType: 'ifsc', upi: true, seller: 'Bengaluru, Karnataka', client: { name: 'Acme Clients Pvt Ltd', address: 'Mumbai, Maharashtra' } },
  US: { currency: 'USD', vatRate: '0', taxName: 'Sales tax', codeType: 'routing', upi: false, seller: 'Austin, TX', client: { name: 'Acme Inc.', address: 'New York, NY' } },
  GB: { currency: 'GBP', vatRate: '20', taxName: 'VAT', codeType: 'sort', upi: false, seller: 'Bristol', client: { name: 'Acme Ltd', address: 'London' } },
  AU: { currency: 'AUD', vatRate: '10', taxName: 'GST', codeType: 'bsb', upi: false, seller: 'Brisbane QLD', client: { name: 'Acme Pty Ltd', address: 'Sydney NSW' } },
  CA: { currency: 'CAD', vatRate: '5', taxName: 'GST', codeType: 'swift', upi: false, seller: 'Ottawa, ON', client: { name: 'Acme Corp.', address: 'Toronto, ON' } },
  NZ: { currency: 'NZD', vatRate: '15', taxName: 'GST', codeType: 'swift', upi: false, seller: 'Wellington', client: { name: 'Acme Ltd', address: 'Auckland' } },
  SG: { currency: 'SGD', vatRate: '9', taxName: 'GST', codeType: 'swift', upi: false, seller: 'Singapore', client: { name: 'Acme Pte Ltd', address: 'Singapore' } },
  AE: { currency: 'AED', vatRate: '5', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Abu Dhabi', client: { name: 'Acme LLC', address: 'Dubai' } },
  SA: { currency: 'SAR', vatRate: '15', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Jeddah', client: { name: 'Acme Co.', address: 'Riyadh' } },
  ZA: { currency: 'ZAR', vatRate: '15', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Cape Town', client: { name: 'Acme (Pty) Ltd', address: 'Johannesburg' } },
  CH: { currency: 'CHF', vatRate: '8.1', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Basel', client: { name: 'Acme AG', address: 'Zurich' } },
  HK: { currency: 'HKD', vatRate: '0', taxName: 'Tax', codeType: 'swift', upi: false, seller: 'Kowloon', client: { name: 'Acme Ltd', address: 'Central, Hong Kong' } },
  MY: { currency: 'MYR', vatRate: '8', taxName: 'SST', codeType: 'swift', upi: false, seller: 'Penang', client: { name: 'Acme Sdn Bhd', address: 'Kuala Lumpur' } },
  PH: { currency: 'PHP', vatRate: '12', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Cebu City', client: { name: 'Acme Inc.', address: 'Makati City' } },
  NG: { currency: 'NGN', vatRate: '7.5', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Abuja', client: { name: 'Acme Ltd', address: 'Lagos' } },
  KE: { currency: 'KES', vatRate: '16', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Mombasa', client: { name: 'Acme Ltd', address: 'Nairobi' } },
  EU: { currency: 'EUR', vatRate: '20', taxName: 'VAT', codeType: 'swift', upi: false, seller: 'Lyon', client: { name: 'Acme GmbH', address: 'Berlin' } },
}

export function regionDefaults(country: Country = detectCountry()): RegionDefaults {
  return DEFAULTS[country]
}

// Rough USD exchange rates — only for turning a template's sample prices
// into believable local amounts, never for real conversion.
const PER_USD: Record<CurrencyCode, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, CAD: 1.37, AUD: 1.52, NZD: 1.66, SGD: 1.35, AED: 3.67, SAR: 3.75,
  ZAR: 18.5, CHF: 0.88, HKD: 7.8, MYR: 4.7, PHP: 56, NGN: 1500, KES: 130,
}

// Rounded to two significant figures so samples look hand-priced (1,500 not 1,527.6).
export function localPrice(usd: string, currency: CurrencyCode): string {
  const value = Number.parseFloat(usd) * PER_USD[currency]
  if (!Number.isFinite(value) || value <= 0) return usd
  const step = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 1)
  return String(Math.round(value / step) * step)
}
