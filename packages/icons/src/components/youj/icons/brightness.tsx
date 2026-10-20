import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* Eight rays round (12, 12), clockwise from the top. Bright, each spans
 * theme's sun rays (r 6.5 to 9); dim, it is a dot at r 7.75, its middle. */
const RAYS = [
  ['M12 4.25 L12 4.24', 'M12 5.5 L12 3'],
  ['M17.48 6.52 L17.49 6.52', 'M16.6 7.4 L18.36 5.64'],
  ['M19.75 12 L19.76 12', 'M18.5 12 L21 12'],
  ['M17.48 17.48 L17.49 17.48', 'M16.6 16.6 L18.36 18.36'],
  ['M12 19.75 L12 19.76', 'M12 18.5 L12 21'],
  ['M6.52 17.48 L6.51 17.48', 'M7.4 16.6 L5.64 18.36'],
  ['M4.25 12 L4.24 12', 'M5.5 12 L3 12'],
  ['M6.52 6.52 L6.51 6.52', 'M7.4 7.4 L5.64 5.64'],
] as const
/* The core is a four-cubic circle, r 3.5 dim and r 4 bright, so it grows without thinning its stroke. */
const CORE_DIM = 'M12 8.5 C13.93 8.5 15.5 10.07 15.5 12 C15.5 13.93 13.93 15.5 12 15.5 C10.07 15.5 8.5 13.93 8.5 12 C8.5 10.07 10.07 8.5 12 8.5 Z'
const CORE_BRIGHT = 'M12 8 C14.21 8 16 9.79 16 12 C16 14.21 14.21 16 12 16 C9.79 16 8 14.21 8 12 C8 9.79 9.79 8 12 8 Z'

/**
 * Dim ↔ bright. The core swells and each dot stretches out into a full ray,
 * traveling clockwise from the top; dimming draws the rays back into dots
 * the other way round. `active` = bright.
 */
export const BrightnessIcon = createIcon({
  name: 'brightness',
  category: 'system',
  keywords: ['brightness', 'display', 'screen', 'sun', 'light', 'dim', 'contrast', 'exposure'],
  states: ['dim', 'bright'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const last = RAYS.length - 1
    return {
      core: {
        rest: { d: CORE_DIM, transition: k.spring('snappy') },
        active: { d: CORE_BRIGHT, transition: k.spring('snappy') },
      },
      ...Object.fromEntries(
        RAYS.map(([dot, ray], i) => [
          `r${i}`,
          {
            rest: { d: dot, transition: after(k, (last - i) * s, 'base') },
            active: { d: ray, transition: after(k, k.duration('instant') + i * s, 'base', 'enter') },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <m.path d={CORE_DIM} variants={v.core} />
      {RAYS.map(([dot], i) => (
        <m.path key={dot} d={dot} variants={v[`r${i}`]} />
      ))}
    </>
  ),
})
