'use client'

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useResizeMeasure } from '../../../hooks/use-resize-measure'
import { cn } from '../../../lib/utils'
import { placeAcross, tickIndexes, wrapWords } from './stats'

/* The bars, drawn in SVG at the width they are given, so text stays at its
 * size. From the top: a lane for the callouts (as tall as the callouts it has
 * room for, none when there are none), the bars, and the day ticks. The peak
 * is lit; the rest are quiet. The average is a dashed line across the plot
 * with its tag in a gutter at the end, where no bar reaches. A callout is
 * text over a thin leader to its bar: it stays in the lane, above the
 * tallest bar, and is nudged sideways just far enough not to touch its
 * neighbour; one that can't fit beside the others is left out of the lane
 * (the readout still reads its day). */

const HEIGHT = 224
const AXIS = 26
const LINE = 15
const GUTTER_PAD = 10
const CHAR = 6.6

interface PlotProps {
  values: readonly number[]
  /** The calendar day's short name, and the readout's longer one. */
  tickOf: (index: number) => string
  /** The first line of a day's callout and the readout, with its value. */
  readingOf: (index: number) => string
  notes: readonly { index: number; text: string }[]
  peak: number
  average: number
  averageTag: string
  active: number | null
  onActiveChange: (index: number | null) => void
  label: string
  summaryId: string
  className?: string
}

function Plot({ values, tickOf, readingOf, notes, peak, average, averageTag, active, onActiveChange, label, summaryId, className }: PlotProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useResizeMeasure(ref, (el) => setWidth(el.clientWidth))
  const n = values.length
  const top = values[peak] ?? 1

  const gutter = Math.ceil(averageTag.length * CHAR) + GUTTER_PAD
  const plotW = Math.max(0, width - gutter)
  const slot = n ? plotW / n : 0
  const barW = Math.min(24, Math.max(3, slot * 0.62))

  // The callouts that fit the lane, most important (tallest bar) first; each a left edge, a width and its lines.
  const lane = useMemo(() => {
    const wanted = notes
      .filter((note) => note.index >= 0 && note.index < n)
      .map((note) => {
        const lines = [readingOf(note.index), ...wrapWords(note.text, 28, 2)]
        return { ...note, lines, w: Math.ceil(Math.max(...lines.map((l) => l.length)) * CHAR) + 4, center: (note.index + 0.5) * slot }
      })
      .sort((a, b) => values[b.index]! - values[a.index]!)
    const kept: typeof wanted = []
    for (const note of wanted) {
      const next = [...kept, note].sort((a, b) => a.center - b.center)
      if (plotW > 0 && placeAcross(next.map((c) => c.center), next.map((c) => c.w), plotW, 12)) kept.push(note)
    }
    kept.sort((a, b) => a.center - b.center)
    const lefts = placeAcross(kept.map((c) => c.center), kept.map((c) => c.w), plotW, 12) ?? []
    const height = kept.length ? Math.max(...kept.map((c) => c.lines.length)) * LINE + 22 : 0
    return { height, items: kept.map((c, i) => ({ ...c, left: lefts[i]! })) }
  }, [notes, n, slot, plotW, values, readingOf])

  const barsTop = lane.height
  const barsH = HEIGHT - AXIS - barsTop
  const yOf = (v: number) => barsTop + barsH - (top > 0 ? (v / top) * barsH : 0)
  const baseline = barsTop + barsH
  const ticks = tickIndexes(n, slot)

  const indexAt = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || slot <= 0) return null
    const x = clientX - box.left
    return x < 0 || x > plotW ? null : Math.min(n - 1, Math.floor(x / slot))
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const i = indexAt(event.clientX)
    if (i !== active) onActiveChange(i)
  }
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = active ?? (event.key === 'ArrowLeft' || event.key === 'End' ? n : -1)
    const next =
      event.key === 'ArrowRight' ? Math.min(n - 1, from + 1)
      : event.key === 'ArrowLeft' ? Math.max(0, from - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? n - 1
      : undefined
    if (event.key === 'Escape' && active !== null) {
      event.preventDefault()
      onActiveChange(null)
    } else if (next !== undefined) {
      event.preventDefault()
      onActiveChange(next)
    }
  }

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
      data-slot="daily-bars-plot"
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

            {values.map((v, i) => {
              const h = Math.max(1, (top > 0 ? v / top : 0) * barsH)
              const x = i * slot + (slot - barW) / 2
              const r = Math.min(3, barW / 2, h)
              return (
                <m.path
                  key={i}
                  data-slot="daily-bars-bar"
                  data-yj-peak={i === peak || undefined}
                  data-active={i === active || undefined}
                  d={`M${x} ${baseline}V${baseline - h + r}Q${x} ${baseline - h} ${x + r} ${baseline - h}H${x + barW - r}Q${x + barW} ${baseline - h} ${x + barW} ${baseline - h + r}V${baseline}Z`}
                  className={cn(
                    'transition-[fill] yj-duration-fast ease-standard',
                    i === peak ? 'fill-chart-1' : i === active ? 'fill-fg-subtle' : 'fill-line-strong',
                  )}
                  style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                  initial={k.reduced ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ ...k.tween('slow', 'enter'), delay: k.reduced ? 0 : i * 0.012 }}
                />
              )
            })}

            {active !== null && active !== peak && (
              <path d={`M${(active + 0.5) * slot} ${baseline + 4}v3`} className="stroke-fg-muted" strokeWidth={1.5} strokeLinecap="round" />
            )}

            {/* The average: a dashed line across the plot, its tag in the gutter. */}
            <line x1={0} x2={plotW} y1={yOf(average)} y2={yOf(average)} className="stroke-fg-muted" strokeWidth={1} strokeDasharray="4 4" />
            <text x={plotW + 8} y={yOf(average)} dominantBaseline="central" className="fill-fg text-ui-xs font-medium tabular-nums">
              {averageTag}
            </text>

            {lane.items.map((c) => {
              const x = (c.index + 0.5) * slot
              const textTop = barsTop - 18 - c.lines.length * LINE
              return (
                <g key={c.index} data-slot="daily-bars-callout">
                  <path d={`M${x} ${yOf(values[c.index]!) - 3}V${barsTop - 16}`} className="stroke-line-strong" strokeWidth={1} />
                  {c.lines.map((line, row) => (
                    <text
                      key={row}
                      x={c.left}
                      y={textTop + (row + 1) * LINE - 4}
                      className={cn('text-ui-xs tabular-nums', row === 0 ? 'fill-fg font-medium' : 'fill-fg-muted')}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}

            {ticks.map((i) => {
              const x = (i + 0.5) * slot
              const anchor = x < 20 ? 'start' : x > plotW - 20 ? 'end' : 'middle'
              return (
                <text
                  key={i}
                  x={anchor === 'start' ? 0 : anchor === 'end' ? plotW : x}
                  y={baseline + 19}
                  textAnchor={anchor}
                  className="fill-fg-muted text-ui-xs tabular-nums"
                >
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
