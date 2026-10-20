import { m } from 'motion/react'
import { createIcon, FULL_DRAW, origin, seq, type IconVariants } from './icon-base'

/* The arrow is symmetric about the 45° diagonal through its tip; the click
 * rays radiate from the tip, inner end first. */
const RAYS = ['M6.5 4 V2.5', 'M4.73 4.73 L3.67 3.67', 'M4 6.5 H2.5']

/** A click: the pointer presses in toward its tip and three rays flash out from the point of contact. */
export const MousePointerIcon = createIcon({
  name: 'mouse-pointer',
  category: 'navigation',
  keywords: ['cursor', 'pointer', 'click', 'select', 'arrow', 'collaboration', 'mouse'],
  variants: (k): IconVariants => {
    const press = k.duration('fast')
    return {
      pointer: {
        rest: { x: 0, y: 0, scale: 1, transition: k.tween('fast') },
        active: {
          x: [null, -0.5, 0],
          y: [null, -0.5, 0],
          scale: [null, 0.9, 1],
          transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']),
        },
      },
      ...Object.fromEntries(
        RAYS.map((_, i) => [
          `r${i}`,
          {
            rest: { pathLength: 0, opacity: 0, transition: k.tween('fast') },
            active: {
              pathLength: [0, FULL_DRAW, FULL_DRAW],
              opacity: [0, 1, 0],
              transition: seq(k, 'deliberate', [0, 0.35, 1], ['enter', 'exit'], press + i * k.stagger('tight')),
            },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <m.path d="M6.5 6.5 L20.5 12 L14.5 14.5 L12 20.5 Z" variants={v.pointer} style={origin(6.5, 6.5)} />
      {RAYS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`r${i}`]} />
      ))}
    </>
  ),
})
