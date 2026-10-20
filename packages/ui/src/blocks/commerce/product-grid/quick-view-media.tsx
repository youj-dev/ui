'use client'

import type { RefObject } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { ProductMedia, type Product } from '../product-card'
import type { ProductGridCopy } from './data'

/* Quick view's photo column: the photo (the flight's slot) in the colorway shown, the product's sides as two small
 * thumbnails when it has a second photo, and the arrows that step through the grid. */

type View = 'front' | 'angle'

interface QuickViewMediaProps {
  product: Product
  /** The colorway shown (the hovered preview wins) and the one picked, which the thumbnails wear. */
  color: string
  picked: string
  view: View
  onViewChange: (view: View) => void
  /** Whether there's another product to step to. */
  steps: boolean
  onStep: (delta: number) => void
  slot: RefObject<HTMLDivElement | null>
  arrows: RefObject<HTMLDivElement | null>
  copy: ProductGridCopy
}

const arrowClass = 'pointer-events-auto bg-overlay shadow-xs hover:bg-overlay'

export function QuickViewMedia({ product, color, picked, view, onViewChange, steps, onStep, slot, arrows, copy }: QuickViewMediaProps) {
  const way = product.colors.find((c) => c.id === color)
  const sides = Boolean(way?.image ? way.angle : product.angle)
  return (
    <div className="relative">
      <div ref={slot} data-slot="quick-view-media" className="relative aspect-square overflow-hidden rounded-xl bg-band md:aspect-[4/5]">
        <ProductMedia
          product={product}
          color={color}
          view={sides ? view : 'front'}
          sizes="(min-width: 48rem) 27rem, 100vw"
          className="absolute inset-0"
        />
      </div>
      {sides && (
        <div role="group" aria-label={copy.views} className="absolute start-5 bottom-5 flex gap-1.5">
          {(['front', 'angle'] as const).map((side) => (
            <button
              key={side}
              type="button"
              aria-label={side === 'front' ? copy.front : copy.side}
              aria-pressed={view === side}
              onClick={() => onViewChange(side)}
              className={cn(
                'relative h-14 w-11 overflow-hidden rounded-md bg-band shadow-xs outline-offset-2 transition-[outline-color] yj-duration-fast ease-standard focus-ring',
                'outline-1 outline-transparent aria-pressed:outline-fg',
              )}
            >
              <ProductMedia product={product} color={picked} view={side} sizes="2.75rem" className="absolute inset-0" />
            </button>
          ))}
        </div>
      )}
      {steps && (
        <div ref={arrows} className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
          <Button variant="outline" size="icon-sm" aria-label={copy.previous} onClick={() => onStep(-1)} className={arrowClass}>
            <ChevronLeftIcon size={16} className="rtl:-scale-x-100" />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={copy.next} onClick={() => onStep(1)} className={arrowClass}>
            <ChevronRightIcon size={16} className="rtl:-scale-x-100" />
          </Button>
        </div>
      )}
    </div>
  )
}
