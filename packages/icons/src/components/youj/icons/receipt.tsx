import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq, type IconVariants } from './icon-base'

const LINES = ['M8.5 7.5 H15.5', 'M8.5 11 H15.5', 'M8.5 14.5 H12.5']

/** Printing: the lines are typed onto the slip one after another, then it is torn off with a short tug. */
export const ReceiptIcon = createIcon({
  name: 'receipt',
  category: 'commerce',
  keywords: ['invoice', 'bill', 'order', 'purchase', 'transaction', 'total', 'expense'],
  variants: (k): IconVariants => ({
    slip: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0, -1, 0], transition: seq(k, 'deliberate', [0, 0.62, 0.78, 1], ['linear', 'exit', 'emphasized']) },
    },
    ...Object.fromEntries(
      LINES.map((_, i) => [`l${i}`, { from: hidden, rest: drawn(k), active: drawIn(k, 'base', i * k.stagger('loose') * 2, 'standard') }]),
    ),
  }),
  render: (v) => (
    <m.g variants={v.slip}>
      <path d="M5 21 V5 A2 2 0 0 1 7 3 H17 A2 2 0 0 1 19 5 V21 L17.25 19.25 L15.5 21 L13.75 19.25 L12 21 L10.25 19.25 L8.5 21 L6.75 19.25 Z" />
      {LINES.map((d, i) => (
        <m.path key={d} d={d} variants={v[`l${i}`]} />
      ))}
    </m.g>
  ),
})
