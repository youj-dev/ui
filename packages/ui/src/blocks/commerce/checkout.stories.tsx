import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { Product } from './product-card'
import { Checkout } from './checkout'

const meta: Meta<typeof Checkout> = {
  title: 'Blocks/Commerce/Checkout',
  component: Checkout,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          "Guide shoppers through contact details, shipping and payment with an order summary in view.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Checkout>

export const Default: Story = {
  render: (args) => (
    <Checkout {...args} />
  ),
}

/** A ceramics studio's catalog, priced in euros. */
const KILN: Product[] = [
  { id: 'tide-mug', name: 'Tide Mug', image: '/blocks/products/mug.webp', focus: [44, 50], category: 'Tableware', price: 32, rating: 4.9, reviews: 214, colors: [{ id: 'white', name: 'White', swatch: 'oklch(0.97 0.003 250)' }, { id: 'sea', name: 'Sea', swatch: 'oklch(0.79 0.06 225)' }], description: 'Wheel-thrown stoneware with a glaze that pools like seawater.' }, // youj-allow: the product's own glaze
  { id: 'moss-vases', name: 'Moss Vases', image: '/blocks/products/bud-vases.webp', category: 'Garden', price: 64, compareAt: 78, rating: 4.7, reviews: 96, colors: [{ id: 'chalk', name: 'Chalk', swatch: 'oklch(0.9 0.008 80)' }], description: 'Three bud vases, fired twice.' }, // youj-allow: the product's own glaze
  { id: 'ember-kettle', name: 'Ember Kettle', image: '/blocks/products/kettle-cream.webp', category: 'Kitchen', price: 189, rating: 4.8, reviews: 51, badge: 'Neu', colors: [{ id: 'cream', name: 'Cream', swatch: 'oklch(0.94 0.015 85)' }], description: 'An enamelled kettle with a walnut grip.' }, // youj-allow: the product's own enamel
]

/** With your data: a ceramics studio's order in euros, two delivery options, EU countries, German headings, and the order in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    lines: [
      { product: KILN[0]!, color: 'sea', quantity: 2 },
      { product: KILN[2]!, color: 'cream', quantity: 1 },
    ],
    shippingOptions: [
      { id: 'standard', label: 'Standard', description: '3–5 Werktage', price: 0 },
      { id: 'express', label: 'Express', description: 'Morgen bis 12 Uhr', price: 14.9 },
    ],
    countries: { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' },
    taxRate: 0.19,
    currency: 'EUR',
    locale: 'de-DE',
    copy: { title: 'Kasse', summary: 'Bestellübersicht', subtotal: 'Zwischensumme', shipping: 'Versand', free: 'Kostenlos', tax: 'MwSt.', total: 'Gesamt' },
    onPlaceOrder: fn(async () => 'KILN-2207'),
  },
}
