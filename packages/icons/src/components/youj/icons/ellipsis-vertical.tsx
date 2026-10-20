import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* ellipsis stood upright: the same dots on the same pitch. */
const DOTS = [5.5, 12, 18.5] as const
const R = 1

/**
 * More, stood upright, for row and card menus. A single wave runs down the
 * column: each dot steps out and back in turn, top to bottom. Unlike
 * more-vertical it keeps its shape.
 */
export const EllipsisVerticalIcon = createIcon({
  name: 'ellipsis-vertical',
  category: 'navigation',
  keywords: ['more', 'kebab', 'overflow', 'dots', 'menu', 'options', 'actions', 'vertical'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      DOTS.map((_, i) => [
        `d${i}`,
        {
          rest: { x: 0, transition: k.tween('fast') },
          active: { x: [null, 2.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
        },
      ]),
    ),
  render: (v) => (
    <g fill="currentColor">
      {DOTS.map((y, i) => (
        <m.circle key={y} cx="12" cy={y} r={R} variants={v[`d${i}`]} />
      ))}
    </g>
  ),
})
