import { productById, type Product } from '../product-card'

type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'rating'

/** The filters a shopper can set: the category tab, a price range `[low, high]` and colorway names. */
interface ProductFilters {
  category: string
  price: [number, number]
  colors: string[]
}

/** English's one or other: the copy picks its word with the language's plural rules. */
const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

/** The demo's shop, in its featured order: the photographed products, the vases first (shown wide). */
const GRID_PRODUCTS: Product[] = ['bud-vases', 'ridge-kettle', 'ritual-tea-set', 'hearth-kettle', 'daily-mug'].map(productById)

const PRODUCT_GRID_COPY = {
  eyebrow: 'The shop',
  title: 'Kitchen & table',
  description: 'Kettles, cups and vases, made in small batches and shot in one studio.',
  categories: 'Categories',
  all: 'All',
  filters: 'Filters',
  /** The filters button's name with the number set: "Filters, 2 set". */
  filtersSet: (count: number) => `Filters, ${count} set`,
  price: 'Price',
  minPrice: 'Minimum price',
  maxPrice: 'Maximum price',
  color: 'Color',
  clearFilters: 'Clear filters',
  clearAll: 'Clear all',
  /** The popover's button, with the matches the filters leave. */
  showResults: (count: number) => `Show ${count} ${plural(count, 'product', 'products')}`,
  activeFilters: 'Active filters',
  removeFilter: (label: string) => `Remove ${label}`,
  sortBy: 'Sort by',
  sorts: { featured: 'Featured', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', rating: 'Top rated' } as Record<
    ProductSort,
    string
  >,
  saved: 'Saved',
  /** A heart's name; it's a toggle, so whether it's saved is its pressed state. */
  save: (name: string) => `Save ${name}`,
  savedNotice: (name: string) => `${name} saved`,
  unsavedNotice: (name: string) => `${name} removed from saved`,
  quickView: (name: string) => `Quick view: ${name}`,
  count: (count: number) => `${count} ${plural(count, 'product', 'products')}`,
  showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
  loadMore: 'Load more',
  loading: 'Loading products',
  list: 'Products',
  emptyTitle: 'Nothing matches those filters',
  emptyDescription: 'Widen the price range or try another color.',
  savedEmptyTitle: 'Nothing saved yet',
  savedEmptyDescription: 'Tap the heart on anything you like and it waits for you here.',
  showAll: 'Show everything',
  errorTitle: 'The products didn’t load',
  retry: 'Try again',
  // Quick view
  close: 'Close',
  previous: 'Previous product',
  next: 'Next product',
  position: (index: number, total: number) => `${index} of ${total}`,
  views: 'Views',
  front: 'Front',
  side: 'Side',
  size: 'Size',
  soldOut: (size: string) => `${size}, sold out`,
  pickSize: 'Pick a size',
  addToBag: 'Add to bag',
  adding: 'Adding…',
  added: 'Added to bag',
  addError: 'Couldn’t add it',
  details: 'View full details',
  reviews: (count: string) => `(${count})`,
  rated: (rating: number) => `Rated ${rating} out of 5`,
}
type ProductGridCopy = typeof PRODUCT_GRID_COPY

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

export { demo, GRID_PRODUCTS, PRODUCT_GRID_COPY }
export type { ProductFilters, ProductGridCopy, ProductSort }
