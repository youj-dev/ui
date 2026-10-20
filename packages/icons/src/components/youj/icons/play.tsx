import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* Both shapes share one command structure so `d` interpolates point for point.
 * The triangle carries a doubled tip vertex that splits into the left bar's
 * two right-hand corners. */
const PLAY = 'M8 4.5 L20 12 L20 12 L8 19.5 Z'
const PAUSE_LEFT = 'M6 4.5 L10 4.5 L10 19.5 L6 19.5 Z'

/** Play ↔ pause. The triangle folds into the left bar while the right bar slides out from its tip. `active` = playing. */
export const PlayIcon = createIcon({
  name: 'play',
  category: 'media',
  keywords: ['pause', 'start', 'resume', 'video', 'audio', 'media'],
  states: ['play', 'pause'],
  variants: (k) => ({
    shape: {
      rest: { d: PLAY, transition: k.spring('snappy') },
      active: { d: PAUSE_LEFT, transition: k.spring('snappy') },
    },
    bar: {
      rest: { x: -4, scaleY: 0.4, opacity: 0, transition: k.tween('fast', 'exit') },
      active: { x: 0, scaleY: 1, opacity: 1, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <m.path d={PLAY} variants={v.shape} />
      <m.path d="M14 4.5 L18 4.5 L18 19.5 L14 19.5 Z" variants={v.bar} style={origin(16, 12)} />
    </>
  ),
})
