import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Pulling away: the car rocks back on its springs as it moves off, then rolls forward and settles level. */
export const CarIcon = createIcon({
  name: 'car',
  category: 'location',
  keywords: ['car', 'drive', 'vehicle', 'ride', 'delivery', 'parking', 'transport', 'trip'],
  variants: (k) => ({
    body: {
      rest: { x: 0, rotate: 0, transition: k.tween('base') },
      active: {
        x: [null, 0, 1, 0],
        rotate: [null, -3, 0.75, 0],
        transition: seq(k, 'deliberate', [0, 0.3, 0.7, 1], ['exit', 'standard', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.body} style={origin(17, 17)}>
        <path d="M5 17 H4 A1 1 0 0 1 3 16 V12.75 A1.5 1.5 0 0 1 4.2 11.28 L7 10.75 L9.2 7.33 A1.75 1.75 0 0 1 10.67 6.5 H14.36 A1.75 1.75 0 0 1 15.76 7.2 L18.5 10.75 L19.8 11.03 A1.5 1.5 0 0 1 21 12.5 V16 A1 1 0 0 1 20 17 H19" />
        <path d="M9 17 H15" />
        <path d="M7 10.75 H18.5" />
      </m.g>
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
})
