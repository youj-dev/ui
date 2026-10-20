'use client'

import { useRef, useState, type ElementType, type KeyboardEvent, type RefObject } from 'react'
import { useDevice, useDirection, useYouj } from '@youj/core'
import { ArrowRightIcon, StarIcon, XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../../../components/ui/dialog'
import { safeLink } from '../../../lib/safe-href'
import { cn } from '../../../lib/utils'
import { Price, type Product } from '../product-card'
import type { ProductGridCopy } from './data'
import { cancelAll, Choreography, flyHome, type FlightParts } from './flight'
import { QuickViewBuy } from './quick-view-buy'
import { QuickViewMedia } from './quick-view-media'

/* A product, a step closer, without leaving the grid: its photo, colorways, sizes, add to bag and save, and the way to
 * its page. Under a pointer the photo flies out of its tile and home again (flight.tsx); ← and → (or the arrows over
 * the photo) step through the grid's order in place. On touch it's the kit's bottom sheet; under reduced motion it
 * simply appears. Focus goes back to the shown product's quick view button. */

interface QuickViewProps {
  /** The order ← and → step through: the grid's, when it opened. */
  products: Product[]
  /** The product shown; null closes it. */
  product: Product | null
  onProductChange: (id: string | null) => void
  /** The tile's photo for a product, if it's in the page. */
  origin: (id: string) => HTMLElement | null
  /** Where focus goes on close: the shown product's quick view button (else back where it was). */
  returnFocus: RefObject<HTMLElement | null>
  isSaved: (id: string) => boolean
  onSave: (product: Product) => void
  onAdd: (product: Product, choice: { color: string; size?: string }) => Promise<unknown>
  copy: ProductGridCopy
  colorLabel: string
  wasLabel: string
  nowLabel: string
  locale: string
  Link: ElementType
}

/** The colorway, its hovered preview, the size (the first in stock) and the side shown: fresh for every product. */
const fresh = (p: Product | null) => ({
  id: p?.id,
  color: p?.colors[0]?.id ?? '',
  preview: undefined as string | undefined,
  size: p?.sizes?.find((s) => !p.soldOut?.includes(s)),
  view: 'front' as 'front' | 'angle',
})

function QuickView({
  products,
  product,
  onProductChange,
  origin,
  returnFocus,
  isSaved,
  onSave,
  onAdd,
  copy,
  colorLabel,
  wasLabel,
  nowLabel,
  locale,
  Link,
}: QuickViewProps) {
  const k = useYouj()
  const flies = useDevice() === 'pointer' && !k.reduced
  const rtl = useDirection() === 'rtl'
  // What the dialog shows: the product, kept through the close so the content doesn't vanish as it leaves.
  const [shown, setShown] = useState(product)
  if (product && product !== shown) setShown(product)
  // Flying home: the dialog stays open until the photo has landed.
  const [home, setHome] = useState(false)
  const [pick, setPick] = useState(() => fresh(product))
  if (shown && pick.id !== shown.id) setPick(fresh(shown))
  const slot = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const details = useRef<HTMLDivElement>(null)
  const arrows = useRef<HTMLDivElement>(null)
  const running = useRef<Animation[]>([])
  const flight = useRef<Animation | null>(null)
  const step = useRef(0)
  const parts: FlightParts = { slot, surface, details, arrows, running, flight, step }

  const index = shown
    ? Math.max(
        0,
        products.findIndex((p) => p.id === shown.id),
      )
    : 0
  const go = (delta: number) => {
    const next = products[(index + delta + products.length) % products.length]
    if (!next || next.id === shown?.id) return
    step.current = delta
    onProductChange(next.id)
  }
  const close = () => {
    if (home || !shown) return
    const landing = flies ? flyHome(parts, origin(shown.id), k) : null
    if (!landing) return onProductChange(null)
    setHome(true)
    landing.then(
      () => onProductChange(null),
      () => {},
    )
  }
  const keys = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    if ((event.target as HTMLElement).closest('input, textarea, select, [role=slider], [role=radiogroup]')) return
    event.preventDefault()
    go((event.key === 'ArrowRight') !== rtl ? 1 : -1)
  }

  return (
    <Dialog
      open={product !== null || home}
      onOpenChange={(next) => !next && close()}
      onOpenChangeComplete={(next) => {
        if (next) return
        cancelAll(parts)
        flight.current = null
        step.current = 0
        setHome(false)
      }}
    >
      {/* shape: the dialog is only a frame while the photo flies; `!` keeps its starting and ending states from fading or moving it */}
      <DialogContent
        showCloseButton={false}
        finalFocus={() => returnFocus.current ?? true}
        onKeyDown={keys}
        className={cn(
          // The popup is only a frame: the surface is drawn inside it, so the photo can fly while the rest fades in.
          'w-full max-w-4xl gap-0 border-transparent bg-transparent p-0 shadow-none',
          flies && 'overflow-visible [&[data-starting-style]]:opacity-100! [&[data-starting-style]]:transform-none!',
          home && '[&[data-ending-style]]:transform-none!',
        )}
      >
        {shown && (
          <Choreography parts={parts} flies={flies} tile={() => origin(shown.id)} rtl={rtl} id={shown.id}>
            <div ref={surface} aria-hidden className="absolute inset-0 rounded-2xl border border-line bg-overlay shadow-lg" />
            <div className="relative grid gap-0 p-2 md:grid-cols-2">
              <QuickViewMedia
                product={shown}
                color={pick.preview ?? pick.color}
                picked={pick.color}
                view={pick.view}
                onViewChange={(view) => setPick({ ...pick, view })}
                steps={products.length > 1}
                onStep={go}
                slot={slot}
                arrows={arrows}
                copy={copy}
              />
              <div ref={details} className="flex min-w-0 flex-col gap-5 px-4 pt-5 pb-3 md:px-7 md:pt-6 md:pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="flex items-center gap-2 text-ui-sm text-fg-muted">
                      <span>{shown.category}</span>
                      <span aria-hidden className="text-fg-subtle">
                        ·
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <StarIcon size={11} aria-hidden className="fill-current text-fg" />
                        <span className="sr-only">{copy.rated(shown.rating)}</span>
                        <span aria-hidden>{shown.rating}</span>
                        <span className="text-fg-subtle">{copy.reviews(shown.reviews.toLocaleString(locale))}</span>
                      </span>
                    </p>
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-balance">{shown.name}</DialogTitle>
                  </div>
                  <span className="-me-2 -mt-1 flex shrink-0 items-center gap-1">
                    {products.length > 1 && (
                      <span className="font-mono text-ui-sm text-fg-subtle tabular-nums">{copy.position(index + 1, products.length)}</span>
                    )}
                    <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label={copy.close} />}>
                      <XIcon size={16} />
                    </DialogClose>
                  </span>
                </div>
                <Price value={shown.price} compareAt={shown.compareAt} size="lg" wasLabel={wasLabel} nowLabel={nowLabel} />
                <DialogDescription className="text-pretty text-ui text-fg-muted">{shown.description}</DialogDescription>
                <div className="mt-auto flex flex-col gap-5 pt-2">
                  <QuickViewBuy
                    product={shown}
                    color={pick.color}
                    onColorChange={(next) => setPick({ ...pick, color: next, preview: undefined })}
                    onPreview={(preview) => setPick({ ...pick, preview })}
                    size={pick.size}
                    onSizeChange={(size) => setPick({ ...pick, size })}
                    saved={isSaved(shown.id)}
                    onSave={onSave}
                    onAdd={onAdd}
                    copy={copy}
                    colorLabel={colorLabel}
                  />
                  <Link
                    href={safeLink(shown.href) ?? `#${shown.id}`}
                    className="group/details inline-flex items-center gap-1.5 self-start rounded-sm text-ui font-medium text-fg underline-offset-4 hover:underline focus-ring"
                  >
                    {copy.details}
                    <ArrowRightIcon
                      size={14}
                      className="transition-transform yj-duration-fast ease-standard group-hover/details:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/details:-translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </Choreography>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { QuickView }
