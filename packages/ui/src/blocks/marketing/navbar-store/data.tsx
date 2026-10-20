import type { MouseEventHandler, ReactNode } from 'react'
import { GiftArt, SunArt, VesselsArt, WeaveArt } from './art'

/** A link in a department's columns, the utility bar or the drawer. */
export interface NavbarStoreLink {
  label: string
  href: string
}

/** A titled column of a department's links. */
export interface NavbarStoreGroup {
  title: string
  links: NavbarStoreLink[]
}

/** A picture tile in a department's menu: a collection, an edit, a campaign. */
export interface NavbarStoreCollection {
  label: string
  href: string
  /** One line under the label. */
  description?: string
  /** The tile's picture. Default: a drawn cover. */
  media?: ReactNode
}

/** A department: a menu of columns and collection tiles (`groups`), or a plain link (`href`). */
export interface NavbarStoreDepartment {
  label: string
  href?: string
  groups?: NavbarStoreGroup[]
  collections?: NavbarStoreCollection[]
  /** Set in the accent colour: a sale, a drop. */
  highlight?: boolean
}

/** A place the store ships to, with the currency it prices in (ISO 4217). */
export interface NavbarStoreRegion {
  id: string
  label: string
  currency: string
}

/** A product the search can suggest. */
export interface NavbarStoreProduct {
  id: string
  name: string
  href: string
  /** In the region's currency. */
  price: number
  category?: string
  /** A small square picture. */
  media?: ReactNode
}

/** What a search ends on: a product, or the results page for a query. */
export type NavbarStoreSearchResult = { kind: 'product'; product: NavbarStoreProduct; href: string } | { kind: 'query'; query: string; href: string }

/** The bar above the header: a short promise, and where it leads. */
export interface NavbarStorePromo {
  label: string
  href?: string
  /** The link's own words after the promise. */
  cta?: string
}

/** The bag on the bar: where it goes and how much is in it. */
export interface NavbarStoreBag {
  href: string
  count: number
  /** Open your mini cart here instead (call `event.preventDefault()` to stay on the page). */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** The store's name, mark and home link. */
export interface NavbarStoreBrand {
  name: string
  logo?: ReactNode
  href?: string
}

export const DEPARTMENTS: NavbarStoreDepartment[] = [
  {
    label: 'Clothing',
    groups: [
      { title: 'Shop', links: [{ label: 'New arrivals', href: '#clothing/new' }, { label: 'Knitwear', href: '#clothing/knitwear' }, { label: 'Shirts', href: '#clothing/shirts' }, { label: 'Outerwear', href: '#clothing/outerwear' }, { label: 'Trousers', href: '#clothing/trousers' }] },
      { title: 'Fit', links: [{ label: 'Relaxed', href: '#clothing/relaxed' }, { label: 'Tailored', href: '#clothing/tailored' }, { label: 'Size guide', href: '#size-guide' }] },
    ],
    collections: [
      { label: 'The linen edit', href: '#edit/linen', description: 'Washed, breathable, made to crease.', media: <WeaveArt /> },
      { label: 'Autumn, early', href: '#edit/autumn', description: 'Layers for the first cold mornings.', media: <SunArt /> },
    ],
  },
  {
    label: 'Home',
    groups: [
      { title: 'Rooms', links: [{ label: 'Kitchen', href: '#home/kitchen' }, { label: 'Table', href: '#home/table' }, { label: 'Bath', href: '#home/bath' }, { label: 'Bedroom', href: '#home/bedroom' }] },
      { title: 'Makers', links: [{ label: 'Studio ceramics', href: '#makers/ceramics' }, { label: 'Woodwork', href: '#makers/wood' }, { label: 'Textiles', href: '#makers/textiles' }] },
    ],
    collections: [
      { label: 'Objects for the table', href: '#edit/table', description: 'Stoneware glazed by hand in Porto.', media: <VesselsArt /> },
      { label: 'Gifts under 50', href: '#edit/gifts', description: 'Wrapped and ready to send.', media: <GiftArt /> },
    ],
  },
  { label: 'Journal', href: '#journal' },
  { label: 'Sale', href: '#sale', highlight: true },
]

export const REGIONS: NavbarStoreRegion[] = [
  { id: 'us', label: 'United States', currency: 'USD' },
  { id: 'gb', label: 'United Kingdom', currency: 'GBP' },
  { id: 'eu', label: 'European Union', currency: 'EUR' },
  { id: 'jp', label: 'Japan', currency: 'JPY' },
]

export const PRODUCTS: NavbarStoreProduct[] = [
  { id: 'linen-shirt', name: 'Washed linen shirt', href: '#p/linen-shirt', price: 98, category: 'Shirts', media: <WeaveArt /> },
  { id: 'merino-crew', name: 'Merino crew knit', href: '#p/merino-crew', price: 145, category: 'Knitwear', media: <SunArt /> },
  { id: 'stoneware-mug', name: 'Stoneware mug, ash glaze', href: '#p/stoneware-mug', price: 32, category: 'Table', media: <VesselsArt /> },
  { id: 'carafe', name: 'Water carafe', href: '#p/carafe', price: 58, category: 'Table', media: <VesselsArt /> },
  { id: 'gift-card', name: 'Gift card', href: '#p/gift-card', price: 50, category: 'Gifts', media: <GiftArt /> },
  { id: 'linen-throw', name: 'Linen throw', href: '#p/linen-throw', price: 120, category: 'Bedroom', media: <WeaveArt /> },
]

export const POPULAR = ['linen', 'stoneware', 'merino', 'gift card']

export const UTILITY_LINKS: NavbarStoreLink[] = [
  { label: 'Help', href: '#help' },
  { label: 'Stores', href: '#stores' },
]

export const PROMO: NavbarStorePromo = { label: 'Free shipping over 75, returns within 30 days.', href: '#shipping', cta: 'Details' }

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-fg">
      <path d="M4 18 V7 L12 13 L20 7 V18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const BRAND: NavbarStoreBrand = { name: 'Marlowe', logo: <Logo />, href: '#home' }

export const BAG: NavbarStoreBag = { href: '#bag', count: 2 }

export const DEFAULT_COPY = {
  navLabel: 'Departments',
  utilityLabel: 'Store',
  /** The region menu's button, given the region and its currency. */
  region: (label: string, currency: string) => `${label} ${currency}, change region`,
  regionTitle: 'Ship to',
  searchLabel: 'Search the store',
  searchPlaceholder: 'Search products…',
  popular: 'Popular',
  products: 'Products',
  /** The row that opens every result for a query. */
  allResults: (query: string) => `See all results for “${query}”`,
  noResults: 'Nothing matches. Try another word.',
  account: 'Account',
  /** The bag link's name, given how many items are in it. */
  bag: (count: number) => `Bag (${count})`,
  menu: 'Menu',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  /** The first stop for the keyboard: jumps past the bar to the page's content. */
  skipLink: 'Skip to content',
}

export type NavbarStoreCopy = typeof DEFAULT_COPY
