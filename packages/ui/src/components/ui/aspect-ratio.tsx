import type { ComponentProps, CSSProperties } from 'react'
import { cn } from '../../lib/utils'

/* A box that keeps its shape as its width changes, for media, embeds and
 * placeholders. It is the CSS `aspect-ratio` property with the ratio as a
 * number (16 / 9), so the space is reserved before an image loads and
 * nothing below it shifts. Children fill it when they're `size-full`. */

type AspectRatioProps = ComponentProps<'div'> & {
  /** Width over height, as a number: `16 / 9`, `1`, `4 / 5`. */
  ratio: number
}

function AspectRatio({ ratio, className, style, ...props }: AspectRatioProps) {
  return (
    <div
      data-slot="aspect-ratio"
      style={{ '--ratio': ratio, ...style } as CSSProperties}
      className={cn('relative aspect-(--ratio)', className)}
      {...props}
    />
  )
}

export { AspectRatio }
export type { AspectRatioProps }
