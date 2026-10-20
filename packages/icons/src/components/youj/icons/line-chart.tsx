import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin } from './icon-base'

/** The series is plotted left to right and the latest point lands with a small settle. */
export const LineChartIcon = createIcon({
  name: 'line-chart',
  category: 'data',
  keywords: ['chart', 'analytics', 'trend', 'graph', 'series', 'stats'],
  variants: (k) => ({
    line: { from: hidden, rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'emphasized') },
    point: {
      from: { scale: 0 },
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [0, 1], transition: { ...k.spring('settle'), delay: k.duration('slow') } },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 3 V19 A2 2 0 0 0 5 21 H21" />
      <m.path d="M7 15 L11 11 L14 14 L19 9" variants={v.line} />
      <m.path d="M19 9 h.01" strokeWidth={3} variants={v.point} style={origin(19, 9)} />
    </>
  ),
})
