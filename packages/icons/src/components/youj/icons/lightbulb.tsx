import { m } from 'motion/react'
import { createIcon, drawn, drawOut, seq, type IconVariants } from './icon-base'

/* Rays radiate from the glass center (12, 10.5), inner end first so they
 * draw outward. Listed top first, then outward pair by pair. */
const RAYS = [-90, -45, -135, 0, 180].map((deg) => {
  const a = (deg * Math.PI) / 180
  const p = (r: number) => `${+(12 + r * Math.cos(a)).toFixed(2)} ${+(10.5 + r * Math.sin(a)).toFixed(2)}`
  return `M${p(7.25)} L${p(8.75)}`
})
/* Rays come in pairs: the top, then each symmetric pair together. */
const ORDER = [0, 1, 1, 2, 2]

/**
 * Off ↔ on. The filament catches with a flicker, then light radiates out,
 * top first and then down both sides; switching off pulls the rays back in
 * the reverse order. `active` = on.
 */
export const LightbulbIcon = createIcon({
  name: 'lightbulb',
  category: 'system',
  keywords: ['idea', 'tip', 'light', 'lamp', 'insight', 'hint', 'smart home'],
  states: ['off', 'on'],
  variants: (k): IconVariants => {
    const s = k.stagger('loose')
    const catchAt = k.duration('fast')
    return {
      glass: {
        rest: { opacity: 1, transition: k.tween('fast') },
        active: { opacity: [null, 0.35, 1, 0.55, 1], transition: seq(k, 'base', [0, 0.25, 0.5, 0.75, 1], ['linear', 'linear', 'linear', 'linear']) },
      },
      ...Object.fromEntries(
        RAYS.map((_, i) => [
          `r${i}`,
          { rest: drawOut(k, 'fast', (2 - ORDER[i]!) * s * 0.5), active: drawn(k, 'base', catchAt + ORDER[i]! * s) },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <m.path d="M9.5 17.5 V15.95 A6 6 0 1 1 14.5 15.95 V17.5 Z" variants={v.glass} />
      <path d="M10.5 20 H13.5" />
      {RAYS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`r${i}`]} />
      ))}
    </>
  ),
})
