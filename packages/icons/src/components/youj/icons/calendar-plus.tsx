import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* file-plus's move on calendar's page: the upright swings clockwise into
 * the check's long arm, the crossbar pivots on its left end into the short
 * arm, endpoint for endpoint. */
const PLUS = { long: 'M12 12.5 L12 18.5', short: 'M9 15.5 L15 15.5' }
const CHECK = { long: 'M15 13.5 L11 17.5', short: 'M9 15.5 L11 17.5' }

/** Add to calendar → added. Both bars of the plus swing clockwise into a check that lands with a small settle. `active` = added. */
export const CalendarPlusIcon = createIcon({
  name: 'calendar-plus',
  category: 'time',
  keywords: ['add to calendar', 'event', 'schedule', 'booking', 'rsvp', 'save the date', 'added'],
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10 H21 M8 3 V7 M16 3 V7" />
      <m.path d={PLUS.long} variants={v.long} />
      <m.path d={PLUS.short} variants={v.short} />
    </>
  ),
})
