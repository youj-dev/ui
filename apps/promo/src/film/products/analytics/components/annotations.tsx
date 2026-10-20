'use client'

import { motion } from 'motion/react'
import { usePlotArea, useXAxisScale, useYAxisScale } from 'recharts'
import { useYouj } from '@youj/core'
import { cn } from '@youj/react/lib/utils'
import { valueAt, type ChartPoint } from '../chart-data'
import type { ChartEvent, Driver, Week } from '../data'
import { usd } from '../format'
import { HOURS } from '../series'

/* Fig. 1's notes, drawn in the chart's own coordinates (Recharts' scale
 * hooks): the moments that moved the week, numbered on the line, and the
 * labels at the ends of the lines instead of a legend. */

interface Placed {
  event: ChartEvent
  n: number
  /** The number's circle: on the line for a moment, at the top of the band for a span. */
  px: number
  py: number
  /** The label's baseline, where its leader ends. */
  ty: number
  anchor: 'start' | 'end'
}

interface Box {
  x0: number
  x1: number
  y0: number
  y1: number
}

const LABEL_HEIGHT = 11
/** A generous estimate of a label's width: the labels are 11px, and a monospaced theme runs wide. */
const labelWidth = (text: string) => text.length * 6.6

/**
 * Lays the notes out in the space the lines leave free. A running total
 * climbs, so early in the week the room is above the lines and a note reads
 * leftward from its leader (rightward when that would leave the plot); late
 * in the week the room is below them. Each note clears every line across its
 * whole width and every note placed before it, and falls back to the other
 * side when its own has no room.
 */
function place(week: Week, data: ChartPoint[], xs: (v: number) => number, ys: (v: number) => number, plot: { x: number; y: number; width: number; height: number }): Placed[] {
  const placed: Placed[] = []
  const boxes: Box[] = []
  const bottom = plot.y + plot.height
  const toData = (px: number) => Math.min(HOURS, Math.max(0, ((px - plot.x) / plot.width) * HOURS))
  // The highest and lowest any line reaches across a span of pixels.
  const reach = (x0: number, x1: number) => {
    let top = Infinity
    let low = -Infinity
    for (let px = x0 - 6; px <= x1 + 6; px += 4) {
      const p = data[Math.round(toData(px))]!
      for (const v of [p.last, p.range[0], p.range[1], p.now, p.without]) {
        if (v === null) continue
        top = Math.min(top, ys(v))
        low = Math.max(low, ys(v))
      }
    }
    return { top, low }
  }
  const hits = (b: Box) => boxes.some((o) => b.x0 < o.x1 + 6 && b.x1 > o.x0 - 6 && b.y0 < o.y1 + 3 && b.y1 > o.y0 - 3)

  week.events.forEach((event, i) => {
    const span = event.to !== undefined
    const px = xs(event.at)
    const py = span ? plot.y + 10 : ys(valueAt(data, event.at))
    const width = labelWidth(event.label)
    const sides: ('above' | 'below')[] = span ? ['below'] : event.at < HOURS / 2 ? ['above', 'below'] : ['below', 'above']
    for (const side of sides) {
      let anchor: 'start' | 'end' = side === 'above' ? 'end' : 'start'
      if (anchor === 'end' && px - 8 - width < plot.x) anchor = 'start'
      if (anchor === 'start' && px + 8 + width > plot.x + plot.width) anchor = 'end'
      const x0 = anchor === 'start' ? px + 6 : px - 6 - width
      const x1 = x0 + width
      const { top, low } = reach(x0, x1)
      let ty = span ? py + 4 : side === 'above' ? Math.min(top - 8, py - 18) : Math.max(low + 8 + LABEL_HEIGHT, py + 28)
      let box = { x0, x1, y0: ty - LABEL_HEIGHT, y1: ty + 3 }
      while (hits(box)) {
        ty += side === 'above' ? -16 : 16
        box = { x0, x1, y0: ty - LABEL_HEIGHT, y1: ty + 3 }
      }
      if ((box.y0 >= plot.y && box.y1 <= bottom - 2) || side === sides.at(-1)) {
        boxes.push(box, { x0: px - 10, x1: px + 10, y0: py - 10, y1: py + 10 })
        placed.push({ event, n: i + 1, px, py, ty: Math.min(bottom - 4, Math.max(plot.y + LABEL_HEIGHT, ty)), anchor })
        break
      }
    }
  })
  return placed
}

// A halo in the page's color, so a label stays legible where it crosses a gridline.
const HALO = '[paint-order:stroke] stroke-canvas [stroke-linejoin:round] [stroke-width:3px]'

/** The notes arrive once the lines have drawn (`delay`), in time order. With a driver open, its own moment stands out and the rest recede. */
export function Annotations({ week, data, driver, compact, delay }: { week: Week; data: ChartPoint[]; driver: Driver | null; compact: boolean; delay: number }) {
  const k = useYouj()
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  if (!xScale || !yScale || !plot) return null
  const xs = (v: number) => xScale(v) ?? 0
  const ys = (v: number) => yScale(v) ?? 0
  const placed = place(week, data, xs, ys, plot)

  // The ends of the lines: this week, last week and, with a driver open, the week without it, nudged apart.
  // This week's label is its line's color (chart-1) with a fifth of ink, as accent-ink is, so it reads as text.
  const ends = [
    { key: 'now', label: week.offset === 0 ? 'So far' : 'This week', value: data[week.hoursIn]!.now ?? 0, x: week.hoursIn, ink: 'fill-[color-mix(in_oklab,var(--color-chart-1)_80%,var(--color-fg))]', strong: true },
    { key: 'last', label: 'Last week', value: data[HOURS]!.last, x: HOURS, ink: 'fill-fg-muted', strong: false },
    ...(driver && week.hoursIn === HOURS
      ? [{ key: 'without', label: 'Without it', value: data[HOURS]!.without ?? 0, x: HOURS, ink: driver.amount >= 0 ? 'fill-success-text' : 'fill-danger-text', strong: false }]
      : []),
  ]
    .map((e) => ({ ...e, px: xs(e.x), py: ys(e.value) }))
    .sort((a, b) => a.py - b.py)
  for (let i = 1; i < ends.length; i++) ends[i]!.py = Math.max(ends[i]!.py, ends[i - 1]!.py + 30)

  const appear = (i: number) => (k.reduced ? { type: false as const } : { ...k.tween('base', 'enter'), delay: delay + i * k.stagger('base') })

  return (
    <g className="text-ui-xs">
      {placed.map((p, i) => {
        const mine = driver !== null && p.event.driver === driver.id
        const faded = driver !== null && !mine
        const span = p.event.to !== undefined
        const down = p.ty > p.py
        return (
          <motion.g key={`${week.offset}-${p.n}`} initial={k.reduced ? false : { opacity: 0 }} animate={{ opacity: faded ? 0.28 : 1 }} transition={faded || mine ? k.tween('base') : appear(i)}>
            {!compact && (
              <>
                {!span && <line x1={p.px} x2={p.px} y1={down ? p.py + 9 : p.py - 9} y2={down ? p.ty - LABEL_HEIGHT - 2 : p.ty + 3} className="stroke-line-strong" strokeWidth={1} />}
                <text
                  x={p.px + (p.anchor === 'start' ? 1 : -1) * (span ? 14 : 6)}
                  y={span ? p.py : p.ty}
                  dy={span ? '0.35em' : undefined}
                  textAnchor={p.anchor}
                  className={cn('fill-fg', HALO, mine && 'font-semibold')}
                >
                  {p.event.label}
                </text>
              </>
            )}
            <circle cx={p.px} cy={p.py} r={8} className={cn(mine ? 'fill-fg' : 'fill-canvas', 'stroke-fg')} strokeWidth={1.25} />
            <text x={p.px} y={p.py} dy="0.35em" textAnchor="middle" className={cn('text-[0.6875rem] font-semibold tabular-nums', mine ? 'fill-canvas' : 'fill-fg')}>
              {p.n}
            </text>
          </motion.g>
        )
      })}
      {!compact &&
        ends.map((e, i) => (
          <motion.g key={`${week.offset}-${e.key}`} initial={k.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={appear(placed.length + i)}>
            <text x={e.px + 10} y={e.py - 3} className={cn(e.ink, 'text-[0.625rem] font-medium tracking-[0.1em] uppercase')}>
              {e.label}
            </text>
            <text x={e.px + 10} y={e.py + 11} className={cn(e.strong ? 'fill-fg font-semibold' : 'fill-fg-muted', 'tabular-nums')}>
              {usd.format(e.value)}
            </text>
          </motion.g>
        ))}
      {week.offset === 0 && week.hoursIn > 0 && (
        <g>
          <circle cx={xs(week.hoursIn)} cy={ys(data[week.hoursIn]!.now ?? 0)} r={9} className="fill-chart-quiet" />
          <circle cx={xs(week.hoursIn)} cy={ys(data[week.hoursIn]!.now ?? 0)} r={3.5} className="fill-chart-1" />
        </g>
      )}
    </g>
  )
}
