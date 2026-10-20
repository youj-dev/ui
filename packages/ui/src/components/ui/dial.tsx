'use client'

import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { animate, m, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { dialLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { clamp, cn, numberFormat } from '../../lib/utils'

/* A bounded value on a ruled arc: a three-quarter ring from the lower left
 * round to the lower right, ticked at every step, with the value as an ink
 * knob on the band and large in mono in the middle. A thermostat, a volume,
 * a speed: anything with a floor and a ceiling you'd turn.
 * - `current` adds a measured value: a marker inside the band, "Now 19.8°"
 *   under the figure, and the stretch between it and the value lit in the
 *   tone (heating up to the target, or cooling down to it).
 * - `marks` put small rings on the ruler (a schedule's setpoints), named in
 *   the dial's description.
 * - Input: it's a Base UI slider under the arc, so arrows step, Page Up and
 *   Down take large steps and Home and End jump to the ends; a pointer
 *   anywhere on the band drags the knob round, snapping to the step. Each
 *   step plays the tick cue, like a detent.
 * - Motion: keyboard and click steps glide the knob and the lit stretch
 *   together on the snappy spring, retargeting mid-flight; a drag follows the
 *   pointer 1:1. Reduced motion: every change jumps.
 * - A dial turns clockwise in every script, so the arc and its keys keep
 *   their direction under RTL; the text in the center follows the page.
 * - variant="ticks" draws the arc as a ring of fine radial ticks with no band
 *   or knob: the ticks up to the value light in the tone and reach outward,
 *   longest at the value, the way Progress's ticks light (the edge tick
 *   partway, the few past it warming up). `bands` change the tone by value:
 *   dry, comfortable, damp. */

type DialTone = 'accent' | 'warm' | 'cool' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface DialMark {
  value: number
  /** "Night". */
  label: string
}

interface DialBand {
  /** The band runs from this value up to the next band's. */
  from: number
  tone: DialTone
}

interface DialProps extends Omit<SliderPrimitive.Root.Props<number>, 'value' | 'defaultValue' | 'onValueChange' | 'children' | 'format' | 'orientation'> {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** Default 1. */
  step?: number
  /** Per Page Up/Down and Shift+arrow. Default 10 steps. */
  largeStep?: number
  /** A measured value to show against the setting: a room's temperature. */
  current?: number
  /** Setpoints on the ruler. */
  marks?: DialMark[]
  /** The lit stretch's color. `warm` and `cool` suit heating and cooling; `success`, `warning` and `danger` suit `bands`. Default `accent`. */
  tone?: DialTone
  /** Intl.NumberFormat options for the figures: { style: 'unit', unit: 'celsius' }. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Dial". */
  label?: string
  /** A mono capital over the figure: "Heating to". */
  caption?: ReactNode
  /** Plays the tick cue at every step. Default true. */
  sound?: boolean
  /** `ticks` draws the arc as a ring of radial ticks that light up to the value, with no band or knob. Default `default`. */
  variant?: 'default' | 'ticks'
  /** How many ticks the `ticks` variant draws. Default 55. */
  ticks?: number
  /** Tones by value, in ascending order: the last band whose `from` the value has reached sets the tone, over `tone`. */
  bands?: DialBand[]
}

const TONE: Record<DialTone, string> = {
  accent: 'var(--color-accent)',
  warm: 'color-mix(in oklch, var(--color-warning) 62%, var(--color-danger))',
  cool: 'var(--color-chart-5)',
  neutral: 'var(--color-fg-muted)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  'chart-1': 'var(--color-chart-1)',
  'chart-2': 'var(--color-chart-2)',
  'chart-3': 'var(--color-chart-3)',
  'chart-4': 'var(--color-chart-4)',
  'chart-5': 'var(--color-chart-5)',
}

/* Geometry in viewBox units, centered on the hub; angles clockwise from the top. */
const VIEW = 128
const START = -135
const SWEEP = 270
const BAND = { r: 90, width: 12 }
const RULER = { inner: 104, minor: 109, major: 113 }
const MARK = 119.5
/* The ticks variant: a tick at rest, lit, and at the value, inner end to outer. */
const TICK = { inner: 84, rest: 102, lit: 110, head: 120 }

const f = (n: number) => Math.round(n * 100) / 100
function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [f(r * Math.sin(rad)), f(-r * Math.cos(rad))]
}
function arc(r: number, from: number, to: number) {
  const a = Math.min(from, to)
  const b = Math.max(from, to)
  const sweep = Math.max(0.01, b - a)
  const [ax, ay] = polar(r, a)
  const [bx, by] = polar(r, a + sweep)
  return `M${ax},${ay} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${bx},${by}`
}
const decimals = (n: number) => (String(n).split('.')[1] ?? '').length

function Dial({
  value: valueProp,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  largeStep,
  current,
  marks = [],
  tone = 'accent',
  format,
  locale: localeProp,
  label,
  caption,
  sound = true,
  variant = 'default',
  ticks = 55,
  bands = [],
  disabled,
  className,
  style,
  ...props
}: DialProps) {
  const k = useYouj()
  const labels = useComponentLabels(dialLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const descriptionId = useId()
  const [value, setInner] = useControllableState(valueProp, defaultValue ?? min)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const formatter = useMemo(() => numberFormat(locale, format ?? { maximumFractionDigits: 0 }), [locale, format && JSON.stringify(format)])
  // The ends of the scale read as whole numbers: 12°C, not 12.0°C.
  const whole = useMemo(() => numberFormat(locale, { ...format, minimumFractionDigits: 0, maximumFractionDigits: 0 }), [locale, format && JSON.stringify(format)])

  const span = max - min || 1
  const snap = (v: number) => clamp(Number((Math.round((v - min) / step) * step + min).toFixed(decimals(step) + decimals(min))), min, max)
  const angleOf = (v: number) => START + ((clamp(v, min, max) - min) / span) * SWEEP
  const set = (next: number) => {
    const v = snap(next)
    if (v === value) return
    setInner(v)
    onValueChange?.(v)
    if (sound) cue('tick')
  }

  // The knob and the lit stretch ride one angle, so they never part.
  const angle = useMotionValue(angleOf(value))
  useEffect(() => {
    const target = angleOf(value)
    if (k.reduced || dragging) angle.jump(target)
    else {
      const run = animate(angle, target, k.spring('snappy'))
      return () => run.stop()
    }
  }, [value, dragging, k.reduced])
  const from = current === undefined ? START : angleOf(current)
  const lit = useTransform(angle, (a) => arc(BAND.r, from, a))

  // A pointer on the band turns the knob to it; the dead zone at the foot snaps to the nearer end.
  const fromPointer = (e: PointerEvent) => {
    const rect = box.current!.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI
    if (deg > 135 && deg <= 180) deg = 135
    if (deg < -135) deg = -135
    return min + ((deg - START) / SWEEP) * span
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
    const rect = box.current!.getBoundingClientRect()
    const reach = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2)) / (rect.width / 2)
    if (reach < 0.5 || reach > 1.05) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    input.current?.focus({ preventScroll: true })
    setDragging(true)
    set(fromPointer(e))
  }

  const toneNow = bands.reduce<DialTone>((t, band) => (value >= band.from ? band.tone : t), tone)
  const parts = formatter.formatToParts(value)
  const tickCount = Math.round(span / step)
  const every = tickCount > 80 ? Math.ceil(tickCount / 60) : 1
  const majorEvery = Math.max(1, Math.round(tickCount / 8 / every))
  const now = current === undefined ? undefined : formatter.format(current)

  return (
    <MotionFeatures>
      {/* The arc turns clockwise in every script, so its keys do too: right and up raise the value. */}
      <DirectionProvider direction="ltr">
      <SliderPrimitive.Root
        value={value}
        onValueChange={(v) => set(v as number)}
        min={min}
        max={max}
        step={step}
        largeStep={largeStep ?? step * 10}
        locale={locale}
        format={format}
        disabled={disabled}
        data-slot="dial"
        data-variant={variant}
        data-tone={toneNow}
        data-dragging={dragging || undefined}
        data-reduced-motion={k.reduced || undefined}
        className={cn('group/dial @container/dial relative isolate aspect-square w-full max-w-72 shrink-0 touch-none select-none data-disabled:opacity-50', className)}
        style={{ '--dial-tone': TONE[toneNow], ...(style as CSSProperties) } as CSSProperties}
        {...props}
      >
        <div
          ref={box}
          data-slot="dial-face"
          className={cn('absolute inset-0', disabled ? 'cursor-not-allowed' : 'cursor-grab data-dragging:cursor-grabbing')}
          data-dragging={dragging || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={(e) => dragging && set(fromPointer(e))}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <svg data-slot="dial-arc" aria-hidden viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="own:block size-full overflow-visible">
            {variant === 'ticks' ? (
              <DialTicks count={Math.max(2, Math.round(ticks))} angle={angle} from={from} />
            ) : (
            <>
            <g data-slot="dial-ruler">
              {Array.from({ length: Math.floor(tickCount / every) + 1 }, (_, i) => {
                const v = min + i * every * step
                const major = i % majorEvery === 0
                const on = current === undefined ? v <= value : v >= Math.min(current, value) && v <= Math.max(current, value)
                const [x1, y1] = polar(RULER.inner, angleOf(v))
                const [x2, y2] = polar(major ? RULER.major : RULER.minor, angleOf(v))
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={major ? 1.5 : 1}
                    strokeLinecap="round"
                    className="transition-[stroke] yj-duration-fast ease-standard"
                    style={{ stroke: on ? 'color-mix(in oklab, var(--dial-tone) 85%, transparent)' : `color-mix(in oklab, var(--color-fg) ${major ? 46 : 20}%, transparent)` }}
                  />
                )
              })}
            </g>
            <path data-slot="dial-track" d={arc(BAND.r, START, START + SWEEP)} fill="none" strokeWidth={BAND.width} strokeLinecap="round" className="stroke-[color-mix(in_oklab,var(--color-fg)_calc(9%+3%*var(--yj-dark)),transparent)]" />
            <m.path data-slot="dial-range" d={lit} fill="none" strokeWidth={BAND.width} strokeLinecap="round" stroke="var(--dial-tone)" />
            </>
            )}
            {marks.map((mark) => {
              const [x, y] = polar(variant === 'ticks' ? TICK.head + 7 : MARK, angleOf(mark.value))
              return <circle key={`${mark.label}-${mark.value}`} data-slot="dial-mark" cx={x} cy={y} r={3} strokeWidth={1.5} className="fill-surface stroke-fg-muted" />
            })}
            {current !== undefined && (
              <path data-slot="dial-current" d="M0,-80 L-4.5,-72 L4.5,-72 Z" transform={`rotate(${f(angleOf(current))})`} strokeLinejoin="round" strokeWidth={1.5} className="fill-fg stroke-fg" />
            )}
            {variant === 'ticks' ? (
              <circle data-slot="dial-focus" r={TICK.inner - 10} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" className="stroke-focus opacity-0 group-has-[input:focus-visible]/dial:opacity-100 group-data-dragging/dial:opacity-0" />
            ) : (
            <m.g data-slot="dial-knob" style={{ rotate: angle }}>
              {/* The knob's box is the whole dial, so it turns about the hub. */}
              <circle r={VIEW} fill="none" stroke="none" />
              <circle cy={-BAND.r} r={17} className="opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/dial:opacity-100 group-has-[input:focus-visible]/dial:opacity-100 group-data-dragging/dial:opacity-100" style={{ fill: 'color-mix(in oklab, var(--dial-tone) 26%, transparent)' }} />
              <circle cy={-BAND.r} r={10.5} strokeWidth={3.5} className="fill-fg stroke-surface" />
              <circle cy={-BAND.r} r={15} fill="none" strokeWidth={2} className="stroke-focus opacity-0 group-has-[input:focus-visible]/dial:opacity-100 group-data-dragging/dial:opacity-0" />
            </m.g>
            )}
          </svg>
        </div>

        <SliderPrimitive.Thumb
          inputRef={input}
          aria-label={label ?? labels.dial}
          aria-describedby={marks.length ? descriptionId : undefined}
          getAriaValueText={(formatted) => (now ? labels.dialValueNow(formatted, now) : formatted)}
          data-slot="dial-thumb"
          className="pointer-events-none"
          style={{ position: 'absolute', inset: '38%', translate: 'none', insetInlineStart: '38%' }}
        />

        <div data-slot="dial-center" aria-hidden className="pointer-events-none absolute inset-0 own:grid place-items-center">
          <div className="own:flex flex-col items-center gap-[1.8cqw] text-center">
            {caption != null && (
              <span data-slot="dial-label" className="own:font-(family-name:--yj-label-font) own:text-[clamp(0.625rem,3.8cqw,0.75rem)] own:leading-none own:text-fg-muted own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]">
                {caption}
              </span>
            )}
            {/* Inline parts, so the figure keeps the bidi order its locale formats it in (a flex row would reverse it in RTL). */}
            <span data-slot="dial-value" className="own:font-mono own:text-[clamp(2rem,19cqw,3rem)] own:leading-none own:font-medium own:tracking-[-0.04em] whitespace-nowrap own:text-fg own:tabular-nums">
              {parts.map((p, i) => (
                <span key={i} className={cn(p.type === 'unit' && 'own:mx-[0.04em] own:text-[0.42em] own:tracking-normal own:text-fg-muted')}>
                  {p.value}
                </span>
              ))}
            </span>
            {now && (
              <span data-slot="dial-now" className="own:flex items-baseline gap-[1.2cqw] own:font-mono own:text-[clamp(0.6875rem,4.2cqw,0.875rem)] own:leading-none own:text-fg-muted own:tabular-nums">
                <span className="own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]">{labels.dialNow}</span>
                <span className="own:text-fg">{now}</span>
              </span>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-[16%] bottom-[9%] own:flex justify-between own:font-mono own:text-[clamp(0.625rem,3.4cqw,0.75rem)] text-fg-muted own:tabular-nums" aria-hidden dir="ltr">
          <span>{whole.format(min)}</span>
          <span>{whole.format(max)}</span>
        </div>

        {marks.length > 0 && (
          <p id={descriptionId} className="sr-only">
            {marks.map((mark) => labels.dialMark(mark.label, formatter.format(mark.value))).join('; ')}
          </p>
        )}
      </SliderPrimitive.Root>
      </DirectionProvider>
    </MotionFeatures>
  )
}

/* The ticks variant. Each tick reads the shared angle, so the lit stretch glides with the value. */
function DialTicks({ count, angle, from }: { count: number; angle: MotionValue<number>; from: number }) {
  const gap = SWEEP / (count - 1)
  return (
    <g data-slot="dial-ticks">
      {Array.from({ length: count }, (_, i) => (
        <DialTick key={i} at={START + i * gap} gap={gap} angle={angle} from={from} />
      ))}
    </g>
  )
}

/** How lit a tick at `at` is, and how far its lit stroke reaches (0 at rest, 1 at the head). */
function tickState(at: number, lo: number, hi: number, gap: number) {
  // Full inside the stretch, partway at its edges, and a warm-up fading over the three ticks past the head, as Progress's ticks do.
  const on = clamp((hi - at) / gap + 1, 0, 1) * clamp((at - lo) / gap + 1, 0, 1)
  const warm = at > hi ? clamp(1 - (at - hi) / (gap * 4), 0, 1) * 0.4 : 0
  const behind = Math.max(0, hi - at) / gap
  const reach = 0.5 + 0.5 * clamp(1 - behind / 4, 0, 1)
  return { level: Math.max(on, warm), reach: on * reach }
}

const TICK_LEN = TICK.head - TICK.inner

function DialTick({ at, gap, angle, from }: { at: number; gap: number; angle: MotionValue<number>; from: number }) {
  const state = (a: number) => tickState(at, Math.min(from, a), Math.max(from, a), gap)
  const opacity = useTransform(angle, (a) => state(a).level)
  // The lit stroke runs from the inner end and reaches past the rest length toward the head's.
  const dash = useTransform(angle, (a) => {
    const { level, reach } = state(a)
    const len = level > 0 ? (TICK.rest - TICK.inner + (TICK.lit - TICK.rest) * Math.min(1, reach * 2) + (TICK.head - TICK.lit) * Math.max(0, reach * 2 - 1)) / TICK_LEN : 0
    return `${f(len)} 2`
  })
  const [x1, y1] = polar(TICK.inner, at)
  const [x2, y2] = polar(TICK.rest, at)
  const [x3, y3] = polar(TICK.head, at)
  return (
    <g data-slot="dial-tick">
      <line x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" strokeWidth={1.5} strokeLinecap="round" className="stroke-line-control transition-[stroke] yj-duration-fast ease-standard group-hover/dial:stroke-line-strong group-data-dragging/dial:stroke-line-strong" />
      <m.line x1={x1} y1={y1} x2={x3} y2={y3} pathLength={1} vectorEffect="non-scaling-stroke" strokeWidth={1.5} strokeLinecap="round" className="transition-[stroke] yj-duration-fast ease-standard" style={{ stroke: 'var(--dial-tone)', opacity, strokeDasharray: dash }} />
    </g>
  )
}

export { Dial, type DialBand, type DialMark, type DialProps, type DialTone }
