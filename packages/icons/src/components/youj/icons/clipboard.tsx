import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* Each text line maps onto one arm of the check, endpoint for endpoint: the
 * long line tips into the long arm, the short line drops into the short arm. */
const LINES = { long: 'M9 11.5 L15 11.5', short: 'M9 15 L13 15' }
const CHECK = { long: 'M11 16 L15 12', short: 'M9 14 L11 16' }

/** Copy → copied. The two lines of text fold into a check and the clip snaps down on it. `active` = copied. */
export const ClipboardIcon = createIcon({
  name: 'clipboard',
  category: 'files',
  keywords: ['copy', 'paste', 'copied', 'clipboard check', 'notes', 'task'],
  states: ['copy', 'copied'],
  variants: (k) => ({
    long: {
      rest: { d: LINES.long, transition: k.spring('snappy') },
      active: { d: CHECK.long, transition: k.spring('settle') },
    },
    short: {
      rest: { d: LINES.short, transition: k.spring('snappy') },
      active: { d: CHECK.short, transition: k.spring('settle') },
    },
    clip: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], k.duration('fast')) },
    },
  }),
  render: (v) => (
    <>
      <path d="M15.5 4.5 H17 A2 2 0 0 1 19 6.5 V19 A2 2 0 0 1 17 21 H7 A2 2 0 0 1 5 19 V6.5 A2 2 0 0 1 7 4.5 H8.5" />
      <m.g variants={v.clip}>
        <rect x="8.5" y="2.75" width="7" height="3.5" rx="1" />
      </m.g>
      <m.path d={LINES.long} variants={v.long} />
      <m.path d={LINES.short} variants={v.short} />
    </>
  ),
})
