import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * The crown is pressed and the hand runs one full lap, landing back on its
 * mark. The hand rests at a full turn, so leaving mid-lap finishes forwards.
 */
export const TimerIcon = createIcon({
  name: 'timer',
  category: 'time',
  keywords: ['stopwatch', 'countdown', 'duration', 'lap', 'time', 'start timer'],
  variants: (k) => ({
    crown: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    hand: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: { ...k.tween('deliberate', 'emphasized'), delay: k.duration('fast') } },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.crown}>
        <path d="M10 3 H14" />
        <path d="M12 3 V6.5" />
      </m.g>
      <circle cx="12" cy="13.5" r="7" />
      <m.path d="M12 13.5 L15 10.5" variants={v.hand} style={origin(12, 13.5)} />
    </>
  ),
})
