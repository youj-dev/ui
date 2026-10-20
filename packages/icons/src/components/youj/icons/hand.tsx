import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* An open right hand, palm out. Four fingers three units wide stand side by
 * side at natural heights, their tips half-circles; the three seams between
 * them run down to the knuckles. The thumb is a capsule angled out to the
 * left, and the palm rounds off into the wrist. */
const HAND =
  'M7.5 12.12 V6.5 A1.5 1.5 0 0 1 10.5 6.5 V5 A1.5 1.5 0 0 1 13.5 5 V6 A1.5 1.5 0 0 1 16.5 6 V8 A1.5 1.5 0 0 1 19.5 8 V14 C19.5 18 16.5 20.5 13.3 20.5 C10.8 20.5 8.67 19.31 7.51 17.44 L4.21 12.14 A1.4 1.4 0 0 1 6.59 10.66 Z'
const SEAMS = ['M10.5 6.5 V11.5', 'M13.5 6 V11.5', 'M16.5 8 V12']

/** A wave from the wrist: the hand swings out and back, each swing smaller, and comes to rest upright. */
export const HandIcon = createIcon({
  name: 'hand',
  category: 'editor',
  keywords: ['hand', 'pan', 'hand tool', 'grab', 'move', 'raise hand', 'wave', 'hello', 'palm', 'stop'],
  variants: (k) => ({
    hand: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, 9, -6, 3.5, -1.5, 0], transition: seq(k, 'deliberate', [0, 0.18, 0.38, 0.58, 0.78, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.hand} style={origin(13.3, 20.5)}>
      <path d={HAND} />
      {SEAMS.map((d) => (
        <path key={d} d={d} />
      ))}
    </m.g>
  ),
})
