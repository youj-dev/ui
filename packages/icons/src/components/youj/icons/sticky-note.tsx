import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The note is peeled up at its corner, flutters, and sticks back down. */
export const StickyNoteIcon = createIcon({
  name: 'sticky-note',
  category: 'files',
  keywords: ['note', 'post-it', 'memo', 'reminder', 'annotation', 'comment'],
  variants: (k) => ({
    note: {
      rest: { rotate: 0, y: 0, transition: k.tween('base') },
      active: { rotate: [0, -5, 3, -1, 0], y: [0, -1, -0.5, 0, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.note} style={origin(12, 4)}>
      <path d="M6 4 H18 A2 2 0 0 1 20 6 V14 L14 20 H6 A2 2 0 0 1 4 18 V6 A2 2 0 0 1 6 4 Z" />
      <path d="M14 20 V16 A2 2 0 0 1 16 14 H20" />
    </m.g>
  ),
})
