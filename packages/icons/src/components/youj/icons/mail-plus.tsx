import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** New message → added. The plus beside the envelope swings into a check while the envelope lifts. `active` = added. */
export const MailPlusIcon = createIcon({
  name: 'mail-plus',
  category: 'communication',
  keywords: ['compose', 'new email', 'add mail', 'new message', 'write', 'added'],
  states: ['add', 'added'],
  variants: (k) => ({
    env: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -0.75, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    long: {
      rest: { d: 'M18 14.5 L18 20.5', transition: k.spring('snappy') },
      active: { d: 'M21 15.5 L17 19.5', transition: k.spring('settle') },
    },
    short: {
      rest: { d: 'M15 17.5 L21 17.5', transition: k.spring('snappy') },
      active: { d: 'M15 17.5 L17 19.5', transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.env}>
        <path d="M21 12.5 V7 A2 2 0 0 0 19 5 H5 A2 2 0 0 0 3 7 V17 A2 2 0 0 0 5 19 H12.5" />
        <path d="M3.5 7 L12 13 L20.5 7" />
      </m.g>
      <m.path d="M18 14.5 L18 20.5" variants={v.long} />
      <m.path d="M15 17.5 L21 17.5" variants={v.short} />
    </>
  ),
})
