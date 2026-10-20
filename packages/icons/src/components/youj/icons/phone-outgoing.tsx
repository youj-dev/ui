import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** An outgoing call: the arrow leaves the handset and a fresh one follows it out. */
export const PhoneOutgoingIcon = createIcon({
  name: 'phone-outgoing',
  category: 'communication',
  keywords: ['outgoing call', 'dial', 'call out', 'outbound', 'calling', 'phone'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: { x: [0, 3, -2, 0], y: [0, -3, 2, 0], opacity: [1, 0, 0, 1], transition: seq(k, 'deliberate', [0, 0.35, 0.36, 1], ['exit', 'linear', 'enter']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M5 3.5 H8 L9.5 7.5 L7.5 9 A11 11 0 0 0 15 16.5 L16.5 14.5 L20.5 16 V19 A2 2 0 0 1 18.5 21 A16 16 0 0 1 3 5.5 A2 2 0 0 1 5 3.5 Z" />
      <m.g variants={v.arrow}>
        <path d="M15 9 L20.5 3.5" />
        <path d="M16.5 3.5 H20.5 V7.5" />
      </m.g>
    </>
  ),
})
