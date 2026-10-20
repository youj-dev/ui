import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Each bar of the plus maps onto one arm of the check, end for end. */
const PLUS = { long: 'M12 8.5 L12 15.5', short: 'M8.5 12 L15.5 12' }
const CHECK = { long: 'M15.5 9.5 L10.75 14.5', short: 'M8.5 12 L10.75 14.5' }

/** Add → added. The plus swings into a check inside the box and lands with a small settle. `active` = added. */
export const SquarePlusIcon = createIcon({
  name: 'square-plus',
  category: 'actions',
  keywords: ['add', 'new', 'create', 'insert', 'plus box', 'added'],
  states: ['add', 'added'],
  variants: (k) => ({
    long: {
      rest: { d: PLUS.long, transition: k.spring('snappy') },
      active: { d: CHECK.long, transition: k.spring('settle') },
    },
    short: {
      rest: { d: PLUS.short, transition: k.spring('snappy') },
      active: { d: CHECK.short, transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <m.path d={PLUS.long} variants={v.long} />
      <m.path d={PLUS.short} variants={v.short} />
    </>
  ),
})
