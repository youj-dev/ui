import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* Three lines of four half-waves each, the middle one half a wavelength out
 * of phase. Calm, every control point is pulled onto its line, so the same
 * cubics lie flat. */
const LINES = [
  [
    'M2.5 7 C4.08 5.34 5.67 5.34 7.25 7 C8.83 8.66 10.42 8.66 12 7 C13.58 5.34 15.17 5.34 16.75 7 C18.33 8.66 19.92 8.66 21.5 7',
    'M2.5 7 C4.08 7 5.67 7 7.25 7 C8.83 7 10.42 7 12 7 C13.58 7 15.17 7 16.75 7 C18.33 7 19.92 7 21.5 7',
  ],
  [
    'M2.5 12 C4.08 13.66 5.67 13.66 7.25 12 C8.83 10.34 10.42 10.34 12 12 C13.58 13.66 15.17 13.66 16.75 12 C18.33 10.34 19.92 10.34 21.5 12',
    'M2.5 12 C4.08 12 5.67 12 7.25 12 C8.83 12 10.42 12 12 12 C13.58 12 15.17 12 16.75 12 C18.33 12 19.92 12 21.5 12',
  ],
  [
    'M2.5 17 C4.08 15.34 5.67 15.34 7.25 17 C8.83 18.66 10.42 18.66 12 17 C13.58 15.34 15.17 15.34 16.75 17 C18.33 18.66 19.92 18.66 21.5 17',
    'M2.5 17 C4.08 17 5.67 17 7.25 17 C8.83 17 10.42 17 12 17 C13.58 17 15.17 17 16.75 17 C18.33 17 19.92 17 21.5 17',
  ],
] as const

/**
 * Waves ↔ calm, for sea state, noise and vibration. The waves smooth out
 * line by line from the top until the water is flat; stirring it raises
 * them again from the bottom. `active` = calm.
 */
export const WavesIcon = createIcon({
  name: 'waves',
  category: 'weather',
  keywords: ['waves', 'water', 'sea', 'ocean', 'calm', 'noise', 'swim', 'tide'],
  states: ['waves', 'calm'],
  variants: (k): IconVariants => {
    const s = k.stagger('loose')
    const last = LINES.length - 1
    return Object.fromEntries(
      LINES.map(([wavy, flat], i) => [
        `l${i}`,
        {
          rest: { d: wavy, transition: after(k, (last - i) * s, 'slow', 'emphasized') },
          active: { d: flat, transition: after(k, i * s, 'slow', 'emphasized') },
        },
      ]),
    )
  },
  render: (v) => (
    <>
      {LINES.map(([wavy], i) => (
        <m.path key={wavy} d={wavy} variants={v[`l${i}`]} />
      ))}
    </>
  ),
})
