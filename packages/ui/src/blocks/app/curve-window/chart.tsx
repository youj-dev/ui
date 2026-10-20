'use client'

import type { CurveWindowCopy, CurveWindowSeries, CurveWindowTrace } from './data'
import { curvePath, endOf, ticks, xOf, yOf, type Plot } from './geometry'

/* One value against another for the last parts. Good curves are hairlines
 * that end inside the window (a dashed green rectangle); the last part is
 * the accent line with a dot at its end; a failed one is danger red with a
 * ring where it ended, and its callout names the part, its value and why.
 * The picture is one image with a text alternative; the parts are listed in
 * words beside it for assistive tech. */

export const FRAME = { x0: 34, x1: 312, y0: 10, y1: 150 } as const
const WIDTH = 320
const HEIGHT = 172

const LABEL = { fontFamily: 'var(--font-sans)', fontSize: 11, fill: 'var(--color-fg-subtle)' } as const

interface ChartProps {
  series: CurveWindowSeries
  /** The failed part the callout names. */
  failed: CurveWindowTrace | undefined
  label: string
  copy: CurveWindowCopy
  /** What the axes stand for and where their ticks fall. */
  axes: { minX: number; maxX: number; minY: number; maxY: number; stepX: number; stepY: number }
  /** A value of each axis as text: `tick` on the axis, `value` anywhere else. */
  text: { tickX: (value: number) => string; tickY: (value: number) => string; y: (value: number) => string }
}

export function Chart({ series, failed, label, copy, axes, text }: ChartProps) {
  const PLOT: Plot = { ...FRAME, minX: axes.minX, maxX: axes.maxX, minY: axes.minY, maxY: axes.maxY }
  const { window } = series
  const last = series.curves[series.curves.length - 1]
  const failEnd = failed ? endOf(failed.points) : undefined
  const bubbleX = failEnd ? xOf(PLOT, failEnd[0]) : 0
  const bubbleY = failEnd ? yOf(PLOT, failEnd[1]) : 0
  return (
    <div className="relative">
      <svg role="img" aria-label={label} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full">
        {ticks(PLOT.maxY, axes.stepY, PLOT.minY).map((t) => (
          <g key={t}>
            <line x1={PLOT.x0} x2={PLOT.x1} y1={yOf(PLOT, t)} y2={yOf(PLOT, t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={PLOT.x0 - 8} y={yOf(PLOT, t)} textAnchor="end" dominantBaseline="middle" style={LABEL}>
              {text.tickY(t)}
            </text>
          </g>
        ))}
        {ticks(PLOT.maxX, axes.stepX, PLOT.minX).map((a) => (
          <text key={a} x={xOf(PLOT, a)} y={PLOT.y1 + 18} textAnchor={a === PLOT.minX ? 'start' : a === PLOT.maxX ? 'end' : 'middle'} style={LABEL}>
            {text.tickX(a)}
          </text>
        ))}
        <rect
          x={xOf(PLOT, window.xFrom)}
          y={yOf(PLOT, window.yTo)}
          width={xOf(PLOT, window.xTo) - xOf(PLOT, window.xFrom)}
          height={yOf(PLOT, window.yFrom) - yOf(PLOT, window.yTo)}
          fill="var(--color-success-subtle)"
          stroke="var(--color-success)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        {series.curves.map((c) =>
          c === last || c.result === 'nok' ? null : <path key={c.id} d={curvePath(PLOT, c.points)} fill="none" stroke="var(--color-fg-subtle)" strokeWidth={1} />,
        )}
        {series.curves
          .filter((c) => c.result === 'nok')
          .map((c) => (
            <g key={c.id}>
              <path d={curvePath(PLOT, c.points)} fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={xOf(PLOT, endOf(c.points)[0])} cy={yOf(PLOT, endOf(c.points)[1])} r={5} fill="var(--color-surface)" stroke="var(--color-danger)" strokeWidth={2} />
            </g>
          ))}
        {last && last.result === 'ok' && (
          <g>
            <path d={curvePath(PLOT, last.points)} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={xOf(PLOT, endOf(last.points)[0])} cy={yOf(PLOT, endOf(last.points)[1])} r={3.5} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {failed && failEnd && (
        <div
          data-yj-tone="inverse"
          className="pointer-events-none absolute -translate-x-full -translate-y-1/2 rounded-chip bg-inverse px-2.5 py-1.5 text-ui whitespace-nowrap text-fg shadow-sm"
          style={{ left: `calc(${(bubbleX / WIDTH) * 100}% - 12px)`, top: `calc(${(bubbleY / HEIGHT) * 100}% - 6px)` }}
        >
          <span className="block font-medium tabular-nums">{copy.callout(failed.id, text.y(failEnd[1]))}</span>
          {failed.note && <span className="block text-ui-sm text-fg-muted">{failed.note}</span>}
        </div>
      )}
    </div>
  )
}
