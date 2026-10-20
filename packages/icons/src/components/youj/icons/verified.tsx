import { m } from 'motion/react'
import { createIcon, drawOut, drawn, origin } from './icon-base'

/* badge-check's rosette (eight r3 lobes between valleys on r7.2) and an r8
 * circle, both as sixteen cubics split at the same angles, so the valleys
 * pull in and the lobes push out point for point. */
const CIRCLE =
  'M15.06 4.61 C16.03 5.01 16.91 5.6 17.66 6.34 C18.4 7.09 18.99 7.97 19.39 8.94 C19.79 9.91 20 10.95 20 12 C20 13.05 19.79 14.09 19.39 15.06 C18.99 16.03 18.4 16.91 17.66 17.66 C16.91 18.4 16.03 18.99 15.06 19.39 C14.09 19.79 13.05 20 12 20 C10.95 20 9.91 19.79 8.94 19.39 C7.97 18.99 7.09 18.4 6.34 17.66 C5.6 16.91 5.01 16.03 4.61 15.06 C4.21 14.09 4 13.05 4 12 C4 10.95 4.21 9.91 4.61 8.94 C5.01 7.97 5.6 7.09 6.34 6.34 C7.09 5.6 7.97 5.01 8.94 4.61 C9.91 4.21 10.95 4 12 4 C13.05 4 14.09 4.21 15.06 4.61 Z'
const ROSETTE =
  'M14.76 5.35 C15.87 4.91 17.14 5.17 17.98 6.02 C18.83 6.86 19.09 8.13 18.65 9.24 C19.75 9.72 20.46 10.8 20.46 12 C20.46 13.2 19.75 14.28 18.65 14.75 C19.09 15.87 18.83 17.14 17.98 17.98 C17.14 18.83 15.87 19.09 14.76 18.65 C14.28 19.75 13.2 20.46 12 20.46 C10.8 20.46 9.72 19.75 9.25 18.65 C8.13 19.09 6.86 18.83 6.02 17.98 C5.17 17.14 4.91 15.87 5.35 14.76 C4.25 14.28 3.54 13.2 3.54 12 C3.54 10.8 4.25 9.72 5.35 9.25 C4.91 8.13 5.17 6.86 6.02 6.02 C6.86 5.17 8.13 4.91 9.24 5.35 C9.72 4.25 10.8 3.54 12 3.54 C13.2 3.54 14.28 4.25 14.75 5.35 Z'

/**
 * Unverified ↔ verified, for accounts and publishers. The plain badge
 * crimps into a rosette with a stamp's twist and the check is inked inside
 * it; revoking erases the check and smooths the rosette back into a circle.
 * `active` = verified.
 */
export const VerifiedIcon = createIcon({
  name: 'verified',
  category: 'security',
  keywords: ['verified', 'badge', 'official', 'trusted', 'certified', 'authentic', 'blue check'],
  states: ['unverified', 'verified'],
  variants: (k) => ({
    badge: {
      rest: { d: CIRCLE, rotate: 0, transition: k.tween('base', 'emphasized') },
      active: { d: ROSETTE, rotate: 45, transition: k.tween('slow', 'emphasized') },
    },
    check: { rest: drawOut(k, 'fast'), active: drawn(k, 'base', k.duration('slow') * 0.7) },
  }),
  render: (v) => (
    <>
      <m.path d={CIRCLE} variants={v.badge} style={origin(12, 12)} />
      <m.path d="M9 12 L11 14 L15 10" variants={v.check} />
    </>
  ),
})
