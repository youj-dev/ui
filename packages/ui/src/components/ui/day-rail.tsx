'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { m } from 'motion/react'
import type { CSSProperties } from 'react'
import { MotionFeatures } from '@youj/core'
import { PlaneIcon } from '@youj/icons'
import { dayRailLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'

/* A trip on one rail, a column per day. Flights arc over the rail from
 * departure to arrival, their code at the top of the arc; a change of clocks
 * on arrival is marked beside the landing (+1 h). Stays sit under the rail as
 * spans from check-in to check-out, in the stop's color, with their nights.
 * Now is a line in the accent that moves with the clock; during a flight the
 * plane rides its arc. Past legs are solid and quiet, the next ones dashed.
 * - Days are tabs: pick one (arrow keys, mirrored in RTL; Home and End) and
 *   its ItineraryDay panel shows. The rail itself is described in a list for
 *   screen readers: every leg with its times and clock change, every stay.
 * - Motion: arcs draw in along their length on mount, the plane and the now
 *   line glide on the slow token as the clock ticks. Reduced motion: arcs are
 *   drawn, the plane and the line jump. */

type ItineraryTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ItineraryStop {
  id: string
  /** On the rail, in mono: "LIS". */
  code: string
  /** "Lisbon". */
  name: string
  /** Local time's offset from UTC, in minutes: 60 for Lisbon in summer. */
  utcOffset: number
  /** Its stays' color. Default: the chart colors in turn. */
  tone?: ItineraryTone
}

interface ItineraryLeg {
  id: string
  from: string
  to: string
  depart: Date | number
  arrive: Date | number
  /** "TP 1036". */
  code?: string
}

interface ItineraryStay {
  id: string
  /** The stop it's in. */
  at: string
  start: Date | number
  end: Date | number
  /** "Casa Bonay". */
  name: string
}

interface DayRailProps extends Omit<TabsPrimitive.Root.Props, 'value' | 'defaultValue' | 'onValueChange'> {
  stops: ItineraryStop[]
  legs: ItineraryLeg[]
  stays?: ItineraryStay[]
  /** The first moment shown: the first day's midnight, at the first stop. */
  start: Date | number
  /** Days shown. Default 7. */
  days?: number
  /** Where the now line sits. Default: the clock, read every 30 s once the page is live. `null` hides it. */
  now?: Date | number | null
  /** The day shown, from 0. Controlled. */
  value?: number
  /** The day shown first. Default: today, if the trip is under way, else the first day. */
  defaultValue?: number
  onValueChange?: (day: number) => void
  /** The rail's accessible name. Default "Itinerary". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
}

const DAY = 86_400_000
const TONES: ItineraryTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'
/** The arcs' layer, in px: tall enough for the highest arc and its code. */
const SKY = 84
const BASE = SKY - 6

/** A time as it reads on the clocks there: shift into the stop's offset, then read it in UTC. */
const localFormat = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const f = dateTimeFormat(locale, { ...options, timeZone: 'UTC' })
  return (t: number, offset: number) => f.format(t + offset * 60_000)
}

function DayRail({
  stops,
  legs,
  stays = [],
  start,
  days = 7,
  now: nowProp,
  value,
  defaultValue,
  onValueChange,
  label,
  locale: localeProp,
  className,
  children,
  ...props
}: DayRailProps) {
  const direction = useDirection()
  const k = useYouj()
  const labels = useComponentLabels(dayRailLabels)
  const locale = useLocale(localeProp)
  const clock = useNow(30_000)
  const now = nowProp === undefined ? clock : nowProp === null ? null : +nowProp
  const t0 = +start
  const span = days * DAY
  const at = (t: number) => Math.min(1, Math.max(0, (t - t0) / span))
  const stopOf = new Map(stops.map((s, i) => [s.id, { stop: s, tone: s.tone ?? TONES[i % TONES.length]! }]))
  const home = stops[0]?.utcOffset ?? 0
  const todayIndex = now !== null && now >= t0 && now < t0 + span ? Math.floor((now - t0) / DAY) : undefined

  const dayLong = localFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const dayName = localFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  const weekday = localFormat(locale, { weekday: 'short' })
  const dayNum = localFormat(locale, { day: 'numeric' })
  const hours = numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow', signDisplay: 'always' })
  const shiftOf = (leg: ItineraryLeg) => {
    const from = stopOf.get(leg.from)?.stop.utcOffset ?? 0
    const to = stopOf.get(leg.to)?.stop.utcOffset ?? 0
    return to === from ? undefined : hours.format((to - from) / 60)
  }

  const ordered = [...legs].sort((a, b) => +a.depart - +b.depart)
  const inFlight = now === null ? undefined : ordered.find((l) => +l.depart <= now && now < +l.arrive)
  const arc = (leg: ItineraryLeg) => arcOf(leg, at)
  // A stop's code under the rail: where the trip starts, and where each leg lands.
  const marks = ordered.flatMap((l, i) => [
    ...(i === 0 ? [{ id: `${l.id}-from`, x: arc(l).x1, stop: l.from, shift: undefined }] : []),
    { id: `${l.id}-to`, x: arc(l).x2, stop: l.to, shift: shiftOf(l) },
  ])

  return (
    <MotionFeatures>
    <DirectionProvider direction={direction}>
      <TabsPrimitive.Root
        value={value}
        defaultValue={defaultValue ?? todayIndex ?? 0}
        onValueChange={(v) => onValueChange?.(Number(v))}
        data-slot="day-rail"
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:flex min-w-0 flex-col gap-5', className)}
        {...props}
      >
        <div data-slot="day-rail-scroll" className="yj-scrollbar own:-mx-1 overflow-x-auto px-1 pb-1">
          <div className="relative min-w-[34rem]">
            <TabsPrimitive.List aria-label={label ?? labels.itinerary} data-slot="day-rail-days" className="own:grid" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
              {Array.from({ length: days }, (_, d) => {
                const t = t0 + d * DAY
                const today = d === todayIndex
                return (
                  <TabsPrimitive.Tab
                    key={d}
                    value={d}
                    data-slot="day-rail-day"
                    data-today={today || undefined}
                    aria-label={`${labels.itineraryDay(d + 1)}, ${dayName(t, home)}`}
                    className={cn(
                      'group/day focus-ring relative own:flex min-w-0 flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 own:text-start transition-[background-color,color] yj-duration-fast ease-standard',
                      'own:text-fg-muted hover:bg-hover hover:text-fg data-active:bg-selected data-active:text-fg',
                    )}
                  >
                    <span data-slot="day-rail-label" className={cn('own:flex items-center gap-1.5 own:text-ui-xs', VOICE)}>
                      {labels.itineraryDay(d + 1)}
                      {today && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
                    </span>
                    <span data-slot="day-rail-value" className="own:flex items-baseline gap-1.5 own:font-mono own:text-ui own:tabular-nums">
                      <span className="own:text-fg">{dayNum(t, home)}</span>
                      <span className="own:text-ui-sm">{weekday(t, home)}</span>
                    </span>
                    <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 origin-center scale-x-0 rounded-full bg-fg transition-transform yj-duration-fast ease-standard group-data-active/day:scale-x-100" />
                  </TabsPrimitive.Tab>
                )
              })}
            </TabsPrimitive.List>

            <div aria-hidden data-slot="day-rail-track" className="relative own:mt-2 [--rail-dir:1] rtl:[--rail-dir:-1]">
              {/* Day columns behind everything. */}
              <div className="absolute inset-0 own:grid" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
                {Array.from({ length: days }, (_, d) => (
                  <span key={d} className={cn('border-s border-line-subtle', d === todayIndex && 'bg-transparent')} />
                ))}
              </div>

              {/* The sky: an arc per flight. */}
              <div data-slot="day-rail-sky" className="relative" style={{ height: SKY }}>
                <svg className="absolute inset-0 size-full overflow-visible rtl:-scale-x-100" viewBox={`0 0 1000 ${SKY}`} preserveAspectRatio="none">
                  {ordered.map((leg, i) => {
                    const { x1, x2, lift } = arc(leg)
                    const past = now !== null && +leg.arrive <= now
                    const flying = leg === inFlight
                    const d = `M ${x1 * 1000} ${BASE} Q ${((x1 + x2) / 2) * 1000} ${BASE - lift * 2} ${x2 * 1000} ${BASE}`
                    const delay = i * k.stagger('loose')
                    // Flown and flying legs draw in along their length; the ones ahead are dashed, and fade in.
                    return past || flying ? (
                      <m.path
                        key={leg.id}
                        data-slot="day-rail-arc"
                        data-state={past ? 'past' : 'flying'}
                        d={d}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeWidth={1.5}
                        className={past ? 'stroke-fg-muted' : 'stroke-accent'}
                        initial={k.reduced ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={k.reduced ? { type: false } : { ...k.tween('deliberate', 'emphasized'), delay }}
                      />
                    ) : (
                      <m.path
                        key={leg.id}
                        data-slot="day-rail-arc"
                        data-state="upcoming"
                        d={d}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeWidth={1.5}
                        strokeDasharray="2 4"
                        className="stroke-fg"
                        initial={k.reduced ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={k.reduced ? { type: false } : { ...k.tween('slow', 'enter'), delay }}
                      />
                    )
                  })}
                </svg>
                {ordered.map((leg) => {
                  const { x1, x2, lift } = arc(leg)
                  return (
                    leg.code && (
                      <span
                        key={leg.id}
                        data-slot="day-rail-code"
                        className="absolute z-20 -translate-x-1/2 rounded-sm bg-surface px-1 own:font-mono own:text-ui-xs whitespace-nowrap own:text-fg-muted rtl:translate-x-1/2"
                        style={{ insetInlineStart: `${((x1 + x2) / 2) * 100}%`, top: BASE - lift - 24 }}
                      >
                        {leg.code}
                      </span>
                    )
                  )
                })}
                {inFlight && now !== null && (
                  <Plane leg={inFlight} now={now} at={at} />
                )}
              </div>

              {/* The rail, with a node where each leg leaves and lands. */}
              <div data-slot="day-rail-line" className="relative h-9">
                <span className="absolute inset-x-0 top-0 h-px bg-line" />
                {ordered.flatMap((leg) => [arc(leg).x1, arc(leg).x2].map((x, j) => (
                  <span
                    key={`${leg.id}-${j}`}
                    data-slot="day-rail-node"
                    className="absolute top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-fg bg-surface rtl:translate-x-1/2"
                    style={{ insetInlineStart: `${x * 100}%` }}
                  />
                )))}
                {marks.map((mark) => (
                  <span
                    key={mark.id}
                    data-slot="day-rail-stop"
                    className={cn(
                      'absolute top-2.5 own:flex items-center gap-1 whitespace-nowrap',
                      // Near an end the label hangs inward, so it never leaves the rail.
                      mark.x > 0.93 ? '-translate-x-[calc(100%-0.5rem)] rtl:translate-x-[calc(100%-0.5rem)]' : mark.x < 0.07 ? '-translate-x-2 rtl:translate-x-2' : '-translate-x-1/2 rtl:translate-x-1/2',
                    )}
                    style={{ insetInlineStart: `${mark.x * 100}%` }}
                  >
                    <span className="own:font-mono own:text-ui-xs own:font-medium own:text-fg">{stopOf.get(mark.stop)?.stop.code}</span>
                    {mark.shift && (
                      <span data-slot="day-rail-shift" dir="ltr" className="rounded-full bg-band px-1.5 own:font-mono own:text-[0.625rem] own:leading-4 own:text-fg-muted own:tabular-nums">
                        {mark.shift}
                      </span>
                    )}
                  </span>
                ))}
              </div>

              {/* Stays, under the rail. */}
              <div data-slot="day-rail-stays" className="relative own:mb-5 h-10">
                {stays.map((stay) => {
                  const from = at(+stay.start)
                  const width = at(+stay.end) - from
                  const tone = stopOf.get(stay.at)?.tone ?? 'chart-1'
                  const nights = Math.max(1, Math.round((+stay.end - +stay.start) / DAY))
                  return (
                    <span
                      key={stay.id}
                      data-slot="day-rail-stay"
                      className="absolute inset-y-1 own:flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-[min(var(--radius-md),0.5rem)] bg-[color-mix(in_oklab,var(--stay-tone)_20%,transparent)] px-2 shadow-[inset_2px_0_0_var(--stay-tone)] rtl:shadow-[inset_-2px_0_0_var(--stay-tone)]"
                      style={{ '--stay-tone': `var(--color-${tone})`, insetInlineStart: `${from * 100}%`, width: `${width * 100}%` } as CSSProperties}
                    >
                      <span className="truncate own:text-ui-sm own:text-fg">{stay.name}</span>
                      <span className="shrink-0 own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">{labels.itineraryNights(nights)}</span>
                    </span>
                  )
                })}
              </div>

              {now !== null && now >= t0 && now <= t0 + span && (
                <div
                  data-slot="day-rail-now"
                  className="pointer-events-none absolute inset-0 z-10 transition-[translate] yj-duration-slow ease-standard reduced:transition-none"
                  style={{ translate: `calc(${at(now)} * 100% * var(--rail-dir)) 0` }}
                >
                  <span className="absolute start-0 top-2 bottom-5 w-0.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)] rtl:translate-x-1/2" />
                  <span className={cn('absolute start-0 bottom-0 -translate-x-1/2 rounded-full bg-accent px-1.5 own:text-[0.625rem] own:leading-4 own:font-medium whitespace-nowrap own:text-on-accent rtl:translate-x-1/2', VOICE)}>
                    {inFlight ? labels.itineraryInTransit : labels.itineraryNow}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <ol data-slot="day-rail-summary" className="sr-only">
          {ordered.map((leg) => {
            const from = stopOf.get(leg.from)?.stop
            const to = stopOf.get(leg.to)?.stop
            const shift = shiftOf(leg)
            return (
              <li key={leg.id}>
                {[leg.code, labels.itineraryLeg(from?.name ?? '', to?.name ?? '', dayLong(+leg.depart, from?.utcOffset ?? 0), dayLong(+leg.arrive, to?.utcOffset ?? 0)), shift && labels.itineraryTimeShift(shift)]
                  .filter(Boolean)
                  .join(', ')}
              </li>
            )
          })}
          {stays.map((stay) => (
            <li key={stay.id}>{`${stay.name}, ${stopOf.get(stay.at)?.stop.name ?? ''}, ${labels.itineraryNights(Math.max(1, Math.round((+stay.end - +stay.start) / DAY)))}`}</li>
          ))}
        </ol>

        {children}
      </TabsPrimitive.Root>
    </DirectionProvider>
    </MotionFeatures>
  )
}

/** A leg's arc on the rail, as shares of its width. A flight is hours on a rail of days, so its arc takes at least a
 * twelfth of the rail around the flight's middle, and nodes sit at its feet; the times stay exact in the words. */
function arcOf(leg: ItineraryLeg, at: (t: number) => number) {
  const a = at(+leg.depart)
  const b = at(+leg.arrive)
  const half = Math.max((b - a) / 2, 0.042)
  const mid = Math.min(1 - half - 0.01, Math.max(half + 0.01, (a + b) / 2))
  const hours = (+leg.arrive - +leg.depart) / 3_600_000
  return { x1: mid - half, x2: mid + half, lift: Math.min(SKY - 30, 30 + hours * 4) }
}

/** The plane on its arc, where it is now: along the quadratic by the share of the flight flown. */
function Plane({ leg, now, at }: { leg: ItineraryLeg; now: number; at: (t: number) => number }) {
  const { x1, x2, lift } = arcOf(leg, at)
  const p = Math.min(1, Math.max(0, (now - +leg.depart) / (+leg.arrive - +leg.depart)))
  const y = BASE - 2 * lift * 2 * p * (1 - p)
  return (
    <span
      data-slot="day-rail-plane"
      className="absolute own:grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent own:text-on-accent transition-[inset-inline-start,top] yj-duration-slow ease-standard reduced:transition-none rtl:translate-x-1/2 rtl:-scale-x-100"
      style={{ insetInlineStart: `${(x1 + (x2 - x1) * p) * 100}%`, top: y }}
    >
      <PlaneIcon size={12} className="rotate-45" />
    </span>
  )
}

/** A day's panel under the rail: shown while its day is picked. */
function ItineraryDay({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="day-rail-panel" className={cn('own:rounded-md own:focus-ring', className)} {...props} />
}

export { ItineraryDay, DayRail, type ItineraryLeg, type DayRailProps, type ItineraryStay, type ItineraryStop, type ItineraryTone }
