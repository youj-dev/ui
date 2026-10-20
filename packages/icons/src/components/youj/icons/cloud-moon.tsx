import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A cloudy night: the cloud drifts across and the moon behind it rocks gently. */
export const CloudMoonIcon = createIcon({
  name: 'cloud-moon',
  category: 'weather',
  keywords: ['night', 'partly cloudy', 'overcast night', 'evening', 'weather'],
  variants: (k) => ({
    cloud: {
      rest: { x: 0, transition: k.tween('base') },
      active: { x: [0, 1.25, 0], transition: seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized']) },
    },
    moon: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -12, 6, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1]) },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M9.8 18.75 A2.4 2.4 0 0 1 9.59 13.96 A4 4 0 1 1 17.38 12.38 A3.2 3.2 0 1 1 17.8 18.75 Z" fill="black" stroke="black" strokeWidth={3.5} variants={v.cloud} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.path d="M8 3.5 A4.75 4.75 0 0 0 13.5 9.75 A6 6 0 1 1 8 3.5 Z" variants={v.moon} style={origin(8.5, 9)} />
      </g>
      <m.path d="M9.8 18.75 A2.4 2.4 0 0 1 9.59 13.96 A4 4 0 1 1 17.38 12.38 A3.2 3.2 0 1 1 17.8 18.75 Z" variants={v.cloud} />
    </>
  ),
})
