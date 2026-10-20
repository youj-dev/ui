import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/* A bracketed serif T: each half of the crossbar runs out from the stem and
 * rolls down into its serif on a 2.5 radius, and the foot is a short slab. */
const BAR_LEFT = 'M12 4.5 H8 A2.5 2.5 0 0 0 5.5 7'
const BAR_RIGHT = 'M12 4.5 H16 A2.5 2.5 0 0 1 18.5 7'

/** Typesetting: the crossbar is ruled out from the stem to both serifs, then the foot is set beneath it. */
export const TypeIcon = createIcon({
  name: 'type',
  category: 'editor',
  keywords: ['text', 'font', 'typography', 'typeface', 'letter', 'paragraph'],
  variants: (k) => {
    const bar = { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') }
    const foot = { from: hidden, rest: drawn(k), active: drawIn(k, 'base', k.duration('base'), 'standard') }
    return { barLeft: bar, barRight: bar, footLeft: foot, footRight: foot }
  },
  render: (v) => (
    <>
      <m.path d={BAR_LEFT} variants={v.barLeft} />
      <m.path d={BAR_RIGHT} variants={v.barRight} />
      <path d="M12 4.5 V19.5" />
      <m.path d="M12 19.5 H9.5" variants={v.footLeft} />
      <m.path d="M12 19.5 H14.5" variants={v.footRight} />
    </>
  ),
})
