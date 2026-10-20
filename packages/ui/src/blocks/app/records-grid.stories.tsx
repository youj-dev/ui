import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { RecordsGrid, type OrderRow } from './records-grid'

const meta: Meta<typeof RecordsGrid> = {
  title: 'Blocks/App/Records grid',
  component: RecordsGrid,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'basalt', address: 'admin.fernhill.shop/orders' },
    docs: {
      description: {
        component:
          'Work through every order in one virtualized grid: filter by payment, fulfillment or channel, open an order in a side sheet, and pack, ship or print labels in bulk.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RecordsGrid>

export const Default: Story = { name: 'Orders' }

/** Its own page, for an app without the frame: the top bar over a centered canvas of the orders grid. */
export const Standalone: Story = { args: { embedded: false } }

/** The first load: skeleton rows shaped like each column. */
export const Loading: Story = { args: { loading: true, count: 0 } }

/** A new shop: the empty state with its illustration. */
export const Empty: Story = { args: { count: 0 } }

const BOOKS = [
  { sku: 'BK-ATLAS', name: 'Atlas of remote islands', price: 32 },
  { sku: 'BK-TIDES', name: 'The book of tides', price: 45 },
  { sku: 'BK-NOTES', name: 'Field notebook, dotted', price: 14 },
]
const order = (n: number, customer: string, payment: OrderRow['payment'], fulfilment: OrderRow['fulfilment'], hoursAgo: number): OrderRow => {
  const items = BOOKS.slice(0, 1 + (n % 3)).map((book) => ({ ...book, quantity: 1 + (n % 2) }))
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return {
    id: `PB-${1040 + n}`,
    customer,
    email: `${customer.split(' ')[0]!.toLowerCase()}@example.no`,
    channel: n % 3 ? 'Web shop' : 'Book fair',
    payment,
    fulfilment,
    items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    shipping: 79,
    total: subtotal + 79,
    tags: n % 4 ? [] : ['gift'],
    country: 'Norway',
    city: ['Bergen', 'Oslo', 'Tromsø', 'Trondheim'][n % 4]!,
    address: `${10 + n} Strandgaten`,
    carrier: 'Posten',
    placedAt: new Date(Date.UTC(2026, 8, 29, 15, 40) - hoursAgo * 3_600_000).toISOString(),
  }
}

/** Your orders, shop and words, with every action handled by your app. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Paperboat Books' },
    orders: [
      order(6, 'Ingrid Lie', 'paid', 'unfulfilled', 1),
      order(5, 'Ola Nordmann', 'paid', 'packed', 5),
      order(4, 'Sofie Berg', 'pending', 'unfulfilled', 9),
      order(3, 'Magnus Dahl', 'paid', 'shipped', 30),
      order(2, 'Nora Haugen', 'paid', 'delivered', 70),
      order(1, 'Emil Strand', 'refunded', 'returned', 200),
    ],
    copy: { section: 'Orders', station: 'Bergen studio', description: 'Every book sold, where it is, and what to post next.', create: 'New order' },
    locale: 'nb-NO',
    currency: 'NOK',
    tags: { gift: { label: 'Gift note' } },
    onOpen: fn(),
    onFulfilmentChange: fn(),
    onRefund: fn(),
    onPrintLabel: fn(),
    onEmail: fn(),
    onExport: fn(),
    onCreate: fn(),
    onSelectedChange: fn(),
  },
}
