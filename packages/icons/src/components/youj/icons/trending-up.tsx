import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/** The trend is drawn upward and the arrowhead is pushed out ahead of it. */
export const TrendingUpIcon = createIcon({
  name: 'trending-up',
  category: 'data',
  keywords: ['growth', 'increase', 'profit', 'up', 'chart', 'rise'],
  variants: (k) => ({
    line: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
    head: {
      from: { opacity: 0 },
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [-3, -3, 0],
        y: [3, 3, 0],
        opacity: [0, 0, 1],
        transition: seq(k, 'slow', [0, 0.35, 1], ['linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M3 17 L9 11 L13 15 L21 7" variants={v.line} />
      <m.path d="M15 7 H21 V13" variants={v.head} />
    </>
  ),
})
