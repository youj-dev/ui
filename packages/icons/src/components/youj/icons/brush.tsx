import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A brush stroke: the brush sweeps across from its handle and back. */
export const BrushIcon = createIcon({
  name: 'brush',
  category: 'editor',
  keywords: ['paint brush', 'art', 'design', 'draw', 'style', 'format painter'],
  variants: (k) => ({
    brush: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -12, 8, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.brush} style={origin(20, 4)}>
      <path d="M20 4 L14.5 9.5" />
      <path d="M15.56 10.56 L13.44 8.44 L11.44 10.44 L13.56 12.56 Z" />
      <path d="M11.44 10.44 C9 11 7.5 12.5 7.5 15 C7.5 17 6.5 18.25 4.5 19.5 C8 19.75 10.5 19 12 17.5 C13.25 16.25 13.75 14.5 13.56 12.56" />
    </m.g>
  ),
})
