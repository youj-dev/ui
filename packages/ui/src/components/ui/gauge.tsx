'use client'

import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { m, useInView } from 'motion/react'
import { useId, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { MotionFeatures, type Size } from '@youj/core'
import { meterLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'

/* One bounded score at a glance: a thin half-ring read left to right on a
 * fine scale, the value in its bowl and the band it's in underneath, between
 * the range's two ends.
 * - The track is a hairline-weight band in the well tone; the fill runs along
 *   it in the tone (the accent by default). An index marks the value: a fine
 *   needle across the band, cut clear of the fill around it.
 * - A scale of ticks rides outside the band, every tenth of the range, with
 *   the ends and the middle drawn longer.
 * - Thresholds split the range into bands; the fill takes the band's tone and
 *   the band's label becomes the sub-label (and is spoken with the value).
 *   `gradient` lays the bands under the fill as zones: each band (or danger,
 *   warning and success thirds without thresholds) faint in its own tone,
 *   split by hairline gaps, so the whole scale reads at once, like the zones
 *   on a dial, while the fill still speaks in one tone.
 * - Motion: when it scrolls into view the fill sweeps up from the minimum on
 *   the smooth spring, and the number and the index ride the same spring, so
 *   they never drift apart. A new value retargets mid-flight with its
 *   velocity. A band change crossfades the fill's color.
 * - Reduced motion: drawn at its value; changes jump.
 * - A dial turns clockwise in every script, so the arc and its two ends keep
 *   their direction under RTL; the band's word follows its own script. */

type GaugeTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface GaugeThreshold {
  /** The band starts at this value and runs up to the next threshold. */
  value: number
  tone: GaugeTone
  /** A word for the band, shown under the value and spoken with it: "Nominal". */
  label?: string
}

interface GaugeProps extends Omit<MeterPrimitive.Root.Props, 'format' | 'children' | 'value'> {
  value: number
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** The dial's size: `sm`, `default` or `lg`. */
  size?: Extract<Size, 'sm' | 'default' | 'lg'>
  /** The fill's tone outside any threshold band. Default `accent`. */
  tone?: GaugeTone
  /** Bands, each from its value up to the next. The fill takes the band's tone. */
  thresholds?: GaugeThreshold[]
  /** Lay the bands under the fill as zones: each threshold band faint in its tone (danger, warning and success thirds without thresholds), split by hairline gaps. */
  gradient?: boolean
  /** Intl.NumberFormat options for the value. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Names the gauge for assistive tech when no visible label points at it. */
  label?: string
  /** The sub-label under the value. Default: the current band's label. */
  children?: ReactNode
}

const TONE: Record<GaugeTone, string> = {
  accent: 'own:text-accent',
  success: 'own:text-success',
  warning: 'own:text-warning',
  danger: 'own:text-danger',
  neutral: 'own:text-fg-muted',
}

/** A zone of the scale: its tone, faint, under the fill. */
const DIM: Record<GaugeTone, string> = {
  accent: 'own:text-accent-line',
  success: 'own:text-success-line',
  warning: 'own:text-warning-line',
  danger: 'own:text-danger-line',
  neutral: 'own:text-line-strong',
}

const SIZE = {
  sm: { root: 'w-36', value: 'own:text-xl', label: 'own:text-ui-xs', scale: 'invisible overflow-hidden' },
  default: { root: 'w-52', value: 'own:text-[length:--spacing(7)]', label: 'own:text-ui-sm', scale: 'own:text-ui-xs' },
  lg: { root: 'w-64', value: 'own:text-[length:--spacing(9)]', label: 'own:text-ui', scale: 'own:text-ui-xs' },
}

/* Geometry in viewBox units, centered on the dial's hub. */
const MID = 92
const THICK = 6
const OUT = MID + THICK / 2
const IN = MID - THICK / 2
/** The scale's ticks start this far outside the band; a long tick (the ends and the middle) reaches further. */
const TICK = { from: OUT + 4, minor: OUT + 7, major: OUT + 10 }
/** The index: a needle `reach` past the band on either side, cut `clear` wide through the fill. */
const NEEDLE = { reach: 4, width: 1.75, clear: 4.5 }
/** The hairline between zones. */
const ZONE_GAP = 2
const BOX = { x: -(TICK.major + 2), y: -(TICK.major + 2), w: 2 * (TICK.major + 2), h: TICK.major + 4 }

const f = (n: number) => Math.round(n * 100) / 100

const SPINE = `M${-MID},0 A${MID},${MID} 0 0 1 ${MID},0`
const TICKS = Array.from({ length: 11 }, (_, i) => ({ at: i / 10, major: i % 5 === 0 }))

/** The spine from one fraction of the range to another, clockwise. */
function arc(from: number, to: number) {
  const at = (t: number) => `${f(-MID * Math.cos(t * Math.PI))},${f(-MID * Math.sin(t * Math.PI))}`
  return `M${at(from)} A${MID},${MID} 0 0 1 ${at(to)}`
}

interface Zone {
  from: number
  to: number
  tone: GaugeTone
}

/** The zones `gradient` paints, as fractions of the range: the bands, or danger, warning and success thirds. */
function zonesFor(thresholds: GaugeThreshold[] | undefined, min: number, span: number, fallback: GaugeTone): Zone[] {
  if (!thresholds?.length)
    return [
      { from: 0, to: 1 / 3, tone: 'danger' },
      { from: 1 / 3, to: 2 / 3, tone: 'warning' },
      { from: 2 / 3, to: 1, tone: 'success' },
    ]
  const zones: Zone[] = []
  let from = 0
  let tone = fallback
  for (const t of [...thresholds].sort((a, b) => a.value - b.value)) {
    const at = Math.min(1, Math.max(0, (t.value - min) / span))
    if (at > from) zones.push({ from, to: at, tone })
    from = Math.max(from, at)
    tone = t.tone
  }
  if (from < 1) zones.push({ from, to: 1, tone })
  return zones
}

function bandFor(value: number, thresholds: GaugeThreshold[] | undefined) {
  let band: GaugeThreshold | undefined
  for (const t of [...(thresholds ?? [])].sort((a, b) => a.value - b.value)) if (value >= t.value) band = t
  return band
}

function Gauge({
  value,
  min = 0,
  max = 100,
  size = 'default',
  tone = 'accent',
  thresholds,
  gradient = false,
  format,
  locale: localeProp,
  label,
  children,
  className,
  ...props
}: GaugeProps) {
  const k = useYouj()
  const labels = useComponentLabels(meterLabels)
  const locale = useLocale(localeProp)
  const id = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const indexRef = useRef<SVGGElement>(null)
  const clearRef = useRef<SVGLineElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const formatter = useMemo(() => numberFormat(locale, format ?? { maximumFractionDigits: 0 }), [locale, format && JSON.stringify(format)])

  const span = max - min || 1
  const clamped = Math.min(max, Math.max(min, value))
  const fraction = (clamped - min) / span
  const shown = k.reduced || inView ? fraction : 0
  const band = bandFor(clamped, thresholds)
  const fill = band?.tone ?? tone
  const sub = children ?? band?.label
  const spoken = band?.label ?? (band?.tone === 'danger' ? labels.meterCritical : band?.tone === 'warning' ? labels.meterWarning : undefined)
  const zones = gradient ? zonesFor(thresholds, min, span, tone) : []

  // The number and the index follow the fill's own spring frame by frame;
  // React renders their first state only, so a re-render never snaps them.
  const first = useRef({ t: shown, text: formatter.format(min + shown * span) })
  const painted = useRef(shown)
  const paint = (t: number) => {
    painted.current = t
    const turn = `rotate(${f(t * 180)})`
    indexRef.current?.setAttribute('transform', turn)
    clearRef.current?.setAttribute('transform', turn)
    const node = textRef.current?.firstChild
    if (node) node.nodeValue = formatter.format(min + t * span)
  }
  const paintRef = useRef(paint)
  paintRef.current = paint
  // Without motion nothing animates, so paint the value directly; with it,
  // repaint where the spring is (a new locale or range reformats in place).
  useLayoutEffect(() => {
    paintRef.current(k.reduced ? shown : painted.current)
  }, [k.reduced, shown, formatter, min, span])

  const indicator = () => (
    <m.path
      data-slot="gauge-indicator"
      d={SPINE}
      fill="none"
      strokeWidth={THICK}
      stroke="currentColor"
      className={cn(TONE[fill], 'transition-[color] yj-duration-base ease-standard')}
      initial={k.reduced ? false : { pathLength: first.current.t }}
      animate={{ pathLength: shown }}
      transition={k.reduced ? { type: false } : k.spring('smooth')}
      onUpdate={(latest) => {
        if (typeof latest.pathLength === 'number') paintRef.current(latest.pathLength)
      }}
    />
  )

  const s = SIZE[size]
  const ends = [min, max].map((n) => formatter.format(n))
  return (
    <MotionFeatures>
      <MeterPrimitive.Root
        ref={ref}
        value={clamped}
        min={min}
        max={max}
        locale={locale}
        format={format ?? { maximumFractionDigits: 0 }}
        getAriaValueText={(formatted) => (spoken ? `${formatted}, ${spoken}` : formatted)}
        aria-label={label}
        data-slot="gauge"
        data-size={size}
        data-tone={gradient ? 'gradient' : fill}
        data-reduced-motion={k.reduced || undefined}
        className={cn('relative own:inline-flex shrink-0 flex-col items-center', s.root, className)}
        {...props}
      >
        <div className="relative w-full">
          <svg
            data-slot="gauge-arc"
            aria-hidden
            viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
            className="own:block w-full overflow-visible"
          >
            <defs>
              {/* The cuts through the band: the clearance around the needle, and the hairlines between zones. */}
              <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h}>
                <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} fill="white" />
                {zones.slice(1).map((zone) => (
                  <line
                    key={zone.from}
                    x1={-(OUT + 1)}
                    x2={-(IN - 1)}
                    y1="0"
                    y2="0"
                    stroke="black"
                    strokeWidth={ZONE_GAP}
                    transform={`rotate(${f(zone.from * 180)})`}
                  />
                ))}
                <line
                  ref={clearRef}
                  x1={-(OUT + 1)}
                  x2={-(IN - 1)}
                  y1="0"
                  y2="0"
                  stroke="black"
                  strokeWidth={NEEDLE.clear}
                  transform={`rotate(${f(first.current.t * 180)})`}
                />
              </mask>
            </defs>
            <g data-slot="gauge-scale" stroke="currentColor" strokeWidth={1} className="own:text-line-strong">
              {TICKS.map((tick) => (
                <line
                  key={tick.at}
                  x1={-TICK.from}
                  x2={-(tick.major ? TICK.major : TICK.minor)}
                  y1="0"
                  y2="0"
                  transform={`rotate(${f(tick.at * 180)})`}
                  className={cn(tick.major && 'own:text-fg-subtle')}
                />
              ))}
            </g>
            <g mask={`url(#${id}-cut)`} fill="none" strokeWidth={THICK}>
              {gradient ? (
                zones.map((zone) => (
                  <path key={zone.from} data-slot="gauge-zone" data-tone={zone.tone} d={arc(zone.from, zone.to)} stroke="currentColor" className={DIM[zone.tone]} />
                ))
              ) : (
                <path data-slot="gauge-track" d={SPINE} stroke="currentColor" className="own:text-line" />
              )}
              {indicator()}
            </g>
            <g ref={indexRef} data-slot="gauge-index" transform={`rotate(${f(first.current.t * 180)})`}>
              <line
                x1={-(OUT + NEEDLE.reach)}
                x2={-(IN - NEEDLE.reach)}
                y1="0"
                y2="0"
                strokeWidth={NEEDLE.width}
                strokeLinecap="round"
                className="own:stroke-fg"
              />
            </g>
          </svg>
          <span
            ref={textRef}
            data-slot="gauge-value"
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-[4%] own:text-center own:leading-none own:font-medium own:tracking-[-0.02em] own:text-fg own:tabular-nums',
              s.value,
            )}
          >
            {first.current.text}
          </span>
        </div>
        {/* The range's ends sit under the band's own ends (left to right in every script), the band's word between them. */}
        <div
          data-slot="gauge-footer"
          dir="ltr"
          className="own:mt-1.5 own:grid w-full grid-cols-[1fr_auto_1fr] items-baseline own:gap-2 own:px-[5%]"
        >
          <span data-slot="gauge-min" aria-hidden className={cn('own:text-fg-subtle own:tabular-nums own:leading-none', s.scale)}>
            {ends[0]}
          </span>
          {sub != null ? (
            <span data-slot="gauge-label" dir="auto" className={cn('max-w-full truncate own:leading-tight own:text-fg-muted', s.label)}>
              {sub}
            </span>
          ) : (
            <span />
          )}
          <span data-slot="gauge-max" aria-hidden className={cn('own:text-end own:text-fg-subtle own:tabular-nums own:leading-none', s.scale)}>
            {ends[1]}
          </span>
        </div>
      </MeterPrimitive.Root>
    </MotionFeatures>
  )
}

export { Gauge, type GaugeProps, type GaugeThreshold, type GaugeTone }
