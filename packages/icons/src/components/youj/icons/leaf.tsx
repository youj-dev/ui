import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A breeze: the leaf sways on its stalk, back and forth and settling, the vein traveling with it. */
export const LeafIcon = createIcon({
  name: 'leaf',
  category: 'weather',
  keywords: ['leaf', 'nature', 'eco', 'green', 'sustainable', 'plant', 'organic', 'spring'],
  variants: (k) => ({
    leaf: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -9, 6, -2.5, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.55, 0.8, 1], ['standard', 'standard', 'standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.leaf} style={origin(5, 19)}>
        <path d="M5 19 C5 10.75 10 5 20 4 C19.5 14 13.75 19 5 19 Z" />
        <path d="M5 19 C8.5 15.5 11.5 12.5 14.5 9.5" />
      </m.g>
      <path d="M5 19 L3 21" />
    </>
  ),
})
