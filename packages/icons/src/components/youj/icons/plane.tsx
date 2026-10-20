import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* A symmetric top-down plane drawn nose up on its own axis, then flown on
 * the 45° diagonal: the heading is the group's local up. */
const PLANE =
  'M12 3 C12.83 3 13.5 3.67 13.5 4.5 V9.75 L20.5 13.75 V15.75 L13.5 13.5 V18.25 L15.5 19.75 V21.25 L12 20.25 L8.5 21.25 V19.75 L10.5 18.25 V13.5 L3.5 15.75 V13.75 L10.5 9.75 V4.5 C10.5 3.67 11.17 3 12 3 Z'

/** Taking off: the plane surges ahead along its heading, eases back and holds its line. */
export const PlaneIcon = createIcon({
  name: 'plane',
  category: 'location',
  keywords: ['flight', 'travel', 'airport', 'trip', 'airplane mode', 'departure', 'plane'],
  variants: (k) => ({
    plane: {
      rest: { y: 0, transition: k.tween('base') },
      active: { y: [null, -1.75, 0.5, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1], ['exit', 'standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <g transform="rotate(45 12 12)">
      <m.path d={PLANE} variants={v.plane} />
    </g>
  ),
})
