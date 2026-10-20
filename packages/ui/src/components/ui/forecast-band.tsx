'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties } from 'react'
import { AnimatePresence, m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { forecastBandLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { cn, dateTimeFormat, numberFormat, relativeTimeFormat, toneColor } from '../../lib/utils'
import { Hatch } from './hatched-bar'

/* Where a running total will land: spend so far as a solid ink line over a
 * faint wash, and from today the forecast as a line in its tone inside its
 * likely range, over a hatched projected area (HatchedBar's Hatch: solid for
 * what's settled, hatched for what isn't). The budget is a dashed line; where
 * the forecast crosses it, the stretch above the line is hatched in danger and
 * a marker names the day.
 * - Time runs from the inline start, like the kit's other rulers, so in RTL
 *   the plot mirrors (it holds no text); every label stays upright.
 * - Motion: when it scrolls into view the actual line draws in to today (a
 *   clip on the deliberate token, emphasized), the forecast and its range
 *   wipe on to the period's end, and the crossing marker arrives on the
 *   settle spring as the wipe reaches it, its ring pulsing once. New data
 *   morphs every path on the smooth spring (keep the point counts stable)
 *   and the budget line and marker glide; the ring pulses once more only
 *   when the crossing day changes. Nothing loops.
 * - Scenario: `scenario` adds a second path from today (what the total does
 *   if something changes) as a solid line in its own tone, ending in a dot;
 *   the summary says where it ends and whether it crosses the budget.
 * - Semantics: the plot is an image named by `label`, described by a text
 *   summary (spent, budget, forecast and its range, the crossing day, the
 *   scenario); the legend is text.
 * - Reduced motion: drawn in place, the ring static. */

type ForecastTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ForecastPoint {
  /** The forecast running total at the end of that day. */
  value: number
  /** The low and high ends of its likely range. */
  low: number
  high: number
}

interface ForecastScenario {
  /** Its running total for each remaining day, like the forecast's values. */
  values: readonly number[]
  /** Its name in the legend and the summary: "With the new rates". Default: the labels' "Scenario". */
  label?: string
  /** Default 'chart-2'. */
  tone?: ForecastTone
}

interface ForecastBandProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The running total at the end of each elapsed day, the last one being today. */
  actual: readonly number[]
  /** The forecast running total for each remaining day of the period. */
  forecast: readonly ForecastPoint[]
  budget: number
  /** The period's first day, to name dates ("Sep 28"). Without it the crossing is named relative to today ("in 9 days") and days are numbered. */
  start?: Date | string
  /** The top of the scale. Default: a round number above the budget and the forecast's high; pass one to keep the scale still across data. */
  max?: number
  /** Intl.NumberFormat options for the amounts, e.g. `{ style: 'currency', currency: 'USD' }`. */
  format?: Intl.NumberFormatOptions
  /** Writes every amount (and the scale) with your own function, for units Intl has none for ("1,240 kWh"). Replaces `format`. */
  formatValue?: (value: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Names the chart for assistive tech. Default: the labels' "Spend forecast". */
  label?: string
  /** The forecast's color: its line, range and hatch. Default 'chart-5'. */
  tone?: ForecastTone
  /** Show the legend over the plot. Default true. */
  legend?: boolean
  /** A second path from today: what the total does if something changes. */
  scenario?: ForecastScenario
}

const DAY = 86_400_000
/** The strip over the plot where the crossing's flag sits. */
const LANE = '1.5rem'
/** The crossing's ring, once: stable references, so a re-render never replays it. */
const PULSE_FROM = { scale: 0.6, opacity: 0 }
const PULSE = { scale: [0.6, 2.4], opacity: [0.7, 0] }
/** Pixels between a day tick's center and today's: half of each label and a gap. */
const TICK_CLEARANCE = 58

const r2 = (n: number) => Math.round(n * 100) / 100
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

/** A calendar day as UTC midnight: an ISO date as written, a Date by its local calendar day. */
function toUtcDay(start: Date | string | undefined) {
  if (start === undefined) return undefined
  if (typeof start === 'string') {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start)
    if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  }
  const date = new Date(start)
  return Number.isNaN(date.getTime()) ? undefined : Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

/** 1, 2, 2.5 or 5 times a power of ten: the step for about three intervals under `top`. */
function niceStep(raw: number) {
  const power = 10 ** Math.floor(Math.log10(raw))
  const n = raw / power
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power
}

interface Pt {
  x: number
  v: number
}

/**
 * Where a running total first reaches `level`, as a fractional day (day d
 * spans d − 1 to d), from the origin through each point. Undefined if it
 * never does.
 */
function crossingOf(points: readonly Pt[], level: number) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    if (a.v < level && b.v >= level) return a.x + ((level - a.v) / (b.v - a.v)) * (b.x - a.x)
  }
  return undefined
}

/** Each segment's start plus one more vertex: where it crosses `level`, or its midpoint. A stable count, so shapes morph. */
function splitAt(points: readonly Pt[], level: number) {
  const out: Pt[] = []
  points.forEach((p, i) => {
    out.push(p)
    const q = points[i + 1]
    if (!q) return
    const crosses = (p.v - level) * (q.v - level) < 0
    const t = crosses ? (level - p.v) / (q.v - p.v) : 0.5
    out.push({ x: p.x + t * (q.x - p.x), v: p.v + t * (q.v - p.v) })
  })
  return out
}

function ForecastBand({
  actual,
  forecast,
  budget,
  start,
  max: maxProp,
  format,
  formatValue,
  locale: localeProp,
  label,
  tone = 'chart-5',
  legend = true,
  scenario,
  className,
  style,
  ...props
}: ForecastBandProps) {
  const k = useYouj()
  const labels = useComponentLabels(forecastBandLabels)
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const summaryId = useId()
  const gradientId = `${useId().replace(/:/g, '')}-wash`
  const ref = useRef<HTMLDivElement>(null)
  const axisRef = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  // The x axis's width, so a day tick near today's chip gives way only when they would touch.
  const [axisWidth, setAxisWidth] = useState(560)
  useLayoutEffect(() => {
    const el = axisRef.current
    if (!el) return
    const measure = () => el.clientWidth && setAxisWidth(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const shown = k.reduced || inView
  // The first reveal is choreographed; later data changes morph in place.
  const [played, setPlayed] = useState(false)
  const first = !k.reduced && !played

  const key = format && JSON.stringify(format)
  const money = useMemo(
    () => (formatValue ? { format: formatValue } : numberFormat(locale, { ...format, minimumFractionDigits: 0, maximumFractionDigits: 0 })),
    [locale, key, formatValue],
  )
  const compact = useMemo(
    () => (formatValue ? { format: formatValue } : numberFormat(locale, { ...format, notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 })),
    [locale, key, formatValue],
  )
  const origin = useMemo(() => toUtcDay(start), [start instanceof Date ? start.getTime() : start])
  const dayName = useMemo(() => dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }), [locale])
  const relative = useMemo(() => relativeTimeFormat(locale, { numeric: 'auto' }), [locale])
  const count = useMemo(() => numberFormat(locale), [locale])

  const geo = useMemo(() => {
    const today = actual.length
    const days = Math.max(1, today + forecast.length)
    const last = actual.at(-1) ?? 0
    const past: Pt[] = [{ x: 0, v: 0 }, ...actual.map((v, i) => ({ x: i + 1, v }))]
    const ahead: (Pt & { low: number; high: number })[] = [
      { x: today, v: last, low: last, high: last },
      ...forecast.map((f, i) => ({ x: today + i + 1, v: f.value, low: f.low, high: f.high })),
    ]
    const alt: Pt[] = scenario ? [{ x: today, v: last }, ...scenario.values.map((v, i) => ({ x: today + i + 1, v }))] : []
    const peak = Math.max(budget, last, ...forecast.map((f) => Math.max(f.high, f.value)), ...alt.map((p) => p.v), 1)
    const step = niceStep((maxProp ?? peak * 1.08) / 3)
    const top = maxProp ?? Math.ceil((peak * 1.08) / step) * step
    const ticks = Array.from({ length: Math.floor(top / step + 1e-9) + 1 }, (_, i) => i * step)
    const X = (x: number) => r2((x / days) * 100)
    const Y = (v: number) => r2(100 - (Math.min(Math.max(v, 0), top) / top) * 100)
    const path = (pts: readonly Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)},${Y(p.v)}`).join(' ')

    // Past the crossing, the hatch under the forecast is split at the budget: in the tone below, danger above.
    const split = splitAt(ahead, budget)
    const polygon = (pts: readonly Pt[], close: string) => `polygon(${pts.map((p) => `${X(p.x)}% ${Y(p.v)}%`).join(', ')}, ${close})`
    const end = X(ahead.at(-1)!.x)
    const from = X(today)
    const cross = crossingOf([...past, ...ahead.slice(1)], budget)
    return {
      today,
      days,
      top,
      ticks,
      last,
      todayAt: X(today),
      lastAt: Y(last),
      actualLine: path(past),
      actualArea: `${path(past)} L${X(today)},100 L0,100 Z`,
      forecastLine: path(ahead),
      range: `${path(ahead.map((p) => ({ x: p.x, v: p.high })))} ${path([...ahead].reverse().map((p) => ({ x: p.x, v: p.low }))).replace(/^M/, 'L')} Z`,
      under: polygon(
        split.map((p) => ({ x: p.x, v: Math.min(p.v, budget) })),
        `${end}% 100%, ${from}% 100%`,
      ),
      over: polygon(
        split.map((p) => ({ x: p.x, v: Math.max(p.v, budget) })),
        `${end}% ${Y(budget)}%, ${from}% ${Y(budget)}%`,
      ),
      budgetAt: Y(budget),
      crossing: cross === undefined ? undefined : { at: X(cross), day: Math.max(1, Math.ceil(cross - 1e-9)) },
      projected: ahead.at(-1)!,
      scenario:
        alt.length > 1
          ? {
              line: path(alt),
              end: { at: X(alt.at(-1)!.x), v: alt.at(-1)!.v, y: Y(alt.at(-1)!.v) },
              crossing: crossingOf([...past, ...alt.slice(1)], budget),
            }
          : undefined,
    }
  }, [actual, forecast, budget, maxProp, scenario])

  const dateOf = (day: number) => (origin !== undefined ? dayName.format(new Date(origin + (day - 1) * DAY)) : relative.format(day - geo.today, 'day'))
  const tickName = (day: number) => (origin !== undefined ? dayName.format(new Date(origin + (day - 1) * DAY)) : count.format(day))
  const crossing = geo.crossing
  const crossName = crossing && dateOf(crossing.day)
  const scenarioName = scenario?.label ?? labels.forecastScenario
  const summary = [
    labels.forecastSummary(money.format(geo.last), money.format(budget), money.format(geo.projected.v), money.format(geo.projected.low), money.format(geo.projected.high)),
    // Left unpunctuated: a date may end in its own abbreviation point ("5. Sept."), and some scripts end sentences otherwise.
    crossName ? labels.forecastCrosses(crossName) : labels.forecastWithin,
    ...(geo.scenario
      ? [
          labels.forecastScenarioSummary(scenarioName, money.format(geo.scenario.end.v)),
          geo.scenario.crossing === undefined ? labels.forecastWithin : labels.forecastCrosses(dateOf(Math.max(1, Math.ceil(geo.scenario.crossing - 1e-9)))),
        ]
      : []),
  ].join(' ')

  // Day ticks a week apart, the period's last day in place of one that would crowd it, and none within reach of today's chip.
  const dayTicks = useMemo(() => {
    const list = Array.from({ length: Math.ceil(geo.days / 7) }, (_, i) => 1 + i * 7).filter((d) => d <= geo.days)
    if (list.length && geo.days - list.at(-1)! < 3) list[list.length - 1] = geo.days
    else if (geo.days > 1) list.push(geo.days)
    const clear = (TICK_CLEARANCE / axisWidth) * 100
    return list.filter((d) => geo.today === 0 || Math.abs(((d - 0.5) / geo.days) * 100 - geo.todayAt) > clear)
  }, [geo.days, geo.todayAt, geo.today, axisWidth])

  // Choreography of the first reveal, in seconds.
  const drawn = k.duration('deliberate')
  const wipeDelay = drawn * 0.8
  const wipe = k.duration('slow')
  const arrival = crossing
    ? crossing.at <= geo.todayAt
      ? drawn * (geo.todayAt ? crossing.at / geo.todayAt : 0)
      : wipeDelay + wipe * Math.min(1, (crossing.at - geo.todayAt) / Math.max(1, 100 - geo.todayAt))
    : 0
  const glide = k.reduced ? { type: false as const } : k.spring('smooth')
  const leave = k.reduced ? { type: false as const } : k.tween('fast', 'exit')
  const align = (at: number) => (at < 25 ? 'start' : at > 70 ? 'end' : 'center')
  const shift = (at: number) => `${rtl ? -at : at}%`
  const toneVar = { '--forecast-tone': toneColor(tone), '--forecast-scenario-tone': toneColor(scenario?.tone ?? 'chart-2') } as CSSProperties

  return (
    <MotionFeatures>
      <div
        ref={ref}
        data-slot="forecast-band"
        data-state={crossing ? 'over' : 'within'}
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:flex w-full min-w-0 flex-col gap-4', className)}
        style={{ ...toneVar, ...style }}
        {...props}
      >
        {legend && (
          <ul data-slot="forecast-band-legend" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 own:text-ui-sm own:text-fg-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden data-slot="forecast-band-swatch" className="h-0.5 w-3.5 rounded-full bg-fg" />
              {labels.forecastActual}
            </li>
            <li className="flex items-center gap-2">
              <Hatch tone={tone} data-slot="forecast-band-swatch" className="size-3 shadow-[inset_0_2px_0_var(--forecast-tone)]" />
              {labels.forecastProjected}
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden data-slot="forecast-band-swatch" className="size-3 rounded-[2px] bg-[color-mix(in_oklab,var(--forecast-tone)_30%,transparent)]" />
              {labels.forecastRange}
            </li>
            {geo.scenario && (
              <li className="flex items-center gap-2">
                <span aria-hidden data-slot="forecast-band-swatch" className="h-0.5 w-3.5 rounded-full bg-(--forecast-scenario-tone)" />
                {scenarioName}
              </li>
            )}
            <li className="flex items-center gap-2">
              <span aria-hidden data-slot="forecast-band-swatch" className="w-3.5 border-t border-dashed border-line-strong" />
              {labels.forecastBudget}
            </li>
          </ul>
        )}

        <div role="img" aria-label={label ?? labels.forecast} aria-describedby={summaryId} data-slot="forecast-band-chart" className="own:flex flex-col">
          <div className="own:flex">
            <div data-slot="forecast-band-axis" data-axis="y" className="relative w-11 shrink-0 own:font-mono own:text-ui-xs text-fg-muted own:tabular-nums">
              {geo.ticks.map((tick) => (
                <span
                  key={tick}
                  data-slot="forecast-band-tick"
                  className="absolute end-2.5 -translate-y-1/2 own:leading-none whitespace-nowrap"
                  style={{ top: `calc(${LANE} + (100% - ${LANE}) * ${r2(1 - tick / geo.top)})` }}
                >
                  {compact.format(tick)}
                </span>
              ))}
            </div>

            <div data-slot="forecast-band-plot" className="relative h-[var(--forecast-band-height,13rem)] min-w-0 flex-1 overflow-x-clip">
              <div data-slot="forecast-band-data" className="absolute inset-x-0 bottom-0" style={{ top: LANE }}>
                {geo.ticks.map((tick) => (
                  <span
                    key={tick}
                    aria-hidden
                    data-slot="forecast-band-grid"
                    className={cn('absolute inset-x-0 border-t', tick === 0 ? 'border-line-subtle' : 'border-dashed border-line-subtle')}
                    style={{ top: `${r2(100 - (tick / geo.top) * 100)}%` }}
                  />
                ))}

                {/* The art: no text, so it mirrors whole in RTL. */}
                <div data-slot="forecast-band-art" className="absolute inset-0 rtl:-scale-x-100">
                  <m.div
                    data-slot="forecast-band-actual"
                    className="absolute inset-0"
                    initial={k.reduced ? false : { clipPath: 'inset(-4px 100% -4px 0%)' }}
                    animate={{ clipPath: shown ? `inset(-4px ${r2(100 - geo.todayAt)}% -4px 0%)` : 'inset(-4px 100% -4px 0%)' }}
                    transition={first ? k.tween('deliberate', 'emphasized') : glide}
                  >
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" style={{ stopColor: 'var(--color-fg)', stopOpacity: 0.13 }} />
                          <stop offset="1" style={{ stopColor: 'var(--color-fg)', stopOpacity: 0 }} />
                        </linearGradient>
                      </defs>
                      <m.path data-slot="forecast-band-actual-area" initial={false} animate={{ d: geo.actualArea }} transition={glide} fill={`url(#${gradientId})`} />
                      <m.path
                        data-slot="forecast-band-actual-line"
                        initial={false}
                        animate={{ d: geo.actualLine }}
                        transition={glide}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={1.75}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="stroke-fg"
                      />
                    </svg>
                  </m.div>

                  <m.div
                    data-slot="forecast-band-forecast"
                    className="absolute inset-0"
                    initial={k.reduced ? false : { clipPath: `inset(-4px ${r2(100 - geo.todayAt)}% -4px 0%)` }}
                    animate={{ clipPath: shown ? 'inset(-4px 0% -4px 0%)' : `inset(-4px ${r2(100 - geo.todayAt)}% -4px 0%)` }}
                    transition={first ? { ...k.tween('slow', 'enter'), delay: wipeDelay } : glide}
                    onAnimationComplete={() => shown && !played && setPlayed(true)}
                  >
                    {/* The projected area: hatched in the tone under the budget, fading toward the baseline. */}
                    <m.div
                      data-slot="forecast-band-projection"
                      className="absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]"
                      initial={false}
                      animate={{ clipPath: geo.under }}
                      transition={glide}
                    >
                      <Hatch tone={tone} className="absolute inset-0 rounded-none" />
                    </m.div>
                    <m.div data-slot="forecast-band-overshoot" className="absolute inset-0" initial={false} animate={{ clipPath: geo.over }} transition={glide}>
                      <Hatch tone="danger" className="absolute inset-0 rounded-none" />
                    </m.div>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                      <m.path
                        data-slot="forecast-band-range"
                        initial={false}
                        animate={{ d: geo.range }}
                        transition={glide}
                        className="fill-(--forecast-tone) [fill-opacity:calc(0.16+0.06*var(--yj-dark))]"
                      />
                      <m.path
                        data-slot="forecast-band-forecast-line"
                        initial={false}
                        animate={{ d: geo.forecastLine }}
                        transition={glide}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={1.75}
                        strokeDasharray="4 3"
                        strokeLinejoin="round"
                        className="stroke-(--forecast-tone)"
                      />
                      {geo.scenario && (
                        <m.path
                          data-slot="forecast-band-scenario-line"
                          initial={false}
                          animate={{ d: geo.scenario.line }}
                          transition={glide}
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                          strokeWidth={1.75}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          className="stroke-(--forecast-scenario-tone)"
                        />
                      )}
                    </svg>
                    {geo.scenario && (
                      // Where the scenario ends: moved by a transform, like the now dot (the art mirrors it in RTL).
                      <m.div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        initial={false}
                        animate={{ x: `${geo.scenario.end.at}%`, y: `${geo.scenario.end.y}%` }}
                        transition={glide}
                      >
                        <span
                          data-slot="forecast-band-scenario-end"
                          className={cn(
                            'absolute top-0 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full', // youj-allow: physical side the art is mirrored whole in RTL, so the dot keeps its physical corner
                            'bg-(--forecast-scenario-tone) shadow-[0_0_0_2px_var(--color-surface)]',
                          )}
                        />
                      </m.div>
                    )}
                  </m.div>
                </div>

                <span
                  aria-hidden
                  data-slot="forecast-band-today"
                  className="absolute inset-y-0 w-px -translate-x-1/2 bg-line-strong rtl:translate-x-1/2"
                  style={{ insetInlineStart: `${geo.todayAt}%` }}
                />

                {/* The budget line, its flag at the start (at the end when the crossing is early, so they never meet). */}
                <m.div
                  data-slot="forecast-band-budget"
                  className="pointer-events-none absolute inset-0"
                  initial={k.reduced ? false : { y: `${geo.budgetAt}%`, opacity: 0 }}
                  animate={{ y: `${geo.budgetAt}%`, opacity: shown ? 1 : 0 }}
                  transition={first ? { y: glide, opacity: k.tween('base', 'enter') } : glide}
                >
                  <span className="absolute inset-x-0 top-0 border-t border-dashed border-line-strong" />
                  <span
                    data-slot="forecast-band-flag"
                    className={cn(
                      'absolute bottom-full own:mb-1.5 own:flex items-baseline gap-1.5 own:text-ui-xs own:leading-none whitespace-nowrap own:text-fg-muted',
                      crossing && crossing.at < 38 ? 'end-0' : 'start-0',
                    )}
                  >
                    <span data-slot="forecast-band-flag-name" className={VOICE}>{labels.forecastBudget}</span>
                    <span data-slot="forecast-band-flag-value" className="own:font-mono own:text-fg own:tabular-nums">{money.format(budget)}</span>
                  </span>
                </m.div>

                {/* Now: a dot where the actual line ends. */}
                <m.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  initial={false}
                  animate={{ x: shift(geo.todayAt), y: `${geo.lastAt}%` }}
                  transition={glide}
                >
                  <m.span
                    data-slot="forecast-band-now"
                    className="absolute start-0 top-0 own:-ms-1 own:-mt-1 size-2 rounded-full bg-fg shadow-[0_0_0_2px_var(--color-surface)]"
                    initial={k.reduced ? false : { scale: 0 }}
                    animate={{ scale: shown ? 1 : 0 }}
                    transition={first ? { ...k.spring('snappy'), delay: drawn * 0.9 } : glide}
                  />
                </m.div>

                <AnimatePresence>
                  {shown && crossing && (
                    <m.div
                      key="crossing"
                      aria-hidden
                      data-slot="forecast-band-crossing"
                      data-day={crossing.day}
                      className="pointer-events-none absolute inset-0"
                      initial={{ x: shift(crossing.at), y: `${geo.budgetAt}%` }}
                      animate={{ x: shift(crossing.at), y: `${geo.budgetAt}%` }}
                      transition={glide}
                    >
                      <m.span
                        data-slot="forecast-band-marker"
                        className="absolute start-0 top-0 own:-ms-1.25 own:-mt-1.25 size-2.5 rounded-full bg-danger shadow-[0_0_0_2px_var(--color-surface),0_0_0_5px_color-mix(in_oklab,var(--color-danger)_28%,transparent)]"
                        initial={k.reduced ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0, opacity: 0, transition: leave }}
                        transition={first ? { ...k.spring('settle'), delay: arrival } : k.spring('settle')}
                      />
                      {!k.reduced && (
                        // Keyed by the day: it pulses once when the marker arrives, and once more only when the day moves.
                        <m.span
                          key={crossing.day}
                          data-slot="forecast-band-pulse"
                          className="absolute start-0 top-0 own:-ms-2.5 own:-mt-2.5 size-5 rounded-full border border-danger"
                          initial={PULSE_FROM}
                          animate={PULSE}
                          transition={{ ...k.tween('deliberate', 'enter'), delay: first ? arrival + k.duration('fast') : k.duration('base') }}
                        />
                      )}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* The lane over the plot: the crossing's flag, with a leader down to the marker. */}
              <AnimatePresence>
                {shown && crossing && (
                  <m.div
                    key="flag"
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    initial={{ x: shift(crossing.at), opacity: k.reduced ? 1 : 0 }}
                    animate={{ x: shift(crossing.at), opacity: 1 }}
                    exit={{ opacity: 0, transition: leave }}
                    transition={first ? { x: glide, opacity: { ...k.tween('base', 'enter'), delay: arrival } } : { x: glide, opacity: k.tween('base', 'enter') }}
                  >
                    <span
                      data-slot="forecast-band-leader"
                      className="absolute start-0 top-[1.1rem] bottom-0 w-px -translate-x-1/2 bg-[color-mix(in_oklab,var(--color-danger)_50%,transparent)] transition-[clip-path] yj-duration-slow ease-standard rtl:translate-x-1/2"
                      // It ends at the marker: the part under the budget line is clipped off (100% less the lane's rest is the data's height).
                      style={{ clipPath: `inset(0 0 calc(${r2(1 - geo.budgetAt / 100)} * (100% - 0.4rem)) 0)` }}
                    />
                    <span
                      data-slot="forecast-band-flag"
                      data-align={align(crossing.at)}
                      className={cn(
                        'absolute start-0 top-0.5 own:text-ui-xs own:leading-none whitespace-nowrap own:text-danger-text transition-[translate] yj-duration-base ease-standard',
                        VOICE,
                        align(crossing.at) === 'center' && '-translate-x-1/2 rtl:translate-x-1/2',
                        align(crossing.at) === 'end' && '-translate-x-full rtl:translate-x-full',
                      )}
                    >
                      {labels.forecastCrosses(crossName!)}
                    </span>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div ref={axisRef} data-slot="forecast-band-axis" data-axis="x" className="relative ms-11 mt-2 h-5 own:font-mono own:text-ui-xs text-fg-muted own:tabular-nums">
            {dayTicks.map((day) => {
              const at = r2(((day - 0.5) / geo.days) * 100)
              return (
                <span
                  key={day}
                  data-slot="forecast-band-tick"
                  className={cn(
                    'absolute top-0.5 own:leading-none whitespace-nowrap',
                    at < 6 ? '' : at > 94 ? '-translate-x-full rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2',
                  )}
                  style={{ insetInlineStart: `${at < 6 ? 0 : at > 94 ? 100 : at}%` }}
                >
                  {tickName(day)}
                </span>
              )
            })}
            {geo.today > 0 && (
              <span
                data-slot="forecast-band-today-label"
                className={cn(
                  'absolute top-0 -translate-x-1/2 rounded-full bg-fg px-1.5 py-0.5 own:text-ui-xs own:leading-none whitespace-nowrap own:text-canvas rtl:translate-x-1/2',
                  VOICE,
                )}
                style={{ insetInlineStart: `${geo.todayAt}%` }}
              >
                {labels.today}
              </span>
            )}
          </div>
        </div>
        <p id={summaryId} data-slot="forecast-band-summary" className="sr-only">
          {summary}
        </p>
      </div>
    </MotionFeatures>
  )
}

export { ForecastBand, type ForecastBandProps, type ForecastPoint, type ForecastScenario, type ForecastTone }
