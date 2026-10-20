import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** Location off: the slash is drawn through the pin again with a matching gap cut behind it. */
export const MapPinOffIcon = createIcon({
  name: 'map-pin-off',
  category: 'location',
  keywords: ['location off', 'no location', 'hide location', 'gps off', 'privacy'],
  variants: (k) => ({
    slash: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M3.5 3.5 L20.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <path d="M12 20 C10 18 5 14 5 9.5 C5 5.63 8.13 2.5 12 2.5 C15.87 2.5 19 5.63 19 9.5 C19 14 14 18 12 20 Z" />
        <circle cx="12" cy="9.5" r="3" />
      </g>
      <m.path d="M3.5 3.5 L20.5 20.5" variants={v.slash} />
    </>
  ),
})
