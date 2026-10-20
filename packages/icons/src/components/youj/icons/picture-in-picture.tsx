import { m } from 'motion/react'
import { after, createIcon } from './icon-base'

/* The video is one rounded rectangle (lines and r1 cubic corners) in both
 * states: inset in the screen while inline, shrunk into the lower right
 * corner once it floats. Its bottom-right corner is the anchor and never
 * moves. */
const INLINE = 'M6.5 7.5 L17.5 7.5 C18.05 7.5 18.5 7.95 18.5 8.5 L18.5 15.5 C18.5 16.05 18.05 16.5 17.5 16.5 L6.5 16.5 C5.95 16.5 5.5 16.05 5.5 15.5 L5.5 8.5 C5.5 7.95 5.95 7.5 6.5 7.5 Z'
const FLOATING = 'M13 12 L17.5 12 C18.05 12 18.5 12.45 18.5 13 L18.5 15.5 C18.5 16.05 18.05 16.5 17.5 16.5 L13 16.5 C12.45 16.5 12 16.05 12 15.5 L12 13 C12 12.45 12.45 12 13 12 Z'

/**
 * Inline ↔ picture in picture. The video shrinks into the corner of the
 * screen and fills in as a floating window; bringing it back grows it out
 * of the corner to fill the screen again. `active` = floating.
 */
export const PictureInPictureIcon = createIcon({
  name: 'picture-in-picture',
  category: 'media',
  keywords: ['pip', 'picture in picture', 'mini player', 'float', 'video', 'pop out', 'overlay'],
  states: ['inline', 'pip'],
  variants: (k) => {
    const move = (d: string) => ({ d, transition: k.spring('smooth') })
    return {
      video: { rest: move(INLINE), active: move(FLOATING) },
      fill: {
        rest: { ...move(INLINE), opacity: 0, transition: { ...k.spring('smooth'), opacity: k.tween('fast', 'exit') } },
        active: { ...move(FLOATING), opacity: 1, transition: { ...k.spring('smooth'), opacity: after(k, k.duration('base'), 'base') } },
      },
    }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <m.path d={INLINE} fill="currentColor" stroke="none" variants={v.fill} />
      <m.path d={INLINE} variants={v.video} />
    </>
  ),
})
