import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* Drawn upright on its own axis, head up with the jaw open, then laid on
 * the 45° diagonal; the head is an r4.25 ring, the handle a capsule. */
const WRENCH =
  'M10.5 2.52 V5 A1.5 1.5 0 0 0 13.5 5 V2.52 A4.25 4.25 0 0 1 13.75 10.37 V19.75 A1.75 1.75 0 0 1 10.25 19.75 V10.37 A4.25 4.25 0 0 1 10.5 2.52 Z'

/**
 * A ratchet turn: the wrench swings on the nut in its jaw, a quick pull and a
 * precise return, dipping in scale so the handle never leaves the grid.
 */
export const WrenchIcon = createIcon({
  name: 'wrench',
  category: 'system',
  keywords: ['tool', 'settings', 'fix', 'repair', 'maintenance', 'configure', 'build', 'tools'],
  variants: (k) => ({
    wrench: {
      rest: { rotate: 0, scale: 1, transition: k.tween('base') },
      active: {
        rotate: [null, -12, 3, 0],
        scale: [null, 0.92, 1, 1],
        transition: seq(k, 'deliberate', [0, 0.4, 0.75, 1], ['standard', 'emphasized', 'standard']),
      },
    },
  }),
  render: (v) => (
    <g transform="rotate(45 12 12)">
      <m.path d={WRENCH} variants={v.wrench} style={origin(12, 6.5)} />
    </g>
  ),
})
