'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { histogramRangeLabels, useComponentLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { Slider } from './slider'

/* A two-thumb range over the distribution it filters. The bars are the
 * data's shape: faint outside the range, stronger inside it. The stronger
 * set is a copy of the bars clipped to the range, so its edges sit exactly
 * under the thumbs' centers and follow a drag 1:1, cutting a bar in two where
 * a thumb stands in it. The accent stays on the track between the thumbs and
 * on the readout (`tone="accent"` puts it on the bars too). The thumbs are
 * the kit's Slider, centered on their values so the bins, the thumbs and the
 * axis share one scale, and drawn as a caliper's jaws: an upright tab on the
 * track with a hairline guide rising through the plot, so each end of the cut
 * is read against the bars it falls in. The control also reaches up over the
 * bars, so the whole plot is the hit area and a press anywhere moves the
 * nearest thumb.
 *
 * Motion: when the data changes, each bar's height (a clip-path, so its
 * corners stay crisp) glides to the new count on the slow token and the
 * emphasized curve, in a quick wave from the first bin to the last; the first
 * render rises from the baseline the same way. A retarget mid-glide starts
 * from where the bars are. Dragging never animates. Reduced motion: the bars
 * take their heights in one frame. The bars are decorative; the readout is
 * spoken through a polite live region once the range settles. */

/** The lowest a bar goes, so an empty bin still reads as baseline. */
const FLOOR = 0.05
/** Wait this long after the last change before speaking the range. */
const ANNOUNCE_DELAY = 500

type Range = [number, number]

interface HistogramRangeProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  /** Raw values, counted into `binCount` even bins from `min` to `max`. Values outside are left out. */
  data?: readonly number[]
  /** Counts per bin, evenly spaced from `min` to `max`. Used instead of `data`. */
  bins?: readonly number[]
  /** How many bins `data` is counted into. Default 40. */
  binCount?: number
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** Default 1. */
  step?: number
  value?: Range
  /** Default [min, max]. */
  defaultValue?: Range
  onValueChange?: (value: Range) => void
  /** Called once a drag or key press ends, with the final range. */
  onValueCommitted?: (value: Range) => void
  /** The visible name over the plot ("Duration"). It names the group, and the thumbs as its minimum and maximum. */
  label?: string
  /** Formats a value for the readout, the thumbs' spoken values and, unless `formatTick` is set, the axis. Default: the locale's number format. */
  format?: (value: number) => string
  /** Formats an axis tick. Default: `format`. */
  formatTick?: (value: number) => string
  /** The values the axis marks. Default: four, evenly spaced from `min` to `max`. */
  ticks?: readonly number[]
  /** The bars inside the range: a stronger neutral, or the accent. Default 'neutral'. */
  tone?: 'neutral' | 'accent'
  /** Names for the two thumbs. Default: the label's minimum and maximum. */
  thumbLabels?: [string, string]
  /** Also submits both ends with a native form, under this name. */
  name?: string
  disabled?: boolean
}

function countBins(data: readonly number[], min: number, max: number, count: number) {
  const bins = new Array<number>(count).fill(0)
  const span = max - min
  for (const v of data) {
    if (!(v >= min && v <= max) || span <= 0) continue
    bins[Math.min(count - 1, Math.floor(((v - min) / span) * count))]!++
  }
  return bins
}

function HistogramRange({
  data,
  bins: binsProp,
  binCount = 40,
  min = 0,
  max = 100,
  step = 1,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommitted,
  label,
  format,
  formatTick,
  ticks: ticksProp,
  tone = 'neutral',
  thumbLabels,
  name,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...props
}: HistogramRangeProps) {
  const k = useYouj()
  const labels = useComponentLabels(histogramRangeLabels)
  const locale = useLocale()
  const rtl = useDirection() === 'rtl'
  const labelId = useId()
  const [range, setRange] = useControllableState<Range>(valueProp, defaultValue ?? [min, max])
  const { announce, announcer } = useAnnouncer()

  const fmt = format ?? numberFormat(locale).format
  const fmtTick = formatTick ?? fmt

  const counts = useMemo(() => binsProp ?? countBins(data ?? [], min, max, binCount), [binsProp, data, min, max, binCount])
  const peak = counts.reduce((a, b) => Math.max(a, b), 0)
  const n = Math.max(1, counts.length)
  const ticks = ticksProp ?? [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3)
  const pct = (v: number) => (max > min ? ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100 : 0)
  const [lo, hi] = range[0] <= range[1] ? range : [range[1], range[0]]

  // The first paint draws the bars at the baseline, so they rise into place.
  const [risen, setRisen] = useState(false)
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setRisen(true))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [])
  const grown = risen || k.reduced
  const height = (count: number) => (grown && peak > 0 ? Math.max(FLOOR, count / peak) : FLOOR)
  const wave = k.stagger('base') * 4

  // The readout is spoken once the range settles, never on the first render.
  const spoken = labels.valueRange(fmt(lo), fmt(hi))
  const lastSpoken = useRef(spoken)
  useEffect(() => {
    if (spoken === lastSpoken.current) return
    lastSpoken.current = spoken
    const timer = setTimeout(() => announce(spoken), ANNOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [spoken, announce])

  const change = (next: number | readonly number[]) => {
    if (!Array.isArray(next)) return
    const value: Range = [next[0]!, next[1]!]
    setRange(value)
    onValueChange?.(value)
  }

  /** A bin is in the range when its middle is. */
  const inRange = (i: number) => {
    const middle = min + ((i + 0.5) / n) * (max - min)
    return middle >= lo && middle <= hi
  }

  const bar = (count: number, i: number, selected: boolean) => (
    <span
      key={i}
      data-slot={selected ? 'histogram-range-selection-bar' : 'histogram-range-bar'}
      data-in-range={!selected && inRange(i) ? '' : undefined}
      className={cn(
        'absolute inset-y-0 transition-[clip-path] yj-duration-slow ease-emphasized reduced:transition-none',
        !selected ? 'own:bg-well' : tone === 'accent' ? 'own:bg-accent' : 'own:bg-line-strong',
      )}
      style={{
        // A 2px gap between bins, 1px each side of a bin's slot.
        insetInlineStart: `calc(${(i / n) * 100}% + 1px)`,
        width: `max(1px, calc(${100 / n}% - 2px))`,
        clipPath: `inset(${(1 - height(count)) * 100}% 0 0 0 round min(1px, var(--radius-xs)))`,
        transitionDelay: k.reduced ? undefined : `${(i / Math.max(1, n - 1)) * wave}s`,
      }}
    />
  )

  const [start, end] = [pct(lo), 100 - pct(hi)]

  return (
    <div
      data-slot="histogram-range"
      role="group"
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : ariaLabel}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-tone={tone}
      data-reduced-motion={k.reduced || undefined}
      className={cn('group/histogram own:flex w-full min-w-0 flex-col', className)}
      {...props}
    >
      <div data-slot="histogram-range-header" className="own:flex min-w-0 items-baseline gap-3">
        {label && (
          <span
            id={labelId}
            data-slot="histogram-range-label"
            className="min-w-0 truncate own:text-ui-sm own:text-fg-muted own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]"
          >
            {label}
          </span>
        )}
        <span
          aria-hidden
          data-slot="histogram-range-readout"
          className="own:ms-auto shrink-0 own:font-mono own:text-ui-sm whitespace-nowrap own:text-accent own:tabular-nums group-data-disabled/histogram:opacity-50"
        >
          {/* Each end is isolated, so a value with a unit keeps its order on an RTL page. */}
          <bdi data-slot="histogram-range-value">{fmt(lo)}</bdi> — <bdi data-slot="histogram-range-value">{fmt(hi)}</bdi>
        </span>
      </div>

      <div data-slot="histogram-range-plot" className="own:mt-3.5 own:flex flex-col">
        {/* Disabled, the bars and the axis dim as the Slider dims itself. */}
        <div data-slot="histogram-range-bars" aria-hidden className="relative own:h-10 group-data-disabled/histogram:opacity-50">
          {counts.map((count, i) => bar(count, i, false))}
          <div
            data-slot="histogram-range-selection"
            className="absolute inset-0"
            style={{ clipPath: rtl ? `inset(0 ${start}% 0 ${end}%)` : `inset(0 ${end}% 0 ${start}%)` }}
          >
            {counts.map((count, i) => bar(count, i, true))}
          </div>
        </div>
        <Slider
          value={[lo, hi]}
          min={min}
          max={max}
          step={step}
          name={name}
          disabled={disabled}
          thumbAlignment="center"
          thumbLabels={thumbLabels ?? (label ? [labels.minimumOf(label), labels.maximumOf(label)] : [labels.rangeMin, labels.rangeMax])}
          getAriaValueText={(_, value) => fmt(value)}
          onValueChange={change}
          onValueCommitted={(next) => Array.isArray(next) && onValueCommitted?.([next[0]!, next[1]!])}
          className={cn(
            // The control reaches up over the bars, so the whole plot is the hit area; the track sits 7px under them. Vertical swipes still scroll the page.
            '[&_[data-slot=slider-control]]:-mt-10 [&_[data-slot=slider-control]]:pt-[calc(2.5rem+7px)] [&_[data-slot=slider-control]]:touch-pan-y',
            // A thin recessed track.
            '[&_[data-slot=slider-track]]:bg-canvas [&_[data-slot=slider-track]]:inset-ring [&_[data-slot=slider-track]]:inset-ring-line-subtle',
            // The thumb: a caliper jaw, an upright tab in the action's ink standing on the track, lifted on a soft shadow; its hit area stays wide.
            '[&_[data-slot=slider-thumb]]:h-4.5 [&_[data-slot=slider-thumb]]:w-1.5 [&_[data-slot=slider-thumb]]:after:-inset-x-2.5',
            '[&_[data-slot=slider-thumb]>span]:border-0 [&_[data-slot=slider-thumb]>span]:bg-action [&_[data-slot=slider-thumb]>span]:shadow-sm-soft [&_[data-slot=slider-thumb]>span]:inset-ring [&_[data-slot=slider-thumb]>span]:inset-ring-(--ui--fill-edge)',
            // Its guide: a hairline from the tab up through the plot to its top, so the cut reads where it falls in the bars.
            '[&_[data-slot=slider-thumb]>span]:before:absolute [&_[data-slot=slider-thumb]>span]:before:inset-x-0 [&_[data-slot=slider-thumb]>span]:before:bottom-full [&_[data-slot=slider-thumb]>span]:before:mx-auto [&_[data-slot=slider-thumb]>span]:before:h-10 [&_[data-slot=slider-thumb]>span]:before:w-px [&_[data-slot=slider-thumb]>span]:before:bg-linear-to-t [&_[data-slot=slider-thumb]>span]:before:from-action/70 [&_[data-slot=slider-thumb]>span]:before:to-action/15',
          )}
        />
      </div>

      <div
        data-slot="histogram-range-axis"
        aria-hidden
        className="relative mt-1 h-4 own:font-mono own:text-ui-xs text-fg-muted own:tabular-nums group-data-disabled/histogram:opacity-50"
      >
        {ticks.map((tick) => {
          const at = pct(tick)
          return (
            <span
              key={tick}
              data-slot="histogram-range-tick"
              className={cn(
                'absolute top-0 whitespace-nowrap',
                at >= 100 ? '-translate-x-full rtl:translate-x-full' : at > 0 && '-translate-x-1/2 rtl:translate-x-1/2',
              )}
              style={{ insetInlineStart: `${at}%` }}
            >
              <bdi>{fmtTick(tick)}</bdi>
            </span>
          )
        })}
      </div>
      <span data-slot="histogram-range-status" className="own:contents">
        {announcer}
      </span>
    </div>
  )
}

export { HistogramRange, type HistogramRangeProps }
