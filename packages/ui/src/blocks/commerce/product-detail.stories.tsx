import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RotateCcwIcon, TruckIcon } from '@youj/icons'
import { productById } from './product-card'
import { ProductDetail } from './product-detail'

const meta: Meta<typeof ProductDetail> = {
  title: 'Blocks/Commerce/Product detail',
  component: ProductDetail,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Let shoppers see a product from every side in the color they pick, choose their size, and know when it will arrive.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProductDetail>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <ProductDetail {...args} />
    </div>
  ),
}

/** A product with one colorway and no sizes. */
export const TeaSet: Story = {
  args: { product: productById('ritual-tea-set') },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <ProductDetail {...args} />
    </div>
  ),
}

/** With your data: a ceramics studio's mug in euros with German labels, its own delivery lines and folds, and add-to-cart and saves in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    product: {
      id: 'tide-mug',
      name: 'Tide Mug',
      image: '/blocks/products/mug.webp',
      focus: [44, 50],
      category: 'Geschirr',
      price: 32,
      rating: 4.8,
      reviews: 51,
      badge: 'Neu',
      colors: [{ id: 'weiss', name: 'Weiß', swatch: 'oklch(0.97 0.003 250)' }], // youj-allow: the product's own glaze
      description: 'Eine Tasse aus Porzellan mit einer Glasur, die wie Meerwasser ausläuft, von Hand gedreht in Leipzig.',
    },
    currency: 'EUR',
    locale: 'de-DE',
    breadcrumbs: [
      { label: 'Shop', href: '/shop' },
      { label: 'Geschirr', href: '/shop/geschirr' },
    ],
    sizeGuideHref: null,
    perks: [
      { icon: TruckIcon, title: 'Versand in 2–3 Tagen', detail: 'Kostenlos ab 120 €' },
      { icon: RotateCcwIcon, title: '30 Tage Rückgabe', detail: 'Das Etikett liegt bei' },
    ],
    sections: [{ id: 'care', title: 'Pflege', body: 'Mit einem trockenen Tuch abwischen. Nicht in die Spülmaschine.' }],
    copy: { addToCart: 'In den Warenkorb', added: 'Im Warenkorb', color: 'Farbe', quantity: 'Menge', save: 'Merken', reviews: (n: string) => `${n} Bewertungen` },
    onAddToCart: fn(async () => {}),
    onSave: fn(),
  },
}
