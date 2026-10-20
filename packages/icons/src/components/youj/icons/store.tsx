import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

/* Scallops and walls each keep one command structure in both states: the
 * scallops flatten into the awning's edge and the walls grow up to meet it. */
const SCALLOPS = 'M3 8 C3 12 9 12 9 8 C9 12 15 12 15 8 C15 12 21 12 21 8'
const ROLLED = 'M3 8 C3 8 9 8 9 8 C9 8 15 8 15 8 C15 8 21 8 21 8'
const WALLS = 'M4.5 10.6 V19 A2 2 0 0 0 6.5 21 H17.5 A2 2 0 0 0 19.5 19 V10.6'
const WALLS_UP = 'M4.5 8 V19 A2 2 0 0 0 6.5 21 H17.5 A2 2 0 0 0 19.5 19 V8'
const SLATS = [11.5, 14.75, 18]

/**
 * Open ↔ closed. The awning rolls up into its bar and a roller shutter comes
 * down over the shopfront, slat by slat from under the awning. Opening rolls
 * it back up. `active` = closed.
 */
export const StoreIcon = createIcon({
  name: 'store',
  category: 'commerce',
  keywords: ['shop', 'storefront', 'market', 'business', 'merchant', 'open', 'closed'],
  states: ['open', 'closed'],
  variants: (k) => {
    const late = k.duration('base')
    return {
      awning: {
        rest: { d: SCALLOPS, transition: after(k, late, 'base', 'enter') },
        active: { d: ROLLED, transition: k.tween('base') },
      },
      walls: {
        rest: { d: WALLS, transition: after(k, late, 'base', 'enter') },
        active: { d: WALLS_UP, transition: k.tween('base') },
      },
      door: {
        rest: { opacity: 1, transition: after(k, k.duration('fast'), 'fast') },
        active: { opacity: 0, transition: after(k, late, 'fast') },
      },
      shutter: {
        rest: { y: -11, transition: k.tween('base', 'exit') },
        active: { y: 0, transition: after(k, k.duration('fast'), 'slow', 'standard') },
      },
    }
  },
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <rect x="3" y="8" width="18" height="14" />
      </clipPath>
      <path d="M4.5 3 H19.5 L21 8 H3 Z" />
      <m.path d={SCALLOPS} variants={v.awning} />
      <m.path d={WALLS} variants={v.walls} />
      <m.path d="M10 21 V16.5 A2 2 0 0 1 14 16.5 V21" variants={v.door} />
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.shutter}>
          {SLATS.map((y) => (
            <path key={y} d={`M4.5 ${y} H19.5`} />
          ))}
        </m.g>
      </g>
    </>
  ),
})
