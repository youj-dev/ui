import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The note hops twice to a beat, rocking on its heel. */
export const MusicIcon = createIcon({
  name: 'music',
  category: 'media',
  keywords: ['song', 'audio', 'note', 'playlist', 'sound'],
  variants: (k) => ({
    note: {
      rest: { y: 0, rotate: 0, transition: k.tween('fast') },
      active: {
        y: [0, -2.5, 0, -1.5, 0],
        rotate: [0, -6, 0, 4, 0],
        transition: seq(k, 'deliberate', [0, 0.22, 0.45, 0.68, 1], ['exit', 'enter', 'exit', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.note} style={origin(12, 21)}>
      <path d="M9 18 V5.5 L20 3.5 V16" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </m.g>
  ),
})
