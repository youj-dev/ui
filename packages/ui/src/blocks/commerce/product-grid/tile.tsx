'use client'

import { memo, type ElementType } from 'react'
import { useSoundCue } from '@youj/core'
import { EyeIcon, HeartIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { ProductCard, type Product, type ProductCardCopy } from '../product-card'
import type { ProductGridCopy } from './data'

/* One product in the grid: the editorial Product card, with a save heart and a quick view over its photo's top-end
 * corner. They rise in with the card's hover or keyboard focus (always shown on touch); a saved heart stays. The
 * wide tile is the featured product in the Featured order: two columns, its photo as tall as its neighbors'. */

/** A round control over the photo: the overlay's plane, a hairline, a soft shadow. */
const actionClass = cn(
  'bg-overlay text-fg shadow-xs hover:bg-overlay hover:text-fg',
  '-translate-y-1 opacity-0 transition-[opacity,translate,color] yj-duration-base ease-enter reduced:translate-y-0',
  'group-hover/product:translate-y-0 group-hover/product:opacity-100 group-focus-within/product:translate-y-0 group-focus-within/product:opacity-100',
  'pointer-coarse:translate-y-0 pointer-coarse:opacity-100',
)

interface TileProps {
  product: Product
  wide: boolean
  saved: boolean
  onSave: (product: Product) => void
  onQuickView: (product: Product) => void
  /** Registers the quick view button, so the grid can fly the photo back to it and return focus there. */
  quickViewRef: (id: string, button: HTMLButtonElement | null) => void
  onAdd?: (product: Product, choice: { color: string; size?: string }) => Promise<unknown>
  copy: ProductGridCopy
  cardCopy?: Partial<ProductCardCopy>
  currency: string
  locale: string
  linkComponent?: ElementType
}

export const Tile = memo(function Tile({
  product,
  wide,
  saved,
  onSave,
  onQuickView,
  quickViewRef,
  onAdd,
  copy,
  cardCopy,
  currency,
  locale,
  linkComponent,
}: TileProps) {
  const cue = useSoundCue()
  return (
    <ProductCard
      product={product}
      onAdd={onAdd}
      currency={currency}
      locale={locale}
      linkComponent={linkComponent}
      copy={cardCopy}
      className={cn(
        'h-full',
        // As tall as its neighbors: on a phone the wide tile has a row to itself, so it keeps a landscape frame.
        wide &&
          '[&_[data-slot=product-card-media]]:aspect-[4/3] md:[&_[data-slot=product-card-media]]:aspect-auto md:[&_[data-slot=product-card-media]]:flex-1',
      )}
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            sound={false}
            aria-label={copy.save(product.name)}
            aria-pressed={saved}
            onClick={() => {
              cue(saved ? 'toggleOff' : 'toggleOn')
              onSave(product)
            }}
            className={cn(actionClass, saved && 'translate-y-0 opacity-100')}
          >
            <HeartIcon size={16} active={saved} />
          </Button>
          <Button
            ref={(button) => quickViewRef(product.id, button)}
            variant="outline"
            size="icon"
            aria-label={copy.quickView(product.name)}
            aria-haspopup="dialog"
            onClick={() => onQuickView(product)}
            className={cn(actionClass, 'delay-[calc(var(--yj-duration-instant)*var(--yj-motion,1))]')}
          >
            <EyeIcon size={16} />
          </Button>
        </>
      }
    />
  )
})
