import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* Each light's flicker: opacity keyframes and when they land, out of step with each other. */
const LEDS = [
  { d: 'M6.5 16 h.01', opacity: [null, 0.15, 1, 0.15, 1], times: [0, 0.2, 0.45, 0.7, 1] },
  { d: 'M10 16 h.01', opacity: [null, 1, 0.15, 1, 0.15, 1], times: [0, 0.1, 0.35, 0.6, 0.85, 1] },
]

/** Disk activity: the two lights on the drive flicker out of step, as if reading and writing. */
export const HardDriveIcon = createIcon({
  name: 'hard-drive',
  category: 'devices',
  keywords: ['storage', 'disk', 'drive', 'hdd', 'ssd', 'backup', 'server', 'volume'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      LEDS.map(({ opacity, times }, i) => [
        `l${i}`,
        {
          rest: { opacity: 1, transition: k.tween('fast') },
          active: { opacity, transition: seq(k, 'deliberate', times, times.slice(1).map(() => 'linear' as const)) },
        },
      ]),
    ),
  render: (v) => (
    <>
      <path d="M2.5 12 V18 A2 2 0 0 0 4.5 20 H19.5 A2 2 0 0 0 21.5 18 V12 L18.4 5.3 A1.5 1.5 0 0 0 17.04 4.5 H6.96 A1.5 1.5 0 0 0 5.6 5.3 Z" />
      <path d="M2.5 12 H21.5" />
      {LEDS.map(({ d }, i) => (
        <m.path key={d} d={d} strokeWidth={2} variants={v[`l${i}`]} />
      ))}
    </>
  ),
})
