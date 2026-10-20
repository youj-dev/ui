import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

const BARS = [
  { x: 8, top: 12 },
  { x: 12.5, top: 7 },
  { x: 17, top: 10 },
]

/** Bars grow up from the baseline, left to right. */
export const BarChartIcon = createIcon({
  name: 'bar-chart',
  category: 'data',
  keywords: ['chart', 'analytics', 'stats', 'graph', 'metrics', 'column'],
  variants: (k) => {
    const bar = (i: number) => ({ from: hidden, rest: drawn(k), active: drawIn(k, 'slow', i * k.stagger('loose'), 'emphasized') })
    return { b0: bar(0), b1: bar(1), b2: bar(2) }
  },
  render: (v) => (
    <>
      <path d="M3 3 V19 A2 2 0 0 0 5 21 H21" />
      {BARS.map(({ x, top }, i) => (
        <m.path key={x} d={`M${x} 17 V${top}`} variants={v[`b${i}` as 'b0']} />
      ))}
    </>
  ),
})
