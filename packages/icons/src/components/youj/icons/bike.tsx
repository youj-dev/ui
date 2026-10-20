import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Pedalling off: the bike rolls forward and rocks back onto its wheels. */
export const BikeIcon = createIcon({
  name: 'bike',
  category: 'location',
  keywords: ['bicycle', 'cycling', 'ride', 'commute', 'bike lane', 'exercise'],
  variants: (k) => ({
    bike: {
      rest: { x: 0, rotate: 0, transition: k.tween('base') },
      active: { x: [0, 1.25, 0], rotate: [0, -4, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.bike} style={origin(6, 16)}>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16 L9.25 9.5 H15.25 L18 16" />
      <path d="M9.25 9.5 L12 16 L15.25 9.5" />
      <path d="M7.75 6.75 H10.75" />
      <path d="M9.25 6.75 V9.5" />
      <path d="M15.25 9.5 L14.5 6.5 H16.75" />
    </m.g>
  ),
})
