import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** You have post: the flag drops and springs back up. */
export const MailboxIcon = createIcon({
  name: 'mailbox',
  category: 'communication',
  keywords: ['post', 'letters', 'inbox', 'delivery', 'mail', 'postbox'],
  variants: (k) => ({
    flag: {
      rest: { rotate: 0, transition: k.spring('settle') },
      active: { rotate: [0, 90, 90, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.5, 1], ['exit', 'linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 19 V11 A4 4 0 0 1 7 7 H17 A4 4 0 0 1 21 11 V19 Z" />
      <path d="M7 7 A4 4 0 0 1 11 11 V19" />
      <path d="M12 19 V21.5" />
      <m.g variants={v.flag} style={origin(15, 7)}>
        <path d="M15 7 V3" />
        <path d="M15 3 H18.5 V5.5 H15" />
      </m.g>
    </>
  ),
})
