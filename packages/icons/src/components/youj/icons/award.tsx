import { m } from 'motion/react'
import { createIcon, origin, seqFor } from './icon-base'

/* A medallion on the 5.5 ring with an inner rim, and two ribbon tails that
 * leave its lower edge and end in V-cut notches. */
const TAILS = ['M8.61 13.33 L7.1 20.6 L8.95 19.55 L10.55 21.1 L11.05 14.42', 'M15.39 13.33 L16.9 20.6 L15.05 19.55 L13.45 21.1 L12.95 14.42']

/**
 * Awarded. The rosette swings on its pin like a pendulum and settles, the
 * tails trailing a beat behind the medal.
 */
export const AwardIcon = createIcon({
  name: 'award',
  category: 'status',
  keywords: ['achievement', 'badge', 'medal', 'prize', 'certified', 'winner', 'rosette', 'reward', 'recognition'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.2
    const times = [0, 0.22, 0.5, 0.76, 1]
    const eases = ['standard', 'standard', 'standard', 'emphasized'] as const
    return {
      medal: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, 7, -4.5, 2, 0], transition: seqFor(k, length, times, [...eases]) },
      },
      tails: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, -2.5, 2, -1, 0], transition: seqFor(k, length, times, [...eases], k.stagger('tight')) },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.medal} style={origin(12, 3.5)}>
      <circle cx="12" cy="9" r="5.5" />
      <circle cx="12" cy="9" r="2.75" />
      <m.g variants={v.tails} style={origin(12, 14.5)}>
        {TAILS.map((d) => (
          <path key={d} d={d} />
        ))}
      </m.g>
    </m.g>
  ),
})
