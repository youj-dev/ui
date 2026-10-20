import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Flicking through: the front photo slides aside a little, showing the one behind, and settles back. */
export const ImagesIcon = createIcon({
  name: 'images',
  category: 'media',
  keywords: ['gallery', 'photos', 'album', 'pictures', 'collection', 'slideshow'],
  variants: (k) => ({
    front: {
      rest: { x: 0, y: 0, rotate: 0, transition: k.tween('base') },
      active: { x: [0, 1.25, 0], y: [0, 0.5, 0], rotate: [0, 4, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    back: {
      rest: { x: 0, transition: k.tween('base') },
      active: { x: [0, -0.75, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M3 16 V5 A2 2 0 0 1 5 3 H16" variants={v.back} />
      <m.g variants={v.front} style={origin(13.75, 21)}>
        <rect x="6.5" y="6.5" width="14.5" height="14.5" rx="2" />
        <circle cx="11" cy="11" r="1.25" />
        <path d="M7 19.5 L12 14.5 L16 18.5" />
      </m.g>
    </>
  ),
})
