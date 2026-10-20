'use client'

import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { portfolioLabels, useComponentLabels } from '@youj/core/labels'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import { POINTS, resample, type PortfolioPoint } from './data'

/* The value over a period as an area. A period switch morphs the curve point
 * by point (every series is resampled to the same number of points) while the
 * date axis crossfades; the curve is never empty. The chart is one slider
 * stop: hovering scrubs a readout, and the arrow keys move a focus point
 * (Home and End jump to the ends, Page Up and Down take tenths). Reduced
 * motion: everything is drawn in place. */

const W = 100
const H = 40
const PAD = 3

interface PortfolioChartProps {
  series: readonly PortfolioPoint[]
  /** The axis' date style: months and days for a short period, months and years for a long one. */
  axis: Intl.DateTimeFormatOptions
  /** Which way the curve is good: a rise reads as success, a fall as danger. */
  tone: 'up' | 'down' | 'flat'
  locale: string
  /** How the amounts are written. */
  format: Intl.NumberFormatOptions
  /** Names the chart for assistive tech. Default: the labels' "Value over time". */
  label?: string
}

function PortfolioChart({ series, axis, tone, locale, format, label }: PortfolioChartProps) {
  const k = useYouj()
  const labels = useComponentLabels(portfolioLabels)
  const hintId = useId()
  const gradient = `pf-${useId().replace(/:/g, '')}`
  const [pointer, setPointer] = useState<number | null>(null)
  const [key, setKey] = useState<number | null>(null)

  const points = useMemo(() => resample(series), [series])
  const last = points.length - 1
  const { line, area, ys } = useMemo(() => {
    const values = points.map((p) => p.v)
    const lo = Math.min(...values)
    const hi = Math.max(...values)
    const span = hi - lo || 1
    const ys = points.map((p) => PAD + (1 - (p.v - lo) / span) * (H - PAD * 2))
    const path = points.map((_, i) => `${i ? 'L' : 'M'}${((i / last) * W).toFixed(2)},${ys[i]!.toFixed(2)}`).join(' ')
    return { line: path, area: `${path} L${W},${H} L0,${H} Z`, ys }
  }, [points, last])

  const money = numberFormat(locale, format)
  const day = dateTimeFormat(locale, { dateStyle: 'medium' })
  const active = pointer ?? key
  const at = active ?? last
  const reading = labels.portfolioReading(money.format(points[at]?.v ?? 0), day.format(points[at]?.t ?? 0))
  const axisFormat = dateTimeFormat(locale, axis)
  const ticks = [0, Math.round(last / 2), last]
  const x = (i: number) => (i / last) * 100

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    if (box.width === 0) return
    setPointer(Math.min(last, Math.max(0, Math.round(((e.clientX - box.left) / box.width) * last))))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = Math.max(1, Math.round(POINTS / 10))
    const now = key ?? last
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? now + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? now - 1
          : e.key === 'PageUp'
            ? now + step
            : e.key === 'PageDown'
              ? now - step
              : e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? last
                  : null
    if (e.key === 'Escape') return setKey(null)
    if (next === null) return
    e.preventDefault()
    setKey(Math.min(last, Math.max(0, next)))
  }

  const morph = k.reduced ? { type: false as const } : k.tween('slow', 'standard')
  const color = tone === 'down' ? 'var(--color-danger)' : tone === 'up' ? 'var(--color-success)' : 'var(--color-fg-muted)'

  return (
    <MotionFeatures>
      <div data-slot="portfolio-chart" dir="ltr" className="flex flex-col gap-2">
        <div
          role="slider"
          tabIndex={0}
          aria-label={label ?? labels.portfolioChart}
          aria-describedby={hintId}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={last}
          aria-valuenow={at}
          aria-valuetext={reading}
          onPointerMove={move}
          onPointerDown={move}
          onPointerLeave={() => setPointer(null)}
          onKeyDown={onKeyDown}
          onFocus={() => setKey((current) => current ?? last)}
          onBlur={() => setKey(null)}
          style={{ '--tone': color } as CSSProperties}
          className="relative h-40 w-full touch-pan-y rounded-lg focus-ring"
        >
          <span id={hintId} className="sr-only">
            {labels.portfolioChartHint}
          </span>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tone)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--tone)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={0}
                x2={W}
                y1={H * f}
                y2={H * f}
                stroke="var(--color-line-subtle)"
                strokeWidth={1}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <m.path initial={false} animate={{ d: area }} transition={morph} fill={`url(#${gradient})`} stroke="none" />
            <m.path
              initial={false}
              animate={{ d: line }}
              transition={morph}
              fill="none"
              stroke="var(--tone)"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="transition-[stroke] yj-duration-base"
            />
          </svg>
          {active !== null && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px bg-line-strong"
                style={{ insetInlineStart: `${x(active)}%` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--tone) ring-2 ring-surface"
                style={{ insetInlineStart: `${x(active)}%`, top: `${(ys[active]! / H) * 100}%` }}
              />
              <span
                aria-hidden
                data-slot="portfolio-readout"
                className="pointer-events-none absolute top-0 flex flex-col rounded-lg border border-line bg-overlay px-2.5 py-1.5 text-ui-xs whitespace-nowrap shadow-xs"
                style={{ insetInlineStart: `${x(active)}%`, transform: `translateX(-${x(active)}%)` }}
              >
                <span className="font-mono text-ui-sm font-medium tabular-nums">{money.format(points[active]!.v)}</span>
                <span className="text-fg-muted">{day.format(points[active]!.t)}</span>
              </span>
            </>
          )}
        </div>
        <div aria-hidden className="relative h-4 text-ui-xs text-fg-subtle">
          <AnimatePresence initial={false}>
            <m.div
              key={`${axis.month}-${axis.year}-${axis.day}-${points[0]?.t}`}
              className="absolute inset-0 flex justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={k.reduced ? { type: false } : k.tween('base', 'standard')}
            >
              {ticks.map((i) => (
                <span key={i} className={cn('tabular-nums', i === 0 ? 'text-start' : i === last ? 'text-end' : 'text-center')}>
                  {axisFormat.format(points[i]!.t)}
                </span>
              ))}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionFeatures>
  )
}

export { PortfolioChart }
