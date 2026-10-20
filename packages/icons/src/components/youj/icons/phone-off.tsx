import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The line is cut again: the slash is redrawn through the handset with a matching gap cut behind it. */
export const PhoneOffIcon = createIcon({
  name: 'phone-off',
  category: 'communication',
  keywords: ['call ended', 'no signal', 'hang up', 'disconnected', 'phone disabled', 'do not disturb'],
  variants: (k) => ({
    slash: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M20.5 3.5 L3.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <path d="M5 3.5 H8 L9.5 7.5 L7.5 9 A11 11 0 0 0 15 16.5 L16.5 14.5 L20.5 16 V19 A2 2 0 0 1 18.5 21 A16 16 0 0 1 3 5.5 A2 2 0 0 1 5 3.5 Z" mask={`url(#${id}-m)`} />
      <m.path d="M20.5 3.5 L3.5 20.5" variants={v.slash} />
    </>
  ),
})
