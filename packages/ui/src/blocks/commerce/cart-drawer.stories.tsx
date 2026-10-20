import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { PlaceholderPage } from '../../docs/placeholder-page'
import { CartDrawer, type CartLine } from './cart-drawer'
import type { Product } from './product-card'

const meta: Meta<typeof CartDrawer> = {
  title: 'Blocks/Commerce/Cart drawer',
  component: CartDrawer,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay' },
    docs: {
      description: {
        component:
          'Let shoppers review their cart in a floating panel without leaving the product page: photos, quantities, the road to free shipping and checkout.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CartDrawer>

/** Open over the shop's page, its trigger in the page's top bar; the Sheet brings its own scrim. */
export const Open: Story = {
  render: () => <PlaceholderPage dimmed={false} action={<CartDrawer defaultOpen />} />,
}

export const Empty: Story = {
  render: () => <PlaceholderPage dimmed={false} action={<CartDrawer defaultOpen defaultLines={[]} />} />,
}

const P = '/blocks/products'

/** A homeware shop's own products, priced in euros. */
const KITCHEN: Product[] = [
  { id: 'kessel', name: 'Kessel', category: 'Küche', price: 89, rating: 4.7, reviews: 1240, image: `${P}/kettle-cream.webp`, colors: [{ id: 'creme', name: 'Creme', swatch: 'var(--color-band)' }], description: 'Ein Flötenkessel aus Emaille.' },
  { id: 'teeset', name: 'Teeservice', category: 'Tee', price: 169, rating: 4.9, reviews: 288, image: `${P}/tea-set.webp`, colors: [{ id: 'hafer', name: 'Hafer', swatch: 'var(--color-band)' }], description: 'Kessel, Dose und drei Becher.' },
]

/** With your data: a homeware shop's cart in euros and German, owned by the page (`lines` + `onLinesChange`), with checkout in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    currency: 'EUR',
    locale: 'de-DE',
    shopHref: '/shop',
    freeShippingAt: 300,
    copy: { title: 'Warenkorb', subtotal: 'Zwischensumme', shipping: 'Versand', shippingLater: 'An der Kasse', removeLabel: 'Entfernen', checkout: 'Zur Kasse', taxesNote: 'Steuern werden an der Kasse berechnet.', awayBefore: 'Noch', awayAfter: 'bis zum kostenlosen Versand' },
    onCheckout: fn(async () => {}),
    onRemove: fn(),
  },
  render: function Render(args) {
    const [lines, setLines] = useState<CartLine[]>([
      { id: 'a', product: KITCHEN[0]!, color: 'creme', quantity: 1 },
      { id: 'b', product: KITCHEN[1]!, color: 'hafer', quantity: 1 },
    ])
    return <PlaceholderPage dimmed={false} action={<CartDrawer {...args} defaultOpen lines={lines} onLinesChange={setLines} />} />
  },
}

/** A plain picture tile for a product that has no photo here: a color and a word. */
const tile = (bg: string, fg: string, word: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/><text x="200" y="270" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="${fg}">${word}</text></svg>`,
  )}`

const food = (id: string, name: string, category: string, price: number, variant: string, image: string): Product => ({
  id,
  image,
  name,
  category,
  price,
  rating: 4.7,
  reviews: 120,
  colors: [{ id: 'default', name: variant, swatch: 'var(--color-band)' }],
  description: name,
})

const GROCERIES: CartLine[] = [
  {
    id: 'g1',
    product: food('tomatoes', 'Roma tomatoes', 'Produce', 2.49, 'Vine-ripened', tile('#d9533c', '#fff3ec', 'Roma')),
    color: 'default',
    size: '2 lb bag',
    quantity: 2,
  },
  {
    id: 'g2',
    product: food('oats', 'Rolled oats', 'Pantry', 4.79, 'Organic', tile('#e3cfa4', '#4a3a1d', 'Oats')),
    color: 'default',
    size: '32 oz canister',
    quantity: 1,
  },
  {
    id: 'g3',
    product: food('milk', 'Whole milk', 'Dairy', 3.99, 'Grass-fed', tile('#dce9f2', '#264a63', 'Milk')),
    color: 'default',
    size: '64 oz',
    quantity: 3,
  },
]

/** A grocery order: packs sold by weight or unit, delivery free above $35, and cents in the total. */
export const GroceryOrder: Story = {
  name: 'Grocery order',
  args: {
    defaultLines: GROCERIES,
    freeShippingAt: 35,
    maxQuantity: 6,
    copy: {
      title: 'Your order',
      trigger: (count) => `Order, ${count} ${count === 1 ? 'pack' : 'packs'}`,
      count: (count) => `${count} ${count === 1 ? 'pack' : 'packs'}`,
      quantity: (name) => `Packs of ${name}`,
      shipping: 'Delivery',
      shippingFree: 'Free delivery',
      shippingLater: 'Set at checkout',
      awayAfter: 'away from free delivery',
      freeShipping: 'Free delivery unlocked',
      taxesNote: 'Items sold by weight are billed at the packed weight.',
      checkout: 'Choose a delivery window',
    },
  },
  render: (args) => <PlaceholderPage dimmed={false} action={<CartDrawer {...args} defaultOpen />} />,
}

const course = (id: string, name: string, category: string, price: number, format: string, image: string): Product => ({
  id,
  image,
  name,
  category,
  price,
  rating: 4.8,
  reviews: 540,
  colors: [{ id: 'default', name: format, swatch: 'var(--color-band)' }],
  description: name,
})

const BUNDLE: CartLine[] = [
  {
    id: 'c1',
    product: course('stats', 'Statistics for Analysts', 'Data', 240, 'Self-paced', tile('#24435a', '#f3e9d2', 'Stats')),
    color: 'default',
    size: '8 weeks',
    quantity: 4,
  },
  {
    id: 'c2',
    product: course('writing', 'Clear Writing at Work', 'Communication', 120, 'Live cohort', tile('#3b4a2c', '#eef3df', 'Writing')),
    color: 'default',
    size: 'Starts Oct 27',
    quantity: 4,
  },
]

/** A course bundle for a team: seats instead of quantities, and one discount threshold for the whole order. */
export const CourseBundle: Story = {
  name: 'Course bundle',
  args: {
    defaultLines: BUNDLE,
    freeShippingAt: 1500,
    maxQuantity: 25,
    copy: {
      title: 'Team enrollment',
      trigger: (count) => `Enrollment, ${count} ${count === 1 ? 'seat' : 'seats'}`,
      count: (count) => `${count} ${count === 1 ? 'seat' : 'seats'}`,
      quantity: (name) => `Seats in ${name}`,
      remove: (name) => `Remove ${name} from the enrollment`,
      removeLabel: 'Remove',
      awayBefore: 'Add',
      awayAfter: 'more for the 10% team discount',
      freeShipping: 'Team discount applied',
      shipping: 'Team discount',
      shippingFree: '10% off',
      shippingLater: 'At $1,500',
      subtotal: 'Total',
      taxesNote: 'Seats can be reassigned until each course starts.',
      checkout: 'Enroll the team',
      checkoutPending: 'Reserving seats…',
      checkoutSuccess: 'Seats reserved',
    },
  },
  render: (args) => <PlaceholderPage dimmed={false} action={<CartDrawer {...args} defaultOpen />} />,
}
