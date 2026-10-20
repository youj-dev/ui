import { m } from 'motion/react'
import { after, createIcon } from './icon-base'

/* The ticket is two open halves that meet on the perforation at x 13.5,
 * each carrying one of the side notches, so the stub can tear away on its
 * own. It is a unit narrower than the grid each side, so both halves stay
 * inside it once torn apart. */
const MAIN = 'M13.5 5.5 H5.5 A2 2 0 0 0 3.5 7.5 V9.5 A2.5 2.5 0 0 1 3.5 14.5 V16.5 A2 2 0 0 0 5.5 18.5 H13.5'
const STUB = 'M13.5 5.5 H18.5 A2 2 0 0 1 20.5 7.5 V9.5 A2.5 2.5 0 0 0 20.5 14.5 V16.5 A2 2 0 0 1 18.5 18.5 H13.5'
const PERFORATION = ['M13.5 8.25 V9.25', 'M13.5 11.5 V12.5', 'M13.5 14.75 V15.75']

/**
 * Valid ↔ used, for tickets, passes and coupons. The stub tears away along
 * the perforation and drops loose as the perforation marks go with it;
 * restoring it presses the stub back into place. `active` = used.
 */
export const TicketIcon = createIcon({
  name: 'ticket',
  category: 'commerce',
  keywords: ['ticket', 'coupon', 'voucher', 'pass', 'event', 'admission', 'redeem', 'used'],
  states: ['valid', 'used'],
  variants: (k) => ({
    main: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: -0.5, transition: k.spring('smooth') },
    },
    stub: {
      rest: { x: 0, y: 0, transition: k.spring('snappy') },
      active: { x: 1, y: 0.75, transition: { ...k.spring('smooth'), delay: k.duration('instant') } },
    },
    perforation: {
      rest: { opacity: 1, transition: after(k, k.duration('fast'), 'fast') },
      active: { opacity: 0, transition: k.tween('fast', 'exit') },
    },
  }),
  render: (v) => (
    <>
      <m.path d={MAIN} variants={v.main} />
      <m.g variants={v.perforation}>
        {PERFORATION.map((d) => (
          <path key={d} d={d} />
        ))}
      </m.g>
      <m.path d={STUB} variants={v.stub} />
    </>
  ),
})
