import { m } from 'motion/react'
import { createIcon, after, origin } from './icon-base'

/** The lid lifts off its left hinge and hangs open while hovered. */
export const TrashIcon = createIcon({
  name: 'trash',
  category: 'actions',
  keywords: ['delete', 'remove', 'bin', 'discard', 'garbage'],
  variants: (k) => ({
    lid: {
      rest: { y: 0, rotate: 0, transition: k.spring('snappy') },
      active: { y: -2, rotate: -10, transition: k.spring('snappy') },
    },
    lines: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: 0.8, transition: after(k, k.stagger('base'), 'base') },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.lid} style={origin(4, 7)}>
        <path d="M4 7 H20" />
        <path d="M9 7 V5 A1 1 0 0 1 10 4 H14 A1 1 0 0 1 15 5 V7" />
      </m.g>
      <path d="M6 7 V19 A2 2 0 0 0 8 21 H16 A2 2 0 0 0 18 19 V7" />
      <m.g variants={v.lines} style={origin(12, 14)}>
        <path d="M10 11 V17" />
        <path d="M14 11 V17" />
      </m.g>
    </>
  ),
})
