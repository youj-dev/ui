'use client'

import { useRef, type ComponentProps, type CSSProperties } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, cssVars, numberFormat, toneColor } from '../../lib/utils'

/* Solid for what is settled, hatched for what isn't: a baseline, a pending
 * or projected amount, a run that missed its gate. `Hatch` is the fill on its
 * own (legend swatches, a pending segment inside another bar); `HatchedBar`
 * is a bar of it that grows to a value.
 * - The hatch is diagonal stripes of the tone over a faint wash of it, drawn
 *   in theme tokens, so it follows the theme and both modes.
 * - Motion: the bar grows from its base (the bottom, or the inline start) on
 *   the smooth spring when it scrolls into view, and a new value retargets
 *   from where it is. It's a clip, so the stripes never stretch.
 * - Semantics: with `label` the bar is a `meter`; without, decorative.
 * - Reduced motion: drawn at its value; changes jump. */

type HatchTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'


/** Stripes of --hatch-color over a wash of it; "/" at any size, 1.5px lines every 5px. */
const HATCH = [
  '[background-color:color-mix(in_oklab,var(--hatch-color)_10%,transparent)]',
  '[background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--hatch-color)_72%,transparent)_0_1.5px,transparent_1.5px_5px)]',
]

interface HatchProps extends ComponentProps<'span'> {
  /** The stripes' color. Default 'neutral'. */
  tone?: HatchTone
}

/** The hatch fill on its own: a legend swatch, a pending segment. Decorative; size it with classes. */
function Hatch({ tone = 'neutral', className, style, ...props }: HatchProps) {
  return (
    <span
      aria-hidden
      data-slot="hatch"
      data-tone={tone}
      className={cn('own:block own:rounded-[2px]', HATCH, className)}
      style={{ '--hatch-color': toneColor(tone), ...style } as CSSProperties}
      {...props}
    />
  )
}

interface HatchedBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The bar's length, out of `max`. */
  value: number
  /** Default 1. */
  max?: number
  /** Hatched for a baseline, pending or projected amount; solid for an actual one. Default 'hatched'. */
  fill?: 'hatched' | 'solid'
  /** Default 'vertical': grows up from the bottom. Horizontal grows from the inline start. */
  orientation?: 'vertical' | 'horizontal'
  /** Default 'neutral', which is a quiet fill when solid. */
  tone?: HatchTone
  /** Accessible name. With it the bar is a `meter`; without, it is hidden from assistive technology. */
  label?: string
  /** The value as spoken. Default: the share of `max` as a percentage, in the provider's locale. */
  valueText?: string
}

function HatchedBar({
  value,
  max = 1,
  fill = 'hatched',
  orientation = 'vertical',
  tone = 'neutral',
  label,
  valueText,
  className,
  style,
  ...props
}: HatchedBarProps) {
  const k = useYouj()
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const target = k.reduced || inView ? fraction : 0
  const vertical = orientation === 'vertical'
  const meter = label !== undefined || props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined

  return (
    <MotionFeatures>
      <m.div
        ref={ref}
        data-slot="hatched-bar"
        data-fill={fill}
        data-tone={tone}
        data-orientation={orientation}
        role={meter ? 'meter' : undefined}
        aria-label={label}
        aria-valuenow={meter ? value : undefined}
        aria-valuemin={meter ? 0 : undefined}
        aria-valuemax={meter ? max : undefined}
        aria-valuetext={
          meter ? (valueText ?? numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(fraction)) : undefined
        }
        aria-hidden={meter ? undefined : true}
        className={cn('relative', vertical ? 'h-24 w-3' : 'h-2 w-full min-w-12', className)}
        style={{ '--hatch-color': toneColor(tone), ...style } as CSSProperties}
        initial={cssVars({ '--hatched-bar-value': k.reduced ? fraction : 0 })}
        animate={cssVars({ '--hatched-bar-value': target })}
        transition={k.reduced ? { type: false } : k.spring('smooth')}
        {...(props as object)}
      >
        <span
          data-slot="hatched-bar-fill"
          className={cn(
            // A data mark: the theme's smallest radius, but never a pill.
            'absolute inset-0 [--hatched-bar-radius:min(var(--radius-xs),3px)] rounded-(--hatched-bar-radius)',
            fill === 'hatched' ? HATCH : tone === 'neutral' ? 'bg-well' : 'bg-(--hatch-color)',
            '[--hatched-bar-rest:calc((1_-_var(--hatched-bar-value))_*_100%)]',
            vertical
              ? '[clip-path:inset(var(--hatched-bar-rest)_0_0_0_round_var(--hatched-bar-radius))]'
              : '[clip-path:inset(0_var(--hatched-bar-rest)_0_0_round_var(--hatched-bar-radius))] rtl:[clip-path:inset(0_0_0_var(--hatched-bar-rest)_round_var(--hatched-bar-radius))]',
          )}
        />
      </m.div>
    </MotionFeatures>
  )
}

export { Hatch, HatchedBar, type HatchProps, type HatchedBarProps, type HatchTone }
