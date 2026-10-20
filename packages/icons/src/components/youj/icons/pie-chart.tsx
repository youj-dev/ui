import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/** The body is traced around, then the slice pulls out along its diagonal and settles there. */
export const PieChartIcon = createIcon({
  name: 'pie-chart',
  category: 'data',
  keywords: ['chart', 'share', 'segment', 'analytics', 'portion', 'report'],
  variants: (k) => ({
    body: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow') },
    slice: {
      rest: { x: 0, y: 0, transition: k.spring('snappy') },
      active: { x: 1.25, y: -1.25, transition: { ...k.spring('settle'), delay: k.duration('fast') } },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M11.5 4.5 A8 8 0 1 0 19.5 12.5" variants={v.body} />
      <m.path d="M13 11 V3 A8 8 0 0 1 21 11 Z" variants={v.slice} />
    </>
  ),
})
