import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** At sea: the ship rolls on the swell and rights itself. */
export const ShipIcon = createIcon({
  name: 'ship',
  category: 'location',
  keywords: ['boat', 'ferry', 'cruise', 'shipping', 'sea', 'vessel', 'sail'],
  variants: (k) => ({
    ship: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -6, 5, -2, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.ship} style={origin(12, 19)}>
        <path d="M3 13.5 H21 L19.2 18.6 A1.5 1.5 0 0 1 17.8 19.6 H6.2 A1.5 1.5 0 0 1 4.8 18.6 Z" />
        <path d="M6.5 13.5 V10 A1 1 0 0 1 7.5 9 H16.5 A1 1 0 0 1 17.5 10 V13.5" />
        <path d="M10 9 V5.5 A1 1 0 0 1 11 4.5 H13 A1 1 0 0 1 14 5.5 V9" />
      </m.g>
      <path d="M3 22 C5 21 7 21 9 22 C11 23 13 23 15 22 C17 21 19 21 21 22" />
    </>
  ),
})
