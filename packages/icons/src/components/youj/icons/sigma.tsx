import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/** The sum is written out: one continuous pen stroke from the top serif, down the diagonals, to the bottom serif. */
export const SigmaIcon = createIcon({
  name: 'sigma',
  category: 'data',
  keywords: ['sum', 'total', 'aggregate', 'formula', 'math', 'calculate', 'statistics'],
  variants: (k) => ({
    sigma: { from: hidden, rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'emphasized') },
  }),
  render: (v) => <m.path d="M18 7.5 V6 A2 2 0 0 0 16 4 H6.5 L14.5 12 L6.5 20 H16 A2 2 0 0 0 18 18 V16.5" variants={v.sigma} />,
})
