import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn } from './icon-base'

/* The long line is one path in both states: a straight run to the edge whose
 * two quarter turns and return are folded into its end, or the same run
 * curling down round an r3.5 bend and back along the next line. */
const STRAIGHT = 'M3 12 L21 12 C21 12 21 12 21 12 C21 12 21 12 21 12 L21 12'
const CURLED = 'M3 12 L17.5 12 C19.43 12 21 13.57 21 15.5 C21 17.43 19.43 19 17.5 19 L14 19'

/**
 * No wrap ↔ wrap, for editors and code views. The overflowing line curls
 * down at the margin and runs back along the next line, and an arrowhead
 * lands at its end; unwrapping erases the head and straightens the line
 * out to the edge. `active` = wrap.
 */
export const WrapTextIcon = createIcon({
  name: 'wrap-text',
  category: 'editor',
  keywords: ['wrap', 'word wrap', 'soft wrap', 'text', 'lines', 'overflow', 'editor'],
  states: ['no wrap', 'wrap'],
  variants: (k) => ({
    line: {
      rest: { d: STRAIGHT, transition: after(k, k.duration('instant'), 'base', 'emphasized') },
      active: { d: CURLED, transition: k.tween('slow', 'emphasized') },
    },
    head: { rest: drawOut(k, 'instant'), active: drawn(k, 'fast', k.duration('slow') * 0.8) },
  }),
  render: (v) => (
    <>
      <path d="M3 5 H21" />
      <m.path d={STRAIGHT} variants={v.line} />
      <m.path d="M16 17 L14 19 L16 21" variants={v.head} />
      <path d="M3 19 H10" />
    </>
  ),
})
