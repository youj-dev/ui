import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The bands are drawn across the sky one after another, outermost first. */
export const RainbowIcon = createIcon({
  name: 'rainbow',
  category: 'weather',
  keywords: ['rainbow', 'after rain', 'pride', 'colorful', 'spectrum', 'arc'],
  variants: (k) => ({
    a0: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
    a1: { rest: drawn(k), active: drawIn(k, 'slow', k.stagger('loose'), 'standard') },
    a2: { rest: drawn(k), active: drawIn(k, 'slow', k.stagger('loose') * 2, 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M3 18 A9 9 0 0 1 21 18" variants={v.a0} />
      <m.path d="M6.5 18 A5.5 5.5 0 0 1 17.5 18" variants={v.a1} />
      <m.path d="M10 18 A2 2 0 0 1 14 18" variants={v.a2} />
    </>
  ),
})
