import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Add a place → added. The pin bobs and the plus inside it swings into a check. `active` = added. */
export const MapPinPlusIcon = createIcon({
  name: 'map-pin-plus',
  category: 'location',
  keywords: ['add location', 'new place', 'save place', 'add marker', 'added'],
  states: ['add', 'added'],
  variants: (k) => ({
    pin: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1.25, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
    long: {
      rest: { d: 'M12 6.5 L12 12.5', transition: k.spring('snappy') },
      active: { d: 'M15 7.5 L11 11.5', transition: k.spring('settle') },
    },
    short: {
      rest: { d: 'M9 9.5 L15 9.5', transition: k.spring('snappy') },
      active: { d: 'M9 9.5 L11 11.5', transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <m.g variants={v.pin}>
      <path d="M12 20 C10 18 5 14 5 9.5 C5 5.63 8.13 2.5 12 2.5 C15.87 2.5 19 5.63 19 9.5 C19 14 14 18 12 20 Z" />
      <m.path d="M12 6.5 L12 12.5" variants={v.long} />
      <m.path d="M9 9.5 L15 9.5" variants={v.short} />
    </m.g>
  ),
})
