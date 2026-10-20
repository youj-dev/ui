import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* Each bar of the plus maps onto one arm of the check: the upright swings
 * clockwise into the long arm, the crossbar pivots on its left end into the
 * short arm. */
const PLUS = { long: 'M18.5 8 L18.5 14', short: 'M15.5 11 L21.5 11' }
const CHECK = { long: 'M21.5 9 L17.5 13', short: 'M15.5 11 L17.5 13' }

/** Invite → invited. The plus swings into a check and the person gives a welcoming nod. `active` = invited. */
export const UserPlusIcon = createIcon({
  name: 'user-plus',
  category: 'people',
  keywords: ['invite', 'add member', 'add user', 'follow', 'join', 'invited'],
  states: ['invite', 'invited'],
  variants: (k) => ({
    long: {
      rest: { d: PLUS.long, transition: k.spring('snappy') },
      active: { d: CHECK.long, transition: k.spring('settle') },
    },
    short: {
      rest: { d: PLUS.short, transition: k.spring('snappy') },
      active: { d: CHECK.short, transition: k.spring('settle') },
    },
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('base')) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.head} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.path d={PLUS.long} variants={v.long} />
      <m.path d={PLUS.short} variants={v.short} />
    </>
  ),
})
