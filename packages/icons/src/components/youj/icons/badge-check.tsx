import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/* Eight lobes of radius 3 between valleys on a 7.2 circle. */
const ROSETTE =
  'M14.76 5.35 A3 3 0 0 1 18.65 9.24 A3 3 0 0 1 18.65 14.76 A3 3 0 0 1 14.76 18.65 A3 3 0 0 1 9.24 18.65 A3 3 0 0 1 5.35 14.76 A3 3 0 0 1 5.35 9.24 A3 3 0 0 1 9.24 5.35 A3 3 0 0 1 14.76 5.35 Z'

/** A seal of approval: the rosette is lifted, twisted and pressed down like a stamp, and the check is inked fresh as it lands. */
export const BadgeCheckIcon = createIcon({
  name: 'badge-check',
  category: 'security',
  keywords: ['verified', 'certified', 'approved', 'trusted', 'official', 'badge', 'seal'],
  variants: (k) => ({
    seal: {
      rest: { scale: 1, rotate: 0, transition: k.tween('fast') },
      active: {
        scale: [1, 1.08, 0.9, 1],
        rotate: [0, -10, 0, 0],
        transition: seq(k, 'deliberate', [0, 0.3, 0.55, 1], ['standard', 'exit', 'emphasized']),
      },
    },
    check: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', k.duration('deliberate') * 0.5, 'standard') },
  }),
  render: (v) => (
    <m.g variants={v.seal} style={origin(12, 12)}>
      <path d={ROSETTE} />
      <m.path d="M9 12 L11 14 L15 10" variants={v.check} />
    </m.g>
  ),
})
