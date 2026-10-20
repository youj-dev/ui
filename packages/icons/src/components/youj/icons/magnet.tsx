import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Snapping: the magnet jerks toward something and settles, with a little wobble. */
export const MagnetIcon = createIcon({
  name: 'magnet',
  category: 'editor',
  keywords: ['snap', 'attract', 'magnetic', 'pull', 'align', 'lead magnet'],
  variants: (k) => ({
    magnet: {
      rest: { y: 0, rotate: 0, transition: k.tween('base') },
      active: { y: [0, 1.5, 0, 0], rotate: [0, 0, -5, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.6, 1], ['exit', 'standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.magnet} style={origin(12, 12)}>
      <path d="M4.5 3.5 H9 V12 A3 3 0 0 0 15 12 V3.5 H19.5 V12 A7.5 7.5 0 0 1 4.5 12 Z" />
      <path d="M4.5 7.5 H9" />
      <path d="M15 7.5 H19.5" />
    </m.g>
  ),
})
