import { m } from 'motion/react'
import { createIcon, drawIn, drawOut, origin, seq } from './icon-base'

/** The pencil scribbles a stroke underneath itself. */
export const PencilIcon = createIcon({
  name: 'pencil',
  category: 'actions',
  keywords: ['edit', 'write', 'compose', 'rename', 'pen'],
  variants: (k) => ({
    pencil: {
      rest: { rotate: 0, x: 0, transition: k.tween('fast') },
      active: {
        rotate: [0, -6, 4, -3, 0],
        x: [0, 1, 3, 5, 5],
        transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]),
      },
    },
    stroke: {
      rest: drawOut(k),
      active: drawIn(k, 'deliberate', k.duration('fast'), 'standard'),
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.pencil} style={origin(4, 20)}>
        <path d="M15.5 4.5 A2.12 2.12 0 0 1 19.5 8.5 L8 20 L3.5 20.5 L4 16 Z" />
        <path d="M13.5 6.5 L17.5 10.5" />
      </m.g>
      <m.path d="M11 20.5 H20" variants={v.stroke} />
    </>
  ),
})
