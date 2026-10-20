import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Shutter: the body dips, the aperture snaps shut and reopens, the flash blinks. */
export const CameraIcon = createIcon({
  name: 'camera',
  category: 'media',
  keywords: ['photo', 'picture', 'capture', 'snapshot', 'shoot'],
  variants: (k) => ({
    body: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0.75, 0], transition: seq(k, 'slow', [0, 0.25, 1], ['exit', 'emphasized']) },
    },
    lens: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.3, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    flash: {
      rest: { opacity: 1, scale: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0, 1], scale: [1, 2.2, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.body}>
      <path d="M3 9 A2 2 0 0 1 5 7 H7.5 L9 4.5 H15 L16.5 7 H19 A2 2 0 0 1 21 9 V18 A2 2 0 0 1 19 20 H5 A2 2 0 0 1 3 18 Z" />
      <m.circle cx="12" cy="13.5" r="3" variants={v.lens} style={origin(12, 13.5)} />
      <m.path d="M17.5 10 h.01" variants={v.flash} style={origin(17.5, 10)} />
    </m.g>
  ),
})
