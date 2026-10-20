import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/**
 * Closed ↔ open. The lid pops off with its bow and tips back, and the pop is
 * allowed its one bounce. Closing sets the lid straight back down.
 * `active` = open.
 */
export const GiftIcon = createIcon({
  name: 'gift',
  category: 'commerce',
  keywords: ['present', 'reward', 'surprise', 'bonus', 'gift card', 'unwrap', 'birthday'],
  states: ['closed', 'open'],
  variants: (k) => ({
    lid: {
      rest: { y: 0, rotate: 0, transition: k.spring('snappy') },
      active: { y: -1.5, rotate: -9, transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.lid} style={origin(12, 10)}>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8 V12" />
        <path d="M12 8 C12 5.5 10.75 3.5 8.75 3.5 A2.25 2.25 0 0 0 8.75 8" />
        <path d="M12 8 C12 5.5 13.25 3.5 15.25 3.5 A2.25 2.25 0 0 1 15.25 8" />
      </m.g>
      <path d="M4.5 12 V18.5 A2 2 0 0 0 6.5 20.5 H17.5 A2 2 0 0 0 19.5 18.5 V12" />
      <path d="M12 12 V20.5" />
    </>
  ),
})
