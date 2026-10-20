import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Drawing a path: the nib tilts one way and the other on its point, like setting an anchor. */
export const PenToolIcon = createIcon({
  name: 'pen-tool',
  category: 'editor',
  keywords: ['vector', 'bezier', 'path tool', 'pen', 'design', 'anchor point'],
  variants: (k) => ({
    nib: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -10, 8, -3, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.nib} style={origin(12, 20)}>
      <path d="M9.2 9.5 L14.8 9.5 A1 1 0 0 1 15.79 10.68 L15.03 14.84 A1 1 0 0 1 14.92 15.14 L12.44 19.7 A0.5 0.5 0 0 1 11.56 19.7 L9.08 15.14 A1 1 0 0 1 8.97 14.84 L8.21 10.68 A1 1 0 0 1 9.2 9.5 Z" />
      <path d="M12 14.25 V19.5" />
      <circle cx="12" cy="13" r="1.25" />
      <path d="M9.5 9.5 V5 A1 1 0 0 1 10.5 4 H13.5 A1 1 0 0 1 14.5 5 V9.5" />
    </m.g>
  ),
})
