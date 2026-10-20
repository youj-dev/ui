import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, type IconVariants } from './icon-base'

const RIDGES = [
  'M4.5 16 C4 14.8 3.75 13.5 3.75 12 A8.25 8.25 0 0 1 18 6.4',
  'M20.1 9.5 C20.2 10.3 20.25 11.1 20.25 12 C20.25 13.6 20.1 15.2 19.8 16.8',
  'M7 18.8 C7.6 17 7.9 15 7.9 12 A4.1 4.1 0 0 1 16.1 12 C16.1 14.6 15.8 16.6 15.2 18.6',
  'M12 12 C12 15.5 11.4 18.4 10.2 20.8',
]

/** A scan line sweeps down the pad and each ridge is re-traced as it passes. */
export const FingerprintIcon = createIcon({
  name: 'fingerprint',
  category: 'security',
  keywords: ['biometric', 'auth', 'identity', 'touch id', 'security', 'scan'],
  variants: (k): IconVariants => {
    const ridges: IconVariants = Object.fromEntries(
      RIDGES.map((_, i) => [`r${i}`, { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', i * k.stagger('loose'), 'standard') }]),
    )
    return {
      scan: {
        rest: { y: -9, opacity: 0, transition: k.tween('fast') },
        active: {
          y: [-9, 9],
          opacity: [0, 1, 1, 0],
          transition: { y: k.tween('deliberate', 'standard'), opacity: { ...k.tween('deliberate', 'linear'), times: [0, 0.15, 0.8, 1] } },
        },
      },
      ...ridges,
    }
  },
  render: (v) => (
    <>
      {RIDGES.map((d, i) => (
        <m.path key={d} d={d} variants={v[`r${i}`]} />
      ))}
      <m.path d="M3 12 H21" variants={v.scan} />
    </>
  ),
})
