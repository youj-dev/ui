import { useMemo } from 'react'
import type { Product } from '../product-card'
import type { ProductSort } from './data'

/* What the grid shows for the filters set, and what every other choice would leave: each filter's counts come from
 * the others, so a tab or a swatch says what picking it would leave. */

interface CatalogFilters {
  category: string
  price: [number, number]
  /** The top of the price range, which means "and up". */
  priceMax: number
  colors: string[]
  sort: ProductSort
  /** Only the saved products. */
  savedOnly: boolean
  saved: string[]
}

const SORTERS: Record<ProductSort, ((a: Product, b: Product) => number) | null> = {
  featured: null,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
}

export function useCatalog(products: Product[], { category, price, priceMax, colors, sort, savedOnly, saved }: CatalogFilters) {
  const [low, high] = price
  return useMemo(() => {
    const inPrice = (p: Product) => p.price >= low && (high >= priceMax || p.price <= high)
    const inColors = (p: Product) => !colors.length || p.colors.some((c) => colors.includes(c.name))
    const inSaved = (p: Product) => !savedOnly || saved.includes(p.id)
    const inCategory = (p: Product) => !category || p.category === category
    const base = products.filter((p) => inPrice(p) && inColors(p) && inSaved(p))
    const categories = [...new Set(products.map((p) => p.category))].map((c) => ({
      value: c,
      label: c,
      count: base.filter((p) => p.category === c).length,
    }))
    const swatches = new Map<string, string>()
    for (const p of products) for (const c of p.colors) if (!swatches.has(c.name)) swatches.set(c.name, c.swatch)
    const others = products.filter((p) => inPrice(p) && inSaved(p) && inCategory(p))
    const colorFacets = [...swatches].map(([name, swatch]) => ({
      value: name,
      label: name,
      swatch,
      count: others.filter((p) => p.colors.some((c) => c.name === name)).length,
    }))
    // With a color picked, a product leads with the colorway that matched, so its photo shows what was asked for.
    const list = base.filter(inCategory).map((p) => {
      const lead = colors.length ? p.colors.find((c) => colors.includes(c.name)) : undefined
      return lead && lead !== p.colors[0] ? { ...p, colors: [lead, ...p.colors.filter((c) => c !== lead)] } : p
    })
    const by = SORTERS[sort]
    return { total: base.length, categories, colors: colorFacets, shown: by ? [...list].sort(by) : list }
  }, [products, low, high, priceMax, colors, savedOnly, saved, category, sort])
}
