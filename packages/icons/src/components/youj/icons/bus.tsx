import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Pulling in: the bus bobs on its wheels and its lights flash. */
export const BusIcon = createIcon({
  name: 'bus',
  category: 'location',
  keywords: ['bus', 'coach', 'transit', 'public transport', 'commute', 'shuttle'],
  variants: (k) => ({
    body: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -0.75, 0, -0.5, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1]) },
    },
    lights: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.2, 1], transition: seq(k, 'slow', [0, 0.4, 1], undefined, k.duration('fast')) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.body}>
        <rect x="3.5" y="3.5" width="17" height="14" rx="2.5" />
        <path d="M3.5 10.5 H20.5" />
        <path d="M12 3.5 V10.5" />
        <m.path d="M7.5 14 h.01" strokeWidth={2} variants={v.lights} />
        <m.path d="M16.5 14 h.01" strokeWidth={2} variants={v.lights} />
      </m.g>
      <path d="M7 17.5 V20" />
      <path d="M17 17.5 V20" />
    </>
  ),
})
