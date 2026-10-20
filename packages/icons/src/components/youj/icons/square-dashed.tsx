import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const SEGMENTS = [
  'M4 7.5 V6.5 A2.5 2.5 0 0 1 6.5 4 H7.5',
  'M16.5 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V7.5',
  'M20 16.5 V17.5 A2.5 2.5 0 0 1 17.5 20 H16.5',
  'M7.5 20 H6.5 A2.5 2.5 0 0 1 4 17.5 V16.5',
  'M10.5 4 H13.5',
  'M20 10.5 V13.5',
  'M10.5 20 H13.5',
  'M4 10.5 V13.5',
]

/** A selection box: the dashed square turns a quarter and lands on its own outline. Rest is 90° so leaving mid-turn completes forwards. */
export const SquareDashedIcon = createIcon({
  name: 'square-dashed',
  category: 'editor',
  keywords: ['selection', 'marquee', 'select area', 'placeholder', 'dashed box', 'frame'],
  variants: (k) => ({
    box: {
      rest: { rotate: 90, scale: 1, transition: k.tween('base', 'enter') },
      active: {
        rotate: [0, 90],
        scale: [1, 0.86, 1],
        transition: { rotate: k.tween('slow', 'emphasized'), scale: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.box} style={origin(12, 12)}>
      {SEGMENTS.map((d) => (
        <path key={d} d={d} />
      ))}
    </m.g>
  ),
})
