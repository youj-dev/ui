import { m } from 'motion/react'
import { createIcon, drawIn, drawn, seq } from './icon-base'

/** Support is listening: the band settles on and the mic boom swings round to the mouth. */
export const HeadsetIcon = createIcon({
  name: 'headset',
  category: 'communication',
  keywords: ['support', 'help desk', 'customer service', 'call center', 'headphones with mic', 'gaming'],
  variants: (k) => ({
    band: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -0.75, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    boom: { rest: drawn(k), active: drawIn(k, 'slow', k.duration('fast'), 'emphasized') },
  }),
  render: (v) => (
    <>
      <m.path d="M4.75 14 V12 A7.25 7.25 0 0 1 19.25 12 V14" variants={v.band} />
      <rect x="3" y="13" width="3.5" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="3.5" height="6" rx="1.5" />
      <m.path d="M19.25 19 V19.5 A2 2 0 0 1 17.25 21.5 H13.5" variants={v.boom} />
    </>
  ),
})
