import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The filled series sinks toward the baseline and swells back up to its values. */
export const ChartAreaIcon = createIcon({
  name: 'chart-area',
  category: 'data',
  keywords: ['area chart', 'graph', 'analytics', 'volume', 'trend', 'statistics'],
  variants: (k) => ({
    area: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.35, 1], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 3 V19 A2 2 0 0 0 5 21 H21" />
      <m.path d="M7 17 V13 L10.5 9.5 L14 12.5 L18.5 7.5 V17 Z" variants={v.area} style={origin(12, 17)} />
    </>
  ),
})
