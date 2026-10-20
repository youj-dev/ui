import { AlertTriangleIcon, BanknoteIcon, CheckCircleIcon, CircleXIcon, PackageIcon, ReceiptIcon, ShoppingBagIcon, TruckIcon } from '@youj/icons'
import type { TimelineEvent, TimelineEventType } from '../../../components/ui/timeline'
import { colorName, productById, type Product } from '../product-card'

/* Fieldwork's order pages: one order in four states (split across two
 * packages, one package on its way, delivered, canceled). Times are relative
 * to when the module loads, so "Today" in the tracking history stays true.
 * Pass your own `Order` to the page instead. */

/** Where a package is. The Stepper's `current` is the index of the stage it is in; `STAGES.length` once delivered. */
export const STAGES = [
  { id: 'ordered', title: 'Ordered' },
  { id: 'packed', title: 'Packed' },
  { id: 'transit', title: 'In transit' },
  { id: 'out', title: 'Out for delivery' },
  { id: 'delivered', title: 'Delivered' },
] as const
export const DELIVERED = STAGES.length

/** The tracking history's marks. */
export const SCAN_TYPES: Record<string, TimelineEventType> = {
  placed: { icon: ShoppingBagIcon, label: 'Order' },
  label: { icon: ReceiptIcon, label: 'Label' },
  packed: { icon: PackageIcon, label: 'Packed' },
  transit: { icon: TruckIcon, label: 'In transit' },
  out: { icon: TruckIcon, tone: 'accent', label: 'Out for delivery' },
  delay: { icon: AlertTriangleIcon, tone: 'warning', label: 'Delay' },
  delivered: { icon: CheckCircleIcon, tone: 'success', label: 'Delivered' },
  cancelled: { icon: CircleXIcon, tone: 'danger', label: 'Canceled' },
  refund: { icon: BanknoteIcon, tone: 'success', label: 'Refund' },
}

export interface Line {
  id: string
  product: Product
  /** The colorway's id. */
  color: string
  size?: string
  quantity: number
  /** Which package it travels in. */
  shipment?: string
}

export interface Shipment {
  id: string
  name: string
  carrier: string
  tracking: string
  /** Index into STAGES of the stage it is in; DELIVERED once it has arrived. */
  stage: number
  /** When each stage was reached, by index. */
  stamps: number[]
  /** Estimated (or actual) delivery. */
  eta: number
  /** The delivery window, or where it was left once delivered. */
  note: string
  events: TimelineEvent[]
  /** Demo only: scans the carrier hasn't reported yet. Track package fetches the next one. */
  upcoming?: { type: string; title: string; stage: number; note?: string }[]
}

export interface Address {
  name: string
  lines: string[]
  phone?: string
}

export interface Order {
  number: string
  placed: number
  email: string
  lines: Line[]
  shipments: Shipment[]
  discount?: { code: string; rate: number }
  shipping: number
  taxRate: number
  shipTo: Address
  billTo: Address
  card: { brand: string; last4: string; exp: string }
  /** Set when the order was canceled: when, and the history that led there. */
  cancelled?: { at: number; reason: string; events: TimelineEvent[] }
}

/** The demo's "now", fixed so the server and the browser draw the same dates: the fixtures' times count back from it. */
export const NOW = new Date(2026, 9, 1, 12).getTime()
/** A time `days` before today (negative: after), at hh:mm local. */
const at = (days: number, hour: number, minute: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

const TEA_SET = { product: productById('ritual-tea-set'), color: 'oat', quantity: 1 }
const KETTLE = { product: productById('ridge-kettle'), color: 'rose', size: '1.2 l', quantity: 1 }
const MUGS = { product: productById('daily-mug'), color: 'white', size: '450 ml', quantity: 2 }

const PEOPLE = {
  email: 'maya@okonkwo.studio',
  shipTo: { name: 'Maya Okonkwo', lines: ['2419 Folsom Street, Apt 3', 'San Francisco, CA 94110', 'United States'], phone: '+1 415 555 0142' },
  billTo: { name: 'Okonkwo Studio LLC', lines: ['88 Kearny Street, Suite 1400', 'San Francisco, CA 94108', 'United States'] },
  card: { brand: 'Visa', last4: '4242', exp: '08/28' },
  shipping: 0,
  taxRate: 0.08625,
}

const placed = (days: number, id: string): TimelineEvent => ({ id, type: 'placed', title: 'Order placed and paid', time: at(days, 10, 12) })

const split: Order = {
  ...PEOPLE,
  number: 'FW-48213',
  placed: at(4, 10, 12),
  discount: { code: 'FIELD10', rate: 0.1 },
  lines: [
    { id: 'l1', ...TEA_SET, shipment: 'p2' },
    { id: 'l2', ...KETTLE, shipment: 'p2' },
    { id: 'l3', ...MUGS, shipment: 'p1' },
  ],
  shipments: [
    {
      id: 'p1',
      name: 'Package 1',
      carrier: 'USPS Priority',
      tracking: '9405 5112 0620 4471 2280 16',
      stage: DELIVERED,
      stamps: [at(4, 10, 12), at(3, 9, 5), at(3, 21, 30), at(1, 8, 3), at(1, 14, 47)],
      eta: at(1, 14, 47),
      note: 'Left in the parcel locker, unit 3',
      events: [
        placed(4, 'p1-1'),
        { id: 'p1-2', type: 'label', title: 'Label created; USPS is expecting it', time: at(4, 16, 40) },
        { id: 'p1-3', type: 'packed', title: 'Packed at our Portland, OR warehouse', time: at(3, 9, 5) },
        { id: 'p1-4', type: 'transit', title: 'Departed the USPS facility in Portland, OR', time: at(3, 21, 30) },
        { id: 'p1-5', type: 'transit', title: 'Arrived at the USPS regional facility in San Francisco, CA', time: at(2, 11, 52) },
        { id: 'p1-6', type: 'out', title: 'Out for delivery in San Francisco, CA', time: at(1, 8, 3) },
        { id: 'p1-7', type: 'delivered', title: 'Delivered to the parcel locker, unit 3', time: at(1, 14, 47), details: 'The locker code was sent to +1 415 555 0142. It holds parcels for 5 days.' },
      ],
    },
    {
      id: 'p2',
      name: 'Package 2',
      carrier: 'UPS Ground',
      tracking: '1Z 84F 29R 03 4471 2280',
      stage: 2,
      stamps: [at(4, 10, 12), at(2, 15, 20), at(1, 22, 10)],
      eta: at(0, 20, 0),
      note: 'By 8 pm',
      events: [
        placed(4, 'p2-1'),
        { id: 'p2-2', type: 'packed', title: 'Packed at our Oakland, CA warehouse', time: at(2, 15, 20), details: 'The Ridge Kettle shipped from Oakland, so your order travels as two packages at no extra cost.' },
        { id: 'p2-3', type: 'label', title: 'Handed to UPS', time: at(2, 17, 31) },
        { id: 'p2-4', type: 'transit', title: 'Departed the UPS facility in Oakland, CA', time: at(1, 22, 10) },
        { id: 'p2-5', type: 'transit', title: 'Arrived at the UPS hub in San Francisco, CA', time: at(1, 23, 48) },
      ],
      upcoming: [{ type: 'out', title: 'On the truck in San Francisco, CA', stage: 3, note: 'Between 2 and 6 pm' }],
    },
  ],
}

const oneBox = (shipment: string) => [
  { id: 'l1', ...TEA_SET, shipment },
  { id: 'l2', ...KETTLE, shipment },
  { id: 'l3', ...MUGS, shipment },
]

const inTransit: Order = {
  ...PEOPLE,
  number: 'FW-48377',
  placed: at(3, 10, 12),
  lines: oneBox('p1'),
  shipments: [
    {
      id: 'p1',
      name: 'Package 1',
      carrier: 'UPS Ground',
      tracking: '1Z 84F 29R 03 5582 9104',
      stage: 2,
      stamps: [at(3, 10, 12), at(2, 11, 40), at(2, 18, 5)],
      eta: at(-1, 20, 0),
      note: 'By 8 pm',
      events: [
        placed(3, 't-1'),
        { id: 't-2', type: 'packed', title: 'Packed at our Portland, OR warehouse', time: at(2, 11, 40) },
        { id: 't-3', type: 'transit', title: 'Departed the UPS facility in Portland, OR', time: at(2, 18, 5) },
        { id: 't-4', type: 'delay', title: 'Held in Medford, OR by snow on I-5', time: at(1, 6, 20), details: 'UPS moved the estimate back one day. Nothing you need to do.' },
        { id: 't-5', type: 'transit', title: 'Departed the UPS facility in Medford, OR', time: at(1, 15, 2) },
      ],
      upcoming: [{ type: 'transit', title: 'Arrived at the UPS hub in San Francisco, CA', stage: 2 }],
    },
  ],
}

const delivered: Order = {
  ...PEOPLE,
  number: 'FW-47960',
  placed: at(6, 10, 12),
  discount: { code: 'FIELD10', rate: 0.1 },
  lines: oneBox('p1'),
  shipments: [
    {
      id: 'p1',
      name: 'Package 1',
      carrier: 'UPS Ground',
      tracking: '1Z 84F 29R 03 3120 7751',
      stage: DELIVERED,
      stamps: [at(6, 10, 12), at(5, 9, 30), at(5, 17, 45), at(2, 8, 14), at(2, 13, 26)],
      eta: at(2, 13, 26),
      note: 'Handed to the building concierge',
      events: [
        placed(6, 'd-1'),
        { id: 'd-2', type: 'packed', title: 'Packed at our Portland, OR warehouse', time: at(5, 9, 30) },
        { id: 'd-3', type: 'transit', title: 'Departed the UPS facility in Portland, OR', time: at(5, 17, 45) },
        { id: 'd-4', type: 'transit', title: 'Arrived at the UPS hub in San Francisco, CA', time: at(3, 20, 5) },
        { id: 'd-5', type: 'out', title: 'Out for delivery in San Francisco, CA', time: at(2, 8, 14) },
        { id: 'd-6', type: 'delivered', title: 'Delivered to the building concierge', time: at(2, 13, 26), details: 'Signed for by R. Alvarez at the front desk.' },
      ],
    },
  ],
}

const cancelled: Order = {
  ...PEOPLE,
  number: 'FW-48102',
  placed: at(3, 10, 12),
  lines: oneBox(''),
  shipments: [],
  cancelled: {
    at: at(3, 10, 51),
    reason: 'You canceled it before it was packed.',
    events: [
      placed(3, 'c-1'),
      { id: 'c-2', type: 'cancelled', title: 'Canceled at your request', time: at(3, 10, 51) },
      { id: 'c-3', type: 'refund', title: 'Refund sent to Visa •••• 4242', time: at(3, 11, 4), details: 'Banks take 5–10 business days to show it. The reference is RF-20931.' },
    ],
  },
}

export const ORDERS = { split, inTransit, delivered, cancelled }

const round = (value: number) => Math.round(value * 100) / 100

/** The receipt, and what one unit of a line refunds (its share of the discount taken off, its tax added back). */
export function totals(order: Order) {
  const subtotal = order.lines.reduce((n, l) => n + l.product.price * l.quantity, 0)
  const discount = round(subtotal * (order.discount?.rate ?? 0))
  const tax = round((subtotal - discount + order.shipping) * order.taxRate)
  const total = round(subtotal - discount + order.shipping + tax)
  const unitRefund = (line: Line) => round(line.product.price * (1 - (order.discount?.rate ?? 0)) * (1 + order.taxRate))
  return { subtotal, discount, tax, total, unitRefund }
}

export const lineVariant = (line: Line) => [colorName(line.product, line.color), line.size].filter(Boolean).join(' · ')

export const DAY_MS = 86_400_000

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
