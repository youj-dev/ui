import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* The triangle's tip slides back onto its left edge, which leaves one bar of
 * the pause; the second bar slides out from where the tip was. */
const PLAY = 'M10 8.5 L15.5 12 L10 15.5 Z'
const BAR = 'M10 8.5 L10 12 L10 15.5 Z'

/** Play ↔ pause in a round button. The triangle folds flat into the left bar and the right bar slides in beside it. `active` = playing. */
export const CirclePlayIcon = createIcon({
  name: 'circle-play',
  category: 'media',
  keywords: ['play', 'pause', 'start', 'video', 'audio', 'resume', 'play button'],
  states: ['play', 'pause'],
  variants: (k) => ({
    shape: {
      rest: { d: PLAY, transition: k.spring('snappy') },
      active: { d: BAR, transition: k.spring('snappy') },
    },
    bar: {
      rest: { x: -4, scaleY: 0.4, opacity: 0, transition: k.tween('fast', 'exit') },
      active: { x: 0, scaleY: 1, opacity: 1, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d={PLAY} variants={v.shape} />
      <m.path d="M14 8.5 L14 15.5" variants={v.bar} style={origin(14, 12)} />
    </>
  ),
})
