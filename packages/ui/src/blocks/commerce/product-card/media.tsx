'use client'

import { useId } from 'react'
import { cn } from '../../../lib/utils'
import { ProductRender, type RenderView } from '../product-render'
import { colorway, type Product } from './data'

interface ProductMediaProps {
  product: Product
  /** The colorway shown, by id or name. Default: the first. */
  color?: string
  /** `angle` is the product's other side (its `angle` photo, else the front), `detail` a close-up. Default `front`. */
  view?: RenderView
  /** As `<img sizes>`, for a photo. */
  sizes?: string
  className?: string
}

/** A product's photo in the colorway shown (the colorway's own, else the product's); a quiet band when it has none. */
function ProductMedia({ product, color, view = 'front', sizes, className }: ProductMediaProps) {
  const way = colorway(product, color)
  const image = way.image ?? product.image
  if (image) {
    const angle = way.image ? way.angle : product.angle
    return <ProductRender src={view === 'angle' ? (angle ?? image) : image} view={view === 'detail' ? 'detail' : 'front'} focus={product.focus} sizes={sizes} className={className} />
  }
  return <div aria-hidden className={cn('size-full bg-band', className)} />
}

interface SwatchesProps {
  product: Product
  value: string
  onValueChange: (color: string) => void
  /** Hovering a swatch previews it; leaving the row clears the preview. */
  onPreview?: (color: string | undefined) => void
  size?: 'sm' | 'lg'
  className?: string
  /** The group's name for screen readers. Default 'Color'. */
  label?: string
}

/** The colorways as a native radio group: one tab stop, arrow keys to move, hover to preview. The pick is a ring
 * drawn around the dot with a gap, so it reads on any surface. */
function Swatches({ product, value, onValueChange, onPreview, size = 'sm', className, label = 'Color' }: SwatchesProps) {
  const name = useId()
  return (
    <fieldset className={cn('relative z-10 flex items-center', size === 'lg' ? 'gap-2' : 'gap-0.5', className)} onPointerLeave={() => onPreview?.(undefined)}>
      <legend className="sr-only">{label}</legend>
      {product.colors.map((c) => (
        <label key={c.id} className={cn('grid cursor-pointer place-items-center rounded-full', size === 'lg' ? 'size-10' : 'size-6')} onPointerEnter={() => onPreview?.(c.id)}>
          <input type="radio" name={name} value={c.id} checked={value === c.id} onChange={() => onValueChange(c.id)} aria-label={c.name} className="peer sr-only" />
          <span
            aria-hidden
            className={cn(
              'rounded-full border border-line-subtle outline-offset-2 transition-[outline-color] yj-duration-fast ease-standard',
              'outline-1 outline-transparent peer-checked:outline-fg peer-focus-visible:outline-2 peer-focus-visible:outline-focus',
              size === 'lg' ? 'size-8' : 'size-3',
            )}
            style={{ background: c.swatch }}
          />
        </label>
      ))}
    </fieldset>
  )
}

export { ProductMedia, Swatches }
export type { ProductMediaProps, SwatchesProps }
