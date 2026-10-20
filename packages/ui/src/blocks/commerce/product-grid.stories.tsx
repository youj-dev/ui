import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { Product } from './product-card'
import { ProductGrid, type ProductGridProps } from './product-grid'

const meta: Meta<typeof ProductGrid> = {
  title: 'Blocks/Commerce/Product grid',
  component: ProductGrid,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'A shop’s catalog on real photographs: category tabs with live counts, a Saved view, filters with chips, a wide featured tile, and a quick view whose photo flies out of its tile and back.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProductGrid>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <ProductGrid {...args} />
    </div>
  ),
}

/** Quick view opens on the Ridge Kettle a moment after the grid: the photo flies out of its tile. ← and → step through the grid. */
function OpensQuickView(args: ProductGridProps) {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setId('ridge-kettle'), 900)
    return () => clearTimeout(timer)
  }, [])
  return <ProductGrid {...args} quickView={id} onQuickViewChange={setId} />
}

export const QuickView: Story = {
  name: 'Quick view',
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <OpensQuickView {...args} />
    </div>
  ),
}

const P = '/blocks/products'

/** A homeware shop's own catalog, in euros. */
const LADEN: Product[] = [
  {
    id: 'kessel',
    name: 'Kessel',
    category: 'Kessel',
    price: 119,
    rating: 4.8,
    reviews: 940,
    image: `${P}/kettle-sage.webp`,
    angle: `${P}/kettle-sage-side.webp`,
    colors: [
      { id: 'salbei', name: 'Salbei', swatch: 'oklch(0.8 0.05 135)' },
      { id: 'rose', name: 'Rosé', swatch: 'oklch(0.79 0.06 15)', image: `${P}/kettle-rose.webp`, angle: `${P}/kettle-rose-side.webp` },
    ],
    description: 'Emaille auf Stahl, für jedes Kochfeld.',
  }, // youj-allow: the products' own enamel
  {
    id: 'teeservice',
    name: 'Teeservice',
    category: 'Tee',
    price: 169,
    rating: 4.9,
    reviews: 288,
    badge: 'Neu',
    image: `${P}/tea-set.webp`,
    colors: [{ id: 'hafer', name: 'Hafer', swatch: 'oklch(0.9 0.025 85)' }],
    description: 'Kessel, Dose und drei Becher auf einem Nussbaumtablett.',
  }, // youj-allow: the product's own glaze
  {
    id: 'floetenkessel',
    name: 'Flötenkessel',
    category: 'Kessel',
    price: 89,
    compareAt: 109,
    rating: 4.7,
    reviews: 1240,
    image: `${P}/kettle-cream.webp`,
    angle: `${P}/kettle-cream-side.webp`,
    colors: [{ id: 'creme', name: 'Creme', swatch: 'oklch(0.94 0.015 85)' }],
    description: 'Ein Flötenkessel mit kühlem Griff aus Nussbaum.',
  }, // youj-allow: the product's own enamel
  {
    id: 'becher',
    name: 'Becher',
    category: 'Tassen',
    price: 19,
    rating: 4.8,
    reviews: 3020,
    sizes: ['300 ml', '450 ml'],
    image: `${P}/mug.webp`,
    colors: [{ id: 'weiss', name: 'Weiß', swatch: 'oklch(0.97 0.003 250)' }],
    description: 'Porzellan, spülmaschinenfest.',
  }, // youj-allow: the product's own glaze
  {
    id: 'vasen',
    name: 'Knospenvasen',
    category: 'Vasen',
    price: 42,
    rating: 4.6,
    reviews: 157,
    image: `${P}/bud-vases.webp`,
    colors: [{ id: 'kreide', name: 'Kreide', swatch: 'oklch(0.9 0.008 80)' }],
    description: 'Unglasiertes Steinzeug, von Hand gedreht.',
  }, // youj-allow: the product's own glaze
]

/** With your data: a German shop's catalog in euros, every tile the same size, four to a page, and adds, saves and filters in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    products: LADEN,
    featured: null,
    currency: 'EUR',
    locale: 'de-DE',
    pageSize: 4,
    defaultSaved: ['teeservice'],
    copy: {
      eyebrow: 'Laden',
      title: 'Küche & Tisch',
      description: 'Handgemacht in kleinen Serien, fotografiert in einem Studio.',
      all: 'Alle',
      saved: 'Gemerkt',
      filters: 'Filter',
      sortBy: 'Sortieren',
      count: (n: number) => `${n} Produkte`,
      showing: (shown: number, total: number) => `${shown} von ${total}`,
      loadMore: 'Mehr laden',
      addToBag: 'In den Korb',
    },
    cardCopy: { quickAdd: 'In den Korb', added: 'Im Korb', color: 'Farbe' },
    onAdd: fn(async () => {}),
    onSavedChange: fn(),
    onCategoryChange: fn(),
    onSortChange: fn(),
    onQuickViewChange: fn(),
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <ProductGrid {...args} />
    </div>
  ),
}

/** The catalog is still on its way: skeleton cards hold the grid's shape, the wide tile included. */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <ProductGrid {...args} />
    </div>
  ),
}

/** The catalog didn't load: the reason, and a retry. */
export const LoadError: Story = {
  name: 'Error',
  args: { error: 'The catalog service didn’t answer in time.', onRetry: fn() },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <ProductGrid {...args} />
    </div>
  ),
}
