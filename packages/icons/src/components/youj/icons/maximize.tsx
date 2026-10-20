import { m } from 'motion/react'
import { createIcon, type IconVariants } from './icon-base'

/* Four corners of a 16-unit window, one unit inside the frame, each an L
 * with 5-unit arms and a 3-unit corner. The vertex slides along its own
 * diagonal: out on the window's edge for maximize, tucked in to the inner
 * 6-unit square for minimize. Both poses share one command structure (line,
 * cubic corner, line) so `d` interpolates point for point, and half-way
 * every corner is a straight 45° line. */
const CORNERS = [
  ['M9 4 L7 4 C5.34 4 4 5.34 4 7 L4 9', 'M9 4 L9 6 C9 7.66 7.66 9 6 9 L4 9'],
  ['M15 4 L17 4 C18.66 4 20 5.34 20 7 L20 9', 'M15 4 L15 6 C15 7.66 16.34 9 18 9 L20 9'],
  ['M20 15 L20 17 C20 18.66 18.66 20 17 20 L15 20', 'M20 15 L18 15 C16.34 15 15 16.34 15 18 L15 20'],
  ['M4 15 L4 17 C4 18.66 5.34 20 7 20 L9 20', 'M4 15 L6 15 C7.66 15 9 16.34 9 18 L9 20'],
] as const

/**
 * Maximize ↔ minimize. Every corner folds through its own diagonal, from the
 * window's edge to pointing inward, like a window giving way; toggling
 * mid-fold swings them back. `active` = minimize.
 */
export const MaximizeIcon = createIcon({
  name: 'maximize',
  category: 'arrows',
  keywords: ['fullscreen', 'expand', 'enlarge', 'focus', 'minimize', 'exit fullscreen', 'maximize-2', 'scan'],
  states: ['maximize', 'minimize'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      CORNERS.map(([max, min], i) => [
        `c${i}`,
        { rest: { d: max, transition: k.spring('snappy') }, active: { d: min, transition: k.spring('snappy') } },
      ]),
    ),
  render: (v) => (
    <>
      {CORNERS.map(([max], i) => (
        <m.path key={max} d={max} variants={v[`c${i}`]} />
      ))}
    </>
  ),
})
