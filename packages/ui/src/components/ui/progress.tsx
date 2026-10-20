'use client'

import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { animate, m, useMotionValue, useTransform, type HTMLMotionProps, type MotionValue } from 'motion/react'
import { useEffect } from 'react'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { clamp, cn } from '../../lib/utils'
import { MotionFeatures, type Size } from '@youj/core'

/* The indicator is a full-width bar scaled on X (transform only) by
 * k.spring('smooth'): value updates glide, and a burst of updates retargets
 * the spring with its velocity intact instead of restarting a tween. It grows
 * from the inline start, so RTL fills right to left. With no value
 * (indeterminate) a band sweeps the track; under reduced motion the value
 * jumps and the indeterminate band is replaced by still stripes.
 *
 * variant="ticks": the track is a row of fine vertical ticks, lit from the
 * inline start. How many are lit follows the same spring, as a fractional
 * count, so the tick at the edge lights partway and the few past it warm up
 * a little before the edge reaches them. Indeterminate, a wave of lit ticks
 * travels from the start to the end and rests; under reduced motion the
 * count jumps, and indeterminate shows every other tick lit, still. */

type ProgressTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger'

interface ProgressProps extends ProgressPrimitive.Root.Props {
  /**
   * The fill. Unset, the component style decides: the accent in Classic, a
   * neutral ink in Bezel (which keeps the accent for emphasis). A tone pins
   * it in every style.
   */
  tone?: ProgressTone
  /** `ticks` draws the track as a row of fine vertical ticks that light from the start. Default `default`. */
  variant?: 'default' | 'ticks'
  /** The track's height: the bar's thickness, or the ticks' length. Default `default`. */
  size?: Extract<Size, 'sm' | 'default' | 'lg'>
  /** How many ticks the `ticks` variant draws. Default 40. */
  ticks?: number
}

const BAR_SIZE = { sm: 'own:h-1', default: undefined, lg: 'own:h-2.5' }

function Progress({ className, children, value, min = 0, max = 100, tone, variant = 'default', size = 'default', ticks = 40, ...props }: ProgressProps) {
  const k = useYouj()
  return (
    <MotionFeatures>
      <ProgressPrimitive.Root
        value={value}
        min={min}
        max={max}
        locale={useLocale()}
        data-slot="progress"
        data-tone={tone}
        data-variant={variant}
        data-size={size}
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:flex w-full flex-wrap items-center justify-between own:gap-x-3 own:gap-y-2', className)}
        {...props}
      >
        {children}
        {variant === 'ticks' ? (
          <ProgressTicks count={Math.max(1, Math.round(ticks))} fraction={value == null ? null : clamp((value - min) / (max - min || 1), 0, 1)} size={size} />
        ) : (
          <ProgressTrack className={BAR_SIZE[size]}>
            <ProgressIndicator />
          </ProgressTrack>
        )}
      </ProgressPrimitive.Root>
    </MotionFeatures>
  )
}

const TICKS_SIZE = { sm: 'own:h-3', default: 'own:h-4', lg: 'own:h-6' }

/** How lit tick `i` is when `lit` ticks are: full behind the edge, partway at it, and a warm-up fading over the three past it. */
function tickLevel(lit: number, i: number) {
  const on = clamp(lit - i, 0, 1)
  const warm = clamp((lit + 3 - i) / 4, 0, 1) * 0.5 * Math.min(1, lit)
  return Math.max(on, warm)
}

function ProgressTicks({ count, fraction, size }: { count: number; fraction: number | null; size: NonNullable<ProgressProps['size']> }) {
  const k = useYouj()
  const target = (fraction ?? 0) * count
  // Indeterminate rests the count at 0, so the first real value lights from the start.
  const lit = useMotionValue(target)
  useEffect(() => {
    if (k.reduced) {
      lit.jump(target)
      return
    }
    const run = animate(lit, target, k.spring('smooth'))
    return () => run.stop()
  }, [target, k, lit])
  const indeterminate = fraction == null
  return (
    <div
      aria-hidden
      data-slot="progress-ticks"
      data-indeterminate={indeterminate || undefined}
      className={cn('own:flex w-full items-stretch justify-between', TICKS_SIZE[size])}
    >
      {Array.from({ length: count }, (_, i) => (
        <ProgressTick key={i} i={i} count={count} lit={lit} indeterminate={indeterminate} reduced={k.reduced} wide={size === 'lg'} />
      ))}
    </div>
  )
}

const TICK_TONES = 'in-data-[tone=neutral]:bg-fg in-data-[tone=success]:bg-success in-data-[tone=warning]:bg-warning in-data-[tone=danger]:bg-danger'

function ProgressTick({ i, count, lit, indeterminate, reduced, wide }: { i: number; count: number; lit: MotionValue<number>; indeterminate: boolean; reduced: boolean; wide: boolean }) {
  const level = useTransform(lit, (l) => tickLevel(l, i))
  // The wave crosses in the first 70% of each loop, start to end, then rests.
  const style = indeterminate
    ? reduced
      ? { opacity: i % 2 ? 0 : 0.6 }
      : { opacity: 0, animationDelay: `calc(var(--yj-duration-deliberate) * ${(((i / count) * 0.7 - 1) * 2).toFixed(4)})` }
    : { opacity: level }
  return (
    <span data-slot="progress-tick" className={cn('relative own:h-full overflow-hidden rounded-full own:bg-line-control', wide ? 'own:w-0.5' : 'own:w-px')}>
      <m.span
        data-slot="progress-tick-fill"
        className={cn('absolute inset-0 own:bg-accent', TICK_TONES, indeterminate && !reduced && 'animate-tick-wave')}
        style={style}
      />
    </span>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn('relative own:h-1.5 w-full overflow-hidden rounded-full own:bg-well', className)}
      {...props}
    />
  )
}

function ProgressIndicator({ className, ...props }: ProgressPrimitive.Indicator.Props) {
  const k = useYouj()
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        // Fills from the inline start; the indeterminate band keeps a left
        // origin and simply runs backwards under RTL.
        'absolute inset-y-0 start-0 rounded-full own:bg-accent origin-left rtl:not-data-indeterminate:origin-right',
        'in-data-[tone=neutral]:bg-fg-muted in-data-[tone=success]:bg-success in-data-[tone=warning]:bg-warning in-data-[tone=danger]:bg-danger',
        'data-indeterminate:animate-indeterminate rtl:data-indeterminate:[animation-direction:reverse]',
        // Still stripes: the gaps must show the track, so the bar's own fill goes.
        'reduced:data-indeterminate:animate-none reduced:data-indeterminate:bg-transparent reduced:data-indeterminate:opacity-60',
        'reduced:data-indeterminate:bg-[repeating-linear-gradient(-45deg,var(--color-accent)_0_3px,transparent_3px_7px)]',
        className,
      )}
      {...props}
      render={(indicatorProps, state) => {
        // Base UI sizes the bar with an inline width (its own value → percent
        // maths). The bar stays full width and scales to that fraction
        // instead, so only transform ever animates.
        const indeterminate = state.status === 'indeterminate'
        const width = indicatorProps.style?.width
        const fraction = typeof width === 'string' ? Math.min(1, Math.max(0, parseFloat(width) / 100)) : 1
        // While indeterminate the CSS sweep owns the transform, so the motion
        // value rests at 0: the first real value then grows from empty instead
        // of springing down from full. The still stripes (reduced) need the
        // full track.
        const scaleX = indeterminate ? (k.reduced ? 1 : 0) : fraction
        return (
          <m.div
            {...(indicatorProps as HTMLMotionProps<'div'>)}
            style={{ ...indicatorProps.style, width: '100%' }}
            initial={false}
            animate={{ scaleX }}
            transition={k.reduced || indeterminate ? { type: false } : k.spring('smooth')}
          />
        )
      }}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn('own:text-ui own:font-medium own:text-fg', className)}
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn('ms-auto own:text-ui-sm own:text-fg-muted own:tabular-nums', className)}
      {...props}
    />
  )
}

export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue, type ProgressProps, type ProgressTone }
