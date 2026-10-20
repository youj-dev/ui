import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Add an image → added. The sun dips behind the ridge and the plus beside the frame swings into a check. `active` = added. */
export const ImagePlusIcon = createIcon({
  name: 'image-plus',
  category: 'media',
  keywords: ['add image', 'upload photo', 'insert picture', 'new image', 'gallery', 'added'],
  states: ['add', 'added'],
  variants: (k) => ({
    sun: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 2, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    long: {
      rest: { d: 'M18 15 L18 21', transition: k.spring('snappy') },
      active: { d: 'M21 16 L17 20', transition: k.spring('settle') },
    },
    short: {
      rest: { d: 'M15 18 L21 18', transition: k.spring('snappy') },
      active: { d: 'M15 18 L17 20', transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <>
      <path d="M21 12.5 V5 A2 2 0 0 0 19 3 H5 A2 2 0 0 0 3 5 V19 A2 2 0 0 0 5 21 H12.5" />
      <m.circle cx="8.5" cy="8.5" r="1.5" variants={v.sun} />
      <path d="M3.5 18 L9 12.5 L13 16.5" />
      <m.path d="M18 15 L18 21" variants={v.long} />
      <m.path d="M15 18 L21 18" variants={v.short} />
    </>
  ),
})
