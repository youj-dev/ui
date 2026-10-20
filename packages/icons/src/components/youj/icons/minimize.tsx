import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* maximize's minimize pose: four L corners around the inner 6-unit square,
 * each with the direction (towards the center) it pinches in. */
const CORNERS = [
  { d: 'M9 4 V6 A3 3 0 0 1 6 9 H4', dx: 1, dy: 1 },
  { d: 'M15 4 V6 A3 3 0 0 0 18 9 H20', dx: -1, dy: 1 },
  { d: 'M20 15 H18 A3 3 0 0 0 15 18 V20', dx: -1, dy: -1 },
  { d: 'M4 15 H6 A3 3 0 0 1 9 18 V20', dx: 1, dy: -1 },
] as const

/** Collapse. The four corners pinch in toward the center, as if the window were already shrinking, and let go. */
export const MinimizeIcon = createIcon({
  name: 'minimize',
  category: 'arrows',
  keywords: ['exit fullscreen', 'collapse', 'shrink', 'reduce', 'contract', 'minimize-2'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      CORNERS.map(({ dx, dy }, i) => [
        `c${i}`,
        {
          rest: { x: 0, y: 0, transition: k.tween('fast') },
          active: {
            x: [null, 1.5 * dx, 0],
            y: [null, 1.5 * dy, 0],
            transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']),
          },
        },
      ]),
    ),
  render: (v) => (
    <>
      {CORNERS.map(({ d }, i) => (
        <m.path key={d} d={d} variants={v[`c${i}`]} />
      ))}
    </>
  ),
})
