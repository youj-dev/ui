export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/* ── Cards ──────────────────────────────────────────────────────────────── */

export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay'

interface Brand {
  id: PaymentBrand
  name: string
  /** The number's first digits. */
  prefix: RegExp
  /** The lengths a number of this brand can have; the last is the longest. */
  lengths: number[]
  /** The length almost every card of the brand has: typing on moves to the expiry there. */
  usual: number
  /** Where the groups break: after these many digits. */
  gaps: number[]
  cvc: number
}

const BRANDS: Brand[] = [
  { id: 'amex', name: 'Amex', prefix: /^3[47]/, lengths: [15], usual: 15, gaps: [4, 10], cvc: 4 },
  { id: 'diners', name: 'Diners', prefix: /^3(0[0-5]|[689])/, lengths: [14, 16], usual: 14, gaps: [4, 10], cvc: 3 },
  { id: 'visa', name: 'Visa', prefix: /^4/, lengths: [13, 16, 19], usual: 16, gaps: [4, 8, 12], cvc: 3 },
  { id: 'mastercard', name: 'Mastercard', prefix: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/, lengths: [16], usual: 16, gaps: [4, 8, 12], cvc: 3 },
  { id: 'discover', name: 'Discover', prefix: /^(6011|65|64[4-9])/, lengths: [16, 19], usual: 16, gaps: [4, 8, 12], cvc: 3 },
  { id: 'jcb', name: 'JCB', prefix: /^35(2[89]|[3-8])/, lengths: [16, 19], usual: 16, gaps: [4, 8, 12], cvc: 3 },
  { id: 'unionpay', name: 'UnionPay', prefix: /^62/, lengths: [16, 19], usual: 16, gaps: [4, 8, 12], cvc: 3 },
]
const FALLBACK: Omit<Brand, 'id' | 'name'> = { prefix: /^/, lengths: [16, 19], usual: 16, gaps: [4, 8, 12], cvc: 3 }

/** The brand a number's first digits say it is, if they say yet. */
export const brandOf = (digits: string) => BRANDS.find((b) => b.prefix.test(digits))
export const brandName = (id: PaymentBrand) => BRANDS.find((b) => b.id === id)?.name ?? id
const rules = (digits: string) => brandOf(digits) ?? FALLBACK

export const digitsOf = (text: string) => text.replace(/\D/g, '')

/** Digits grouped the way the brand prints them: 4242 4242 4242 4242, 3782 822463 10005. */
export function formatNumber(digits: string) {
  const { lengths, gaps } = rules(digits)
  const cut = digits.slice(0, lengths[lengths.length - 1])
  let out = ''
  for (let i = 0; i < cut.length; i++) {
    if (i > 0 && gaps.includes(i)) out += ' '
    out += cut[i]
  }
  return out
}

/** The Luhn checksum every card number carries in its last digit. */
export function luhn(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2
    sum += d
  }
  return digits.length > 0 && sum % 10 === 0
}

/** A whole number of a length its brand uses. */
export const numberWhole = (digits: string) => rules(digits).lengths.includes(digits.length)
/** Typing the number is done: the brand's usual length, and the checksum holds. */
export const numberDone = (digits: string) => digits.length === rules(digits).usual && luhn(digits)
export const cvcLength = (digits: string) => rules(digits).cvc

/** "MM / YY" as it's typed: a first digit over 1 is a month on its own ("4" → "04 / "). */
export function formatExpiry(text: string, deleting: boolean) {
  let digits = digitsOf(text).slice(0, 4)
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`
  if (digits.length < 2) return digits
  if (digits.length === 2) return deleting ? digits : `${digits} / `
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`
}

/* ── Countries and their addresses ──────────────────────────────────────── */

export type PaymentAddressPart = 'line1' | 'line2' | 'city' | 'region' | 'postal'

/** A field's name in this country, and how a message refers to it ("a ZIP code"). */
export interface PaymentLabel {
  label: string
  /** With its article, for messages: "a ZIP code", "an EIN". */
  noun: string
}

export interface PaymentCountry {
  /** ISO 3166-1 alpha-2. */
  code: string
  name: string
  /** The address fields in rows, in the order this country writes them. */
  layout: PaymentAddressPart[][]
  city: PaymentLabel
  /** Leave out for a country whose addresses have none. `options` makes it a list. */
  region?: PaymentLabel & { options?: string[] }
  postal: PaymentLabel & { pattern: RegExp; example: string; normalize?: (value: string) => string }
  /** The business tax number asked for when buying as a business. */
  tax: PaymentLabel & { pattern: RegExp; example: string; optional?: boolean }
}

const US_STATES = 'Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,District of Columbia,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming'.split(',')
const CA_PROVINCES = 'Alberta,British Columbia,Manitoba,New Brunswick,Newfoundland and Labrador,Northwest Territories,Nova Scotia,Nunavut,Ontario,Prince Edward Island,Quebec,Saskatchewan,Yukon'.split(',')
const AU_STATES = 'Australian Capital Territory,New South Wales,Northern Territory,Queensland,South Australia,Tasmania,Victoria,Western Australia'.split(',')

const upper = (value: string) => value.trim().toUpperCase()
/** A space before the last three characters: "sw1a1aa" → "SW1A 1AA". */
const inward = (value: string) => upper(value).replace(/\s+/g, '').replace(/^(.+)(.{3})$/, '$1 $2')

export const PAYMENT_COUNTRIES: PaymentCountry[] = [
  {
    code: 'US',
    name: 'United States',
    layout: [['line1'], ['line2'], ['city', 'region', 'postal']],
    city: { label: 'City', noun: 'a city' },
    region: { label: 'State', noun: 'a state', options: US_STATES },
    postal: { label: 'ZIP code', noun: 'a ZIP code', pattern: /^\d{5}(-\d{4})?$/, example: '94110' },
    tax: { label: 'EIN', noun: 'an EIN', pattern: /^\d{2}-?\d{7}$/, example: '12-3456789', optional: true },
  },
  {
    code: 'CA',
    name: 'Canada',
    layout: [['line1'], ['line2'], ['city', 'region', 'postal']],
    city: { label: 'City', noun: 'a city' },
    region: { label: 'Province', noun: 'a province', options: CA_PROVINCES },
    postal: { label: 'Postal code', noun: 'a postal code', pattern: /^[A-Z]\d[A-Z] \d[A-Z]\d$/, example: 'M5H 1K4', normalize: inward },
    tax: { label: 'Business number', noun: 'a business number', pattern: /^\d{9}$/, example: '123456789', optional: true },
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    layout: [['line1'], ['line2'], ['city', 'postal']],
    city: { label: 'Town or city', noun: 'a town or city' },
    postal: { label: 'Postcode', noun: 'a postcode', pattern: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/, example: 'E1 6PG', normalize: inward },
    tax: { label: 'VAT number', noun: 'a VAT number', pattern: /^GB(\d{9}|\d{12})$/, example: 'GB123456789' },
  },
  {
    code: 'DE',
    name: 'Germany',
    layout: [['line1'], ['line2'], ['postal', 'city']],
    city: { label: 'City', noun: 'a city' },
    postal: { label: 'Postal code', noun: 'a postal code', pattern: /^\d{5}$/, example: '10435' },
    tax: { label: 'VAT number', noun: 'a VAT number', pattern: /^DE\d{9}$/, example: 'DE123456789' },
  },
  {
    code: 'FR',
    name: 'France',
    layout: [['line1'], ['line2'], ['postal', 'city']],
    city: { label: 'City', noun: 'a city' },
    postal: { label: 'Postal code', noun: 'a postal code', pattern: /^\d{5}$/, example: '75009' },
    tax: { label: 'VAT number', noun: 'a VAT number', pattern: /^FR[0-9A-Z]{2}\d{9}$/, example: 'FR12345678901' },
  },
  {
    code: 'NL',
    name: 'Netherlands',
    layout: [['line1'], ['line2'], ['postal', 'city']],
    city: { label: 'City', noun: 'a city' },
    postal: { label: 'Postal code', noun: 'a postal code', pattern: /^\d{4} [A-Z]{2}$/, example: '1015 CW', normalize: (v) => upper(v).replace(/^(\d{4})\s*([A-Z]{2})$/, '$1 $2') },
    tax: { label: 'VAT number', noun: 'a VAT number', pattern: /^NL\d{9}B\d{2}$/, example: 'NL123456789B01' },
  },
  {
    code: 'AU',
    name: 'Australia',
    layout: [['line1'], ['line2'], ['city', 'region', 'postal']],
    city: { label: 'Suburb', noun: 'a suburb' },
    region: { label: 'State', noun: 'a state', options: AU_STATES },
    postal: { label: 'Postcode', noun: 'a postcode', pattern: /^\d{4}$/, example: '2010' },
    tax: { label: 'ABN', noun: 'an ABN', pattern: /^\d{11}$/, example: '12345678901', optional: true },
  },
  {
    code: 'JP',
    name: 'Japan',
    layout: [['postal', 'region'], ['city'], ['line1'], ['line2']],
    city: { label: 'City and ward', noun: 'a city' },
    region: { label: 'Prefecture', noun: 'a prefecture' },
    postal: { label: 'Postal code', noun: 'a postal code', pattern: /^\d{3}-\d{4}$/, example: '150-0001', normalize: (v) => v.replace(/[^\d]/g, '').replace(/^(\d{3})(\d{4})$/, '$1-$2') },
    tax: { label: 'Registration number', noun: 'a registration number', pattern: /^T\d{13}$/, example: 'T1234567890123', optional: true },
  },
]

/* ── Values ─────────────────────────────────────────────────────────────── */

export interface PaymentAddress {
  /** ISO 3166-1 alpha-2. */
  country: string
  line1: string
  line2: string
  city: string
  region: string
  postal: string
}

/** Everything the form holds. The card's number keeps its spaces here; `onSubmit` gets the digits. */
export interface PaymentValues {
  card: { number: string; expiry: string; cvc: string; name: string }
  address: PaymentAddress
  /** Buying as a business: the company and its tax number are asked for too. */
  business: boolean
  company: string
  taxId: string
}

/** What `onSubmit` receives. `card` is left out when your provider's own element takes the card (the `card` slot). */
export interface PaymentDetails {
  card?: { number: string; brand: PaymentBrand | null; last4: string; expMonth: number; expYear: number; cvc: string; name: string }
  address: PaymentAddress
  business: { company: string; taxId: string } | null
}

/** An address the lookup offers for what's typed. */
export interface PaymentAddressSuggestion {
  id: string
  /** The first line, as it's listed: "27 Orchard Street". */
  label: string
  /** The rest of it, under the first line: "New York, NY 10002". */
  description?: string
  address: Partial<PaymentAddress>
}

export const EMPTY_VALUES: PaymentValues = {
  card: { number: '', expiry: '', cvc: '', name: '' },
  address: { country: 'US', line1: '', line2: '', city: '', region: '', postal: '' },
  business: false,
  company: '',
  taxId: '',
}

const SUGGESTIONS: PaymentAddressSuggestion[] = [
  { id: 'us-1', label: '1200 Valencia Street', description: 'San Francisco, CA 94110', address: { country: 'US', line1: '1200 Valencia Street', city: 'San Francisco', region: 'California', postal: '94110' } },
  { id: 'us-2', label: '27 Orchard Street', description: 'New York, NY 10002', address: { country: 'US', line1: '27 Orchard Street', city: 'New York', region: 'New York', postal: '10002' } },
  { id: 'us-3', label: '1450 Larimer Street', description: 'Denver, CO 80202', address: { country: 'US', line1: '1450 Larimer Street', city: 'Denver', region: 'Colorado', postal: '80202' } },
  { id: 'us-4', label: '900 Congress Avenue', description: 'Austin, TX 78701', address: { country: 'US', line1: '900 Congress Avenue', city: 'Austin', region: 'Texas', postal: '78701' } },
  { id: 'ca-1', label: '220 King Street West', description: 'Toronto, ON M5H 1K4', address: { country: 'CA', line1: '220 King Street West', city: 'Toronto', region: 'Ontario', postal: 'M5H 1K4' } },
  { id: 'gb-1', label: '14 Shoreditch High Street', description: 'London E1 6PG', address: { country: 'GB', line1: '14 Shoreditch High Street', city: 'London', postal: 'E1 6PG' } },
  { id: 'gb-2', label: '7 Deansgate', description: 'Manchester M3 2BW', address: { country: 'GB', line1: '7 Deansgate', city: 'Manchester', postal: 'M3 2BW' } },
  { id: 'de-1', label: 'Kastanienallee 12', description: '10435 Berlin', address: { country: 'DE', line1: 'Kastanienallee 12', city: 'Berlin', postal: '10435' } },
  { id: 'de-2', label: 'Sendlinger Straße 30', description: '80331 München', address: { country: 'DE', line1: 'Sendlinger Straße 30', city: 'München', postal: '80331' } },
  { id: 'fr-1', label: '18 Rue des Martyrs', description: '75009 Paris', address: { country: 'FR', line1: '18 Rue des Martyrs', city: 'Paris', postal: '75009' } },
  { id: 'nl-1', label: 'Keizersgracht 120', description: '1015 CW Amsterdam', address: { country: 'NL', line1: 'Keizersgracht 120', city: 'Amsterdam', postal: '1015 CW' } },
  { id: 'au-1', label: '30 Oxford Street', description: 'Darlinghurst NSW 2010', address: { country: 'AU', line1: '30 Oxford Street', city: 'Darlinghurst', region: 'New South Wales', postal: '2010' } },
  { id: 'jp-1', label: 'Jingumae 1-2-3', description: 'Shibuya, Tokyo 150-0001', address: { country: 'JP', line1: 'Jingumae 1-2-3', city: 'Shibuya', region: 'Tokyo', postal: '150-0001' } },
]

/** The demo's address lookup: a few addresses per country, matched on any word. */
export async function demoSearch(query: string, country: string) {
  await demo('PaymentForm: onSearchAddress', 250)
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return SUGGESTIONS.filter((s) => s.address.country === country && words.every((w) => `${s.label} ${s.description}`.toLowerCase().includes(w)))
}

export const DEFAULT_COPY = {
  title: 'Payment details',
  description: 'Charged today, then on the same day each month.',
  card: 'Card',
  cardNumber: 'Card number',
  cardNumberPlaceholder: '1234 1234 1234 1234',
  /** The brand mark's spoken name, beside the number: "Visa". */
  brandLabel: (brand: string) => `${brand} card`,
  expiry: 'Expiry',
  expiryPlaceholder: 'MM / YY',
  cvc: 'Security code',
  cvcHint: (digits: number, front: boolean) => `${digits} digits on the ${front ? 'front' : 'back'}`,
  cardName: 'Name on card',
  numberIncomplete: 'Your card number is incomplete.',
  numberInvalid: 'Your card number is invalid.',
  brandRefused: (brand: string) => `We don’t take ${brand} cards. Try another card.`,
  expiryIncomplete: 'Your card’s expiry date is incomplete.',
  expiryMonth: 'Enter a month from 01 to 12.',
  expiryPast: 'Your card’s expiry date is in the past.',
  expiryFar: 'That expiry date is too far ahead.',
  cvcIncomplete: 'Your card’s security code is incomplete.',
  nameMissing: 'Enter the name on the card.',
  billing: 'Billing address',
  country: 'Country',
  searchCountry: 'Search countries…',
  suggestions: (count: number, plural: Intl.LDMLPluralRule) => (count ? `${count} ${plural === 'one' ? 'address' : 'addresses'} found` : 'No addresses found'),
  addressLine1: 'Address',
  addressLine2: 'Apartment, suite, etc.',
  /** What's missing when the first line is empty: "Enter an address." */
  addressNoun: 'an address',
  addressPlaceholder: 'Start typing an address',
  optional: 'optional',
  /** "Enter a city." */
  missing: (noun: string) => `Enter ${noun}.`,
  /** "Choose a state." */
  choose: (noun: string) => `Choose ${noun}.`,
  /** "Enter a ZIP code like 94110." */
  invalid: (noun: string, example: string) => `Enter ${noun} like ${example}.`,
  regionPlaceholder: 'Choose…',
  business: 'I’m buying for a business',
  businessHint: 'Add your company’s details to the invoice.',
  company: 'Company name',
  companyMissing: 'Enter the company’s name.',
  dueToday: 'Due today',
  pay: (amount: string) => `Pay ${amount}`,
  save: 'Save payment details',
  paying: 'Processing…',
  paid: 'Paid',
  saved: 'Saved',
  failed: 'Payment failed',
  invalidForm: 'Check the details',
  failedTitle: 'The payment didn’t go through',
  failedDescription: 'Nothing was charged. Check the details or try another card.',
  secure: 'Encrypted from your browser to the payment provider.',
}

export type PaymentFormCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale amounts are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** The month and year of an expiry, or null while it isn't a whole one. */
export function expiryParts(expiry: string) {
  const digits = digitsOf(expiry)
  if (digits.length !== 4) return null
  return { month: Number(digits.slice(0, 2)), year: 2000 + Number(digits.slice(2)) }
}
