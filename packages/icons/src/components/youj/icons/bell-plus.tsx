import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Add a notification: the bell swings from its crown as the plus beside it turns a quarter. */
export const BellPlusIcon = createIcon({
  name: 'bell-plus',
  category: 'communication',
  keywords: ['add reminder', 'subscribe', 'new alert', 'notify me', 'follow', 'add notification'],
  variants: (k) => ({
    body: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, 12, -9, 6, -2, 0], transition: seq(k, 'deliberate', [0, 0.18, 0.36, 0.54, 0.72, 1]) },
    },
    cross: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 90, transition: k.spring('snappy') },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <circle cx="18.5" cy="5" r="4" fill="black" stroke="none" />
      </mask>
      <m.g variants={v.body} style={origin(12, 3.5)}>
        <g mask={`url(#${id}-m)`}>
          <path d="M6 9.5 A6 6 0 0 1 18 9.5 V13.5 L20 16.5 H4 L6 13.5 Z" />
        </g>
        <path d="M10 19.5 A2 2 0 0 0 14 19.5" />
      </m.g>
      <m.g variants={v.cross} style={origin(18.5, 5)}>
        <path d="M18.5 2.5 V7.5" />
        <path d="M16 5 H21" />
      </m.g>
    </>
  ),
})
