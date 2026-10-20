'use client'

import { useEffect, useId, useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { ContentSwap, Counter } from '@youj/motion'
import { statCardLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { Card, type CardProps } from './card'
import { ShareBar } from './share-bar'
import { Skeleton } from './skeleton'

/* Analytics tiles, built like an instrument readout: a small label, one big
 * figure with its unit set small and muted, how it moved (a triangle and the
 * change, in the good or bad ink, then what it's compared against), and at
 * most one picture of the data beneath: its recent shape as bars (last
 * period's values as ticks on them), a share of a whole or progress to a
 * target (with a notch for the pace), or how a total splits.
 * - Parts: Stat is one tile (a group named by its label); StatGroup joins
 *   tiles into one panel on hairlines; StatCard is a tile on its own Card.
 *   Inside a tile: StatValue, StatDelta, StatNote, StatBars, StatMeter and
 *   StatBreakdown, in any order.
 * - Motion: the value rolls to each new number like an odometer (motion's
 *   Counter) and the change counts to its own; the triangle turns when the
 *   change does. Bars rise from the baseline left to right when they scroll
 *   into view and morph to new values; a meter's fill springs to its share;
 *   a breakdown's parts open from the inline start. Loading holds a skeleton
 *   and ContentSwap resolves the figures into focus.
 * - Reduced motion: every figure and picture is drawn at its value.
 * The pictures are decorative unless given a `label`: the figures and words
 * beside them say the same thing to assistive tech. */

type StatTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A tone as a color; `neutral` is the ink. */
const inkOf = (tone: StatTone) => toneColor(tone, 'var(--color-fg)')

/* ── Stat: one tile ─────────────────────────────────────────────────────── */

interface StatProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What is measured: "Monthly recurring revenue". Names the tile. */
  label: ReactNode
  /** At the end of the label's line: a period ("30 days"), a live marker, or a small menu button. */
  action?: ReactNode
  /** The figures and picture wait behind a skeleton; the tile is busy. */
  loading?: boolean
  /** Announced while loading. Default "Loading {label}" when the label is a string. */
  loadingLabel?: string
  children?: ReactNode
}

function Stat({ label, action, loading = false, loadingLabel, className, children, ...props }: StatProps) {
  const labelId = useId()
  const labels = useComponentLabels(statCardLabels)
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-busy={loading || undefined}
      data-slot="stat"
      className={cn('own:flex own:min-w-0 flex-col own:gap-2 own:p-4', className)}
      {...props}
    >
      <div data-slot="stat-head" className="own:flex own:min-h-5 own:items-center own:justify-between own:gap-3">
        <span
          id={labelId}
          data-slot="stat-label"
          className="min-w-0 truncate own:font-(family-name:--yj-label-font) own:text-ui-sm own:font-medium own:tracking-(--yj-label-tracking) own:text-fg-muted own:[text-transform:var(--yj-label-case)]"
        >
          {label}
        </span>
        {action != null && (
          <div data-slot="stat-action" className="own:-my-1 own:flex shrink-0 own:items-center gap-2 own:text-ui-xs own:text-fg-muted">
            {action}
          </div>
        )}
      </div>
      <ContentSwap
        loading={loading}
        loadingLabel={loadingLabel ?? (typeof label === 'string' ? labels.loadingNamed(label) : undefined)}
        fallback={<StatSkeleton />}
      >
        <div data-slot="stat-body" className="own:flex own:min-w-0 flex-col own:gap-1">
          {children}
        </div>
      </ContentSwap>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="own:flex flex-col gap-2">
      <Skeleton className="own:h-8 own:w-28" />
      <Skeleton className="own:h-3.5 own:w-36" />
    </div>
  )
}

/* ── StatGroup: tiles on one panel ──────────────────────────────────────── */

/**
 * Tiles joined into one panel, split by hairlines at the theme's stroke. Any
 * count wraps: each tile draws the line at its inline end and its foot, and
 * the panel clips the ones at its edges. Columns: auto-fit at 11rem and up;
 * set your own with `grid-cols-*`.
 */
function StatGroup({ className, ...props }: CardProps) {
  return (
    <Card
      data-stat-group=""
      className={cn(
        'own:grid own:grid-cols-[repeat(auto-fit,minmax(min(100%,var(--spacing)*44),1fr))] own:gap-0 overflow-hidden own:py-0',
        '*:data-[slot=stat]:[box-shadow:var(--yj-stroke-width,1px)_var(--yj-stroke-width,1px)_0_0_var(--color-line)]',
        'rtl:*:data-[slot=stat]:[box-shadow:calc(var(--yj-stroke-width,1px)*-1)_var(--yj-stroke-width,1px)_0_0_var(--color-line)]',
        '*:data-[slot=stat]:md:p-5',
        className,
      )}
      {...props}
    />
  )
}

/* ── StatValue: the figure ──────────────────────────────────────────────── */

interface StatValueProps extends Omit<ComponentProps<'span'>, 'children'> {
  value: number
  /** Where the first roll starts. Default 0; pass the value itself to start settled and roll only on a change. */
  from?: number
  /** Intl.NumberFormat options: currency, percent, compact notation, units. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Words Intl has no unit for, set small and muted after the figure: "seats", "/mo". */
  unit?: ReactNode
  /** `sm` for dense strips, `lg` for the one figure a panel leads with. Default `default`. */
  size?: 'sm' | 'default' | 'lg'
}

const VALUE_SIZE = { sm: 'own:text-xl', default: 'own:text-2xl', lg: 'own:text-4xl' }

/** The figure: it rolls to each new value like an odometer; a unit, percent sign or compact suffix sits small and muted on its baseline. */
function StatValue({ value, from, format, locale, unit, size = 'default', className, ...props }: StatValueProps) {
  const lang = useLocale(locale)
  return (
    <span
      data-slot="stat-value"
      data-size={size}
      className={cn(
        'own:flex min-w-0 flex-wrap own:items-baseline gap-x-1.5 own:leading-[1.1] own:font-semibold own:tracking-tight own:text-fg own:tabular-nums',
        VALUE_SIZE[size],
        // Units on the figure's baseline, small and muted, however Intl split them.
        'own:[&_[dir=ltr]]:items-baseline',
        '[&_:is([data-part=unit],[data-part=percentSign],[data-part=compact])]:text-[0.6em] [&_:is([data-part=unit],[data-part=percentSign],[data-part=compact])]:text-fg-muted',
        className,
      )}
      {...props}
    >
      <Counter mode="roll" value={value} from={from} format={format} locale={lang} />
      {unit != null && (
        <span data-slot="stat-unit" className="own:text-[0.5em] own:font-normal own:tracking-normal own:text-fg-muted">
          {unit}
        </span>
      )}
    </span>
  )
}

/* ── StatDelta: how it moved ────────────────────────────────────────────── */

interface StatDeltaProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** The change: a fraction (0.124 = 12.4%) by default, or in the value's own terms with `format`. */
  value: number
  /** Intl.NumberFormat options for the change. Default: a percentage to one decimal. */
  format?: Intl.NumberFormatOptions
  /** Down is good for this metric (latency, churn, cost): a fall takes the good ink. */
  invert?: boolean
  /** Default: the YoujProvider locale. */
  locale?: string
  /** What it's compared against, muted after the change: "vs. last month". */
  children?: ReactNode
}

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 }

/** The change as a triangle and a figure in the good or bad ink (words for assistive tech), then its comparison. */
function StatDelta({ value, format = PERCENT, invert = false, locale, className, children, ...props }: StatDeltaProps) {
  const k = useYouj()
  const lang = useLocale(locale)
  const labels = useComponentLabels(statCardLabels)
  // The first reading is shown as it is; later changes count to theirs.
  const first = useRef(Math.abs(value))
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const tone = direction === 'flat' ? 'neutral' : (direction === 'up') !== invert ? 'good' : 'bad'
  return (
    <span
      data-slot="stat-delta"
      data-direction={direction}
      data-tone={tone}
      className={cn('own:inline-flex own:min-w-0 flex-wrap own:items-baseline own:gap-x-2 own:gap-y-0.5 own:text-ui-sm', className)}
      {...props}
    >
      <span
        data-slot="stat-delta-value"
        className={cn(
          'own:inline-flex shrink-0 own:items-baseline gap-1 own:font-medium own:tabular-nums',
          tone === 'good' ? 'own:text-success-text' : tone === 'bad' ? 'own:text-danger-text' : 'own:text-fg-muted',
        )}
      >
        <MotionFeatures>
          {direction === 'flat' ? (
            <span aria-hidden className="own:mb-[0.3em] h-px w-2 self-end own:bg-current" />
          ) : (
            <m.svg
              aria-hidden
              viewBox="0 0 8 8"
              className="size-[0.6em] shrink-0 self-center fill-current"
              initial={false}
              animate={{ rotate: direction === 'down' ? 180 : 0 }}
              transition={k.reduced ? { type: false } : k.spring('snappy')}
            >
              <path d="M4 1 7.5 7h-7z" />
            </m.svg>
          )}
        </MotionFeatures>
        <span className="sr-only">{direction === 'up' ? labels.trendUp : direction === 'down' ? labels.trendDown : labels.trendFlat} </span>
        <Counter value={Math.abs(value)} from={first.current} format={format} locale={lang} inView={false} duration="slow" ease="standard" />
      </span>
      {children != null && (
        <span data-slot="stat-delta-comparison" className="own:min-w-0 own:text-fg-muted">
          {children}
        </span>
      )}
    </span>
  )
}

/* ── StatNote: a line of context ────────────────────────────────────────── */

/** A muted line under the figure, when there's no change to show: "Paid, waiting to go out". */
function StatNote({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="stat-note" className={cn('own:text-ui-sm own:text-fg-muted', className)} {...props} />
}

/* ── StatBars: the recent shape ─────────────────────────────────────────── */

interface StatBarsProps extends Omit<ComponentProps<'div'>, 'children' | 'color'> {
  /** The readings, oldest first: one bar each. */
  data: readonly number[]
  /** Last period's readings, aligned with `data`: a tick on each bar, so you see where it beat them. */
  previous?: readonly number[]
  /** The lit bar's color; the rest are a quiet tint of it. Default `neutral`, the ink. */
  tone?: StatTone
  /** Which bar is lit. Default: the latest. `none` lights none. */
  highlight?: number | 'none'
  /** The top of the scale. Default: the largest reading (or tick). */
  max?: number
  /** Accessible name, e.g. "Orders per hour today, peaking at 11 am". Without it the bars are decorative. */
  label?: string
}

/** A bar's visible part as a clip from the top, so its rounded top stays round at any height. */
const barClip = (share: number) => `inset(${Math.round((1 - Math.min(1, Math.max(0, share))) * 1000) / 10}% 0% 0% 0% round 1.5px)`

/** Readings as a row of thin bars on a baseline: the latest lit, the rest a quiet tint; with `previous`, last period's as ticks. */
function StatBars({ data, previous, tone = 'neutral', highlight, max, label, className, style, ...props }: StatBarsProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  // The first time they show they rise in turn; afterwards a new reading morphs in place.
  const entered = useRef(false)
  const entering = shown && !entered.current && !k.reduced
  useEffect(() => {
    if (shown) entered.current = true
  })
  const top = max ?? Math.max(0, ...data, ...(previous ?? []))
  const lit = highlight === 'none' ? -1 : (highlight ?? data.length - 1)
  const step = Math.min(k.stagger('tight'), k.duration('slow') / Math.max(1, data.length))
  const change = k.reduced ? { type: false as const } : k.tween('slow', 'standard')

  return (
    <MotionFeatures>
      <div
        ref={ref}
        data-slot="stat-bars"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        // Time reads left to right in either direction of text.
        dir="ltr"
        className={cn('relative own:mt-3 own:flex own:h-9 own:w-full own:items-end own:justify-between own:gap-[2px] own:border-b own:border-line own:pb-px', className)}
        style={{ '--stat-tone': inkOf(tone), ...style } as CSSProperties}
        {...props}
      >
        {data.map((v, i) => {
          const share = top > 0 ? v / top : 0
          const tick = previous?.[i]
          return (
            <span key={i} className="relative h-full max-w-3 min-w-px flex-1">
              <m.span
                data-slot="stat-bar"
                data-lit={i === lit || undefined}
                className={cn('absolute inset-0', i === lit ? 'own:bg-(--stat-tone)' : 'own:bg-[color-mix(in_oklab,var(--stat-tone)_30%,var(--color-chart-quiet))]')}
                initial={{ clipPath: barClip(k.reduced ? share : 0) }}
                animate={{ clipPath: barClip(shown ? share : 0) }}
                transition={entering ? { ...k.tween('deliberate', 'enter'), delay: i * step } : change}
              />
              {tick !== undefined && top > 0 && (
                // A full-height layer moved up by the tick's share of its own height: a transform, so it glides.
                <m.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  initial={false}
                  animate={{ y: `${-Math.min(1, Math.max(0, tick / top)) * 100}%`, opacity: shown ? 1 : 0 }}
                  transition={entering ? { ...k.tween('base', 'standard'), delay: k.duration('deliberate') * 0.6 } : change}
                >
                  <span data-slot="stat-bar-tick" className="absolute inset-x-0 bottom-0 own:h-[1.5px] own:bg-fg-muted" />
                </m.span>
              )}
            </span>
          )
        })}
      </div>
    </MotionFeatures>
  )
}

/* ── StatMeter: a share of a whole, or progress to a target ─────────────── */

interface StatMeterProps extends Omit<ComponentProps<'div'>, 'children'> {
  value: number
  /** The whole, or the target. */
  max: number
  /** A notch on the track at this value: where the pace says you should be by now, or a limit inside a bigger whole. Behind it, the fill turns warning. */
  marker?: number
  /** The fill. Default `accent`; `success` once the value reaches `max`. */
  tone?: StatTone
  /** Draw this many cells instead of a solid bar. */
  segments?: number
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The words after the share: "of the $150K target". */
  children?: ReactNode
  /** At the end of the caption: "$42K to go". */
  detail?: ReactNode
}

/** A thin track filled to value ÷ max, with an optional notch, over a caption that leads with the share. */
function StatMeter({ value, max, marker, tone, segments, locale, children, detail, className, ...props }: StatMeterProps) {
  const lang = useLocale(locale)
  const share = max > 0 ? value / max : 0
  const behind = marker !== undefined && value < marker
  const fill: StatTone = tone ?? (share >= 1 ? 'success' : behind ? 'warning' : 'accent')
  const percent = numberFormat(lang, { style: 'percent', maximumFractionDigits: share > 0 && share < 0.1 ? 1 : 0 }).format(share)
  return (
    <div data-slot="stat-meter" data-tone={fill} className={cn('own:mt-3 own:flex flex-col own:gap-2', className)} {...props}>
      <div className="relative">
        <ShareBar value={Math.min(value, max)} max={max} tone={fill} segments={segments} />
        {marker !== undefined && max > 0 && (
          <span
            aria-hidden
            data-slot="stat-meter-marker"
            className="absolute -inset-y-1 own:w-[1.5px] -translate-x-1/2 own:rounded-full own:bg-fg rtl:translate-x-1/2"
            style={{ insetInlineStart: `${Math.min(1, Math.max(0, marker / max)) * 100}%` }}
          />
        )}
      </div>
      <div className="own:flex min-w-0 own:items-baseline justify-between gap-3 own:text-ui-sm">
        <span className="min-w-0 own:text-fg-muted">
          <span data-slot="stat-meter-share" className="own:font-medium own:text-fg own:tabular-nums">
            {percent}
          </span>
          {children != null && <> {children}</>}
        </span>
        {detail != null && <span className="shrink-0 own:text-fg-muted own:tabular-nums">{detail}</span>}
      </div>
    </div>
  )
}

/* ── StatBreakdown: how a total splits ──────────────────────────────────── */

interface StatBreakdownPart {
  label: ReactNode
  value: number
  /** Default: the chart colors in order. */
  tone?: StatTone
}

interface StatBreakdownProps extends Omit<ComponentProps<'div'>, 'children'> {
  parts: StatBreakdownPart[]
  /** Intl.NumberFormat options for each part's figure in the key. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The key under the bar: each part's swatch, name and figure. Default true. */
  legend?: boolean
}

/** One bar split into its parts from the inline start, each in its tone, over a key of names and figures. */
function StatBreakdown({ parts, format, locale, legend = true, className, ...props }: StatBreakdownProps) {
  const k = useYouj()
  const lang = useLocale(locale)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const shown = k.reduced || inView
  // The first time it shows the parts open in turn; afterwards a new split glides at once.
  const entered = useRef(false)
  const entering = shown && !entered.current && !k.reduced
  useEffect(() => {
    if (shown) entered.current = true
  })
  const total = parts.reduce((sum, p) => sum + Math.max(0, p.value), 0)
  // A neutral part is the quiet gray, so the parts that need attention carry the color.
  const colors = parts.map((p, i) => toneColor(p.tone ?? `chart-${(i % 5) + 1}`))
  // Every part with a value keeps a sliver you can see.
  const floor = 0.02
  const raw = parts.map((p) => (total > 0 ? Math.max(0, p.value) / total : 0))
  const lifted = raw.map((s) => (s > 0 ? Math.max(s, floor) : 0))
  const sum = lifted.reduce((a, b) => a + b, 0) || 1
  let start = 0
  const spans = lifted.map((s) => {
    const from = start
    start += s / sum
    return { from, to: start }
  })
  const figure = numberFormat(lang, format)

  return (
    <div ref={ref} data-slot="stat-breakdown" className={cn('own:mt-3 own:flex flex-col own:gap-2.5', className)} {...props}>
      {/* Parts as clips of one full-width bar each, so a new split glides; mirrored in RTL so it grows from the inline start. */}
      <div aria-hidden data-slot="stat-breakdown-bar" className="relative own:h-1.5 rtl:-scale-x-100">
        <span className="absolute inset-0 own:rounded-[2px] own:bg-band" />
        {spans.map(({ from, to }, i) => {
          if (to <= from) return null
          const left = shown ? from : 0
          const right = shown ? 1 - to : 1
          const clip = `inset(0 calc(${(right * 100).toFixed(2)}% + ${right > 0.0001 ? 1 : 0}px) 0 calc(${(left * 100).toFixed(2)}% + ${left > 0.0001 ? 1 : 0}px) round 2px)`
          return (
            <span
              key={i}
              data-slot="stat-breakdown-part"
              className={cn('absolute inset-0', !k.reduced && 'transition-[clip-path] ease-standard yj-duration-slow')}
              style={{ backgroundColor: colors[i], clipPath: clip, transitionDelay: entering ? `${Math.round(i * k.ms('fast') * 0.5)}ms` : undefined }}
            />
          )
        })}
      </div>
      {legend && (
        <ul data-slot="stat-breakdown-legend" className="own:flex flex-wrap own:gap-x-3.5 own:gap-y-1 own:text-ui-sm">
          {parts.map((p, i) => (
            <li key={i} className="own:flex min-w-0 own:items-center gap-1.5">
              <span aria-hidden className="size-2 shrink-0 own:rounded-[2px]" style={{ backgroundColor: colors[i] }} />
              <span className="own:text-fg-muted">{p.label}</span>
              <span data-slot="stat-breakdown-value" className="own:font-medium own:text-fg own:tabular-nums">
                {figure.format(p.value)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── StatCard: a tile on its own card ───────────────────────────────────── */

interface StatCardProps extends Omit<CardProps, 'children' | 'title'> {
  /** What is measured: "Monthly recurring revenue". */
  label: ReactNode
  value: number
  /** Intl.NumberFormat options for the value: currency, percent, compact, units. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Words Intl has no unit for, small and muted after the value: "seats". */
  unit?: ReactNode
  /** The previous period's value. Gives the change when `delta` is not set. */
  previous?: number
  /** Change as a fraction (0.124 = +12.4%). Default: from `previous`. */
  delta?: number
  /** Down is good for this metric (latency, churn, cost): a fall is shown as good news. */
  invert?: boolean
  /** The period compared against, after the change: "vs. last month". Without a change it's a note. */
  comparison?: ReactNode
  /** A slot beside the label: a period, a menu, a link. */
  action?: ReactNode
  /** A slot under the figures: StatBars, StatMeter, StatBreakdown or a Sparkline. */
  chart?: ReactNode
  loading?: boolean
  /** Announced while loading. Default "Loading {label}" when the label is a string. */
  loadingLabel?: string
}

/** A KPI on a Card: Stat with its value, change and one picture, as props. */
function StatCard({
  label,
  value,
  format,
  locale,
  unit,
  previous,
  delta,
  invert = false,
  comparison,
  action,
  chart,
  loading = false,
  loadingLabel,
  className,
  ...props
}: StatCardProps) {
  const change = delta ?? (previous ? (value - previous) / Math.abs(previous) : undefined)
  return (
    <Card size="sm" className={cn('own:gap-0 own:py-0', className)} {...props}>
      <Stat label={label} action={action} loading={loading} loadingLabel={loadingLabel} className="own:p-(--card-spacing)">
        <StatValue value={value} format={format} locale={locale} unit={unit} />
        {change !== undefined ? (
          <StatDelta value={change} invert={invert} locale={locale}>
            {comparison}
          </StatDelta>
        ) : (
          comparison != null && <StatNote>{comparison}</StatNote>
        )}
        {chart != null && (
          <div data-slot="stat-chart" className="own:mt-3 own:[&>[data-slot^=stat-]]:mt-0">
            {chart}
          </div>
        )}
      </Stat>
    </Card>
  )
}

export {
  Stat,
  StatBars,
  StatBreakdown,
  StatCard,
  StatDelta,
  StatGroup,
  StatMeter,
  StatNote,
  StatValue,
  type StatBarsProps,
  type StatBreakdownPart,
  type StatBreakdownProps,
  type StatCardProps,
  type StatDeltaProps,
  type StatMeterProps,
  type StatProps,
  type StatTone,
  type StatValueProps,
}
