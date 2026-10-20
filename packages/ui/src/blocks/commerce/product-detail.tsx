'use client'

import { createElement, Fragment, useId, useState, type ComponentProps, type ComponentType, type ElementType, type ReactNode } from 'react'
import { HeartIcon, RotateCcwIcon, RulerIcon, ShoppingCartIcon, StarIcon, StoreIcon, TruckIcon } from '@youj/icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent } from '../../components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselThumb, CarouselThumbs } from '../../components/ui/carousel'
import { Field, FieldLabel } from '../../components/ui/field'
import { NumberInput } from '../../components/ui/number-input'
import { Toggle } from '../../components/ui/toggle'
import { Eyebrow } from '../../components/ui/typography'
import { cn } from '../../lib/utils'
import { colorName, formatPrice, MoneyContext, Price, productById, ProductMedia, Swatches, useMoneyFormat, type Product } from './product-card'
import { type RenderView } from './product-render'

/* A product page. The gallery is a Carousel (swipe, arrows, arrow keys) of
 * the product from the front, from its other side and close up, with
 * thumbnails whose indicator glides to the current one. Picking a color
 * re-tints every shot and thumbnail in place on the slow token, so you see
 * the colorway from every angle without leaving the one you're on. Sizes
 * are a native radio group laid out as a grid, sold-out ones struck through
 * and skipped. Quantity is a NumberInput, and Add to cart carries the
 * request through Button onAction while the cart icon takes the parcel in.
 * Delivery, pickup and returns sit in a small panel under it, with the
 * delivery day worked out from `today`. Reduced motion: the gallery jumps and
 * colors change at once.
 *
 * Pass your `product` (its photos in `image` and `angle`), its
 * `perks` and `sections`, `currency` and `locale`, and wire
 * `onAddToCart` and `onSave`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

const VIEWS: RenderView[] = ['front', 'angle', 'detail']

const PRODUCT_DETAIL_COPY = {
  breadcrumb: 'Shop',
  photos: (name: string) => `${name} photos`,
  views: { front: 'from the front', angle: 'from the other side', detail: 'close up' } as Record<RenderView, string>,
  slide: (name: string, color: string, view: string, n: number, total: number) => `${name} in ${color}, ${view}, ${n} of ${total}`,
  thumb: (name: string, view: string) => `${name}, ${view}`,
  rated: (rating: number) => `Rated ${rating} out of 5`,
  reviews: (count: string) => `${count} reviews`,
  each: (price: string) => `${price} each`,
  was: 'Was',
  now: 'now',
  color: 'Color',
  size: 'Size',
  sizeGuide: 'Size guide',
  soldOut: (size: string) => `${size}, sold out`,
  quantity: 'Quantity',
  addToCart: 'Add to cart',
  adding: 'Adding…',
  added: 'Added to cart',
  addError: 'Couldn’t add it',
  save: 'Save for later',
  freeDelivery: 'Free delivery',
  arrives: (day: string) => `Arrives by ${day}`,
  pickUp: 'Pick up in store',
  pickUpDetail: 'Ready in 2 hours at Mission Street',
  returns: 'Free returns',
  returnsDetail: 'Send it back within 30 days, no questions',
  details: 'Details',
  detailsBody: 'Designed in Copenhagen, made in Portugal, and covered by a two-year warranty.',
  shipping: 'Shipping',
  shippingBody: 'Standard delivery is free and takes 2–4 working days. Next-day delivery is $12.',
  returnsTitle: 'Returns',
  returnsBody: 'Changed your mind? Send it back within 30 days for a full refund. The return label is on us.',
}
type ProductDetailCopy = typeof PRODUCT_DETAIL_COPY

/** A line in the delivery panel. */
interface ProductPerk {
  icon: ComponentType<{ size?: number }>
  title: string
  detail: string
}

/** A fold under the panel. */
interface ProductSection {
  id: string
  title: string
  body: ReactNode
}

/** The demo's today: deliveries are counted from it. */
const TODAY = new Date(2026, 9, 1).getTime()

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/** The weekday a standard delivery arrives: `days` working days from today. */
function arrivesBy(days: number, today: Date | number, locale: string) {
  const date = new Date(today)
  for (let left = days; left > 0; ) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() % 6) left--
  }
  return date.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })
}

interface SizesProps {
  product: Product
  value?: string
  onValueChange: (size: string) => void
  copy: ProductDetailCopy
  sizeGuideHref: string | null
  Link: ElementType
}

function Sizes({ product, value, onValueChange, copy, sizeGuideHref, Link }: SizesProps) {
  const name = useId()
  const labelId = useId()
  if (!product.sizes) return null
  return (
    <fieldset aria-labelledby={labelId} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow id={labelId}>{copy.size}</Eyebrow>
        {sizeGuideHref !== null && (
          <Link href={sizeGuideHref} className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-ui-sm text-fg-muted hover:text-fg">
            <RulerIcon size={14} /> {copy.sizeGuide}
          </Link>
        )}
      </div>
      <div className={cn('grid gap-1.5', product.sizes.length > 3 ? 'grid-cols-4' : 'grid-cols-3')}>
        {product.sizes.map((s) => {
          const out = product.soldOut?.includes(s) ?? false
          return (
            <label
              key={s}
              className={cn(
                'relative grid h-control cursor-pointer place-items-center rounded-lg border border-line bg-canvas font-mono text-ui text-fg tabular-nums transition-[background-color,border-color,color] yj-duration-fast ease-standard',
                'hover:bg-hover has-checked:border-fg has-checked:bg-fg has-checked:text-canvas has-focus-visible:ring-2 has-focus-visible:ring-focus has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-canvas',
                out && 'cursor-not-allowed text-fg-muted line-through decoration-line-strong hover:bg-canvas',
              )}
            >
              <input type="radio" name={name} value={s} checked={value === s} disabled={out} onChange={() => onValueChange(s)} className="sr-only" aria-label={out ? copy.soldOut(s) : s} />
              {s}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface ProductDetailProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** The product; required in practice. Default: a sample kettle (swap in yours). */
  product?: Product
  /** Resolve once the line is in the cart; reject to shake the button. `color` is the colorway's id. Default: a short demo wait. */
  onAddToCart?: (line: { product: Product; color: string; size?: string; quantity: number }) => Promise<unknown>
  /** Hears "Save for later" being turned on or off. */
  onSave?: (product: Product, saved: boolean) => void
  /** The trail above the title, as links. Default: Shop › the product's category. */
  breadcrumbs?: { label: string; href: string }[]
  /** The size guide's page; `null` hides the link. Default '#size-guide'. */
  sizeGuideHref?: string | null
  /** The delivery panel's lines. Default: free delivery (arriving three working days from `today`), pickup and returns. */
  perks?: ProductPerk[]
  /** The folds at the foot. Default: details, shipping and returns. */
  sections?: ProductSection[]
  /** Today, for the delivery day. Default: the demo's day. */
  today?: Date | number
  /** An ISO 4217 code. Default 'USD'. */
  currency?: string
  /** A BCP 47 locale for prices, dates and counts. Default 'en-US'. */
  locale?: string
  /** Renders breadcrumb and size-guide links, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<ProductDetailCopy>
}

function ProductDetail({
  product = productById('ridge-kettle'),
  onAddToCart = () => demo('ProductDetail: onAddToCart', 900),
  onSave,
  breadcrumbs,
  sizeGuideHref = '#size-guide',
  perks,
  sections,
  today = TODAY,
  currency,
  locale,
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: ProductDetailProps) {
  const copy = { ...PRODUCT_DETAIL_COPY, ...copyProp }
  const money = useMoneyFormat(currency, locale)
  const [slide, setSlide] = useState(0)
  const [color, setColor] = useState(product.colors[0]!.id)
  const [size, setSize] = useState(product.sizes?.find((s) => !product.soldOut?.includes(s)))
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [saved, setSaved] = useState(false)
  const name = colorName(product, color)
  const trail = breadcrumbs ?? [
    { label: copy.breadcrumb, href: '#shop' },
    { label: product.category, href: `#${product.category.toLowerCase()}` },
  ]
  const lines = perks ?? [
    { icon: TruckIcon, title: copy.freeDelivery, detail: copy.arrives(arrivesBy(3, today, money.locale)) },
    { icon: StoreIcon, title: copy.pickUp, detail: copy.pickUpDetail },
    { icon: RotateCcwIcon, title: copy.returns, detail: copy.returnsDetail },
  ]
  const folds = sections ?? [
    { id: 'details', title: copy.details, body: `${product.description} ${copy.detailsBody}` },
    { id: 'shipping', title: copy.shipping, body: copy.shippingBody },
    { id: 'returns', title: copy.returnsTitle, body: copy.returnsBody },
  ]
  const crumb = Link === 'a' ? undefined : createElement(Link)

  return (
    <MoneyContext.Provider value={money}>
      <section aria-labelledby="product-title" className={cn('bg-canvas py-8 md:py-12', className)} {...rest}>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              {trail.map((c) => (
                <Fragment key={c.href}>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={c.href} render={crumb}>
                      {c.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
            <Carousel onSlideChange={setSlide} aria-label={copy.photos(product.name)} className="group/gallery self-start overflow-hidden rounded-xl border border-line bg-surface shadow-xs md:sticky md:top-6">
              <CarouselContent className="ms-0">
                {VIEWS.map((v, i) => (
                  <CarouselItem key={v} aria-label={copy.slide(product.name, name, copy.views[v], i + 1, VIEWS.length)} className="aspect-square ps-0">
                    <ProductMedia product={product} color={color} view={v} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="start-3 opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
              <CarouselNext className="end-3 opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" />
              <Badge variant="secondary" className="absolute end-3 top-3 font-mono tabular-nums">
                {slide + 1} / {VIEWS.length}
              </Badge>
              <CarouselThumbs className="border-t border-line bg-surface p-2.5">
                {VIEWS.map((v, i) => (
                  <CarouselThumb key={v} index={i} aria-label={copy.thumb(product.name, copy.views[v])} className="size-16 overflow-hidden border border-line sm:size-18">
                    <ProductMedia product={product} color={color} view={v} />
                  </CarouselThumb>
                ))}
              </CarouselThumbs>
            </Carousel>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {product.badge && (
                    <Badge variant="success">
                      <BadgeDot />
                      {product.badge}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                    {/* Plain stars in the warning ink, not the interactive rating's keys: this one is only read. */}
                    <span role="img" aria-label={copy.rated(product.rating)} className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} size={13} aria-hidden className={cn('fill-current', n <= Math.round(product.rating) ? 'text-warning' : 'text-line-strong')} />
                      ))}
                    </span>
                    <span className="font-mono tabular-nums">{product.rating}</span>· {copy.reviews(product.reviews.toLocaleString(money.locale))}
                  </span>
                </div>
                <h1 id="product-title" className="text-3xl font-semibold tracking-tight text-balance text-fg">
                  {product.name}
                </h1>
                <p className="text-ui-lg text-pretty text-fg-muted">{product.description}</p>
              </div>
              <div className="flex items-baseline gap-2.5">
                <Price size="lg" value={product.price * quantity} compareAt={product.compareAt && product.compareAt * quantity} wasLabel={copy.was} nowLabel={copy.now} />
                {quantity > 1 && <span className="font-mono text-ui text-fg-muted tabular-nums">{copy.each(formatPrice(product.price, money))}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <Eyebrow>{copy.color}</Eyebrow>
                  <span className="text-ui-sm text-fg">{name}</span>
                </div>
                <Swatches product={product} value={color} onValueChange={setColor} size="lg" className="-ms-1" label={copy.color} />
              </div>

              <Sizes product={product} value={size} onValueChange={setSize} copy={copy} sizeGuideHref={sizeGuideHref} Link={Link} />

              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-28">
                  <FieldLabel>{copy.quantity}</FieldLabel>
                  <NumberInput value={quantity} onValueChange={(value) => setQuantity(value ?? 1)} min={1} max={10} />
                </Field>
                <AsyncButton
                  size="lg"
                  className="min-w-40 flex-1"
                  pendingLabel={copy.adding}
                  successLabel={copy.added}
                  errorLabel={copy.addError}
                  onAction={async () => {
                    await onAddToCart({ product, color, size, quantity })
                    setAdded(true)
                  }}
                >
                  <ShoppingCartIcon size={18} active={added} />
                  {copy.addToCart}
                </AsyncButton>
                <Toggle
                  variant="outline"
                  size="lg"
                  aria-label={copy.save}
                  pressed={saved}
                  onPressedChange={(next) => {
                    setSaved(next)
                    onSave?.(product, next)
                  }}
                  data-yj-trigger=""
                >
                  <HeartIcon size={18} active={saved} />
                </Toggle>
              </div>

              <Card size="sm" className="gap-0 py-0">
                <CardContent className="flex flex-col divide-y divide-line px-0">
                  {lines.map(({ icon: Icon, title, detail }) => (
                    <div key={title} className="flex items-center gap-3 px-4 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-well text-fg-muted">
                        <Icon size={16} />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-ui font-medium text-fg">{title}</span>
                        <span className="text-ui-sm text-fg-muted">{detail}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {folds.length > 0 && (
                // The fullest fold's height at an app's size: opening another never shifts the page.
                <Accordion defaultValue={[folds[0]!.id]} className="min-h-47.75">
                  {folds.map((s) => (
                    <AccordionItem key={s.id} value={s.id}>
                      <AccordionTrigger headingLevel={2}>{s.title}</AccordionTrigger>
                      <AccordionContent className="text-fg-muted">{s.body}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </section>
    </MoneyContext.Provider>
  )
}

export { ProductDetail, PRODUCT_DETAIL_COPY }
export type { Product, ProductDetailCopy, ProductDetailProps, ProductPerk, ProductSection }
