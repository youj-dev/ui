'use client'

import { useId } from 'react'
import { useSoundCue } from '@youj/core'
import { HeartIcon, ShoppingBagIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { colorName, Swatches, type Product } from '../product-card'
import type { ProductGridCopy } from './data'

/* What quick view sells with: the colorways (hovering one previews it on the photo), the sizes as a radio row (sold-out
 * ones struck through and disabled), add to bag (it waits on the app's `onAdd`: pending, then Added or the error) and
 * the save heart, the same state as the tile's. */

interface QuickViewBuyProps {
  product: Product
  color: string
  onColorChange: (color: string) => void
  onPreview: (color: string | undefined) => void
  size: string | undefined
  onSizeChange: (size: string) => void
  saved: boolean
  onSave: (product: Product) => void
  onAdd: (product: Product, choice: { color: string; size?: string }) => Promise<unknown>
  copy: ProductGridCopy
  colorLabel: string
}

export function QuickViewBuy({
  product,
  color,
  onColorChange,
  onPreview,
  size,
  onSizeChange,
  saved,
  onSave,
  onAdd,
  copy,
  colorLabel,
}: QuickViewBuyProps) {
  const name = useId()
  const cue = useSoundCue()
  return (
    <div className="flex flex-col gap-5">
      {product.colors.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-ui-sm text-fg-muted">
            {colorLabel} <span className="text-fg">{colorName(product, color)}</span>
          </p>
          <Swatches
            product={product}
            value={color}
            onValueChange={onColorChange}
            onPreview={onPreview}
            label={colorLabel}
            size="lg"
            className="-ms-1"
          />
        </div>
      )}
      {product.sizes && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-ui-sm text-fg-muted">{copy.size}</legend>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((s) => {
              const out = product.soldOut?.includes(s)
              return (
                <label key={s} className={cn('relative', out ? 'cursor-not-allowed' : 'cursor-pointer')}>
                  <input
                    type="radio"
                    name={name}
                    value={s}
                    checked={size === s}
                    disabled={out}
                    onChange={() => onSizeChange(s)}
                    aria-label={out ? copy.soldOut(s) : s}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      'flex h-control-sm min-w-14 items-center justify-center rounded-md border border-line px-3 font-mono text-ui-sm tabular-nums text-fg',
                      'transition-[border-color,background-color] yj-duration-fast ease-standard',
                      'peer-checked:border-fg peer-checked:bg-selected peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
                      out ? 'text-fg-subtle line-through decoration-line-strong' : 'hover:border-line-strong',
                    )}
                  >
                    {s}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      <div className="flex gap-2">
        <AsyncButton
          size="lg"
          className="flex-1"
          disabled={Boolean(product.sizes) && !size}
          onAction={() => onAdd(product, { color, size })}
          pendingLabel={copy.adding}
          successLabel={copy.added}
          errorLabel={copy.addError}
        >
          <ShoppingBagIcon size={16} />
          {copy.addToBag}
        </AsyncButton>
        <Button
          variant="outline"
          size="icon-lg"
          sound={false}
          aria-label={copy.save(product.name)}
          aria-pressed={saved}
          onClick={() => {
            cue(saved ? 'toggleOff' : 'toggleOn')
            onSave(product)
          }}
        >
          <HeartIcon size={18} active={saved} />
        </Button>
      </div>
    </div>
  )
}
