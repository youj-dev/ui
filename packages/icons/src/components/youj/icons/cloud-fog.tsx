import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Fog rolls through: the banks of mist drift one way and the other under the cloud. */
export const CloudFogIcon = createIcon({
  name: 'cloud-fog',
  category: 'weather',
  keywords: ['fog', 'mist', 'haze', 'overcast', 'low visibility', 'weather'],
  variants: (k) => ({
    a: {
      rest: { x: 0, transition: k.tween('base') },
      active: { x: [0, 2, -1, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1]) },
    },
    b: {
      rest: { x: 0, transition: k.tween('base') },
      active: { x: [0, -2, 1, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1]) },
    },
  }),
  render: (v) => (
    <>
      <path d="M6.8 14 A2.85 2.85 0 0 1 6.55 8.31 A4.75 4.75 0 1 1 15.8 6.43 A3.8 3.8 0 1 1 16.3 14 Z" />
      <m.path d="M4 17.5 H14.5" variants={v.a} />
      <m.path d="M9 20.75 H20" variants={v.b} />
    </>
  ),
})
