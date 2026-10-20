import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* Rays around the lamp's center (12, 13), listed left to right so they flash in the lamp's direction of turn. */
const RAYS = ['M6.7 7.7 L5.28 6.28', 'M12 5.5 V3.5', 'M17.3 7.7 L18.72 6.28']

/**
 * Incident. The glint inside the dome sweeps once round the lamp and each
 * ray flashes as it passes. Rest is a full turn, so leaving mid-sweep
 * carries on forwards instead of unwinding.
 */
export const SirenIcon = createIcon({
  name: 'siren',
  category: 'status',
  keywords: ['alarm', 'incident', 'emergency', 'alert', 'urgent', 'on-call', 'outage'],
  variants: (k): IconVariants => {
    const sweep = k.duration('deliberate')
    return {
      glint: {
        rest: { rotate: 360, transition: k.tween('base', 'enter') },
        active: { rotate: [0, 360], transition: { ...k.tween('deliberate', 'standard'), duration: sweep } },
      },
      ...Object.fromEntries(
        RAYS.map((_, i) => [
          `r${i}`,
          {
            rest: { opacity: 1, transition: k.tween('fast') },
            active: { opacity: [null, 0.15, 1], transition: seq(k, 'base', [0, 0.35, 1], ['exit', 'enter'], sweep * (0.15 + i * 0.25)) },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <rect x="4.5" y="17.5" width="15" height="3" rx="1" />
      <path d="M7 17.5 V13 A5 5 0 0 1 17 13 V17.5" />
      <m.path d="M9.5 13 A2.5 2.5 0 0 1 12 10.5" variants={v.glint} style={origin(12, 13)} />
      {RAYS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`r${i}`]} />
      ))}
    </>
  ),
})
