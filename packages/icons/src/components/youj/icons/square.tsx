import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * A quarter turn: the square dips, turns exactly 90° and lands on its own
 * silhouette. It's 16 units a side, the same area as the r9 circle, so the
 * two read as one size. Rest is 90° so leaving mid-turn completes forwards.
 */
export const SquareIcon = createIcon({
  name: 'square',
  category: 'editor',
  keywords: ['square', 'shape', 'stop', 'checkbox', 'rectangle', 'box', 'unchecked'],
  variants: (k) => ({
    square: {
      rest: { rotate: 90, scale: 1, transition: k.tween('base', 'enter') },
      active: {
        rotate: [0, 90],
        scale: [1, 0.84, 1],
        transition: { rotate: k.tween('slow', 'emphasized'), scale: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
    },
  }),
  render: (v) => <m.rect x="4" y="4" width="16" height="16" rx="2.5" variants={v.square} style={origin(12, 12)} />,
})
