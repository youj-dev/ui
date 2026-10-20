import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** Money in euros: the curve is written again round the bars. */
export const EuroIcon = createIcon({
  name: 'euro',
  category: 'commerce',
  keywords: ['euro', 'eur', 'currency', 'money', 'price', 'europe'],
  variants: (k) => ({
    glyph: { rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M18.1 7.4 A6.5 6.5 0 1 0 18.1 16.6" variants={v.glyph} />
      <path d="M5 10.25 H13" />
      <path d="M5 13.75 H12" />
    </>
  ),
})
