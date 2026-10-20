import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Disappointed: the face shakes its head slowly and the frown deepens, then it all relaxes. */
export const FrownIcon = createIcon({
  name: 'frown',
  category: 'people',
  keywords: ['sad', 'unhappy', 'dislike', 'bad', 'negative feedback', 'upset'],
  variants: (k) => ({
    face: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -6, 5, -3, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
    mouth: {
      rest: { y: 0, scaleY: 1, transition: k.tween('fast') },
      active: { y: [0, 0.5, 0], scaleY: [1, 1.35, 1], transition: seq(k, 'deliberate', [0, 0.4, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.face} style={origin(12, 12)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5 h.01" strokeWidth={2} />
      <path d="M15 9.5 h.01" strokeWidth={2} />
      <m.path d="M8.5 16.5 A4 4 0 0 1 15.5 16.5" variants={v.mouth} style={origin(12, 16)} />
    </m.g>
  ),
})
