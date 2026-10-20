import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

const BUBBLES = [
  { x: 10.5, y: 18.25 },
  { x: 13.75, y: 17.25 },
]

/**
 * An experiment: the liquid sloshes and two bubbles rise through it and pop
 * at the surface, then form again at the bottom out of sight.
 */
export const FlaskIcon = createIcon({
  name: 'flask',
  category: 'development',
  keywords: ['experiment', 'test', 'lab', 'beta', 'science', 'research', 'flask', 'labs'],
  variants: (k): IconVariants => ({
    surface: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -5, 4, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1], ['standard', 'standard', 'emphasized']) },
    },
    ...Object.fromEntries(
      BUBBLES.map((_, i) => [
        `b${i}`,
        {
          rest: { y: 0, opacity: 1, transition: k.tween('fast') },
          active: {
            y: [null, -2.75, -2.75, 0],
            opacity: [null, 0, 0, 1],
            transition: seq(k, 'deliberate', [0, 0.55, 0.6, 1], ['standard', 'linear', 'enter'], i * k.stagger('loose') * 2),
          },
        },
      ]),
    ),
  }),
  render: (v) => (
    <>
      <path d="M8.5 3 H15.5" />
      <path d="M10 3 V8.46 L4.55 18.5 A1.75 1.75 0 0 0 6.09 21 H17.91 A1.75 1.75 0 0 0 19.45 18.5 L14 8.46 V3" />
      <m.path d="M7.1 15 H16.9" variants={v.surface} style={origin(12, 15)} />
      {BUBBLES.map(({ x, y }, i) => (
        <m.path key={x} d={`M${x} ${y} h.01`} strokeWidth={2} variants={v[`b${i}`]} />
      ))}
    </>
  ),
})
