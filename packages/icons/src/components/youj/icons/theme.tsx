import { m } from 'motion/react'
import { createIcon, after, origin, type IconVariants } from './icon-base'

/* Sun and moon share one command structure: a short "bite" arc and a long
 * outer arc. On the sun the bite collapses to a sliver on the rim, so it
 * reads as a plain circle; on the moon it opens into the crescent. */
const SUN = 'M14.75 9.1 A0.2 0.2 0 0 0 14.9 9.25 A4 4 0 1 1 14.75 9.1 Z'
const MOON = 'M12 3 A6 6 0 0 0 21 12 A9 9 0 1 1 12 3 Z'
const RAYS = [
  'M12 5.5 L12 3',
  'M16.6 7.4 L18.36 5.64',
  'M18.5 12 L21 12',
  'M16.6 16.6 L18.36 18.36',
  'M12 18.5 L12 21',
  'M7.4 16.6 L5.64 18.36',
  'M5.5 12 L3 12',
  'M7.4 7.4 L5.64 5.64',
]

/**
 * Sun ↔ moon. The rays retract into the core one after another, then the core
 * swells and a bite sweeps in to carve the crescent. `active` = dark.
 */
export const ThemeIcon = createIcon({
  name: 'theme',
  category: 'system',
  keywords: ['sun', 'moon', 'dark mode', 'light mode', 'appearance', 'toggle'],
  states: ['light', 'dark'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const hold = k.duration('base')
    const ray = (i: number) => ({
      rest: { pathLength: 1, opacity: 1, transition: { pathLength: after(k, hold + i * s, 'base'), opacity: after(k, hold + i * s, 'instant') } },
      active: {
        pathLength: 0,
        opacity: 0,
        transition: { pathLength: after(k, i * s, 'fast', 'exit'), opacity: after(k, i * s, 'fast', 'exit') },
      },
    })
    const rays: IconVariants = Object.fromEntries(RAYS.map((_, i) => [`r${i}`, ray(i)]))
    return {
      ...rays,
      body: {
        rest: { d: SUN, rotate: 0, transition: k.tween('base') },
        active: { d: MOON, rotate: -20, transition: after(k, k.duration('fast'), 'slow', 'emphasized') },
      },
    }
  },
  render: (v) => (
    <>
      {RAYS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`r${i}`]} />
      ))}
      <m.path d={SUN} variants={v.body} style={origin(12, 12)} />
    </>
  ),
})
