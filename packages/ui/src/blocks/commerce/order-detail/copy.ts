import { createContext, useContext } from 'react'
import { useLocale } from '@youj/core'
import { DAY_MS, NOW } from './data'

export const ORDER_DETAIL_COPY = {
  brandSection: 'Orders',
  allOrders: 'All orders',
  title: (number: string) => `Order ${number}`,
  placed: (date: string, count: number, total: string) => `Placed ${date} · ${count} items · ${total}`,
  canceled: 'Canceled',
  delivered: 'Delivered',
  someDelivered: (n: number, total: number) => `${n} of ${total} delivered`,
  onItsWay: 'On its way',
  downloadInvoice: 'Download invoice',
  preparing: 'Preparing…',
  downloaded: 'Downloaded',
  downloadedToast: (number: string) => `Downloaded ${number}.pdf`,
  downloadedCancelled: 'The invoice and its credit note.',
  downloadedFor: (total: string, name: string) => `${total} to ${name}`,
  returnItems: 'Return items',
  contactSupport: 'Contact support',
  chat: 'Chat with us',
  chatToast: 'Connecting you to Fieldwork support',
  chatToastDetail: (number: string) => `About ${number}. Replies take about 2 minutes.`,
  emailUs: (email: string) => `Email ${email}`,
  emailToast: 'Email drafted',
  emailToastDetail: (email: string, number: string) => `To ${email}, about ${number}.`,
  callUs: (phone: string) => `Call ${phone}`,
  callToast: (phone: string) => `Calling ${phone}`,
  callToastDetail: 'Mon–Sat, 7 am to 7 pm PT.',
  returnStarted: (rma: string) => `Return ${rma} started`,
  returnNote: (dropBy: string, refund: string, to: string) => `Hand it to UPS by ${dropBy} with the QR code we emailed. ${refund} goes back ${to} once it’s scanned.`,
  toCard: (brand: string, last4: string) => `to ${brand} •••• ${last4}`,
  asCredit: 'as Fieldwork credit',
  cancellation: 'Cancellation',
  delivery: 'Delivery',
  deliveryPackages: (n: number) => `Delivery · ${n} packages`,
  canceledOn: (date: string) => `Canceled ${date}`,
  canceledRefund: (reason: string, total: string, brand: string, last4: string) => `${reason} ${total} went back to ${brand} •••• ${last4}.`,
  packages: 'Packages',
  packageDelivered: '· Delivered',
  packageOnItsWay: '· On its way',
  noNewScans: (carrier: string) => `No new scans from ${carrier}`,
  lastScan: (date: string, time: string) => `The last one was ${date} at ${time}.`,
  // Shipment
  deliveredOn: (day: string) => `Delivered ${day}`,
  arriving: (day: string) => `Arriving ${day}`,
  estimated: (date: string) => `Est. ${date}`,
  copyTracking: (tracking: string) => `Copy tracking number ${tracking}`,
  copied: 'Copied',
  copyFailed: 'Copy failed',
  track: 'Track package',
  checking: 'Checking…',
  updated: 'Updated',
  upToDate: 'Up to date',
  progress: (name: string) => `${name} delivery progress`,
  inPackage: (name: string) => `In ${name}: `,
  itemCount: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
  trackingHistory: 'Tracking history',
  today: 'today',
  tomorrow: 'tomorrow',
  yesterday: 'yesterday',
  // Items
  items: 'Items',
  qty: (n: number) => ` · Qty ${n}`,
  each: (price: string) => ` · ${price} each`,
  returnStartedBadge: 'Return started',
  returning: (n: number, of: number) => `Returning ${n} of ${of}`,
  // Payment and addresses
  payment: 'Payment',
  subtotal: 'Subtotal',
  discount: 'Discount',
  shipping: 'Shipping',
  free: 'Free',
  tax: (rate: string) => `Tax (${rate}%)`,
  total: 'Total',
  refunded: (date: string) => `Refunded ${date}`,
  refundedOn: (total: string, date: string) => `Refunded ${total} on ${date}`,
  charged: (total: string, date: string, exp: string) => `Charged ${total} on ${date} · Expires ${exp}`,
  addresses: 'Addresses',
  shippingTo: 'Shipping to',
  billingTo: 'Billing to',
  receipts: 'Receipts go to',
  // Return dialog
  returnTitle: 'Return items',
  returnDoneTitle: 'Return started',
  returnDescription: (number: string) => `Order ${number}. Returns are free within 30 days of delivery.`,
  returnDoneDescription: (number: string, rma: string) => `Order ${number} · ${rma}`,
  startReturn: 'Start return',
  cancel: 'Cancel',
  itemsStep: 'Items',
  itemsStepDescription: 'What’s going back, and how many.',
  chooseItem: 'Choose at least one item to return.',
  backEach: (variant: string, price: string) => `${variant} · ${price} back each`,
  howMany: (name: string) => `How many ${name}`,
  stillOnItsWay: 'Still on its way. You can return it once it arrives.',
  reasonStep: 'Reason',
  reasonStepDescription: 'Why it’s going back. It helps us fix what went wrong.',
  chooseReason: 'Choose a reason.',
  reasons: [
    { id: 'space', title: 'It doesn’t suit the space', hint: 'Color, size or feel' },
    { id: 'damaged', title: 'It arrived damaged', hint: 'We’ll send a replacement first if you’d like' },
    { id: 'described', title: 'It isn’t as described', hint: 'Tell us what was different' },
    { id: 'mind', title: 'I changed my mind', hint: 'No questions asked within 30 days' },
  ],
  note: 'Anything we should know? (optional)',
  notePlaceholder: 'The kettle’s lid has a dent near the hinge.',
  refundStep: 'Refund',
  refundStepDescription: 'How the money comes back, and how the parcel gets to us.',
  refundTo: 'Refund to',
  cardTitle: (brand: string, last4: string) => `${brand} •••• ${last4}`,
  cardHint: '5–10 business days after we receive it',
  creditTitle: 'Fieldwork credit, plus 10%',
  creditHint: 'Instantly, as soon as the carrier scans it',
  handOver: 'Hand it over',
  storeTitle: 'Drop it at a UPS Store',
  storeHint: (date: string) => `Free · Bring the QR code by ${date}`,
  pickupTitle: 'Schedule a pickup',
  pickupHint: (fee: string) => `${fee} taken off the refund`,
  refundFor: (n: number) => `Refund for ${n} items`,
  confirmation: (email: string, dropBy: string, refund: string, to: string) => `We emailed the QR code to ${email}. Hand it over by ${dropBy}; ${refund} goes to ${to} once the carrier scans it.`,
  yourCredit: 'your Fieldwork credit',
  done: 'Done',
}
export type OrderDetailCopy = typeof ORDER_DETAIL_COPY

/** How the page writes money, dates and days, and the moment it counts from. */
export function orderFormat(copy: OrderDetailCopy, locale: string, currency = 'USD', now = NOW) {
  const money = (value: number) => value.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const shortDate = (time: number) => new Date(time).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  const clock = (time: number) => new Date(time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()
  /** "today", "tomorrow", "yesterday", else "Tue, Sep 29". */
  const dayName = (time: number) => {
    if (sameDay(time, now)) return copy.today
    if (sameDay(time, now + DAY_MS)) return copy.tomorrow
    if (sameDay(time, now - DAY_MS)) return copy.yesterday
    return new Date(time).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  }
  return { copy, locale, currency, now, money, shortDate, clock, dayName }
}
export type OrderFormat = ReturnType<typeof orderFormat>

const OrderContext = createContext<OrderFormat | null>(null)
/** The page's format; outside it, the default copy in the app's locale. */
const useOrder = () => {
  const around = useContext(OrderContext)
  const locale = useLocale()
  return around ?? orderFormat(ORDER_DETAIL_COPY, locale)
}

export { OrderContext, useOrder }
