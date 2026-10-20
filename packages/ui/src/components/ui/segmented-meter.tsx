'use client'

import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { useInView } from 'motion/react'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { meterLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* How full a resource is, in cells you can count: a label and its value on
 * one line, and under them a row of discrete cells, lit from the inline start
 * (right to left in RTL). Cells past a threshold light in that band's tone,
 * so the warning shows exactly where usage crossed the line; with
 * `colorBy="value"` every lit cell takes the value's band instead, so a score
 * reads as one color at a glance.
 * - Motion: the cells light one after another at a constant rate (the
 *   deliberate token spread over the whole row), so a fuller meter takes
 *   longer to fill, like an instrument settling. A new value lights or
 *   darkens the cells between the old edge and the new one in order, starting
 *   from where the edge is on screen, so a burst of updates never jumps.
 * - Reduced motion: the cells are lit at once. */

type MeterTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface SegmentedMeterThreshold {
  /** Cells from this value up take the tone. */
  value: number
  tone: MeterTone
  /** A word for the band, spoken after the value: "High". */
  label?: string
}

interface SegmentedMeterProps extends Omit<MeterPrimitive.Root.Props, 'format' | 'children' | 'value'> {
  value: number
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** The visible name on the start side: "CPU". */
  label?: ReactNode
  /** How many cells. Default 40. */
  segments?: number
  /** The lit cells' tone below every threshold. Default `neutral` (the ink). */
  tone?: MeterTone
  /** Bands: cells from a threshold's value up light in its tone. */
  thresholds?: SegmentedMeterThreshold[]
  /** `position`: each lit cell takes the band it sits in. `value`: every lit cell takes the value's band, as a score does. Default 'position'. */
  colorBy?: 'position' | 'value'
  /** Intl.NumberFormat options for the value. Default: a percentage of the range. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Show the value on the end side. Default true. */
  showValue?: boolean
}

const CELL: Record<MeterTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-fg',
}

const sortBands = (thresholds: SegmentedMeterThreshold[] | undefined) => [...(thresholds ?? [])].sort((a, b) => a.value - b.value)

function SegmentedMeter({
  value,
  min = 0,
  max = 100,
  label,
  segments = 40,
  tone = 'neutral',
  thresholds,
  colorBy = 'position',
  format,
  locale: localeProp,
  showValue = true,
  className,
  ...props
}: SegmentedMeterProps) {
  const k = useYouj()
  const labels = useComponentLabels(meterLabels)
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  const span = max - min || 1
  const clamped = Math.min(max, Math.max(min, value))
  const count = Math.round(((clamped - min) / span) * segments)
  const lit = k.reduced || inView ? count : 0
  const bands = sortBands(thresholds)
  const bandAt = (v: number) => bands.filter((b) => v >= b.value).at(-1)
  const current = bandAt(clamped)
  const spoken = current?.label ?? (current?.tone === 'danger' ? labels.meterCritical : current?.tone === 'warning' ? labels.meterWarning : undefined)

  // Where the lit edge is on screen: the last sweep's start plus the cells it
  // has crossed since, so a new value sweeps on from there.
  const step = k.reduced ? 0 : k.ms('deliberate') / segments
  const sweep = useRef({ from: lit, to: lit, at: 0 })
  const { from: prevFrom, to: prevTo, at } = sweep.current
  const crossed = step && at ? Math.floor((now() - at) / step) : Infinity
  const edge = prevTo >= prevFrom ? Math.min(prevTo, prevFrom + crossed) : Math.max(prevTo, prevFrom - crossed)
  const from = lit === prevTo ? prevFrom : edge
  useLayoutEffect(() => {
    if (lit !== sweep.current.to) sweep.current = { from, to: lit, at: now() }
  })

  return (
    <MeterPrimitive.Root
      ref={ref}
      value={clamped}
      min={min}
      max={max}
      locale={locale}
      format={format}
      getAriaValueText={(formatted) => (spoken ? `${formatted}, ${spoken}` : formatted)}
      data-slot="segmented-meter"
      data-tone={current?.tone ?? tone}
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex w-full flex-col gap-2.5', className)}
      {...props}
    >
      {(label != null || showValue) && (
        <div data-slot="segmented-meter-header" className="own:flex items-baseline justify-between gap-3">
          {label != null && (
            <MeterPrimitive.Label
              data-slot="segmented-meter-label"
              className="min-w-0 truncate own:font-(family-name:--yj-label-font) own:text-ui-sm own:text-fg-muted own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]"
            >
              {label}
            </MeterPrimitive.Label>
          )}
          {showValue && (
            <MeterPrimitive.Value data-slot="segmented-meter-value" className="ms-auto shrink-0 own:text-ui-lg font-medium text-fg own:tabular-nums" />
          )}
        </div>
      )}
      <div data-slot="segmented-meter-track" aria-hidden className="own:flex h-2.5 gap-0.75">
        {Array.from({ length: segments }, (_, i) => {
          const on = i < lit
          // A cell takes the band its start sits in; the leading cell shows the value's own band.
          const cellTone = (colorBy === 'value' || i === count - 1 ? current : bandAt(min + (i / segments) * span))?.tone ?? tone
          // Lighting runs outward from the edge; darkening runs back toward the new one.
          const delay = lit > from && i >= from && i < lit ? (i - from) * step : lit < from && i >= lit && i < from ? (from - 1 - i) * step : 0
          return (
            <span
              key={i}
              data-slot="segmented-meter-cell"
              data-state={on ? 'on' : 'off'}
              data-tone={on ? cellTone : undefined}
              className={cn(
                'min-w-0 flex-1 rounded-[2px] transition-[background-color] yj-duration-fast ease-standard',
                on
                  ? CELL[cellTone]
                  : 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]',
              )}
              style={delay ? { transitionDelay: `${Math.round(delay)}ms` } : undefined}
            />
          )
        })}
      </div>
    </MeterPrimitive.Root>
  )
}

const now = () => (typeof performance === 'undefined' ? 0 : performance.now())

export { SegmentedMeter, type SegmentedMeterProps, type SegmentedMeterThreshold }
