import { m } from 'motion/react'
import { createIcon, after, drawOut, drawn, origin, seq } from './icon-base'

/* The stripe and the check share one three-point structure: the stripe's
 * ends pull in off the card edges and its midpoint drops to the check's vertex. */
const STRIPE = 'M2.5 10 L12 10 L21.5 10'
const CHECK = 'M8.75 12.25 L11 14.5 L15.25 10.25'

/**
 * Card ↔ paid. The card taps like a contactless payment, the number is wiped,
 * and the magnetic stripe folds down into a check. Reverting unfolds it.
 * `active` = paid.
 */
export const CreditCardIcon = createIcon({
  name: 'credit-card',
  category: 'commerce',
  keywords: ['payment', 'card', 'pay', 'checkout', 'billing', 'paid', 'debit'],
  states: ['card', 'paid'],
  variants: (k) => ({
    card: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.92, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    stripe: {
      rest: { d: STRIPE, transition: k.tween('base', 'standard') },
      active: { d: CHECK, transition: after(k, k.duration('fast'), 'slow', 'emphasized') },
    },
    number: {
      rest: drawn(k, 'base', k.duration('fast')),
      active: drawOut(k, 'fast'),
    },
  }),
  render: (v) => (
    <m.g variants={v.card} style={origin(12, 12)}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <m.path d={STRIPE} variants={v.stripe} />
      <m.path d="M6 15 H10" variants={v.number} />
    </m.g>
  ),
})
