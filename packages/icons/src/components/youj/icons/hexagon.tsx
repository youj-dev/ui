import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A sixth of a turn: the hexagon tightens, rotates one side on and lands on its own outline. Rest is 60° so leaving mid-turn completes forwards. */
export const HexagonIcon = createIcon({
  name: 'hexagon',
  category: 'editor',
  keywords: ['hexagon', 'shape', 'polygon', 'honeycomb', 'node', 'geometry'],
  variants: (k) => ({
    shape: {
      rest: { rotate: 60, scale: 1, transition: k.tween('base', 'enter') },
      active: {
        rotate: [0, 60],
        scale: [1, 0.86, 1],
        transition: { rotate: k.tween('slow', 'emphasized'), scale: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
    },
  }),
  render: (v) => <m.path d="M12.88 3.26 L19.14 6.87 A1.75 1.75 0 0 1 20.01 8.39 L20.01 15.61 A1.75 1.75 0 0 1 19.14 17.13 L12.88 20.74 A1.75 1.75 0 0 1 11.13 20.74 L4.86 17.13 A1.75 1.75 0 0 1 3.99 15.61 L3.99 8.39 A1.75 1.75 0 0 1 4.86 6.87 L11.13 3.26 A1.75 1.75 0 0 1 12.88 3.26 Z" variants={v.shape} style={origin(12, 12)} />,
})
