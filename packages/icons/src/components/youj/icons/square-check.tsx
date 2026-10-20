import { m } from 'motion/react'
import { createIcon, drawOut, drawn } from './icon-base'

/* The box is one open path in both states, lines and cubic corners, starting
 * on the right edge. Checked, its start slides down the edge and its last
 * corner shrinks into the top edge's end, opening the corner the check's
 * long arm swings out through. */
const BOX = 'M21 5 L21 19 C21 20.1 20.1 21 19 21 L5 21 C3.9 21 3 20.1 3 19 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5'
const OPENED = 'M21 11 L21 19 C21 20.1 20.1 21 19 21 L5 21 C3.9 21 3 20.1 3 19 L3 5 C3 3.9 3.9 3 5 3 L15.5 3 C15.5 3 15.5 3 15.5 3'

/**
 * Unchecked ↔ checked, for tasks and to-dos. The box opens its top corner
 * and a check is written through it, the long arm breaking out of the box;
 * unchecking erases the check and closes the corner behind it.
 * `active` = checked.
 */
export const SquareCheckIcon = createIcon({
  name: 'square-check',
  category: 'actions',
  keywords: ['checkbox', 'task', 'todo', 'done', 'complete', 'checked', 'select'],
  states: ['unchecked', 'checked'],
  variants: (k) => ({
    box: {
      rest: { d: BOX, transition: { ...k.tween('base'), delay: k.duration('fast') } },
      active: { d: OPENED, transition: k.tween('base', 'emphasized') },
    },
    check: { rest: drawOut(k, 'fast'), active: drawn(k, 'slow', k.duration('instant')) },
  }),
  render: (v) => (
    <>
      <m.path d={BOX} variants={v.box} />
      <m.path d="M8.5 11 L12 14.5 L21.25 5.25" variants={v.check} />
    </>
  ),
})
