import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* One closing quotation mark: a rounded box whose right side runs on into a tail. */
const mark = (x: number) =>
  `M${x + 5} 11 H${x + 1.5} A1.5 1.5 0 0 1 ${x} 9.5 V7.5 A1.5 1.5 0 0 1 ${x + 1.5} 6 H${x + 3.5} A1.5 1.5 0 0 1 ${x + 5} 7.5 V13 C${x + 5} 15.67 ${x + 3.67} 17.33 ${x + 1} 18`

/** The marks nod one after the other, like the cadence of someone speaking. */
export const QuoteIcon = createIcon({
  name: 'quote',
  category: 'editor',
  keywords: ['quote', 'blockquote', 'citation', 'testimonial', 'speech'],
  variants: (k) => {
    const nod = (delay: number) => ({
      rest: { rotate: 0, transition: k.tween('fast') },
      active: { rotate: [null, -14, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { left: nod(0), right: nod(k.stagger('loose')) }
  },
  render: (v) => (
    <>
      <m.path d={mark(5)} variants={v.left} style={origin(7.5, 8.5)} />
      <m.path d={mark(14)} variants={v.right} style={origin(16.5, 8.5)} />
    </>
  ),
})
