import { m } from 'motion/react'
import { createIcon, after, origin, type IconVariants } from './icon-base'

/* The smile and the check are both two cubic segments: the smile's corners
 * and low point swing up into the check's ends and vertex. */
const SMILE = 'M8.5 14.5 C9.5 15.8 10.7 16.5 12 16.5 C13.3 16.5 14.5 15.8 15.5 14.5'
const CHECK = 'M8.5 12.5 C9.33 13.33 10.17 14.17 11 15 C12.5 13.5 14 12 15.5 10.5'
const CORNERS = [
  { d: 'M3 8 V5 A2 2 0 0 1 5 3 H8', x: 1, y: 1 },
  { d: 'M16 3 H19 A2 2 0 0 1 21 5 V8', x: -1, y: 1 },
  { d: 'M21 16 V19 A2 2 0 0 1 19 21 H16', x: -1, y: -1 },
  { d: 'M8 21 H5 A2 2 0 0 1 3 19 V16', x: 1, y: -1 },
]

/**
 * Scanning ↔ verified. The corner brackets close in and lock on, the eyes
 * blink shut and the smile swings up into a check. `active` = verified.
 */
export const ScanFaceIcon = createIcon({
  name: 'scan-face',
  category: 'security',
  keywords: ['face id', 'biometric', 'recognition', 'identity', 'verify', 'login', 'passkey'],
  states: ['scanning', 'verified'],
  variants: (k): IconVariants => {
    const corner = (x: number, y: number) => ({
      rest: { x: 0, y: 0, transition: after(k, k.duration('fast'), 'base') },
      active: { x, y, transition: { ...k.spring('settle'), delay: k.duration('base') } },
    })
    return {
      ...Object.fromEntries(CORNERS.map((c, i) => [`c${i}`, corner(c.x, c.y)])),
      eyes: {
        rest: { scaleY: 1, opacity: 1, transition: after(k, k.duration('fast'), 'fast') },
        active: { scaleY: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      },
      mouth: {
        rest: { d: SMILE, transition: k.tween('base') },
        active: { d: CHECK, transition: after(k, k.duration('instant'), 'slow', 'emphasized') },
      },
    }
  },
  render: (v) => (
    <>
      {CORNERS.map((c, i) => (
        <m.path key={c.d} d={c.d} variants={v[`c${i}`]} />
      ))}
      <m.g variants={v.eyes} style={origin(12, 9.75)}>
        <path d="M9 9 V10.5" />
        <path d="M15 9 V10.5" />
      </m.g>
      <m.path d={SMILE} variants={v.mouth} />
    </>
  ),
})
