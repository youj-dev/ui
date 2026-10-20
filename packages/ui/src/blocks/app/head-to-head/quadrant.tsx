'use client'

import { useId } from 'react'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { HeadToHeadContender, HeadToHeadCopy, HeadToHeadSide } from './data'

interface QuadrantProps {
  contenders: Record<HeadToHeadSide, HeadToHeadContender>
  /** The overall winner, drawn in the accent. */
  winner: HeadToHeadSide | 'even'
  copy: HeadToHeadCopy
  /** The change from A to B on each axis, as text. Default: percent for x, points for y. */
  format?: { xDelta?: (from: number, to: number) => string; yDelta?: (from: number, to: number) => string }
}

/** B's change read as a gain (mint), a loss (red) or neither. */
const tint = (gain: number) => (gain > 0 ? 'text-success-text' : gain < 0 ? 'text-danger-text' : 'text-fg')

const W = 280
const H = 176
const PAD = 22

/** One axis against another as two dots on a quadrant: lower x to the left, higher y to the top, the cheap-and-good corner tinted, an arrow from A to B. Its numbers are stated beside it. */
function Quadrant({ contenders, winner, copy, format }: QuadrantProps) {
  const { a, b } = contenders
  const arrow = `arrow-${useId().replace(/[^\w-]/g, '')}`
  const xMax = Math.max(a.x, b.x) * 1.3
  // Room above and below the two dots: two units on a 0–100 score, 2% of the figure when it is bigger (a salary).
  const room = Math.max(2, Math.max(Math.abs(a.y), Math.abs(b.y)) / 50)
  const yMin = Math.floor(Math.min(a.y, b.y) - room)
  const yMax = Math.ceil(Math.max(a.y, b.y) + room)
  const x = (value: number) => PAD + (value / xMax) * (W - 2 * PAD)
  const y = (value: number) => H - PAD - ((value - yMin) / (yMax - yMin)) * (H - 2 * PAD)
  const midX = x(xMax / 2)
  const midY = y((yMin + yMax) / 2)
  const pct = numberFormat(copy.locale, { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 0 })
  const pts = numberFormat(copy.locale, { signDisplay: 'exceptZero', maximumFractionDigits: 1 })
  const xChange = format?.xDelta ? format.xDelta(a.x, b.x) : pct.format((b.x - a.x) / a.x)
  const yChange = format?.yDelta ? format.yDelta(a.y, b.y) : copy.points(pts.format(b.y - a.y))

  const dot = (side: HeadToHeadSide) => {
    const c = contenders[side]
    const lit = winner === side
    return (
      <g key={side}>
        {lit && <circle cx={x(c.x)} cy={y(c.y)} r={11} className="fill-accent-line" />}
        <circle cx={x(c.x)} cy={y(c.y)} r={lit ? 6 : 5} className={lit ? 'fill-accent' : 'fill-surface stroke-fg-subtle'} strokeWidth={1.5} />
        <text x={x(c.x) + 8} y={y(c.y) - 9} fontSize={10} className="fill-fg font-mono">
          {copy.sides[side]}
        </text>
      </g>
    )
  }

  return (
    <div data-slot="head-to-head-tradeoff" className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_--spacing(56)]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${copy.tradeoff}. ${copy.summary(copy.sides.b, xChange, yChange)}`}
        className="h-auto w-full max-w-88"
      >
        <rect x={PAD} y={PAD} width={midX - PAD} height={midY - PAD} rx={6} className="fill-accent-subtle" />
        <text x={PAD + 7} y={PAD + 13} fontSize={7.5} letterSpacing="0.1em" className="fill-accent-text font-mono uppercase">
          {copy.bestCorner}
        </text>
        <line x1={midX} x2={midX} y1={PAD} y2={H - PAD} strokeDasharray="2 4" className="stroke-line-strong" />
        <line x1={PAD} x2={W - PAD} y1={midY} y2={midY} strokeDasharray="2 4" className="stroke-line-strong" />
        <path d={`M${PAD} ${PAD} V${H - PAD} H${W - PAD}`} fill="none" className="stroke-line-strong" />
        <text x={W - PAD} y={H - 6} textAnchor="end" fontSize={7.5} letterSpacing="0.1em" className="fill-fg-muted font-mono uppercase">
          {copy.xAxis} →
        </text>
        <text x={6} y={PAD - 8} fontSize={7.5} letterSpacing="0.1em" className="fill-fg-muted font-mono uppercase">
          ↑ {copy.yAxis}
        </text>
        <defs>
          <marker id={arrow} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 z" className="fill-fg-subtle" />
          </marker>
        </defs>
        <line
          x1={x(a.x)}
          y1={y(a.y)}
          x2={x(b.x) + (x(a.x) > x(b.x) ? 12 : -12)}
          y2={y(b.y)}
          strokeDasharray="3 3"
          markerEnd={`url(#${arrow})`}
          className="stroke-line-strong"
        />
        {dot('a')}
        {dot('b')}
      </svg>
      <div className="flex flex-col gap-2.5">
        <dl className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
            <Eyebrow render={<dt />}>{copy.xChange}</Eyebrow>
            <dd className={cn('font-mono text-ui-lg tabular-nums', tint(a.x - b.x))}>{xChange}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
            <Eyebrow render={<dt />}>{copy.yChange}</Eyebrow>
            <dd className={cn('font-mono text-ui-lg tabular-nums', tint(b.y - a.y))}>{yChange}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export { Quadrant }
