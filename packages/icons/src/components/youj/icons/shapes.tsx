import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The three shapes pop one after another: circle, then square, then triangle. */
export const ShapesIcon = createIcon({
  name: 'shapes',
  category: 'editor',
  keywords: ['shapes', 'geometry', 'elements', 'objects', 'insert shape', 'design'],
  variants: (k) => {
    const pop = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.3, 1.1, 1], transition: seq(k, 'slow', [0, 0.3, 0.7, 1], ['exit', 'enter', 'standard'], i * k.stagger('loose')) },
    })
    return { s0: pop(0), s1: pop(1), s2: pop(2) }
  },
  render: (v) => (
    <>
      <m.circle cx="7.5" cy="7.5" r="4" variants={v.s0} style={origin(7.5, 7.5)} />
      <m.rect x="13" y="13" width="7.5" height="7.5" rx="1.5" variants={v.s1} style={origin(16.75, 16.75)} />
      <m.path d="M8.37 14.52 L10.65 18.5 A1 1 0 0 1 9.78 20 L5.22 20 A1 1 0 0 1 4.35 18.5 L6.63 14.52 A1 1 0 0 1 8.37 14.52 Z" variants={v.s2} style={origin(7.5, 17.5)} />
    </>
  ),
})
