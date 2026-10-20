import { brandName, brandOf, cvcLength, digitsOf, expiryParts, luhn, numberWhole, type PaymentBrand, type PaymentCountry, type PaymentFormCopy, type PaymentValues } from './data'

/* Every check the form makes, with the messages a person can act on: the
 * card's own rules (its brand, length and checksum; a month that exists and
 * isn't past; the security code its brand prints), then the address in the
 * country's terms (its postal code's shape, its regions), then the business
 * details. Keyed by field path, as the form's resolver wants them. */

interface Context {
  country: PaymentCountry
  copy: PaymentFormCopy
  now: Date
  /** The brands taken; every brand when empty. */
  brands: PaymentBrand[]
  /** The card fields are the form's own (not a provider's element in their place). */
  ownCard: boolean
}

/** A tax number as it's checked: capitals, no spaces or dots. */
export const tidyTax = (value: string) => value.toUpperCase().replace(/[\s.]/g, '')

export function problems(values: PaymentValues, { country, copy, now, brands, ownCard }: Context) {
  const found: Record<string, string> = {}

  if (ownCard) {
    const digits = digitsOf(values.card.number)
    const brand = brandOf(digits)
    if (!numberWhole(digits)) found['card.number'] = copy.numberIncomplete
    else if (!luhn(digits)) found['card.number'] = copy.numberInvalid
    else if (brand && brands.length && !brands.includes(brand.id)) found['card.number'] = copy.brandRefused(brandName(brand.id))

    const expiry = expiryParts(values.card.expiry)
    const thisMonth = now.getFullYear() * 12 + now.getMonth()
    if (!expiry) found['card.expiry'] = copy.expiryIncomplete
    else if (expiry.month < 1 || expiry.month > 12) found['card.expiry'] = copy.expiryMonth
    else if (expiry.year * 12 + expiry.month - 1 < thisMonth) found['card.expiry'] = copy.expiryPast
    else if (expiry.year > now.getFullYear() + 20) found['card.expiry'] = copy.expiryFar

    if (digitsOf(values.card.cvc).length !== cvcLength(digits)) found['card.cvc'] = copy.cvcIncomplete
    if (!values.card.name.trim()) found['card.name'] = copy.nameMissing
  }

  const address = values.address
  if (!address.line1.trim()) found['address.line1'] = copy.missing(copy.addressNoun)
  if (!address.city.trim()) found['address.city'] = copy.missing(country.city.noun)
  if (country.region && !address.region.trim()) found['address.region'] = (country.region.options ? copy.choose : copy.missing)(country.region.noun)
  const postal = country.postal.normalize ? country.postal.normalize(address.postal) : address.postal.trim()
  if (!postal) found['address.postal'] = copy.missing(country.postal.noun)
  else if (!country.postal.pattern.test(postal)) found['address.postal'] = copy.invalid(country.postal.noun, country.postal.example)

  if (values.business) {
    if (!values.company.trim()) found.company = copy.companyMissing
    const tax = tidyTax(values.taxId)
    if (!tax && !country.tax.optional) found.taxId = copy.missing(country.tax.noun)
    else if (tax && !country.tax.pattern.test(tax)) found.taxId = copy.invalid(country.tax.noun, country.tax.example)
  }
  return found
}

/** Flat paths to the nested shape react-hook-form's resolver returns. */
export function nested(found: Record<string, string>) {
  const errors: Record<string, unknown> = {}
  for (const [path, message] of Object.entries(found)) {
    const [head, tail] = path.split('.') as [string, string | undefined]
    if (tail) errors[head] = { ...(errors[head] as object), [tail]: { type: 'validate', message } }
    else errors[head] = { type: 'validate', message }
  }
  return errors
}
