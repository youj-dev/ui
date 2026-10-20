'use client'

import type { ComponentProps } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/**
 * A recessed block with a band of light crossing it on the shimmer token
 * (three deliberate beats: cross, then rest), timed by the provider's Speed
 * and reversed under RTL. Under reduced motion the band is gone and the block
 * is still. Hidden from assistive tech: the region it stands in for should
 * carry aria-busy and announce the wait once.
 */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  const k = useYouj()
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'relative own:overflow-hidden own:rounded-md own:bg-band',
        'own:after:absolute own:after:inset-0 own:after:animate-shimmer after:bg-linear-to-r own:after:from-transparent own:after:via-(--ui-shimmer) own:after:to-transparent',
        'own:rtl:after:[animation-direction:reverse] own:reduced:after:hidden',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
