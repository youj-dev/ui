'use client'

import { useState, type ElementType, type ReactNode } from 'react'
import { Counter, PresenceItem, PresenceList } from '@youj/motion'
import { ArrowRightIcon, ShoppingBagIcon, TruckIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button, buttonVariants } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { NumberInput } from '../../components/ui/number-input'
import { Progress, ProgressLabel } from '../../components/ui/progress'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { cn } from '../../lib/utils'
import { colorName, formatPrice, Money, MoneyContext, ProductMedia, productById, useMoneyFormat, type Product } from './product-card'

/** The button's name, led by the word it shows when the name doesn't already hold it. */
const named = (name: string, shown: string) => (name.toLowerCase().includes(shown.toLowerCase()) ? name : `${shown}, ${name}`)

/* The cart as a floating Sheet from the inline end, inset from the window and raised over a blurred page, as
 * tall as its lines (up to the window, then the lines scroll), so it reads as a bag set down beside the shop
 * rather than a wall. The trigger carries the item count. The header holds
 * the title, a rolling count and the road to free shipping: a slim bar that fills as the subtotal grows, with a
 * truck that turns green once it's unlocked. Each line is a 4:5 photo of the product in the colorway picked, its
 * variant, a quantity NumberInput and a quiet Remove; a removed line fades where it stands and the lines below
 * glide up (PresenceList). The footer sums shipping and the subtotal (rolling to each new figure) over the checkout
 * button, which carries the hand-off through AsyncButton. An empty cart sits centered with a way back to the shop.
 * Reduced motion: the sheet and every change are instant.
 *
 * Pass your cart as `lines` with `onLinesChange` (or hear each change through
 * `onQuantityChange` and `onRemove`), set `currency` and `locale`, and wire
 * `onCheckout`; every string is in `copy`.
 * It takes the page's layout density, trigger and drawer alike. */

interface CartLine {
  id: string
  product: Product
  /** The colorway's id. */
  color: string
  size?: string
  quantity: number
}

const CART_DRAWER_COPY = {
  trigger: (count: number) => `Cart, ${count} ${count === 1 ? 'item' : 'items'}`,
  title: 'Your cart',
  count: (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`,
  nothingYet: 'Nothing here yet',
  awayBefore: 'You’re',
  awayAfter: 'away from free shipping',
  freeShipping: 'Free shipping unlocked',
  list: 'Cart items',
  quantity: (name: string) => `Quantity of ${name}`,
  remove: (name: string) => `Remove ${name}`,
  removeLabel: 'Remove',
  emptyTitle: 'Your cart is empty',
  emptyDescription: 'Everything you add shows up here, ready to check out.',
  continueShopping: 'Continue shopping',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  shippingFree: 'Free',
  shippingLater: 'At checkout',
  taxesNote: 'Taxes are calculated at checkout.',
  checkout: 'Check out',
  checkoutPending: 'Preparing checkout…',
  checkoutSuccess: 'Redirecting',
}
type CartDrawerCopy = typeof CART_DRAWER_COPY

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

const SAMPLE: CartLine[] = [
  { id: 'l1', product: productById('ridge-kettle'), color: 'rose', size: '1.2 l', quantity: 1 },
  { id: 'l2', product: productById('daily-mug'), color: 'white', size: '450 ml', quantity: 2 },
  { id: 'l3', product: productById('bud-vases'), color: 'chalk', quantity: 1 },
]

interface CartDrawerProps {
  /** The cart, controlled: pair it with `onLinesChange`. */
  lines?: CartLine[]
  /** The cart when the drawer owns it. Default: the demo's three lines. */
  defaultLines?: CartLine[]
  /** Hears the whole cart after every quantity change or removal. */
  onLinesChange?: (lines: CartLine[]) => void
  /** Hears a line's new quantity. */
  onQuantityChange?: (line: CartLine, quantity: number) => void
  /** Hears a line being removed. */
  onRemove?: (line: CartLine) => void
  /** Whether the drawer is open, controlled: pair it with `onOpenChange`. */
  open?: boolean
  /** Whether it starts open when the drawer owns it. Default false. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Resolve once checkout is ready to take over; reject to shake the button. Default: a short demo wait. */
  onCheckout?: (lines: CartLine[]) => Promise<unknown>
  /** An ISO 4217 code. Default 'USD'. */
  currency?: string
  /** A BCP 47 locale for every amount. Default 'en-US'. */
  locale?: string
  /** The subtotal that ships free, in `currency`; `null` hides the bar. Default 150. */
  freeShippingAt?: number | null
  /** The most of one line a shopper can take. Default 10. */
  maxQuantity?: number
  /** Where "Continue shopping" goes from an empty cart. Default '#shop'. */
  shopHref?: string
  /** Renders the "Continue shopping" link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the drawer's strings, to rewrite or translate. */
  copy?: Partial<CartDrawerCopy>
  /** Replaces the empty cart's message. */
  empty?: ReactNode
  /** Classes for the drawer's panel. */
  className?: string
  /** The layout density (ui.css) of the trigger and the drawer. Default: the page's (YoujProvider's or ThemeScope's `density`). */
  'data-yj-density'?: 'compact' | 'roomy'
}

function CartDrawer({
  lines: linesProp,
  defaultLines = SAMPLE,
  onLinesChange,
  onQuantityChange,
  onRemove,
  open,
  defaultOpen,
  onOpenChange,
  onCheckout = () => demo('CartDrawer: onCheckout', 900),
  currency,
  locale,
  freeShippingAt = 150,
  maxQuantity = 10,
  shopHref = '#shop',
  linkComponent: Link = 'a',
  copy: copyProp,
  empty,
  className,
  'data-yj-density': density,
}: CartDrawerProps) {
  const copy = { ...CART_DRAWER_COPY, ...copyProp }
  const money = useMoneyFormat(currency, locale)
  const [owned, setOwned] = useState(defaultLines)
  const lines = linesProp ?? owned
  const count = lines.reduce((n, l) => n + l.quantity, 0)
  const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0)
  const toFree = freeShippingAt === null ? 0 : Math.max(0, freeShippingAt - subtotal)

  const change = (next: CartLine[]) => {
    if (linesProp === undefined) setOwned(next)
    onLinesChange?.(next)
  }
  const setQuantity = (line: CartLine, quantity: number) => {
    change(lines.map((l) => (l.id === line.id ? { ...l, quantity } : l)))
    onQuantityChange?.(line, quantity)
  }
  const remove = (line: CartLine) => {
    change(lines.filter((l) => l.id !== line.id))
    onRemove?.(line)
  }

  // Whole dollars while every price is whole, cents once any price has them.
  const places = lines.some((l) => l.product.price % 1) ? 2 : 0
  const progress = freeShippingAt === null ? 0 : Math.min(100, (subtotal / freeShippingAt) * 100)

  return (
    <MoneyContext.Provider value={money}>
      <Sheet open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange && ((next) => onOpenChange(next))}>
        <SheetTrigger render={<Button variant="outline" className="relative" aria-label={copy.trigger(count)} data-yj-trigger="" data-yj-density={density} />}>
          <ShoppingBagIcon size={18} active={count > 0} />
          <span className="tabular-nums">{count}</span>
        </SheetTrigger>
        {/* The drawer portals out of the page, so it carries the density itself. */}
        <SheetContent variant="floating" backdrop="blur" data-yj-density={density} className={cn('bottom-auto max-h-[calc(100dvh-var(--yj-sheet-gap)*2)] w-[min(--spacing(104),calc(100vw-var(--yj-sheet-gap)*2))]', className)}>
          <SheetHeader className="gap-3 border-b-0 pb-0">
            <div className="flex items-baseline gap-2">
              <SheetTitle className="text-ui-lg tracking-tight">{copy.title}</SheetTitle>
              {count > 0 && (
                <Badge aria-hidden variant="secondary" className="font-mono tabular-nums">
                  <Counter value={count} inView={false} duration="fast" />
                </Badge>
              )}
            </div>
            <SheetDescription className="sr-only">{count ? copy.count(count) : copy.nothingYet}</SheetDescription>
            {lines.length > 0 && freeShippingAt !== null && (
              <Progress value={progress} className="gap-y-2">
                <ProgressLabel className="flex w-full items-center justify-between gap-2 text-ui-sm text-fg-muted">
                  {toFree ? (
                    <span>
                      {copy.awayBefore} <span className="font-medium text-fg tabular-nums">{formatPrice(toFree, money)}</span> {copy.awayAfter}
                    </span>
                  ) : (
                    <span className="font-medium text-success-text">{copy.freeShipping}</span>
                  )}
                  <TruckIcon size={16} active={!toFree} className={cn('shrink-0', toFree ? 'text-fg-subtle' : 'text-success-text')} />
                </ProgressLabel>
              </Progress>
            )}
          </SheetHeader>
          <SheetBody className={cn('gap-0', !lines.length && 'justify-center')}>
            {lines.length ? (
              <PresenceList aria-label={copy.list} className="flex flex-col">
                {lines.map((line) => (
                  <PresenceItem key={line.id} className="flex gap-3.5 border-b border-line-subtle bg-overlay py-3.5 last:border-b-0">
                    <div className="relative aspect-[4/5] w-18 shrink-0 overflow-hidden rounded-lg">
                      <ProductMedia product={line.product} color={line.color} sizes="5rem" className="absolute inset-0" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-ui font-medium text-fg">{line.product.name}</span>
                          <span className="truncate text-ui-sm text-fg-muted">{[colorName(line.product, line.color), line.size].filter(Boolean).join(' · ')}</span>
                        </div>
                        <span className="font-mono text-ui font-medium text-fg tabular-nums">
                          <Money value={line.quantity * line.product.price} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <NumberInput
                          aria-label={copy.quantity(line.product.name)}
                          value={line.quantity}
                          onValueChange={(value) => setQuantity(line, value ?? 1)}
                          min={1}
                          max={maxQuantity}
                          className="w-26"
                        />
                        <Button variant="ghost" size="sm" aria-label={named(copy.remove(line.product.name), copy.removeLabel)} onClick={() => remove(line)} data-yj-trigger="" className="-me-2 text-fg-muted">
                          {copy.removeLabel}
                        </Button>
                      </div>
                    </div>
                  </PresenceItem>
                ))}
              </PresenceList>
            ) : (
              (empty ?? (
                <Empty className="border-0 py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingBagIcon />
                    </EmptyMedia>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link href={shopHref} className={buttonVariants({ variant: 'outline' })}>
                      {copy.continueShopping}
                    </Link>
                  </EmptyContent>
                </Empty>
              ))
            )}
          </SheetBody>
          {lines.length > 0 && (
            <SheetFooter className="flex-col items-stretch gap-3 bg-overlay pt-4 pb-5">
              <dl className="flex flex-col gap-1.5 text-ui">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fg-muted">{copy.shipping}</dt>
                  <dd className={cn('text-ui-sm', freeShippingAt !== null && !toFree ? 'font-medium text-success-text' : 'text-fg-muted')}>
                    {freeShippingAt !== null && !toFree ? copy.shippingFree : copy.shippingLater}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-medium text-fg">{copy.subtotal}</dt>
                  <dd className="font-mono text-xl font-medium tracking-tight text-fg tabular-nums">
                    <Counter value={subtotal} format={{ style: 'currency', currency: money.currency, minimumFractionDigits: places, maximumFractionDigits: places }} locale={money.locale} inView={false} duration="base" />
                  </dd>
                </div>
              </dl>
              <AsyncButton size="lg" pendingLabel={copy.checkoutPending} successLabel={copy.checkoutSuccess} onAction={() => onCheckout(lines)}>
                {copy.checkout}
                <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
              </AsyncButton>
              <p className="text-center text-ui-xs text-fg-muted">{copy.taxesNote}</p>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </MoneyContext.Provider>
  )
}

export { CartDrawer, CART_DRAWER_COPY }
export type { CartDrawerCopy, CartDrawerProps, CartLine, Product }
