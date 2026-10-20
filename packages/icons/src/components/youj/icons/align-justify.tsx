import { m } from 'motion/react'
import { createIcon, seqFor, type IconVariants } from './icon-base'

/* Four lines of a justified paragraph: three set full measure and the last,
 * as in real justified text, left short. Each full line has a ragged length
 * it falls back to. */
const LINES = [
  { full: 'M3 6 H21', ragged: 'M3 6 H16' },
  { full: 'M3 10 H21', ragged: 'M3 10 H18.5' },
  { full: 'M3 14 H21', ragged: 'M3 14 H14.5' },
] as const

/**
 * The lines fall back to ragged lengths all at once, then are set to full
 * measure again one after another, top to bottom. The short last line stays
 * as it is.
 */
export const AlignJustifyIcon = createIcon({
  name: 'align-justify',
  category: 'editor',
  keywords: ['align', 'justify', 'justified', 'text', 'paragraph', 'block', 'text-align-justify'],
  variants: (k): IconVariants => {
    const length = k.duration('deliberate')
    return Object.fromEntries(
      LINES.map(({ full, ragged }, i) => {
        const start = 0.36 + i * 0.12
        return [
          `l${i}`,
          {
            rest: { d: full, transition: k.tween('fast') },
            active: {
              d: [null, ragged, ragged, full, full],
              transition: seqFor(k, length, [0, 0.3, start, start + 0.34, 1], ['standard', 'linear', 'emphasized', 'linear']),
            },
          },
        ]
      }),
    )
  },
  render: (v) => (
    <>
      {LINES.map(({ full }, i) => (
        <m.path key={full} d={full} variants={v[`l${i}`]} />
      ))}
      <path d="M3 18 H13" />
    </>
  ),
})
