import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Rolling paint on: the roller sweeps up and down the wall on its handle. */
export const PaintRollerIcon = createIcon({
  name: 'paint-roller',
  category: 'editor',
  keywords: ['paint', 'roller', 'theme', 'decorate', 'redesign', 'wall'],
  variants: (k) => ({
    roller: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.25, 1, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.roller}>
      <rect x="3" y="3" width="15" height="5" rx="1.5" />
      <path d="M18 5.5 H20 A1 1 0 0 1 21 6.5 V10 A1 1 0 0 1 20 11 H12.5 A1 1 0 0 0 11.5 12 V14" />
      <rect x="10" y="14" width="3" height="7" rx="1" />
    </m.g>
  ),
})
