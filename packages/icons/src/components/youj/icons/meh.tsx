import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Neither here nor there: the flat mouth slides to one side and back, and the eyes blink. */
export const MehIcon = createIcon({
  name: 'meh',
  category: 'people',
  keywords: ['neutral', 'okay', 'indifferent', 'so-so', 'average', 'feedback'],
  variants: (k) => ({
    mouth: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -1.25, 1, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
    eyes: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.2, 1], transition: seq(k, 'base', [0, 0.5, 1], undefined, k.duration('slow')) },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.g variants={v.eyes} style={origin(12, 9.5)}>
        <path d="M9 9.5 h.01" strokeWidth={2} />
        <path d="M15 9.5 h.01" strokeWidth={2} />
      </m.g>
      <m.path d="M9 15 H15" variants={v.mouth} />
    </>
  ),
})
