import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** An incoming call: the arrow arrives at the handset from outside and the handset gives a short ring. */
export const PhoneIncomingIcon = createIcon({
  name: 'phone-incoming',
  category: 'communication',
  keywords: ['incoming call', 'received call', 'answer', 'inbound', 'ringing', 'phone'],
  variants: (k) => ({
    handset: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -8, 6, -3, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1]) },
    },
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: { x: [0, 3, 3, 0], y: [0, -3, -3, 0], opacity: [1, 0, 0, 1], transition: seq(k, 'deliberate', [0, 0.3, 0.31, 1], ['exit', 'linear', 'enter']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M5 3.5 H8 L9.5 7.5 L7.5 9 A11 11 0 0 0 15 16.5 L16.5 14.5 L20.5 16 V19 A2 2 0 0 1 18.5 21 A16 16 0 0 1 3 5.5 A2 2 0 0 1 5 3.5 Z" variants={v.handset} style={origin(12, 12)} />
      <m.g variants={v.arrow}>
        <path d="M20.5 3.5 L15 9" />
        <path d="M15 5 V9 H19" />
      </m.g>
    </>
  ),
})
