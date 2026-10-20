import { m } from 'motion/react'
import { createIcon, FULL_DRAW, seqFor } from './icon-base'

/* An S of six cubics from the top-right terminal to the bottom-left one, and
 * the bar as two stubs that meet it at its top and bottom. */
const S =
  'M16 7.9 C15.25 6.4 13.75 5.5 12 5.5 C9.75 5.5 8 6.8 8 8.75 C8 10.75 9.85 11.5 12 12 C14.15 12.5 16 13.25 16 15.25 C16 17.2 14.25 18.5 12 18.5 C10.25 18.5 8.75 17.6 8 16.1'
/* The pen rests at the top terminal: a short stub, never zero, since a
 * zero-length dash can leave a stray cap at the far end. */
const PEN = 0.05

/** Money. The S rewinds into its top terminal and is written again while the bar holds. */
export const DollarSignIcon = createIcon({
  name: 'dollar-sign',
  category: 'commerce',
  keywords: ['currency', 'price', 'usd', 'money', 'billing', 'payment', 'cost', 'revenue', 'dollar', 'pricing'],
  variants: (k) => ({
    s: {
      rest: { pathLength: FULL_DRAW, transition: k.tween('fast') },
      active: {
        pathLength: [null, PEN, PEN, FULL_DRAW],
        transition: seqFor(k, k.duration('deliberate') * 1.25, [0, 0.28, 0.34, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <path d="M12 3 V5.5" />
      <m.path d={S} variants={v.s} />
      <path d="M12 18.5 V21" />
    </>
  ),
})
