import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { OrderDetail, type Order } from './order-detail'
import { ORDERS } from './order-detail/data'

/** Fieldwork's look: warm stone neutrals, a postal indigo, soft corners and calm timing. */
const fieldwork = defineTheme({
  id: 'fieldwork',
  name: 'Fieldwork',
  description: 'Warm stone neutrals and a postal indigo. Calm, like a parcel you know is coming.',
  neutral: { hue: 70, chroma: 0.012, wash: 0.35 },
  accent: 'oklch(0.5 0.16 268)', // youj-allow: theme input colour
  radius: 'lg',
  controlSize: 'default',
  motionPersonality: 'calm',
})

const meta: Meta<typeof OrderDetail> = {
  title: 'Blocks/Commerce/Order detail',
  component: OrderDetail,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: fieldwork },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', theme: 'Fieldwork', accent: 'oklch(0.5 0.16 268)', address: 'fieldwork.co/orders/FW-48213' },
    docs: {
      description: {
        component:
          'Help your customers check their order and see where it is on its way to them.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof OrderDetail>

/** Split across two packages: one delivered, one on its way. */
export const Default: Story = {}

/** One package, held a day by weather. */
export const InTransit: Story = { args: { order: 'inTransit' } }

/** Everything arrived: the tracker is complete and returns are open. */
export const Delivered: Story = { args: { order: 'delivered' } }

/** Canceled before it shipped: why, and where the refund went. */
export const Cancelled: Story = { args: { order: 'cancelled' } }

/** Inside an account page: a section with an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true, order: 'delivered' },
  // The host app's content area, full-bleed: the page fills it.
  render: (args) => (
    <main className="min-h-dvh bg-canvas p-6">
      <OrderDetail {...args} />
    </main>
  ),
}

/** A ceramics studio's delivered order: its own number, customer, card and tax. */
const KILN_ORDER: Order = {
  ...ORDERS.delivered,
  number: 'KL-2207',
  email: 'lena@brandt.de',
  shipTo: { name: 'Lena Brandt', lines: ['Karl-Heine-Straße 41', '04229 Leipzig', 'Deutschland'] },
  billTo: { name: 'Lena Brandt', lines: ['Karl-Heine-Straße 41', '04229 Leipzig', 'Deutschland'] },
  card: { brand: 'Mastercard', last4: '5100', exp: '04/29' },
  taxRate: 0.19,
}

/** With your data: a ceramics studio's order in euros, its own support line and words, and every action in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    order: KILN_ORDER,
    brand: { name: 'Kiln & Co.' },
    currency: 'EUR',
    locale: 'de-DE',
    support: { email: 'hallo@kiln.co', phone: '+49 341 555 0123' },
    copy: { brandSection: 'Bestellungen', allOrders: 'Alle Bestellungen', title: (n: string) => `Bestellung ${n}`, delivered: 'Zugestellt', downloadInvoice: 'Rechnung', returnItems: 'Zurücksenden', contactSupport: 'Hilfe' },
    onTrack: fn(async () => false),
    onReturn: fn(async () => {}),
    onDownloadInvoice: fn(async () => {}),
    onContact: fn(),
  },
}
