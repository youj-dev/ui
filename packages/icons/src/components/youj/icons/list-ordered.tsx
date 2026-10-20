import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/** Counting off: the numerals are written again in order, 1 then 2, as if the list were being numbered. */
export const ListOrderedIcon = createIcon({
  name: 'list-ordered',
  category: 'editor',
  keywords: ['numbered', 'ordered', 'list', 'steps', 'sequence', 'numbers'],
  variants: (k) => ({
    one: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
    two: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', k.duration('base'), 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M3.5 5 L5 4 V8.5" variants={v.one} />
      <m.path d="M3.25 16.5 A1.75 1.75 0 0 1 6.75 16.25 C6.75 17.5 3.25 18.75 3.25 20 H6.75" variants={v.two} />
      <path d="M10 6 H21" />
      <path d="M10 12 H21" />
      <path d="M10 18 H21" />
    </>
  ),
})
