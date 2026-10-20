import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Tightening the crop: both corner brackets slide in along the diagonal together, then ease back out to the frame. */
export const CropIcon = createIcon({
  name: 'crop',
  category: 'editor',
  keywords: ['crop', 'trim', 'resize', 'image', 'frame', 'cut', 'aspect ratio'],
  variants: (k) => {
    const slide = (dir: 1 | -1) => ({
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: {
        x: [null, 1.25 * dir, 0],
        y: [null, -1.25 * dir, 0],
        transition: seq(k, 'slow', [0, 0.45, 1], ['emphasized', 'standard']),
      },
    })
    return { lower: slide(1), upper: slide(-1) }
  },
  render: (v) => (
    <>
      <m.path d="M6.5 2.5 V15.5 A2 2 0 0 0 8.5 17.5 H21.5" variants={v.lower} />
      <m.path d="M17.5 21.5 V8.5 A2 2 0 0 0 15.5 6.5 H2.5" variants={v.upper} />
    </>
  ),
})
