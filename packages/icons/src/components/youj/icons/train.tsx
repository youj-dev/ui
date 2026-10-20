import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Arriving: the train rocks on the rails and its headlights flash. */
export const TrainIcon = createIcon({
  name: 'train',
  category: 'location',
  keywords: ['train', 'rail', 'metro', 'subway', 'transit', 'commute', 'railway'],
  variants: (k) => ({
    body: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -0.75, 0, -0.5, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1]) },
    },
    lights: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.2, 1, 0.2, 1], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1]) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.body}>
        <rect x="5" y="3" width="14" height="15" rx="3" />
        <rect x="7.5" y="6" width="9" height="5" rx="1" />
        <m.path d="M8.75 14.5 h.01" strokeWidth={2} variants={v.lights} />
        <m.path d="M15.25 14.5 h.01" strokeWidth={2} variants={v.lights} />
      </m.g>
      <path d="M8.5 18 L6.5 21" />
      <path d="M15.5 18 L17.5 21" />
    </>
  ),
})
