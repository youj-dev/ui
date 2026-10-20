'use client'

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useResizeMeasure } from '../../../hooks/use-resize-measure'
import { cn } from '../../../lib/utils'
import { clearSpot, gaps, spreadLabels, tickIndexes, wrapWords, type Rect } from './stats'

/* The two running totals, drawn in SVG at the width they are given. Days run
 * along the bottom by their number in the period, so the previous period's
 * line lines up under this one's. This period is a line in the accent; the
 * previous is a quiet one; the stretch between them is a wash, in the accent
 * where this period is ahead and in danger where it has fallen behind. Each
 * line ends in a dot and a value in a gutter at the end, nudged apart when
 * the two lines finish close together. The note is text beside its point on
 * the line, placed in the first free spot around it (above to the left, above
 * to the right, below to the right, below to the left) so it never touches a
 * line, with a short leader to the point when it sits off to one side. */

const HEIGHT = 224
const AXIS = 26
const TOP = 10
const LINE = 15
const CHAR = 6.6
const GUTTER_PAD = 12

interface PlotProps {
  /** Both running totals, by day. */
  current: readonly number[]
  previous: readonly number[]
  tickOf: (index: number) => string
  /** The note's first line: its day and the running total. */
  noteOf: (index: number) => string
  note?: { index: number; text: string }
  currentEnd: string
  previousEnd: string
  active: number | null
  onActiveChange: (index: number | null) => void
  label: string
  summaryId: string
  className?: string
}

function Plot({ current, previous, tickOf, noteOf, note, currentEnd, previousEnd, active, onActiveChange, label, summaryId, className }: PlotProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useResizeMeasure(ref, (el) => setWidth(el.clientWidth))
  const days = Math.max(current.length, previous.length)

  const gutter = Math.ceil(Math.max(currentEnd.length, previousEnd.length) * CHAR) + GUTTER_PAD
  const plotW = Math.max(0, width - gutter)
  const baseline = HEIGHT - AXIS
  const plotH = baseline - TOP
  const { xOf, yOf, currentPts, previousPts, washes } = useMemo(() => {
    const top = Math.max(1, ...current, ...previous) * 1.05
    const xOf = (i: number) => (days > 1 ? (i / (days - 1)) * plotW : plotW / 2)
    const yOf = (v: number) => baseline - (v / top) * plotH
    const pointsOf = (values: readonly number[]) => values.map((v, i) => ({ x: xOf(i), y: yOf(v) }))
    const washes = gaps(current, previous).map((g) => {
      const upper = g.points.map((p) => `${xOf(p.x).toFixed(1)} ${yOf(Math.max(p.current, p.previous)).toFixed(1)}`)
      const lower = g.points.map((p) => `${xOf(p.x).toFixed(1)} ${yOf(Math.min(p.current, p.previous)).toFixed(1)}`).reverse()
      return { ahead: g.ahead, d: `M${upper.join('L')}L${lower.join('L')}Z` }
    })
    return { xOf, yOf, currentPts: pointsOf(current), previousPts: pointsOf(previous), washes }
  }, [current, previous, days, plotW, baseline, plotH])
  const slot = days > 1 ? plotW / (days - 1) : plotW
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('')

  // The note: beside its point on this period's line, in the first free spot.
  const callout = useMemo(() => {
    if (!note || note.index < 0 || note.index >= current.length || plotW <= 0) return undefined
    const lines = [noteOf(note.index), ...wrapWords(note.text, 26, 2)]
    const w = Math.ceil(Math.max(...lines.map((l) => l.length)) * CHAR) + 2
    const h = lines.length * LINE
    const p = currentPts[note.index]!
    const gap = 12
    const candidates: Rect[] = [
      { left: p.x - w + 4, top: p.y - gap - h, width: w, height: h },
      { left: p.x - 4, top: p.y - gap - h, width: w, height: h },
      { left: p.x + gap, top: p.y + gap, width: w, height: h },
      { left: p.x - gap - w, top: p.y + gap, width: w, height: h },
    ]
    const spot = clearSpot(candidates, [currentPts, previousPts], { left: 0, top: 0, width: plotW, height: baseline }, 4)!
    return { lines, spot, p }
  }, [note, current.length, plotW, currentPts, previousPts, baseline, noteOf])

  // The two end values, apart by at least a line each, in the order the lines finish.
  const ends = [previous, current].map((values) => yOf(values.at(-1) ?? 0))
  const byHeight = [0, 1].sort((a, b) => ends[a]! - ends[b]!)
  const spread = spreadLabels(byHeight.map((i) => ends[i]!), 17, TOP + 6, baseline - 6)
  const labelYs = ends.map((_, i) => spread[byHeight.indexOf(i)]!)

  const indexAt = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || days < 1 || plotW <= 0) return null
    const x = clientX - box.left
    return x < -slot / 2 || x > plotW + slot / 2 ? null : Math.min(days - 1, Math.max(0, Math.round(x / (slot || 1))))
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const i = indexAt(event.clientX)
    if (i !== active) onActiveChange(i)
  }
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = active ?? (event.key === 'ArrowLeft' || event.key === 'End' ? days : -1)
    const next =
      event.key === 'ArrowRight' ? Math.min(days - 1, from + 1)
      : event.key === 'ArrowLeft' ? Math.max(0, from - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? days - 1
      : undefined
    if (event.key === 'Escape' && active !== null) {
      event.preventDefault()
      onActiveChange(null)
    } else if (next !== undefined) {
      event.preventDefault()
      onActiveChange(next)
    }
  }

  const ticks = tickIndexes(days, slot)
  const draw = k.reduced ? undefined : { ...k.tween('deliberate', 'enter') }

  return (
    <div
      ref={ref}
      // Time runs left to right in either direction of text.
      dir="ltr"
      role="group"
      aria-roledescription="chart"
      aria-label={label}
      aria-describedby={summaryId}
      tabIndex={0}
      data-slot="running-total-plot"
      className={cn('relative w-full touch-pan-y rounded-md outline-hidden select-none focus-ring', className)}
      style={{ height: HEIGHT }}
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={() => onActiveChange(null)}
      onBlur={() => onActiveChange(null)}
      onKeyDown={keys}
    >
      {width > 0 && (
        <MotionFeatures>
          <svg aria-hidden width={width} height={HEIGHT} className="block overflow-visible">
            <line x1={0} x2={plotW} y1={baseline + 0.5} y2={baseline + 0.5} className="stroke-line" />

            {washes.map((w, i) => (
              <m.path
                key={i}
                d={w.d}
                data-slot="running-total-gap"
                data-yj-ahead={w.ahead}
                className={w.ahead ? 'fill-accent-subtle' : 'fill-danger-subtle'}
                initial={k.reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={draw && { ...draw, delay: 0.25 }}
              />
            ))}

            <m.path
              d={line(previousPts)}
              fill="none"
              className="stroke-fg-subtle"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={k.reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={draw}
            />
            <m.path
              d={line(currentPts)}
              fill="none"
              data-slot="running-total-line"
              className="stroke-chart-1"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={k.reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={draw && { ...draw, delay: 0.08 }}
            />

            {/* Where each line ends: a dot and its value. */}
            {[
              { at: previousPts, text: previousEnd, y: labelYs[0]!, dot: 'fill-fg-subtle', ink: 'fill-fg-muted' },
              { at: currentPts, text: currentEnd, y: labelYs[1]!, dot: 'fill-chart-1', ink: 'fill-fg font-medium' },
            ].map((end, i) => {
              const p = end.at.at(-1)
              return (
                p && (
                  <g key={i} data-slot="running-total-end">
                    <circle cx={p.x} cy={p.y} r={3.5} className={cn(end.dot, 'stroke-surface')} strokeWidth={2} />
                    <text x={plotW + 12} y={end.y} dominantBaseline="central" className={cn('text-ui-xs tabular-nums', end.ink)}>
                      {end.text}
                    </text>
                  </g>
                )
              )
            })}

            {active !== null && (
              <g data-slot="running-total-cursor">
                <line x1={xOf(active)} x2={xOf(active)} y1={TOP} y2={baseline} className="stroke-line-strong" strokeDasharray="3 3" />
                {active < previous.length && <circle cx={xOf(active)} cy={previousPts[active]!.y} r={3.5} className="fill-fg-subtle stroke-surface" strokeWidth={2} />}
                {active < current.length && <circle cx={xOf(active)} cy={currentPts[active]!.y} r={3.5} className="fill-chart-1 stroke-surface" strokeWidth={2} />}
              </g>
            )}

            {callout && (
              <g data-slot="running-total-callout">
                <circle cx={callout.p.x} cy={callout.p.y} r={5} className="fill-surface stroke-chart-1" strokeWidth={2} />
                {(() => {
                  const { spot, p } = callout
                  const x = Math.min(spot.left + spot.width, Math.max(spot.left, p.x))
                  const y = Math.min(spot.top + spot.height, Math.max(spot.top, p.y))
                  const near = Math.hypot(x - p.x, y - p.y) > 9
                  return near ? <path d={`M${p.x} ${p.y}L${x} ${y}`} className="stroke-line-strong" strokeWidth={1} /> : null
                })()}
                {callout.lines.map((text, row) => (
                  <text
                    key={row}
                    x={callout.spot.left}
                    y={callout.spot.top + (row + 1) * LINE - 4}
                    className={cn('text-ui-xs tabular-nums', row === 0 ? 'fill-fg font-medium' : 'fill-fg-muted')}
                  >
                    {text}
                  </text>
                ))}
              </g>
            )}

            {ticks.map((i) => {
              const x = xOf(i)
              const anchor = x < 20 ? 'start' : x > plotW - 20 ? 'end' : 'middle'
              return (
                <text key={i} x={anchor === 'start' ? 0 : anchor === 'end' ? plotW : x} y={baseline + 19} textAnchor={anchor} className="fill-fg-muted text-ui-xs tabular-nums">
                  {tickOf(i)}
                </text>
              )
            })}
          </svg>
        </MotionFeatures>
      )}
    </div>
  )
}

export { Plot }
