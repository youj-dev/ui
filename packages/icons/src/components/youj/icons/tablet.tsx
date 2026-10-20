import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Portrait ↔ landscape. The tablet turns a quarter-turn and dips in scale
 * mid-turn so its corners never leave the grid. `active` = landscape.
 */
export const TabletIcon = createIcon({
  name: 'tablet',
  category: 'devices',
  keywords: ['ipad', 'device', 'rotate', 'orientation', 'landscape', 'portrait'],
  states: ['portrait', 'landscape'],
  variants: (k) => {
    const turn = { rotate: k.tween('slow', 'emphasized'), scale: seq(k, 'slow', [0, 0.5, 1], ['standard', 'standard']) }
    return {
      device: {
        rest: { rotate: 0, scale: [null, 0.84, 1], transition: turn },
        active: { rotate: -90, scale: [null, 0.84, 1], transition: turn },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.device} style={origin(12, 12)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M10.5 18 H13.5" />
    </m.g>
  ),
})
