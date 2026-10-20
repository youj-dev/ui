import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Fill: the bucket tips over its rim and a drop of paint falls from it as it rights itself. */
export const PaintBucketIcon = createIcon({
  name: 'paint-bucket',
  category: 'editor',
  keywords: ['fill', 'paint', 'bucket', 'color fill', 'flood fill', 'pour'],
  variants: (k) => ({
    bucket: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, 24, 24, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.5, 1], ['standard', 'linear', 'emphasized']) },
    },
    drop: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: { y: [-3, -3, 0], opacity: [0, 0, 1], transition: seq(k, 'deliberate', [0, 0.35, 1], ['linear', 'enter']) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.bucket} style={origin(15.5, 9)}>
        <path d="M5.07 9 L14.93 9 A0.5 0.5 0 0 1 15.42 9.57 L14.18 18.7 A1.5 1.5 0 0 1 12.69 20 L7.31 20 A1.5 1.5 0 0 1 5.82 18.7 L4.58 9.57 A0.5 0.5 0 0 1 5.07 9 Z" />
        <path d="M5.5 9 A4.5 4.5 0 0 1 14.5 9" />
      </m.g>
      <m.path d="M19 13 C19.9 14.4 20.75 15.3 20.75 16.4 A1.75 1.75 0 0 1 17.25 16.4 C17.25 15.3 18.1 14.4 19 13 Z" variants={v.drop} />
    </>
  ),
})
