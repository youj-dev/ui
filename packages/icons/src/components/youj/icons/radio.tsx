import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Tuning in: the antenna sways and the speaker pulses to the sound. */
export const RadioIcon = createIcon({
  name: 'radio',
  category: 'media',
  keywords: ['radio', 'fm', 'broadcast', 'music', 'station', 'tuner'],
  variants: (k) => ({
    antenna: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -8, 6, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
    speaker: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 1.15, 0.95, 1.1, 1], transition: seq(k, 'deliberate', [0, 0.2, 0.4, 0.6, 1]) },
    },
  }),
  render: (v) => (
    <>
      <rect x="2.5" y="8" width="19" height="12.5" rx="2" />
      <m.path d="M6 8 L17 3.5" variants={v.antenna} style={origin(6, 8)} />
      <m.circle cx="8.5" cy="14.25" r="3" variants={v.speaker} style={origin(8.5, 14.25)} />
      <path d="M15 12.5 H18.5" />
      <path d="M15 16 H18.5" />
    </>
  ),
})
