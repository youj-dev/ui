'use client'

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { formatPrice, MoneyContext, PRODUCT_CARD_COPY, useMoneyFormat, type Product, type ProductCardCopy } from './product-card'
import { useCatalog } from './product-grid/catalog'
import { demo, GRID_PRODUCTS, PRODUCT_GRID_COPY, type ProductGridCopy, type ProductSort } from './product-grid/data'
import { QuickView } from './product-grid/quick-view'
import { emptyMessage, errorMessage, GridSkeleton, LoadMore } from './product-grid/states'
import { Tile } from './product-grid/tile'
import { Chips, Toolbar } from './product-grid/toolbar'

/* A shop's catalog page on the editorial Product card. One row of controls on a hairline: the categories as tabs
 * with live counts, the Saved view (its count rolls), a Filters popover (price over its histogram, colors as swatches,
 * each saying what it leaves) and the sort; every filter set is a chip under it. The featured product takes a wide
 * tile in the Featured order. Cards that stop matching fade where they stand while the rest glide into the gap
 * (PresenceList); the count is announced. Every photo carries a save heart and a quick view, which flies the photo out
 * of its tile into a dialog that steps through the grid with ← and → and flies it home on close. A long catalog
 * shows a page at a time with Load more and its progress. Loading keeps the grid's shape, an error offers a retry, no
 * matches offers a way out. Reduced motion: the grid changes at once and quick view simply appears.
 *
 * Pass your `products` (categories and colors come from them), own any state the URL should hold (`category`,
 * `price`, `colors`, `sort`, `saved`, `quickView`), wire `onAdd` and `onSavedChange`; every string is in `copy`. It
 * takes the page's layout density. */

interface ProductGridProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The catalog, in its featured order. Default: the demo's five photographed products. */
  products?: Product[]
  /** The product shown wide in the Featured order (it should come first); `null` keeps every tile the same. Default: the demo's vases. */
  featured?: string | null
  /** Called to put a product in the bag, from a card's quick add or quick view; awaited. Default: a short demo wait. */
  onAdd?: (product: Product, choice: { color: string; size?: string }) => Promise<unknown> | unknown
  /** The category shown (`''` is all), controlled. */
  category?: string
  /** The category shown first, uncontrolled. Default all. */
  defaultCategory?: string
  onCategoryChange?: (category: string) => void
  /** The price range `[low, high]`, controlled; the top of the range means "and up". */
  price?: [number, number]
  /** The price range first set, uncontrolled. Default the whole range. */
  defaultPrice?: [number, number]
  onPriceChange?: (price: [number, number]) => void
  /** The top of the price range. Default: the dearest product, rounded up to 10. */
  priceMax?: number
  /** The colorway names picked, controlled. */
  colors?: string[]
  /** The colorway names picked first, uncontrolled. Default none. */
  defaultColors?: string[]
  onColorsChange?: (colors: string[]) => void
  /** The order, controlled. */
  sort?: ProductSort
  /** The order first shown, uncontrolled. Default 'featured'. */
  defaultSort?: ProductSort
  onSortChange?: (sort: ProductSort) => void
  /** The saved products' ids, controlled. */
  saved?: string[]
  /** The products saved at first, uncontrolled. Default none. */
  defaultSaved?: string[]
  onSavedChange?: (saved: string[]) => void
  /** The product in quick view (its id; `null` is closed), controlled. */
  quickView?: string | null
  /** The product in quick view at first, uncontrolled. Default none. */
  defaultQuickView?: string | null
  onQuickViewChange?: (id: string | null) => void
  /** How many products show before Load more. Default 12. */
  pageSize?: number
  /** Shows skeleton cards while the catalog loads. Default false. */
  loading?: boolean
  /** Why the catalog didn't load: shown with a retry instead of the grid. */
  error?: ReactNode
  onRetry?: () => void
  /** Replaces the "no matches" message. */
  empty?: ReactNode
  /** Draws each product instead of a Product card. */
  renderItem?: (product: Product) => ReactNode
  /** An ISO 4217 code. Default: the format around it, else 'USD'. */
  currency?: string
  /** A BCP 47 locale for prices and counts. Default: the app's (YoujProvider). */
  locale?: string
  /** Renders each product link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** The heading's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the grid's strings, to rewrite or translate. */
  copy?: Partial<ProductGridCopy>
  /** The cards' strings. */
  cardCopy?: Partial<ProductCardCopy>
}

function ProductGrid({
  theme,
  embedded = false,
  products = GRID_PRODUCTS,
  featured = 'bud-vases',
  onAdd,
  category: categoryProp,
  defaultCategory = '',
  onCategoryChange,
  price: priceProp,
  defaultPrice,
  onPriceChange,
  priceMax: priceMaxProp,
  colors: colorsProp,
  defaultColors = [],
  onColorsChange,
  sort: sortProp,
  defaultSort = 'featured',
  onSortChange,
  saved: savedProp,
  defaultSaved = [],
  onSavedChange,
  quickView: quickViewProp,
  defaultQuickView = null,
  onQuickViewChange,
  pageSize = 12,
  loading = false,
  error,
  onRetry,
  empty,
  renderItem,
  currency,
  locale,
  linkComponent: Link = 'a',
  headingLevel = 1,
  copy: copyProp,
  cardCopy,
  className,
  ...rest
}: ProductGridProps) {
  const copy = { ...PRODUCT_GRID_COPY, ...copyProp }
  const card = { ...PRODUCT_CARD_COPY, ...cardCopy }
  const money = useMoneyFormat(currency, locale)
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const { announce, announcer } = useAnnouncer()
  const statusRef = useRef<HTMLParagraphElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  // After Load more, focus moves to the first product it brought, so the keyboard carries on where the list did.
  const firstNew = useRef<number | null>(null)
  const priceMax = priceMaxProp ?? Math.max(10, Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 10) * 10)

  const [category, setCategory] = useControllableState(categoryProp, defaultCategory)
  const [price, setPrice] = useControllableState<[number, number]>(priceProp, defaultPrice ?? [0, priceMax])
  const [colors, setColors] = useControllableState(colorsProp, defaultColors)
  const [sort, setSort] = useControllableState(sortProp, defaultSort)
  const [saved, setSaved] = useControllableState(savedProp, defaultSaved)
  const [quick, setQuick] = useControllableState(quickViewProp, defaultQuickView)
  const [savedOnly, setSavedOnly] = useState(false)
  const pickCategory = (next: string) => (setCategory(next), onCategoryChange?.(next))
  const pickPrice = (next: [number, number]) => (setPrice(next), onPriceChange?.(next))
  const pickColors = (next: string[]) => (setColors(next), onColorsChange?.(next))
  const pickSort = (next: ProductSort) => (setSort(next), onSortChange?.(next))

  const save = useCallback(
    (product: Product) => {
      const on = !saved.includes(product.id)
      const next = on ? [...saved, product.id] : saved.filter((id) => id !== product.id)
      setSaved(next)
      onSavedChange?.(next)
      announce((on ? copy.savedNotice : copy.unsavedNotice)(product.name))
    },
    [saved, setSaved, onSavedChange, announce, copy.savedNotice, copy.unsavedNotice],
  )

  const [low, high] = price
  const facets = useCatalog(products, { category, price, priceMax, colors, sort, savedOnly, saved })
  const { shown } = facets

  // A page at a time: changing what's shown starts again from the first page.
  const key = `${category}|${low}|${high}|${colors.join()}|${sort}|${savedOnly}`
  const [paging, setPaging] = useState({ key, limit: pageSize })
  if (paging.key !== key) setPaging({ key, limit: pageSize })
  const visible = shown.slice(0, paging.limit)
  const wide = sort === 'featured' && visible.length > 1 ? featured : null
  useEffect(() => {
    const index = firstNew.current
    if (index === null) return
    firstNew.current = null
    const item = grid.current?.querySelector('ul')?.children[index]
    ;(item?.querySelector<HTMLElement>('a[href]') ?? item?.querySelector<HTMLElement>('button'))?.focus()
  }, [paging.limit])

  // Quick view: its buttons (to fly back to and return focus to), and the order it steps through, fixed as it opens.
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const returnFocus = useRef<HTMLElement | null>(null)
  const [order, setOrder] = useState<Product[] | null>(null)
  const register = useCallback((id: string, button: HTMLButtonElement | null) => {
    if (button) buttons.current.set(id, button)
    else buttons.current.delete(id)
  }, [])
  const view = (id: string | null) => {
    returnFocus.current = id ? (buttons.current.get(id) ?? returnFocus.current) : returnFocus.current
    setQuick(id)
    onQuickViewChange?.(id)
  }
  const openQuickView = useCallback(
    (product: Product) => {
      setOrder(shown)
      returnFocus.current = buttons.current.get(product.id) ?? null
      setQuick(product.id)
      onQuickViewChange?.(product.id)
    },
    [shown, setQuick, onQuickViewChange],
  )
  const add = useCallback(
    (product: Product, choice: { color: string; size?: string }) => Promise.resolve(onAdd ? onAdd(product, choice) : demo('ProductGrid: onAdd', 700)),
    [onAdd],
  )
  const steps = order?.some((p) => p.id === quick) ? order : shown

  const range = low > 0 || high < priceMax
  const chips = [
    ...(range
      ? [
          {
            id: 'price',
            label: `${formatPrice(low, money)} – ${formatPrice(high, money)}${high >= priceMax ? '+' : ''}`,
            onRemove: () => pickPrice([0, priceMax]),
          },
        ]
      : []),
    ...colors.map((name) => ({ id: `color-${name}`, label: name, onRemove: () => pickColors(colors.filter((c) => c !== name)) })),
  ]
  const clear = () => {
    pickPrice([0, priceMax])
    pickColors([])
    pickCategory('')
    setSavedOnly(false)
  }

  const body = error ? (
    errorMessage(copy, error, onRetry)
  ) : loading ? (
    <GridSkeleton wide={featured !== null && sort === 'featured'} />
  ) : visible.length ? (
    <PresenceList aria-label={copy.list} className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3">
      {visible.map((product) => (
        <PresenceItem key={product.id} className={cn('min-w-0', product.id === wide && 'col-span-2')}>
          {renderItem ? (
            renderItem(product)
          ) : (
            <Tile
              key={product.colors[0]?.id}
              product={product}
              wide={product.id === wide}
              saved={saved.includes(product.id)}
              onSave={save}
              onQuickView={openQuickView}
              quickViewRef={register}
              onAdd={onAdd ? add : undefined}
              copy={copy}
              cardCopy={cardCopy}
              currency={money.currency}
              locale={money.locale}
              linkComponent={Link}
            />
          )}
        </PresenceItem>
      ))}
    </PresenceList>
  ) : (
    (empty ?? emptyMessage(copy, savedOnly && !saved.length, clear))
  )

  const section = (
    <MoneyContext.Provider value={money}>
      <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
        <div className={cn('flex flex-col gap-8', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
          <div className="flex flex-col gap-3">
            {copy.eyebrow && <p className="text-ui-sm font-medium text-fg-muted">{copy.eyebrow}</p>}
            <Title id={titleId} className="max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            {copy.description && <p className="max-w-2xl text-pretty text-ui-lg text-fg-muted">{copy.description}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Toolbar
              copy={copy}
              categories={facets.categories}
              total={facets.total}
              category={category}
              onCategoryChange={pickCategory}
              savedOnly={savedOnly}
              onSavedOnlyChange={setSavedOnly}
              savedCount={saved.length}
              prices={products.map((p) => p.price)}
              priceMax={priceMax}
              price={price}
              onPriceChange={pickPrice}
              colors={facets.colors}
              picked={colors}
              onPickedChange={pickColors}
              matches={shown.length}
              sort={sort}
              onSortChange={pickSort}
              money={(value) => formatPrice(value, money)}
              locale={money.locale}
              status={loading ? copy.loading : copy.count(shown.length)}
              statusRef={statusRef}
            />
            <Chips copy={copy} chips={chips} onClear={() => (pickPrice([0, priceMax]), pickColors([]))} fallback={statusRef} />
          </div>
          {/* The products and Load more scroll in one height (the demo's at an app's size): a category, saved, more pages or none never resize the section. */}
          <div ref={grid} className="-m-1 flex h-262.25 flex-col gap-8 overflow-y-auto p-1 yj-scrollbar">
            {body}
            {!loading && !error && shown.length > visible.length && (
              <LoadMore
                copy={copy}
                shown={visible.length}
                total={shown.length}
                onLoadMore={() => {
                  firstNew.current = paging.limit
                  setPaging({ key, limit: paging.limit + pageSize })
                }}
              />
            )}
          </div>
        </div>
        {announcer}
        <QuickView
          products={steps}
          product={products.find((p) => p.id === quick) ?? null}
          onProductChange={view}
          origin={(id) => buttons.current.get(id)?.closest<HTMLElement>('[data-slot=product-card-media]') ?? null}
          returnFocus={returnFocus}
          isSaved={(id) => saved.includes(id)}
          onSave={save}
          onAdd={add}
          copy={copy}
          colorLabel={card.color}
          wasLabel={card.was}
          nowLabel={card.now}
          locale={money.locale}
          Link={Link}
        />
      </section>
    </MoneyContext.Provider>
  )
  return theme ? <ThemeScope theme={theme}>{section}</ThemeScope> : section
}

export { ProductGrid, PRODUCT_GRID_COPY }
export type { Product, ProductGridCopy, ProductGridProps, ProductSort }
