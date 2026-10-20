import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Paid in cash: the note lifts as the seal in its middle flips over like a tossed coin, and it settles back down. */
export const BanknoteIcon = createIcon({
  name: 'banknote',
  category: 'commerce',
  keywords: ['cash', 'money', 'banknote', 'payment', 'bill', 'currency', 'payout', 'pricing'],
  variants: (k) => ({
    note: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    seal: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [null, 0, -1, 0, 1], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1], ['exit', 'enter', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.note}>
      <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
      <m.circle cx="12" cy="12" r="2.5" variants={v.seal} style={origin(12, 12)} />
      <path d="M6 12 h.01 M18 12 h.01" strokeWidth={2} />
    </m.g>
  ),
})
