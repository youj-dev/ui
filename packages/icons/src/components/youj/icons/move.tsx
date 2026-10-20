import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* Four arms, each half a shaft and its head, with the way each one pushes. */
const ARMS = [
  { d: 'M12 12 V3 M9.5 5.5 L12 3 L14.5 5.5', dx: 0, dy: -1 },
  { d: 'M12 12 H21 M18.5 9.5 L21 12 L18.5 14.5', dx: 1, dy: 0 },
  { d: 'M12 12 V21 M9.5 18.5 L12 21 L14.5 18.5', dx: 0, dy: 1 },
  { d: 'M12 12 H3 M5.5 9.5 L3 12 L5.5 14.5', dx: -1, dy: 0 },
]

/** Four ways at once: the arms push out from the center, parting in the middle, and draw back together. */
export const MoveIcon = createIcon({
  name: 'move',
  category: 'editor',
  keywords: ['move', 'drag', 'pan', 'reposition', 'arrows', 'arrange', 'translate'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      ARMS.map(({ dx, dy }, i) => [
        `a${i}`,
        {
          rest: { x: 0, y: 0, transition: k.tween('fast') },
          active: { x: [null, dx, 0], y: [null, dy, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']) },
        },
      ]),
    ),
  render: (v) => (
    <>
      {ARMS.map(({ d }, i) => (
        <m.path key={d} d={d} variants={v[`a${i}`]} />
      ))}
    </>
  ),
})
