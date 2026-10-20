import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { Shimmer, useShimmer, type ShimmerOptions, type ShimmerProps } from '../effects/shimmer'

/* The shimmer effect as product surfaces: a container (an AI composer, a
 * featured card) and a button (an upgrade call to action). See effects/shimmer
 * for how the light travels. */

export type { ShimmerOptions }

export type ShimmerBorderProps = ShimmerProps

/** A container whose border carries a traveling point of light. */
export function ShimmerBorder({ className, ...rest }: ShimmerBorderProps) {
  return <Shimmer {...rest} className={cn('rounded-xl bg-surface', className)} />
}

export interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ShimmerOptions {
  children?: ReactNode
}

/** A button with the same traveling border light. Focus-visible counts as hover. */
export function ShimmerButton({
  idle,
  intensify,
  speed,
  borderWidth,
  className,
  style,
  children,
  type = 'button',
  ...rest
}: ShimmerButtonProps) {
  const { rootProps, layers } = useShimmer<HTMLButtonElement>({ idle, intensify, speed, borderWidth })
  return (
    <button
      type={type}
      {...rest}
      {...rootProps}
      ref={rootProps.ref as Ref<HTMLButtonElement>}
      style={{ ...rootProps.style, ...style }}
      className={cn(
        rootProps.className,
        'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-surface px-4 text-sm font-medium text-fg',
        'transition-transform yj-duration-fast ease-standard active:scale-[0.98]',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        className,
      )}
    >
      {layers}
      <span className="relative z-2 inline-flex items-center gap-2">{children}</span>
    </button>
  )
}
