'use client'

import { useEffect, useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { scoreRingLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { clamp, cn, numberFormat, toneColor } from '../../lib/utils'

/* A score out of a range as a full ring of fine ticks, lit clockwise from
 * the top up to the score, with its grade (or the score) in the middle.
 * Grades split the range into bands: the ring takes the band's tone and the
 * band's label is the grade. The tick at the score reaches past the others,
 * so the reading is exact at a glance.
 * - `busy` (a scan running): a soft sweep circles inside the ring.
 * - Motion: when it scrolls into view the ticks light one after another up
 *   to the score over the deliberate token; a new score relights on the fast
 *   token. The sweep turns once every few seconds.
 * - Reduced motion: drawn at its score; no sweep.
 * - A dial turns clockwise in every script, so the ring keeps its direction
 *   under RTL. */

type ScoreRingTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ScoreGrade {
  /** The band starts at this score and runs up to the next grade's. */
  from: number
  /** The grade, shown in the middle and spoken after the score: "B". */
  label: string
  tone: ScoreRingTone
}

interface ScoreRingProps extends Omit<ComponentProps<'div'>, 'children'> {
  value: number
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** Bands in any order: the ring takes the tone of the one the score is in, and shows its label. */
  grades?: readonly ScoreGrade[]
  /** The lit ticks' tone outside any grade. Default `accent`. */
  tone?: ScoreRingTone
  /** How many ticks make the ring. Default 40. */
  ticks?: number
  /** The ring's size: `sm` 64px, `default` 96px, `lg` 128px. */
  size?: 'sm' | 'default' | 'lg'
  /** A soft sweep circles inside the ring, for a scan or a check still running. */
  busy?: boolean
  /** Intl.NumberFormat options for the score. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Score". */
  label?: string
  /** The middle. Default: the grade, else the score. */
  children?: ReactNode
}

const SIZE = { sm: 'size-16 own:text-xl', default: 'size-24 own:text-3xl', lg: 'size-32 own:text-4xl' }
/* Geometry in viewBox units, centered: a tick at rest, lit, and at the score, inner end to outer. */
const TICK: Record<'rest' | 'lit' | 'head', [number, number]> = { rest: [40.5, 46], lit: [39, 47], head: [36.5, 49] }

const f = (n: number) => Math.round(n * 100) / 100
const polar = (r: number, turn: number): [number, number] => [f(r * Math.sin(turn * 2 * Math.PI)), f(-r * Math.cos(turn * 2 * Math.PI))]

function ScoreRing({
  value,
  min = 0,
  max = 100,
  grades,
  tone = 'accent',
  ticks: count = 40,
  size = 'default',
  busy = false,
  format,
  locale: localeProp,
  label,
  children,
  className,
  style,
  ...props
}: ScoreRingProps) {
  const k = useYouj()
  const labels = useComponentLabels(scoreRingLabels)
  const locale = useLocale(localeProp)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  // numberFormat caches by locale and options, so this is the same formatter every render.
  const formatter = numberFormat(locale, format ?? { maximumFractionDigits: 0 })

  const span = max - min || 1
  const score = clamp(value, min, max)
  const fraction = (score - min) / span
  const grade = [...(grades ?? [])].sort((a, b) => a.from - b.from).reduce<ScoreGrade | undefined>((band, g) => (score >= g.from ? g : band), undefined)
  const ink = toneColor(grade?.tone ?? tone, 'var(--color-fg-muted)')
  const n = Math.max(8, Math.round(count))
  const lit = shown ? Math.round(fraction * n) : 0
  // Only the first reveal lights tick after tick; a later score relights at once.
  const revealed = useRef(false)
  useEffect(() => {
    if (lit > 0) revealed.current = true
  }, [lit])
  const step = k.reduced || revealed.current ? 0 : k.ms('deliberate') / n
  const valueText = labels.scoreRingValue(formatter.format(score), formatter.format(max))

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={label ?? labels.scoreRing}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={score}
      aria-valuetext={grade ? `${valueText}, ${labels.scoreRingGrade(grade.label)}` : valueText}
      aria-busy={busy || undefined}
      data-slot="score-ring"
      data-size={size}
      data-tone={grade?.tone ?? tone}
      data-yj-busy={busy || undefined}
      className={cn('relative own:inline-grid shrink-0 place-items-center', SIZE[size], className)}
      style={{ '--score-ring-tone': ink, ...style } as CSSProperties}
      {...props}
    >
      {busy && !k.reduced && (
        <span
          aria-hidden
          data-slot="score-ring-sweep"
          className="absolute inset-[14%] own:rounded-full animate-[yj-ring-turn_calc(var(--yj-duration-deliberate)*6)_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0turn,transparent_0.72turn,color-mix(in_oklab,var(--score-ring-tone)_30%,transparent)_1turn)]"
        />
      )}
      <svg aria-hidden data-slot="score-ring-ticks" viewBox="-50 -50 100 100" className="absolute inset-0 size-full overflow-visible">
        {Array.from({ length: n }, (_, i) => {
          const on = i < lit
          const head = on && i === lit - 1
          const [r0, r1] = head ? TICK.head : on ? TICK.lit : TICK.rest
          const [x1, y1] = polar(r0, i / n)
          const [x2, y2] = polar(r1, i / n)
          return (
            <line
              key={i}
              data-slot="score-ring-tick"
              data-yj-lit={on || undefined}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth={head ? 2.6 : 2.2}
              strokeLinecap="round"
              className={cn(on ? 'stroke-(--score-ring-tone)' : 'stroke-line-strong', !k.reduced && 'transition-[stroke] yj-duration-fast ease-standard')}
              style={step && on ? { transitionDelay: `${Math.round(i * step)}ms` } : undefined}
            />
          )
        })}
      </svg>
      <span data-slot="score-ring-center" className="relative own:font-medium own:leading-none own:tracking-tight own:text-fg own:tabular-nums">
        {children ?? grade?.label ?? formatter.format(score)}
      </span>
    </div>
  )
}

export { ScoreRing, type ScoreGrade, type ScoreRingProps, type ScoreRingTone }
