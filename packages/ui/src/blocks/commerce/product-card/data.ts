/** A colorway as a storefront shows it: its id, name and swatch color, and its own photos when it has them. */
interface Colorway {
  id: string
  name: string
  swatch: string
  /** This colorway's photo; picking the swatch crossfades to it. Default: the product's `image`. */
  image?: string
  /** This colorway from its other side, for the hover turn. Default: the product's `angle`. */
  angle?: string
}

interface Product {
  id: string
  name: string
  /** A photo's URL: it pictures the product (a colorway's own `image` wins). */
  image?: string
  /** The product from its other side; hover and keyboard focus turn to it. */
  angle?: string
  /** Where the product sits in its photos, in percent from the top start: a crop of another shape keeps it in frame. Default `[50, 50]`. */
  focus?: readonly [number, number]
  /** The product's page. Default `#<id>`. */
  href?: string
  category: string
  price: number
  compareAt?: number
  rating: number
  reviews: number
  badge?: string
  /** The colorways it's sold in; the first is the default. */
  colors: Colorway[]
  sizes?: string[]
  /** Sizes out of stock right now. */
  soldOut?: string[]
  description: string
}

/** Where the demo's photos are served from: the Youj site, so a copied block shows them in any app. Pass your own URLs in `image`. */
const PHOTOS = 'https://www.youj.dev/blocks/products'

/** A photographed shop: kitchen and table goods shot in one grey studio (credits in the docs' public/blocks/products). */
const PHOTO_PRODUCTS: Product[] = [
  {
    id: 'ridge-kettle',
    name: 'Ridge Kettle',
    category: 'Kettles',
    price: 129,
    rating: 4.8,
    reviews: 1204,
    badge: 'New',
    image: `${PHOTOS}/kettle-sage.webp`,
    angle: `${PHOTOS}/kettle-sage-side.webp`,
    colors: [
      { id: 'sage', name: 'Sage', swatch: 'oklch(0.8 0.05 135)' }, // youj-allow: the product's own enamel, fixed like its photo
      { id: 'rose', name: 'Rose', swatch: 'oklch(0.79 0.06 15)', image: `${PHOTOS}/kettle-rose.webp`, angle: `${PHOTOS}/kettle-rose-side.webp` }, // youj-allow: the product's own enamel
      { id: 'sky', name: 'Sky', swatch: 'oklch(0.79 0.06 225)', image: `${PHOTOS}/kettle-sky.webp`, angle: `${PHOTOS}/kettle-sky-side.webp` }, // youj-allow: the product's own enamel
    ],
    sizes: ['1.2 l', '1.8 l'],
    soldOut: ['1.8 l'],
    description: 'Enamelled steel on a soft-touch handle, for every hob including induction. Whistles politely.',
  },
  {
    id: 'ritual-tea-set',
    name: 'Ritual Tea Set',
    category: 'Tea',
    price: 184,
    rating: 4.9,
    reviews: 312,
    badge: 'Bestseller',
    image: `${PHOTOS}/tea-set.webp`,
    colors: [{ id: 'oat', name: 'Oat', swatch: 'oklch(0.9 0.025 85)' }], // youj-allow: the product's own glaze
    description: 'A kettle, a caddy and three speckled cups on a walnut tray, glazed in small batches.',
  },
  {
    id: 'bud-vases',
    name: 'Bud Vases, set of three',
    category: 'Vases',
    price: 48,
    rating: 4.6,
    reviews: 157,
    image: `${PHOTOS}/bud-vases.webp`,
    colors: [{ id: 'chalk', name: 'Chalk', swatch: 'oklch(0.9 0.008 80)' }], // youj-allow: the product's own glaze
    description: 'Unglazed stoneware, thrown by hand. Made for a single stem each.',
  },
  {
    id: 'hearth-kettle',
    name: 'Hearth Kettle',
    category: 'Kettles',
    price: 98,
    compareAt: 118,
    rating: 4.7,
    reviews: 842,
    image: `${PHOTOS}/kettle-cream.webp`,
    angle: `${PHOTOS}/kettle-cream-side.webp`,
    colors: [{ id: 'cream', name: 'Cream', swatch: 'oklch(0.94 0.015 85)' }], // youj-allow: the product's own enamel
    description: 'A stovetop whistler with a walnut grip that stays cool, on a body that holds 2 litres.',
  },
  {
    id: 'daily-mug',
    name: 'Daily Mug',
    category: 'Cups',
    price: 22,
    rating: 4.7,
    reviews: 2310,
    image: `${PHOTOS}/mug.webp`,
    // The handle sits left of the photo's middle: a portrait crop centered on the cup keeps it whole.
    focus: [44, 50],
    colors: [{ id: 'white', name: 'White', swatch: 'oklch(0.97 0.003 250)' }], // youj-allow: the product's own glaze
    sizes: ['300 ml', '450 ml'],
    description: 'Porcelain that keeps coffee hot and fits the hand. Dishwasher and microwave safe.',
  },
]

/** A product by id. */
const productById = (id: string) => PHOTO_PRODUCTS.find((p) => p.id === id)!

/** A product's colorway for an id or name, else its first. */
const colorway = (product: Product, color?: string) => product.colors.find((c) => c.id === color || c.name === color) ?? product.colors[0]!

/** A colorway's name, from its id (or name). */
const colorName = (product: Product, color: string) =>
  product.colors.find((c) => c.id === color || c.name === color)?.name ?? color

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export { colorName, colorway, demo, PHOTO_PRODUCTS, productById }
export type { Colorway, Product }
