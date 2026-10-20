import { z } from 'zod'
import { productById, type Product } from '../product-card'

/** A line in the order summary. */
export interface CheckoutLine {
  product: Product
  /** The colorway's id. */
  color: string
  size?: string
  quantity: number
}

/** A way to ship the order. */
export interface CheckoutShippingOption {
  id: string
  /** "Standard", "Express". */
  label: string
  /** "2–4 days". */
  description?: string
  /** In the checkout's currency; 0 reads as `copy.free`. */
  price: number
}

export const CHECKOUT_LINES: CheckoutLine[] = [
  { product: productById('ridge-kettle'), color: 'sage', size: '1.2 l', quantity: 1 },
  { product: productById('daily-mug'), color: 'white', size: '450 ml', quantity: 2 },
]

export const SHIPPING_OPTIONS: CheckoutShippingOption[] = [{ id: 'standard', label: 'Standard', description: '2–4 days', price: 0 }]

export const COUNTRIES: Record<string, string> = { US: 'United States', CA: 'Canada', GB: 'United Kingdom', DE: 'Germany', FR: 'France', NL: 'Netherlands' }

export const CHECKOUT_COPY = {
  title: 'Checkout',
  secure: 'Secure checkout',
  summary: 'Order summary',
  quantity: (n: number) => `Qty ${n}`,
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  free: 'Free',
  tax: 'Tax',
  total: 'Total',

  contactTitle: 'Contact',
  contactDescription: 'Where we send the receipt and delivery updates.',
  email: 'Email',
  emailPlaceholder: 'you@company.com',
  emailRequired: 'Enter your email.',
  emailInvalid: 'Enter an email like you@company.com.',
  news: 'Email me about new products and restocks',

  shippingTitle: 'Shipping',
  shippingDescription: 'Free delivery in 2–4 days.',
  shippingMethod: 'Delivery',
  name: 'Full name',
  namePlaceholder: 'Ada Lovelace',
  nameRequired: 'Enter the name for the delivery.',
  address: 'Street address',
  addressPlaceholder: '221B Baker Street',
  addressRequired: 'Enter a street address.',
  city: 'City',
  cityRequired: 'Enter a city.',
  postal: 'Postal code',
  postalRequired: 'Enter a postal code.',
  country: 'Country',
  countryRequired: 'Choose a country.',
  phone: 'Phone',
  phoneDescription: 'Only for the courier.',
  phoneRequired: 'Enter a phone number for the courier.',

  paymentTitle: 'Payment',
  paymentDescription: 'Charged when your order ships.',
  card: 'Card number',
  cardPlaceholder: '4242 4242 4242 4242',
  cardInvalid: 'Enter the 16 digits on your card.',
  expiry: 'Expiry',
  expiryPlaceholder: 'MM/YY',
  expiryInvalid: 'Use MM/YY, like 08/28.',
  cvc: 'Security code',
  cvcPlaceholder: '123',
  cvcInvalid: 'Enter the 3 or 4 digits on the back.',
  holder: 'Name on card',
  holderRequired: 'Enter the name on the card.',

  reviewTitle: 'Review',
  reviewDescription: 'Check the details, then pay.',
  shipTo: 'Ship to',
  cardEnding: (last4: string, expiry: string) => `Card ending ${last4} · expires ${expiry}`,
  edit: 'Edit',
  editLabel: (part: string) => `Edit ${part.toLowerCase()}`,
  pay: (total: string) => `Pay ${total}`,
  placed: 'Order placed',

  confirmedTitle: 'Order confirmed',
  receiptBefore: 'Thank you. We sent the receipt to ',
  receiptAfter: ' and will email again when it ships.',
  order: 'Order',
  totalPaid: 'Total paid',
  arrives: 'Arrives Thursday, by courier',
  continueShopping: 'Continue shopping',
}
export type CheckoutCopy = typeof CHECKOUT_COPY

/** Each step's schema, its messages from `copy`. */
export function checkoutSchemas(copy: CheckoutCopy) {
  return {
    contact: z.object({
      email: z.string().trim().min(1, copy.emailRequired).email(copy.emailInvalid),
      news: z.boolean(),
    }),
    shipping: z.object({
      name: z.string().trim().min(1, copy.nameRequired),
      address: z.string().trim().min(1, copy.addressRequired),
      city: z.string().trim().min(1, copy.cityRequired),
      postal: z.string().trim().min(3, copy.postalRequired),
      country: z.string().min(1, copy.countryRequired),
      phone: z.string().min(8, copy.phoneRequired),
    }),
    payment: z.object({
      card: z.string().refine((v) => /^\d{15,16}$/.test(v.replace(/\s/g, '')), copy.cardInvalid),
      expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, copy.expiryInvalid),
      cvc: z.string().regex(/^\d{3,4}$/, copy.cvcInvalid),
      holder: z.string().trim().min(1, copy.holderRequired),
    }),
  }
}
type Schemas = ReturnType<typeof checkoutSchemas>
export type CheckoutContact = z.infer<Schemas['contact']>
export type CheckoutShipping = z.infer<Schemas['shipping']>
export type CheckoutPayment = z.infer<Schemas['payment']>

/** What `onPlaceOrder` receives. */
export interface CheckoutOrder {
  contact: CheckoutContact
  shipping: CheckoutShipping
  payment: CheckoutPayment
  lines: CheckoutLine[]
  shippingOption: CheckoutShippingOption
  subtotal: number
  tax: number
  total: number
}

/** The order's figures, tax rounded to the cent. */
export function totals(lines: CheckoutLine[], shipping: number, taxRate: number) {
  const subtotal = lines.reduce((n, l) => n + l.product.price * l.quantity, 0)
  const tax = Math.round(subtotal * taxRate * 100) / 100
  return { subtotal, tax, total: subtotal + shipping + tax }
}

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
