import { cn } from '@youj/core/lib/youj/cn'
import { SpotlightGroup, SpotlightSurface, type SpotlightGroupProps, type SpotlightSurfaceProps } from '../effects/spotlight'

/* The spotlight effect as a product surface: SpotlightGrid shares one light
 * across a grid of cards, so a card's border lights up where the cursor is
 * near it even when the cursor is over a neighbor, and keyboard focus glides
 * the light from card to card. See effects/spotlight for how it works. */

export type SpotlightGridProps = SpotlightGroupProps

/** Lays out SpotlightCards and shares one pointer-tracked light across them. Bring your own grid classes. */
export function SpotlightGrid({ className, ...rest }: SpotlightGridProps) {
  return <SpotlightGroup {...rest} className={cn('grid', className)} />
}

export type SpotlightCardProps = SpotlightSurfaceProps

/** A surface lit by a pointer-tracked spotlight with a border glow. Works alone or inside SpotlightGrid. */
export function SpotlightCard({ className, ...rest }: SpotlightCardProps) {
  return <SpotlightSurface {...rest} className={cn('rounded-xl border border-line bg-surface', className)} />
}
