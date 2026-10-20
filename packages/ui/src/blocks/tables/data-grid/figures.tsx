'use client'

import { memo, useContext, useId, useMemo, type CSSProperties } from 'react'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { TrendingDownIcon } from '@youj/icons/components/youj/icons/trending-down'
import { TrendingUpIcon } from '@youj/icons/components/youj/icons/trending-up'
import { cn } from '../../../lib/utils'
import { GridEnvContext } from './cells'
import { useCopy } from './copy'
import { figureParts, type FigurePart } from './format'
import type { DataGridTone } from './model'

/* ── Figures: tabular mono, the symbol, cents and unit muted ────────────── */

function Parts({ parts }: { parts: FigurePart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.muted ? (
          <span key={i} className="own:text-fg-muted">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  )
}

export const FigureCell = memo(function FigureCell({
  value,
  options,
  unit,
  tone,
}: {
  value: number | null | undefined
  options: Intl.NumberFormatOptions
  unit?: string
  tone?: DataGridTone
}) {
  const { locale } = useContext(GridEnvContext)
  if (value === null || value === undefined || Number.isNaN(value)) return <span className="own:text-fg-muted">—</span>
  return (
    <span
      data-slot="data-grid-figure"
      className={cn('own:font-mono own:text-[0.95em] own:tracking-tight whitespace-nowrap own:tabular-nums', tone && TONE_INK[tone])}
    >
      <Parts parts={figureParts(value, locale, options)} />
      {unit && <span className="own:ms-1 own:font-sans own:text-ui-sm own:tracking-normal own:text-fg-muted">{unit}</span>}
    </span>
  )
})

const TONE_INK: Record<DataGridTone, string> = {
  neutral: 'own:text-fg',
  accent: 'own:text-accent-text',
  success: 'own:text-success-text',
  warning: 'own:text-warning-text',
  danger: 'own:text-danger-text',
}

/* ── Meter: how much of a limit is used ─────────────────────────────────── */

export const MeterCell = memo(function MeterCell({
  value,
  max,
  tone,
  format,
  label,
}: {
  value: number
  max: number
  tone: DataGridTone
  format: (n: number) => string
  /** The meter's name: the column header. */
  label: string
}) {
  const labels = useCopy()
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <span className="own:flex w-full min-w-0 items-center gap-2.5">
      <span
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={labels.valueOfMax(format(value), format(max))}
        className="relative h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-well"
      >
        <span
          data-slot="data-grid-meter-fill"
          data-tone={tone}
          className={cn(
            'absolute inset-0 origin-left own:rounded-full rtl:origin-right',
            'transition-[scale,background-color] yj-duration-slow ease-standard',
            METER_FILL[tone],
          )}
          style={{ scale: `${ratio} 1` }}
        />
      </span>
      <span aria-hidden className="shrink-0 own:font-mono own:text-ui-sm own:tabular-nums">
        {format(value)}
        <span className="own:text-fg-muted">/{format(max)}</span>
      </span>
    </span>
  )
})

const METER_FILL: Record<DataGridTone, string> = {
  neutral: 'own:bg-fg-muted',
  accent: 'own:bg-accent',
  success: 'own:bg-success',
  warning: 'own:bg-warning',
  danger: 'own:bg-danger',
}

/* ── Trend: a word-sized line and the change ────────────────────────────── */

const SPARK_W = 72
const SPARK_H = 24
const SPARK_PAD = 3

/** Fritsch–Carlson monotone cubic: it never overshoots a point. */
function monotone(points: [number, number][]) {
  const n = points.length
  // lint-blocks-allow: a one-point path, not a plural
  if (n < 2) return n === 1 ? `M${points[0]![0]},${points[0]![1]}` : ''
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]![0] - points[i]![0])
    slope.push((points[i + 1]![1] - points[i]![1]) / (dx[i] || 1))
  }
  const tangent: number[] = [slope[0]!]
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!
    const b = slope[i]!
    tangent.push(a * b <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / a + (dx[i]! + 2 * dx[i - 1]!) / b))
  }
  tangent.push(slope[n - 2]!)
  const r = (v: number) => Math.round(v * 100) / 100
  let d = `M${r(points[0]![0])},${r(points[0]![1])}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[i + 1]!
    const h = dx[i]! / 3
    d += ` C${r(x0 + h)},${r(y0 + tangent[i]! * h)} ${r(x1 - h)},${r(y1 - tangent[i + 1]! * h)} ${r(x1)},${r(y1)}`
  }
  return d
}

export const TrendCell = memo(function TrendCell({
  data,
  delta,
  color,
  format,
}: {
  data: readonly number[]
  /** The change to show beside the line, as a fraction (0.12 is +12%). Default: last against first. */
  delta: number | null
  /** Any CSS color, or `auto`: the first chart color, and the danger ink while it falls. */
  color: string
  format: (fraction: number) => string
}) {
  const labels = useCopy()
  const gradient = `dg-spark-${useId().replace(/:/g, '')}`
  const { line, area, end } = useMemo(() => {
    if (data.length === 0) return { line: '', area: '', end: null }
    const lo = Math.min(...data)
    const hi = Math.max(...data)
    const span = hi - lo || 1
    const step = data.length > 1 ? SPARK_W / (data.length - 1) : 0
    const points = data.map((v, i): [number, number] => [i * step, SPARK_PAD + (1 - (v - lo) / span) * (SPARK_H - SPARK_PAD * 2)])
    const path = monotone(points)
    return { line: path, area: `${path} L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`, end: points[points.length - 1]! }
  }, [data])
  const direction = delta === null ? null : delta > 0.0005 ? 'up' : delta < -0.0005 ? 'down' : 'flat'
  const stroke = color === 'auto' ? (direction === 'down' ? 'var(--color-danger)' : 'var(--color-chart-1)') : color
  const Arrow = direction === 'up' ? TrendingUpIcon : direction === 'down' ? TrendingDownIcon : MinusIcon
  return (
    <span className="own:flex items-center gap-2.5">
      {/* A trend reads left to right in either direction of text: the line is drawn left to right, and never mirrored. */}
      <svg
        aria-hidden
        width={SPARK_W}
        height={SPARK_H}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        className="shrink-0 overflow-visible"
        style={{ '--dg-spark': stroke } as CSSProperties}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dg-spark)" stopOpacity={0.24} />
            <stop offset="100%" stopColor="var(--dg-spark)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradient})`} />
        <path d={line} fill="none" stroke="var(--dg-spark)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {end && <circle cx={end[0]} cy={end[1]} r={2.25} fill="var(--dg-spark)" stroke="var(--dg-row-bg, var(--color-surface))" strokeWidth={1.5} />}
      </svg>
      {direction && delta !== null && (
        <span
          data-slot="data-grid-delta"
          data-direction={direction}
          className={cn(
            'own:inline-flex items-center gap-0.5 own:font-mono own:text-ui-sm own:tabular-nums',
            direction === 'up' ? 'own:text-success-text' : direction === 'down' ? 'own:text-danger-text' : 'own:text-fg-muted',
          )}
        >
          <Arrow size={13} strokeWidth={2} trigger="none" />
          <span className="sr-only">{direction === 'up' ? labels.trendUp : direction === 'down' ? labels.trendDown : labels.trendFlat}</span>
          {format(Math.abs(delta))}
        </span>
      )}
    </span>
  )
})
