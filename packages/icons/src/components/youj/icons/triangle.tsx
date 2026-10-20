import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A third of a turn: the triangle tightens, rotates one corner on and lands on its own outline. Rest is 120° so leaving mid-turn completes forwards. */
export const TriangleIcon = createIcon({
  name: 'triangle',
  category: 'editor',
  keywords: ['triangle', 'shape', 'delta', 'warning shape', 'geometry', 'polygon'],
  variants: (k) => ({
    shape: {
      rest: { rotate: 120, scale: 1, transition: k.tween('base', 'enter') },
      active: {
        rotate: [0, 120],
        scale: [1, 0.84, 1],
        transition: { rotate: k.tween('slow', 'emphasized'), scale: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
    },
  }),
  render: (v) => <m.path d="M13.73 6 L19.27 15.59 A2 2 0 0 1 17.54 18.59 L6.46 18.59 A2 2 0 0 1 4.73 15.59 L10.27 6 A2 2 0 0 1 13.73 6 Z" variants={v.shape} style={origin(12, 13.39)} />,
})
