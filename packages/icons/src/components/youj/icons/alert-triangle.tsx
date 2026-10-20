import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The triangle rocks on its base; the exclamation jumps and the point lands a beat after. */
export const AlertTriangleIcon = createIcon({
  name: 'alert-triangle',
  category: 'status',
  keywords: ['warning', 'caution', 'error', 'danger', 'attention'],
  variants: (k) => ({
    frame: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -6, 5, -3, 1.5, 0], transition: seq(k, 'deliberate', [0, 0.16, 0.34, 0.52, 0.7, 1]) },
    },
    bar: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']) },
    },
    dot: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base')) },
    },
  }),
  render: (v) => (
    <m.g variants={v.frame} style={origin(12, 19.5)}>
      <path d="M10.27 6.01 A2 2 0 0 1 13.73 6.01 L19.77 16.5 A2 2 0 0 1 18.04 19.5 L5.96 19.5 A2 2 0 0 1 4.23 16.5 Z" />
      <m.path d="M12 10 V13" variants={v.bar} />
      <m.path d="M12 16 h.01" variants={v.dot} />
    </m.g>
  ),
})
