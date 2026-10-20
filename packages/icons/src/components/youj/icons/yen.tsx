import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** Money in yen: the arms are written again down to the stem. */
export const YenIcon = createIcon({
  name: 'yen',
  category: 'commerce',
  keywords: ['yen', 'yuan', 'jpy', 'cny', 'currency', 'money'],
  variants: (k) => ({
    glyph: { rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M6.5 4 L12 11.5 L17.5 4" variants={v.glyph} />
      <path d="M12 11.5 V20" />
      <path d="M8 13 H16" />
      <path d="M8 16.5 H16" />
    </>
  ),
})
