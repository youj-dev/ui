'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { animate, m, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { hoursDialLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat, listFormat, numberFormat, toneColor } from '../../lib/utils'

/* A stretch of the day on a 24-hour face: midnight at the top, clockwise, a
 * ruler of quarter-hour ticks all the way round, and two handles on it, a
 * start (hollow) and an end (solid). The ticks between them light up in the
 * tone over a soft band, and the center reads the span's length large in
 * mono, with its two times under it. A sleep schedule, quiet hours, a shift,
 * opening hours: any window that may run past midnight.
 * - Input: each handle is a slider of minutes after midnight. Arrows step
 *   (`step`, 15 minutes), Page Up and Down move an hour, Home and End jump to
 *   midnight and the last step before it. A pointer drags the handle it's
 *   near round the face; a press on the lit band drags the whole window, its
 *   length kept; a press elsewhere on the ruler brings the nearer handle
 *   there. The handles never meet: the span stays at least one step long and
 *   one step short of a day. Each step plays the tick cue, like a detent.
 * - Motion: keyboard and click moves glide the handles and the lit stretch on
 *   the snappy spring, the short way round; a drag follows the pointer 1:1.
 *   Reduced motion: every change jumps.
 * - Unlike Dial (a bounded value on a three-quarter arc), the face is a whole
 *   day with no ends, and the value is a pair of times.
 * - A clock turns clockwise in every script, so the face and its keys keep
 *   their direction under RTL; the text in the center follows the page. */

type HoursDialTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A window of the day, in minutes after midnight (0–1439). `end` before `start` runs past midnight. */
interface HoursDialValue {
  start: number
  end: number
}

interface HoursDialProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  value?: HoursDialValue
  /** Default 22:30 to 07:00. */
  defaultValue?: HoursDialValue
  onValueChange?: (value: HoursDialValue) => void
  /** Minutes per arrow key and the snap of a drag; a divisor of 60 suits best. Default 15. */
  step?: number
  /** Minutes per Page Up/Down. Default 60. */
  largeStep?: number
  /** The lit stretch's color. Default `accent`. */
  tone?: HoursDialTone
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name of the pair of handles. Default: the labels' "Time range". */
  label?: string
  /** A mono capital over the length: "Asleep". */
  caption?: ReactNode
  disabled?: boolean
  /** Plays the tick cue at every step. Default true. */
  sound?: boolean
}

type Handle = 'start' | 'end'
type Grip = { mode: Handle } | { mode: 'window'; from: number; value: HoursDialValue }

const DAY = 1440
const wrap = (n: number) => ((n % DAY) + DAY) % DAY
const spanOf = (v: HoursDialValue) => wrap(v.end - v.start)
/** The equivalent of `deg` nearest `from`, so a glide takes the short way round. */
const near = (from: number, deg: number) => from + ((((deg - from) % 360) + 540) % 360) - 180

/* Geometry in viewBox units, centered on the hub; angles clockwise from the top. */
const VIEW = 128
const RULER = { inner: 96, minor: 102, hour: 106, quarter: 110, lit: 90 }
const HANDLE = 101
const BAND = 18
const NUMERALS = 80

const f = (n: number) => Math.round(n * 100) / 100
function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [f(r * Math.sin(rad)), f(-r * Math.cos(rad))]
}
const sweepOf = (a: number, b: number) => (((b - a) % 360) + 360) % 360
function arc(r: number, from: number, to: number) {
  const sweep = Math.max(0.01, sweepOf(from, to))
  const [ax, ay] = polar(r, from)
  const [bx, by] = polar(r, from + sweep)
  return `M${ax},${ay} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${bx},${by}`
}
const wedge = (from: number, to: number) => `M0,0 L${arc(VIEW, from, to).slice(1)} Z`

const TICKS = Array.from({ length: 96 }, (_, i) => ({ deg: i * 3.75, kind: i % 24 === 0 ? 'quarter' : i % 4 === 0 ? 'hour' : 'minor' }) as const)

function Ruler({ lit }: { lit?: boolean }) {
  return TICKS.map(({ deg, kind }) => {
    const [x1, y1] = polar(lit ? RULER.lit : RULER.inner, deg)
    const [x2, y2] = polar(RULER[kind], deg)
    return (
      <line
        key={deg}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        vectorEffect="non-scaling-stroke"
        strokeWidth={kind === 'minor' ? 1 : 1.5}
        strokeLinecap="round"
        style={{
          stroke: lit ? 'var(--ui--hours-dial-tone)' : `color-mix(in oklab, var(--color-fg) ${kind === 'minor' ? 18 : kind === 'hour' ? 34 : 52}%, transparent)`,
        }}
      />
    )
  })
}

function Knob({
  handle,
  angle,
  value,
  text,
  name,
  disabled,
  max,
  dragging,
  reduced,
  onKeyDown,
}: {
  handle: Handle
  angle: MotionValue<number>
  value: number
  text: string
  name: string
  disabled: boolean
  max: number
  dragging: boolean
  reduced: boolean
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
}) {
  // The knob sits at the hub and is pushed out to the ruler; cqw keeps it with the face at any size.
  const x = useTransform(angle, (a) => `${f((Math.sin((a * Math.PI) / 180) * HANDLE * 50) / VIEW)}cqw`)
  const y = useTransform(angle, (a) => `${f((-Math.cos((a * Math.PI) / 180) * HANDLE * 50) / VIEW)}cqw`)
  return (
    <m.div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={name}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={text}
      aria-disabled={disabled || undefined}
      data-slot={`hours-dial-${handle}`}
      data-dragging={dragging || undefined}
      onKeyDown={onKeyDown}
      style={{ x, y }}
      className={cn(
        // A knob is round by nature, whatever the theme's radius.
        'absolute inset-0 own:m-auto size-[max(--spacing(5),10cqw)] own:rounded-full own:shadow-sm-soft focus-ring',
        'transition-[scale] yj-duration-fast ease-standard hover:scale-110 data-dragging:scale-110',
        handle === 'start' ? 'own:border-[length:max(3px,1.4cqw)] own:border-(--ui--hours-dial-tone) own:bg-surface' : 'own:border-[length:max(2px,0.9cqw)] own:border-surface own:bg-(--ui--hours-dial-tone)',
        disabled ? 'cursor-not-allowed' : 'cursor-grab data-dragging:cursor-grabbing',
        reduced && 'transition-none',
      )}
    />
  )
}

function HoursDial({
  value: valueProp,
  defaultValue = { start: 22 * 60 + 30, end: 7 * 60 },
  onValueChange,
  step = 15,
  largeStep = 60,
  tone = 'accent',
  locale: localeProp,
  label,
  caption,
  disabled = false,
  sound = true,
  className,
  style,
  ...props
}: HoursDialProps) {
  const k = useYouj()
  const labels = useComponentLabels(hoursDialLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const clip = `hours-dial-${useId().replace(/[^\w-]/g, '')}`
  const [value, setInner] = useControllableState(valueProp, defaultValue)
  const face = useRef<HTMLDivElement>(null)
  const grip = useRef<Grip | null>(null)
  const [dragging, setDragging] = useState<Grip['mode'] | null>(null)

  const snap = (n: number) => wrap(Math.round(n / step) * step)
  const commit = (next: HoursDialValue) => {
    if (next.start === value.start && next.end === value.end) return
    setInner(next)
    onValueChange?.(next)
    if (sound) cue('tick')
  }
  // Moves one handle to `to`; past the other one it stops a step short, on the side the window was on.
  const place = (handle: Handle, to: number) => {
    const at = snap(to)
    let span = handle === 'start' ? wrap(value.end - at) : wrap(at - value.start)
    if (span < step || span > DAY - step) span = spanOf(value) < DAY / 2 ? step : DAY - step
    commit(handle === 'start' ? { start: wrap(value.end - span), end: value.end } : { start: value.start, end: wrap(value.start + span) })
  }

  // The knobs and the lit stretch ride two angles, so they never part.
  const startAngle = useMotionValue(value.start / 4)
  const endAngle = useMotionValue(value.end / 4)
  // biome-ignore lint/correctness/useExhaustiveDependencies: the angles and the spring follow the value; the motion values are stable and k is read fresh
  useEffect(() => {
    const runs = (
      [
        [startAngle, value.start / 4],
        [endAngle, value.end / 4],
      ] as const
    ).map(([angle, deg]) => {
      const target = near(angle.get(), deg)
      if (k.reduced || dragging) {
        angle.jump(target)
        return undefined
      }
      return animate(angle, target, k.spring('snappy'))
    })
    return () => runs.forEach((run) => run?.stop())
  }, [value.start, value.end, dragging, k.reduced]) // eslint-disable-line react-hooks/exhaustive-deps -- the angles and the spring follow the value; k is read fresh
  const lit = useTransform([startAngle, endAngle], ([a, b]) => wedge(a as number, b as number))
  const band = useTransform([startAngle, endAngle], ([a, b]) => arc(HANDLE, a as number, b as number))

  const minutesAt = (e: PointerEvent) => {
    const rect = face.current!.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    return { at: wrap(((Math.atan2(dx, -dy) * 180) / Math.PI) * 4), reach: Math.hypot(dx, dy) / (rect.width / 2) }
  }
  const apart = (a: number, b: number) => Math.min(wrap(a - b), wrap(b - a))
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
    const { at, reach } = minutesAt(e)
    const knob = (e.target as Element).closest('[role=slider]')?.getAttribute('data-slot')
    let next: Grip
    if (knob === 'hours-dial-start' || knob === 'hours-dial-end') next = { mode: knob === 'hours-dial-start' ? 'start' : 'end' }
    else if (reach < 0.62 || reach > 1.06) return
    else {
      const nearer: Handle = apart(at, value.start) <= apart(at, value.end) ? 'start' : 'end'
      // A press on the band, clear of both knobs, takes hold of the whole window.
      const inside = wrap(at - value.start) < spanOf(value) && apart(at, value[nearer]) > 45
      next = inside ? { mode: 'window', from: at, value } : { mode: nearer }
      if (!inside) place(nearer, at)
    }
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    grip.current = next
    setDragging(next.mode)
    face.current?.querySelector<HTMLElement>(`[data-slot=hours-dial-${next.mode === 'end' ? 'end' : 'start'}]`)?.focus({ preventScroll: true })
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const held = grip.current
    if (!held) return
    const { at } = minutesAt(e)
    if (held.mode !== 'window') return place(held.mode, at)
    const by = Math.round((wrap(at - held.from + DAY / 2) - DAY / 2) / step) * step
    commit({ start: wrap(held.value.start + by), end: wrap(held.value.end + by) })
  }
  const onPointerEnd = () => {
    grip.current = null
    setDragging(null)
  }

  const onKeyDown = (handle: Handle) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const from = value[handle]
    // Clockwise is forward in every script: right and up move later.
    const to: Record<string, number> = {
      ArrowRight: from + step,
      ArrowUp: from + step,
      ArrowLeft: from - step,
      ArrowDown: from - step,
      PageUp: from + largeStep,
      PageDown: from - largeStep,
      Home: 0,
      End: DAY - step,
    }
    if (!(e.key in to)) return
    e.preventDefault()
    place(handle, to[e.key]!)
  }

  const time = dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
  const hourOnly = dateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' })
  const clock = (minutes: number) => time.format(Date.UTC(2000, 0, 1, 0, minutes))
  const span = spanOf(value)
  const hours = Math.floor(span / 60)
  const minutes = span % 60
  const short = [
    ...numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow' }).formatToParts(hours),
    { type: 'literal', value: ' ' },
    ...numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'narrow', minimumIntegerDigits: 2 }).formatToParts(minutes),
  ]
  const long = listFormat(locale, { type: 'unit', style: 'long' }).format(
    [
      hours && numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(hours),
      minutes && numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'long' }).format(minutes),
    ].filter((part): part is string => Boolean(part)),
  )

  return (
    <MotionFeatures>
      <div
        role="group"
        aria-label={label ?? labels.hoursDial}
        data-slot="hours-dial"
        data-tone={tone}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        className={cn('group/hours-dial @container/hours-dial relative isolate aspect-square w-full max-w-72 shrink-0 touch-none select-none data-disabled:opacity-50', className)}
        style={{ '--ui--hours-dial-tone': toneColor(tone, 'var(--color-fg-muted)'), ...style } as CSSProperties}
        {...props}
      >
        <div
          ref={face}
          data-slot="hours-dial-face"
          className={cn('absolute inset-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer data-dragging:cursor-grabbing')}
          data-dragging={dragging || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
        >
          <svg aria-hidden viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="own:block size-full overflow-visible">
            <defs>
              <clipPath id={clip}>
                <m.path d={lit} />
              </clipPath>
            </defs>
            <m.path
              data-slot="hours-dial-band"
              d={band}
              fill="none"
              strokeWidth={BAND}
              strokeLinecap="round"
              style={{ stroke: 'color-mix(in oklab, var(--ui--hours-dial-tone) calc(14% + 6% * var(--yj-dark)), transparent)' }}
            />
            <g data-slot="hours-dial-ruler">
              <Ruler />
            </g>
            <g data-slot="hours-dial-range" clipPath={`url(#${clip})`}>
              <Ruler lit />
            </g>
            <g data-slot="hours-dial-numerals" fontSize={10} className="own:fill-fg-muted own:font-mono own:tabular-nums">
              {[0, 12].map((h) => {
                const [x, y] = polar(NUMERALS, h * 15)
                return (
                  <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="central">
                    {hourOnly.format(Date.UTC(2000, 0, 1, h))}
                  </text>
                )
              })}
            </g>
          </svg>
          {(['start', 'end'] as const).map((handle) => (
            <Knob
              key={handle}
              handle={handle}
              angle={handle === 'start' ? startAngle : endAngle}
              value={value[handle]}
              text={labels.hoursDialValue(clock(value[handle]), long)}
              name={handle === 'start' ? labels.hoursDialStart : labels.hoursDialEnd}
              disabled={disabled}
              max={DAY - step}
              dragging={dragging === handle || dragging === 'window'}
              reduced={k.reduced}
              onKeyDown={onKeyDown(handle)}
            />
          ))}
        </div>

        <div data-slot="hours-dial-center" aria-hidden className="pointer-events-none absolute inset-0 own:grid place-items-center">
          <div className="own:flex flex-col items-center gap-[2cqw] text-center">
            {caption != null && (
              <span data-slot="hours-dial-label" className="own:font-(family-name:--yj-label-font) own:text-[clamp(--spacing(2.5),3.8cqw,--spacing(3))] own:leading-none own:text-fg-muted own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]">
                {caption}
              </span>
            )}
            <span data-slot="hours-dial-value" className="own:font-mono own:text-[clamp(--spacing(6),13cqw,--spacing(10))] own:leading-none own:font-medium own:tracking-[-0.04em] whitespace-nowrap own:text-fg own:tabular-nums">
              {short.map((p, i) => (
                <span key={i} className={cn(p.type === 'unit' && 'own:ms-[0.04em] own:text-[0.5em] own:tracking-normal own:text-fg-muted')}>
                  {p.value}
                </span>
              ))}
            </span>
            <span data-slot="hours-dial-times" className="own:font-mono own:text-[clamp(--spacing(2.75),4.2cqw,--spacing(3.5))] own:leading-none own:text-fg-muted own:tabular-nums whitespace-nowrap">
              <bdi>{clock(value.start)}</bdi> – <bdi>{clock(value.end)}</bdi>
            </span>
          </div>
        </div>
      </div>
    </MotionFeatures>
  )
}

export { HoursDial, type HoursDialProps, type HoursDialTone, type HoursDialValue }
