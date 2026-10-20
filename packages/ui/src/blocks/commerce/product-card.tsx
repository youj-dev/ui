'use client'

import { useEffect, useRef, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ShoppingCartIcon, StarIcon, XIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Eyebrow } from '../../components/ui/typography'
import { safeLink } from '../../lib/safe-href'
import { cn } from '../../lib/utils'
import { colorName, colorway, demo, PHOTO_PRODUCTS, productById, type Colorway, type Product } from './product-card/data'
import { ProductMedia, Swatches, type ProductMediaProps, type SwatchesProps } from './product-card/media'
import { formatPrice, Money, MoneyContext, Price, useFormatPrice, useMoneyFormat, type MoneyFormat, type PriceProps } from './product-card/money'

/* A product card for an editorial storefront grid: the photo is the card. No box around it, a 4:5 studio shot
 * with soft corners, and under it the name and price on one line, the category and rating under that, the
 * colorways at the end. Hover or keyboard focus turns the product around (its `angle` photo crossfades in) or,
 * with no other side to show, eases the shot a little closer. The swatches are a radio group: hovering one
 * previews the colorway (its own photo crossfades in when it has one), clicking or the arrow keys pick it. Quick
 * add rises in over the foot of the photo on hover or focus (always shown on touch). A product without sizes goes
 * straight to the cart through AsyncButton; one with sizes opens them in the same place first (sold-out ones
 * struck through, Escape closes them and focus returns). Reduced motion: the turn, the push-in and the color swap
 * happen at once, nothing travels.
 *
 * The catalogs, Price, Swatches, ProductMedia and the money helpers are exported for the other commerce blocks.
 * Pass your `product` (photos in `image`/`angle`, per colorway if you have them), wire `onAdd`, set
 * `currency`/`locale` and `linkComponent`; every string is in `copy`. It takes the page's layout density. */

const PRODUCT_CARD_COPY = {
  color: 'Color',
  was: 'Was',
  now: 'now',
  pickSize: 'Pick a size',
  closeSizes: 'Close sizes',
  sizesFor: (name: string) => `Sizes for ${name}`,
  soldOut: (size: string) => `${size}, sold out`,
  addSize: (size: string) => `Add ${size}`,
  chooseSize: (name: string) => `Choose a size of ${name}`,
  /** A size's text on its button; the product's `sizes` entry is the full name (screen readers read it). */
  sizeLabel: (size: string) => size.replace(/^EU /, ''),
  addToCart: (name: string) => `Add ${name} to cart`,
  quickAdd: 'Quick add',
  adding: 'Adding…',
  added: 'Added',
  addedSize: (size: string) => `Added · ${size}`,
  addError: 'Couldn’t add',
  rated: (rating: number) => `Rated ${rating} out of 5`,
  from: ' from',
  off: (percent: number) => `−${percent}%`,
}
type ProductCardCopy = typeof PRODUCT_CARD_COPY

interface ProductCardProps extends Omit<ComponentProps<'article'>, 'children'> {
  /** The product: name, price, colors, sizes, and its photos (`image`, `angle`). Default: the first photographed product. */
  product?: Product
  /** Resolve once the product is in the cart; reject to shake the button. Default: a short wait. */
  onAdd?: (product: Product, choice: { color: string; size?: string }) => Promise<unknown>
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<ProductCardCopy>
  /** An ISO 4217 code. Default: the format around it, else 'USD'. */
  currency?: string
  /** A BCP 47 locale for prices and counts. Default: the format around it, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Renders the product link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Controls over the photo's top-end corner (a save heart, a quick view), above the product link; they can reveal
   * themselves with the card's `group-hover/product` and `group-focus-within/product`. */
  actions?: ReactNode
}

function ProductCard({ product = PHOTO_PRODUCTS[0]!, onAdd = () => demo('ProductCard: onAdd', 700), copy: copyProp, currency, locale, linkComponent: Link = 'a', actions, className, ...rest }: ProductCardProps) {
  const copy = { ...PRODUCT_CARD_COPY, ...copyProp }
  const money = useMoneyFormat(currency, locale)
  const [color, setColor] = useState(product.colors[0]!.id)
  const [preview, setPreview] = useState<string>()
  const [picking, setPicking] = useState(false)
  const [added, setAdded] = useState<string | true>()
  const quick = useRef<HTMLButtonElement>(null)
  const sizesRef = useRef<HTMLDivElement>(null)
  const refocus = useRef(false)
  const titleId = `product-${product.id}`
  const shown = preview ?? color
  const way = colorway(product, shown)
  // Something to turn to: the photo's other side.
  const turns = Boolean(way.image ? way.angle : product.angle)

  // Opening the sizes moves focus to the first one in stock; closing them (or adding one) hands it back to quick add.
  useEffect(() => {
    if (picking) sizesRef.current?.querySelector<HTMLButtonElement>('[data-size-option]:not(:disabled)')?.focus()
    else if (refocus.current) quick.current?.focus()
    refocus.current = false
  }, [picking])

  const close = () => {
    refocus.current = true
    setPicking(false)
  }
  const add = async (size?: string) => {
    await onAdd(product, { color, size })
    setAdded(size ?? true)
    if (size) close()
  }

  const quickProps = {
    ref: quick,
    size: 'sm',
    variant: 'outline',
    'aria-label': product.sizes ? copy.chooseSize(product.name) : copy.addToCart(product.name),
    className: cn(
      'pointer-events-auto absolute inset-x-2 bottom-2 z-10 justify-center bg-overlay text-fg shadow-md hover:bg-overlay hover:border-line-strong',
      'translate-y-1.5 opacity-0 transition-[opacity,translate,border-color] yj-duration-base ease-enter reduced:translate-y-0',
      'group-hover/product:translate-y-0 group-hover/product:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100',
      added && 'translate-y-0 opacity-100',
    ),
    children: (
      <>
        <ShoppingCartIcon size={15} active={Boolean(added)} />
        {added ? (typeof added === 'string' ? copy.addedSize(added) : copy.added) : copy.quickAdd}
      </>
    ),
  } as const

  return (
    <MoneyContext.Provider value={money}>
      <article aria-labelledby={titleId} className={cn('group/product relative flex min-w-0 flex-col gap-3', className)} {...rest}>
        <div
          data-slot="product-card-media"
          className={cn(
            // Above the product link's cover (so quick add and the sizes take their own clicks), but see-through to the
            // pointer elsewhere, so a click on the photo still opens the product.
            'pointer-events-none relative isolate z-10 aspect-[4/5] overflow-hidden rounded-xl bg-band',
            'outline-offset-2 outline-transparent group-has-[a:focus-visible]/product:outline-2 group-has-[a:focus-visible]/product:outline-focus',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 transition-[scale] yj-duration-deliberate ease-standard reduced:transition-none',
              turns ? 'group-hover/product:scale-[1.02]' : 'group-hover/product:scale-[1.045] group-has-[a:focus-visible]/product:scale-[1.045]',
              'reduced:group-hover/product:scale-100 reduced:group-has-[a:focus-visible]/product:scale-100',
            )}
          >
            <ProductMedia product={product} color={shown} sizes="(min-width: 48rem) 22rem, 50vw" className="absolute inset-0" />
            {turns && (
              <ProductMedia
                product={product}
                color={shown}
                view="angle"
                sizes="(min-width: 48rem) 22rem, 50vw"
                className="absolute inset-0 opacity-0 transition-opacity yj-duration-slow ease-standard group-hover/product:opacity-100 group-has-[a:focus-visible]/product:opacity-100 reduced:transition-none"
              />
            )}
          </div>
          {actions && <div className="pointer-events-auto absolute end-2.5 top-2.5 z-10 flex flex-col gap-1.5">{actions}</div>}
          {(product.badge || product.compareAt) && (
            <div className="absolute start-2.5 top-2.5 flex gap-1">
              {product.badge && <Badge className="bg-overlay text-fg shadow-xs">{product.badge}</Badge>}
              {product.compareAt && (
                <Badge variant="danger" className="font-mono tabular-nums shadow-xs">
                  <span dir="ltr">{copy.off(Math.round((1 - product.price / product.compareAt) * 100))}</span>
                </Badge>
              )}
            </div>
          )}
          {picking && product.sizes ? (
            <div
              ref={sizesRef}
              role="group"
              aria-label={copy.sizesFor(product.name)}
              onKeyDown={(event) => event.key === 'Escape' && close()}
              className="yj-pop pointer-events-auto absolute inset-x-2 bottom-2 z-20 flex flex-col gap-2 rounded-lg border border-line bg-overlay p-2 shadow-md"
            >
              <div className="flex items-center justify-between gap-2 ps-1">
                <Eyebrow>{copy.pickSize}</Eyebrow>
                <Button variant="ghost" size="icon-xs" aria-label={copy.closeSizes} onClick={close}>
                  <XIcon />
                </Button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1">
                {product.sizes.map((s) => {
                  const out = product.soldOut?.includes(s)
                  return (
                    <AsyncButton
                      key={s}
                      data-size-option=""
                      size="xs"
                      variant="secondary"
                      disabled={out}
                      aria-label={out ? copy.soldOut(s) : copy.addSize(s)}
                      pendingLabel={copy.adding}
                      onAction={() => add(s)}
                      className={cn('font-mono tabular-nums', out && 'line-through')}
                    >
                      {copy.sizeLabel(s)}
                    </AsyncButton>
                  )
                })}
              </div>
            </div>
          ) : product.sizes ? (
            <Button {...quickProps} aria-expanded={false} onClick={() => setPicking(true)} />
          ) : (
            <AsyncButton {...quickProps} onAction={() => add()} pendingLabel={copy.adding} successLabel={copy.added} errorLabel={copy.addError} />
          )}
        </div>
        {/* A narrow card (two to a row on a phone) puts the price under the name and drops the review count. */}
        <div className="@container/details flex flex-col gap-1 px-0.5">
          <div className="flex flex-col gap-0.5 @[15rem]/details:flex-row @[15rem]/details:items-baseline @[15rem]/details:justify-between @[15rem]/details:gap-3">
            <h2 id={titleId} className="min-w-0 text-ui-lg font-medium tracking-tight text-fg @[15rem]/details:truncate">
              <Link href={safeLink(product.href) ?? `#${product.id}`} className="outline-none after:absolute after:inset-0">
                {product.name}
              </Link>
            </h2>
            <Price value={product.price} compareAt={product.compareAt} wasLabel={copy.was} nowLabel={copy.now} />
          </div>
          <div className="flex min-h-6 items-center justify-between gap-2 text-ui-sm text-fg-muted">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{product.category}</span>
              <span aria-hidden className="text-fg-subtle">·</span>
              <span className="flex shrink-0 items-center gap-1 tabular-nums">
                <StarIcon size={11} aria-hidden className="fill-current text-fg" />
                <span className="sr-only">{copy.rated(product.rating)}</span>
                <span aria-hidden>{product.rating}</span>
                <span className="hidden @[15rem]/details:inline">
                  <span className="sr-only">{copy.from}</span> ({product.reviews.toLocaleString(money.locale)})
                </span>
              </span>
            </span>
            {product.colors.length > 1 && (
              <span className="-me-1 flex shrink-0 items-center gap-1">
                <span className="hidden truncate @[13rem]/details:inline">{colorName(product, shown)}</span>
                <Swatches product={product} value={color} onValueChange={setColor} onPreview={setPreview} label={copy.color} />
              </span>
            )}
          </div>
        </div>
      </article>
    </MoneyContext.Provider>
  )
}

export { colorName, formatPrice, Money, MoneyContext, PHOTO_PRODUCTS, Price, PRODUCT_CARD_COPY, ProductCard, ProductMedia, productById, Swatches, useFormatPrice, useMoneyFormat }
export type { Colorway, MoneyFormat, PriceProps, Product, ProductCardCopy, ProductCardProps, ProductMediaProps, SwatchesProps }
