import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const DOTS = [[7.5, 15], [10, 10.5], [13, 13.5], [15.5, 8], [18.5, 11]] as const

/** The points are plotted one by one, each popping in where it lands. */
export const ChartScatterIcon = createIcon({
  name: 'chart-scatter',
  category: 'data',
  keywords: ['scatter plot', 'correlation', 'data points', 'distribution', 'analytics', 'graph'],
  variants: (k) => {
    const pop = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0, 1.3, 1], transition: seq(k, 'slow', [0, 0.25, 0.65, 1], ['exit', 'enter', 'standard'], i * k.stagger('loose')) },
    })
    return Object.fromEntries(DOTS.map((_, i) => [`p${i}`, pop(i)]))
  },
  render: (v) => (
    <>
      <path d="M3 3 V19 A2 2 0 0 0 5 21 H21" />
      {DOTS.map(([x, y], i) => (
        <m.path key={x} d={`M${x} ${y} h.01`} strokeWidth={2.75} variants={v[`p${i}`]} style={origin(x, y)} />
      ))}
    </>
  ),
})
