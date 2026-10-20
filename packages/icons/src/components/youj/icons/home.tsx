import { m } from 'motion/react'
import { createIcon, drawIn, drawn, seq } from './icon-base'

/** The roof lifts and sets back down; the door is drawn open underneath it. */
export const HomeIcon = createIcon({
  name: 'home',
  category: 'navigation',
  keywords: ['house', 'dashboard', 'start', 'main'],
  variants: (k) => ({
    roof: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -2, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    door: { rest: drawn(k), active: drawIn(k, 'slow', k.duration('fast')) },
  }),
  render: (v) => (
    <>
      <m.path d="M3.5 11.5 L12 3 L20.5 11.5" variants={v.roof} />
      <path d="M6 9.5 V19 A2 2 0 0 0 8 21 H16 A2 2 0 0 0 18 19 V9.5" />
      <m.path d="M10 21 V16 A2 2 0 0 1 14 16 V21" variants={v.door} />
    </>
  ),
})
