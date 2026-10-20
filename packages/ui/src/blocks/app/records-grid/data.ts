import type { DataGridView } from '../../tables/data-grid'
import { DEFAULT_COPY, type OrdersCopy } from './copy'
import { numberFormat } from '../../../lib/utils'

/* Fernhill's orders: a seeded set, so the page renders the same on the
 * server and in the browser. Pass your own as the page's `orders`. */

export const NOW = Date.UTC(2026, 8, 29, 15, 40)
const HOUR = 3_600_000

export type Payment = 'paid' | 'pending' | 'refunded' | 'failed'
export type Fulfilment = 'unfulfilled' | 'packed' | 'shipped' | 'delivered' | 'returned'
export type Channel = 'Online store' | 'iOS app' | 'Wholesale' | 'In store'

export interface LineItem {
  sku: string
  name: string
  quantity: number
  /** Unit price, in dollars. */
  price: number
}

export interface Order {
  /** The order number customers see: "FH-20418". */
  id: string
  customer: string
  email: string
  /** Where it was bought: the demo's are Online store, iOS app, Wholesale and In store. */
  channel: Channel | (string & {})
  payment: Payment
  fulfilment: Fulfilment
  items: LineItem[]
  /** How many things, across the lines. */
  quantity: number
  shipping: number
  /** Subtotal plus shipping, in dollars. */
  total: number
  tags: string[]
  country: string
  city: string
  address: string
  carrier: string
  /** An ISO date. */
  placedAt: string
}

export const PAYMENT = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
} as const

export const FULFILMENT = {
  unfulfilled: { label: 'Unfulfilled', tone: 'warning' },
  packed: { label: 'Packed', tone: 'accent' },
  shipped: { label: 'Shipped', tone: 'accent' },
  delivered: { label: 'Delivered', tone: 'success' },
  returned: { label: 'Returned', tone: 'danger' },
} as const

export const TAGS = {
  gift: { label: 'Gift wrap' },
  express: { label: 'Express' },
  fragile: { label: 'Fragile' },
  first: { label: 'First order' },
  vip: { label: 'Regular' },
} as const

const PRODUCTS: Omit<LineItem, 'quantity'>[] = [
  { sku: 'MUG-SAGE', name: 'Stoneware mug, sage', price: 28 },
  { sku: 'KTL-POUR', name: 'Pour-over kettle', price: 84 },
  { sku: 'APR-LIN', name: 'Linen apron', price: 46 },
  { sku: 'BRD-OAK', name: 'Oak serving board', price: 62 },
  { sku: 'PLT-CER', name: 'Ceramic planter', price: 38 },
  { sku: 'THR-WOL', name: 'Wool throw, oat', price: 148 },
  { sku: 'CUP-ESP', name: 'Espresso cups, set of 4', price: 54 },
  { sku: 'CND-BEE', name: 'Beeswax candle', price: 22 },
  { sku: 'SCS-BRS', name: 'Brass scissors', price: 36 },
  { sku: 'CRF-GLS', name: 'Glass carafe', price: 42 },
  { sku: 'TWL-WAF', name: 'Waffle towels, pair', price: 32 },
  { sku: 'BWL-SPK', name: 'Speckled bowls, set of 2', price: 48 },
]

const FIRST = ['Ada', 'Ben', 'Chloé', 'Dev', 'Elif', 'Farah', 'Gus', 'Hana', 'Idris', 'Jun', 'Kofi', 'Lena', 'Mateo', 'Nia', 'Oskar', 'Priya', 'Quinn', 'Rosa', 'Sami', 'Tove', 'Uma', 'Vik', 'Wren', 'Yara', 'Zoe']
const LAST = ['Abbott', 'Brandt', 'Castillo', 'Dahl', 'Eze', 'Fischer', 'Gallo', 'Hoang', 'Iverson', 'Jansen', 'Kaur', 'Lindgren', 'Moreau', 'Nakamura', 'Okafor', 'Petrov', 'Quist', 'Reyes', 'Silva', 'Tanaka', 'Varga', 'Walsh']
const PLACES: [string, string][] = [
  ['United States', 'Portland'], ['United States', 'Brooklyn'], ['United States', 'Austin'], ['United Kingdom', 'Bristol'],
  ['United Kingdom', 'Leeds'], ['Germany', 'Hamburg'], ['Netherlands', 'Utrecht'], ['Canada', 'Montréal'],
  ['Australia', 'Melbourne'], ['Japan', 'Kyoto'], ['Sweden', 'Malmö'], ['France', 'Lyon'],
]
const STREETS = ['Alder St', 'Canal Rd', 'Mill Lane', 'Harbour Way', 'Orchard Ave', 'Station Rd', 'Linden Ct', 'Kiln Row']

export function makeOrders(count: number, seed = 11): Order[] {
  let s = seed
  const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  // A seeded Fisher-Yates: a random comparator in sort() shuffles differently per JS engine (server vs browser).
  const shuffle = <T>(list: readonly T[]) => {
    const out = [...list]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j]!, out[i]!]
    }
    return out
  }
  const channels: Channel[] = ['Online store', 'Online store', 'Online store', 'iOS app', 'iOS app', 'Wholesale', 'In store']
  const tagKeys = Object.keys(TAGS)
  let placed = NOW - 0.4 * HOUR
  return Array.from({ length: count }, (_, i) => {
    // Newest first: orders thin out the further back they go.
    placed -= (0.2 + next() * 0.9) * HOUR * (1 + i / 900)
    const age = (NOW - placed) / HOUR
    const channel = pick(channels)
    const lines = shuffle(PRODUCTS).slice(0, 1 + Math.floor(next() * (channel === 'Wholesale' ? 5 : 3)))
    const items = lines.map((p) => ({ ...p, quantity: channel === 'Wholesale' ? 6 + Math.floor(next() * 18) : 1 + Math.floor(next() * next() * 3) }))
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shipping = channel === 'In store' || subtotal >= 150 ? 0 : 8
    const roll = next()
    const payment: Payment = roll < 0.035 ? 'failed' : roll < 0.08 ? 'refunded' : roll < 0.13 && age < 48 ? 'pending' : 'paid'
    const fulfilment: Fulfilment =
      payment === 'refunded'
        ? next() < 0.6 ? 'returned' : 'unfulfilled'
        : payment !== 'paid'
          ? 'unfulfilled'
          : channel === 'In store'
            ? 'delivered'
            : age < 14 ? pick(['unfulfilled', 'unfulfilled', 'packed'] as const)
              : age < 40 ? pick(['packed', 'shipped', 'shipped'] as const)
                : age < 120 ? pick(['shipped', 'delivered', 'delivered'] as const)
                  : next() < 0.03 ? 'returned' : 'delivered'
    const [country, city] = pick(PLACES)
    const first = pick(FIRST)
    const last = pick(LAST)
    const tags = tagKeys.filter((key) => next() < (key === 'first' ? 0.18 : 0.1))
    return {
      id: `FH-${24_870 - i}`,
      customer: channel === 'Wholesale' ? `${last} & Co.` : `${first} ${last}`,
      email: `${first}.${last}@example.com`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
      channel,
      payment,
      fulfilment,
      items,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      shipping,
      total: subtotal + shipping,
      tags,
      country,
      city,
      address: `${10 + Math.floor(next() * 180)} ${pick(STREETS)}`,
      carrier: channel === 'In store' ? 'Collected' : country === 'United States' ? pick(['USPS', 'UPS']) : pick(['DHL', 'Royal Mail', 'PostNL']),
      placedAt: new Date(placed).toISOString(),
    }
  })
}

/** The saved views, with how many orders each holds (the same rules their filters apply). */
export function orderViews(orders: readonly Order[], labels: OrdersCopy['views'] = DEFAULT_COPY.views): DataGridView[] {
  const count = (test: (o: Order) => boolean) => orders.filter(test).length
  return [
    { id: 'all', label: labels.all, count: orders.length, state: {} },
    {
      id: 'ship',
      label: labels.ship,
      count: count((o) => o.payment === 'paid' && (o.fulfilment === 'unfulfilled' || o.fulfilment === 'packed')),
      state: { columnFilters: [{ id: 'payment', value: ['paid'] }, { id: 'fulfilment', value: ['unfulfilled', 'packed'] }], sorting: [{ id: 'placedAt', desc: false }] },
    },
    {
      id: 'payment',
      label: labels.payment,
      count: count((o) => o.payment === 'pending' || o.payment === 'failed'),
      state: { columnFilters: [{ id: 'payment', value: ['pending', 'failed'] }] },
    },
    {
      id: 'returns',
      label: labels.returns,
      count: count((o) => o.fulfilment === 'returned'),
      state: { columnFilters: [{ id: 'fulfilment', value: ['returned'] }] },
    },
  ]
}

export const money = (n: number, cents: boolean, locale: string, currency = 'USD') =>
  numberFormat(locale, { style: 'currency', currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n)
