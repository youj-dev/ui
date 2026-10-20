import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Each bar of the plus maps onto one arm of the check, so `d` interpolates
 * endpoint for endpoint: the upright swings clockwise into the long arm, the
 * crossbar pivots on its left end into the short arm. */
const PLUS = { long: 'M12 11.5 L12 17.5', short: 'M9 14.5 L15 14.5' }
const CHECK = { long: 'M15 12.5 L11 16.5', short: 'M9 14.5 L11 16.5' }

/** Add → added. Both bars of the plus swing clockwise into a check that lands with a small settle. `active` = added. */
export const FilePlusIcon = createIcon({
  name: 'file-plus',
  category: 'files',
  keywords: ['new file', 'add', 'create', 'document', 'attach', 'added'],
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
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d={PLUS.long} variants={v.long} />
      <m.path d={PLUS.short} variants={v.short} />
    </>
  ),
})
