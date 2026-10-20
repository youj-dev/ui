import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ProductCard, productById, type Product } from './product-card'

const meta: Meta<typeof ProductCard> = {
  title: 'Blocks/Commerce/Product card',
  component: ProductCard,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Show a product the way an editorial shop does: the photo is the card. Hover to see its other side, try a color from the swatches, and add it to the cart without leaving the page.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProductCard>

export const Default: Story = {
  render: () => (
    <div className="flex min-h-dvh w-full items-center justify-center bg-canvas p-6 sm:p-10">
      <div className="grid w-full max-w-4xl grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
        {['ridge-kettle', 'ritual-tea-set', 'bud-vases'].map((id) => (
          <ProductCard key={id} product={productById(id)} />
        ))}
      </div>
    </div>
  ),
}

const P = '/blocks/products'

/** A homeware shop's own products, priced in euros. */
const KITCHEN: Product[] = [
  { id: 'kessel', name: 'Kessel', category: 'Küche', price: 89, compareAt: 109, rating: 4.7, reviews: 1240, image: `${P}/kettle-cream.webp`, angle: `${P}/kettle-cream-side.webp`, colors: [{ id: 'creme', name: 'Creme', swatch: 'var(--color-band)' }], description: 'Ein Flötenkessel aus Emaille.' },
  { id: 'becher', name: 'Becher', category: 'Tassen', price: 19, rating: 4.8, reviews: 3020, sizes: ['300 ml', '450 ml'], image: `${P}/mug.webp`, colors: [{ id: 'weiss', name: 'Weiß', swatch: 'var(--color-surface)' }], description: 'Porzellan.' },
  { id: 'teeset', name: 'Teeservice', category: 'Tee', price: 169, rating: 4.9, reviews: 288, badge: 'Neu', image: `${P}/tea-set.webp`, colors: [{ id: 'hafer', name: 'Hafer', swatch: 'var(--color-band)' }], description: 'Kessel, Dose und drei Becher.' },
]

/** With your data: a homeware shop's products and photos in euros, German labels, and quick add in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { currency: 'EUR', locale: 'de-DE', copy: { quickAdd: 'In den Korb', added: 'Im Korb', color: 'Farbe', pickSize: 'Größe wählen' }, onAdd: fn(async () => {}) },
  render: (args) => (
    <div className="flex min-h-dvh w-full items-center justify-center bg-canvas p-6 sm:p-10">
      <div className="grid w-full max-w-4xl grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
        {KITCHEN.map((product) => (
          <ProductCard key={product.id} {...args} product={product} />
        ))}
      </div>
    </div>
  ),
}

const cover = (bg: string, band: string, title: string, author: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="${bg}"/><rect x="60" y="760" width="680" height="10" fill="${band}"/><text x="60" y="200" font-family="Georgia, serif" font-size="84" fill="${band}">${title}</text><text x="60" y="880" font-family="Georgia, serif" font-size="44" fill="${band}">${author}</text></svg>`,
  )}`

const BOOKS: Product[] = [
  {
    id: 'salt-tide',
    name: 'The Salt Tide',
    category: 'Fiction',
    price: 18.5,
    compareAt: 24,
    rating: 4.6,
    reviews: 842,
    badge: 'Staff pick',
    image: cover('#24435a', '#f3e9d2', 'The Salt Tide', 'Ines Calloway'),
    colors: [
      { id: 'hardcover', name: 'Hardcover', swatch: 'var(--color-fg)' },
      { id: 'paperback', name: 'Paperback', swatch: 'var(--color-band)' },
    ],
    description: 'A novel of three sisters and one harbor town.',
  },
  {
    id: 'field-guide',
    name: 'Small Gardens',
    category: 'Nonfiction',
    price: 27,
    rating: 4.8,
    reviews: 311,
    image: cover('#e5d9b8', '#3b4a2c', 'Small Gardens', 'Theo Marsh'),
    colors: [{ id: 'paperback', name: 'Paperback', swatch: 'var(--color-band)' }],
    description: 'Plans for balconies, stoops and window boxes.',
  },
]

/** A bookshop: a book is the product, its formats are the swatches and its list price the old price. */
export const Bookshop: Story = {
  args: {
    copy: {
      quickAdd: 'Add to basket',
      added: 'In your basket',
      color: 'Format',
      addToCart: (name: string) => `Add ${name} to your basket`,
      rated: (rating: number) => `${rating} out of 5 stars`,
    },
  },
  render: (args) => (
    <div className="grid min-h-dvh w-full grid-cols-1 place-items-center bg-canvas p-6 sm:p-10">
      <div className="grid w-full max-w-xl grid-cols-2 gap-x-5 gap-y-8">
        {BOOKS.map((book) => (
          <ProductCard key={book.id} {...args} product={book} />
        ))}
      </div>
    </div>
  ),
}
