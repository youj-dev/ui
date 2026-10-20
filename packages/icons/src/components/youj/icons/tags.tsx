import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const SWING = [0, 0.2, 0.42, 0.66, 1]

/** The front tag swings on its hole and the one behind follows a beat later, both damping out to rest. */
export const TagsIcon = createIcon({
  name: 'tags',
  category: 'commerce',
  keywords: ['labels', 'categories', 'tagging', 'prices', 'organize', 'topics'],
  variants: (k) => ({
    front: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -12, 7, -3, 0], transition: seq(k, 'deliberate', SWING) },
    },
    back: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -8, 5, -2, 0], transition: seq(k, 'deliberate', SWING, undefined, k.stagger('loose')) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M13.5 5 L19.59 11.09 A2 2 0 0 1 19.59 13.91 L15 18.5" variants={v.back} style={origin(13.5, 5)} />
      <m.g variants={v.front} style={origin(6.5, 8.5)}>
        <path d="M5 5 L9.17 5 A2 2 0 0 1 10.59 5.59 L16.59 11.59 A2 2 0 0 1 16.59 14.41 L13.41 17.59 A2 2 0 0 1 10.59 17.59 L3.59 10.59 A2 2 0 0 1 3 9.17 L3 7 A2 2 0 0 1 5 5 Z" />
        <circle cx="6.5" cy="8.5" r="1" />
      </m.g>
    </>
  ),
})
