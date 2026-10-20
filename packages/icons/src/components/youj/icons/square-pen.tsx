import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const WRITE = [0, 0.2, 0.4, 0.6, 0.8, 1]

/** Editing: the pen scribbles a few quick strokes against the open corner of the page and settles back. */
export const SquarePenIcon = createIcon({
  name: 'square-pen',
  category: 'actions',
  keywords: ['edit', 'write', 'compose', 'modify', 'pen', 'rename', 'draft'],
  variants: (k) => ({
    pen: {
      rest: { x: 0, y: 0, rotate: 0, transition: k.tween('fast') },
      active: {
        x: [0, -1.5, 0.5, -1, 0.25, 0],
        y: [0, 0.5, -0.5, 0.75, -0.25, 0],
        rotate: [0, -4, 3, -3, 1, 0],
        transition: seq(k, 'deliberate', WRITE),
      },
    },
  }),
  render: (v) => (
    <>
      <path d="M11.5 4 H6.5 A2.5 2.5 0 0 0 4 6.5 V17.5 A2.5 2.5 0 0 0 6.5 20 H17.5 A2.5 2.5 0 0 0 20 17.5 V12.5" />
      <m.path d="M17.51 4.51 A1.4 1.4 0 0 1 19.49 6.49 L12.49 13.49 L9.25 14.75 L10.51 11.51 Z" variants={v.pen} style={origin(10, 14)} />
    </>
  ),
})
