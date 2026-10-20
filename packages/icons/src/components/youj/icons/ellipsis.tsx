import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* Filled dots that also take the stroke, so they grow with strokeWidth like
 * every other line in the set, on a six-and-a-half-unit pitch: a touch
 * tighter than more-horizontal, so the three read as one glyph. */
const DOTS = [5.5, 12, 18.5] as const
const R = 1

/**
 * More, overflow, truncated. A single wave runs along the row: each dot lifts
 * and lands in turn, left to right. Unlike more-horizontal it keeps its
 * shape: use it where nothing opens, such as a gap in pagination.
 */
export const EllipsisIcon = createIcon({
  name: 'ellipsis',
  category: 'navigation',
  keywords: ['more', 'overflow', 'dots', 'truncate', 'etc', 'gap', 'pagination', 'loading'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      DOTS.map((_, i) => [
        `d${i}`,
        {
          rest: { y: 0, transition: k.tween('fast') },
          active: { y: [null, -2.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
        },
      ]),
    ),
  render: (v) => (
    <g fill="currentColor">
      {DOTS.map((x, i) => (
        <m.circle key={x} cx={x} cy="12" r={R} variants={v[`d${i}`]} />
      ))}
    </g>
  ),
})
