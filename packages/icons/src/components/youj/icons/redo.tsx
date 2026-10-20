import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* undo's arrow, mirrored: the 90° head points right and the hook turns on a
 * 4.75 radius around (10.5, 14.75), which is also the pivot it winds on. */
const HEAD = 'M15 15 L20 10 L15 5'
const HOOK = 'M20 10 H10.5 A4.75 4.75 0 0 0 10.5 19.5 H16'

/** Step forward. The arrow winds a notch clockwise around its hook, the direction it travels, and eases home. */
export const RedoIcon = createIcon({
  name: 'redo',
  category: 'arrows',
  keywords: ['forward', 'repeat', 'history', 'step forward', 'again'],
  variants: (k) => ({
    arrow: {
      rest: { rotate: 0, transition: k.tween('fast') },
      active: { rotate: [null, 24, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow} style={origin(10.5, 14.75)}>
      <path d={HEAD} />
      <path d={HOOK} />
    </m.g>
  ),
})
