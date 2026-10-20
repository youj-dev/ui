import { m } from 'motion/react'
import { createIcon, after, origin, seqFor } from './icon-base'

/**
 * Setting the time: the crown pulls out, the minute hand sweeps a full hour,
 * and the crown clicks back in. Rest is 360° so leaving mid-sweep finishes
 * the turn forwards.
 */
export const WatchIcon = createIcon({
  name: 'watch',
  category: 'devices',
  keywords: ['wearable', 'smartwatch', 'wrist', 'time', 'fitness', 'device'],
  variants: (k) => {
    const pull = k.duration('fast')
    const total = pull + k.duration('deliberate') + k.duration('instant')
    const t = (s: number) => s / total
    return {
      crown: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [null, 1, 1, 0], transition: seqFor(k, total, [0, t(pull * 0.7), t(pull + k.duration('deliberate')), 1], ['standard', 'linear', 'exit']) },
      },
      minute: {
        rest: { rotate: 360, transition: k.tween('base', 'enter') },
        active: { rotate: [0, 360], transition: after(k, pull, 'deliberate', 'emphasized') },
      },
    }
  },
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M8.5 5.94 V4.5 A2 2 0 0 1 10.5 2.5 H13.5 A2 2 0 0 1 15.5 4.5 V5.94" />
      <path d="M8.5 18.06 V19.5 A2 2 0 0 0 10.5 21.5 H13.5 A2 2 0 0 0 15.5 19.5 V18.06" />
      <m.path d="M20 10.75 V13.25" variants={v.crown} />
      <path d="M12 12 L14 14" />
      <m.path d="M12 12 V8.5" variants={v.minute} style={origin(12, 12)} />
    </>
  ),
})
