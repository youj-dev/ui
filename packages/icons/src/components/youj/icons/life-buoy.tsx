import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* The buoy is the band between the r=9 ring and an r=4 hole, with four solid
 * stripes across it on the diagonals. Each stripe is an annular sector 26°
 * wide, so it reads as painted bands rather than spokes. */
const f = (n: number) => +n.toFixed(2)
function stripe(deg: number, half = 13): string {
  const at = (r: number, a: number) => {
    const t = (a * Math.PI) / 180
    return `${f(12 + r * Math.cos(t))} ${f(12 + r * Math.sin(t))}`
  }
  const a = deg - half
  const b = deg + half
  return `M${at(9, a)} A9 9 0 0 1 ${at(9, b)} L${at(4, b)} A4 4 0 0 0 ${at(4, a)} Z`
}
const STRIPES = [45, 135, 225, 315].map((deg) => stripe(deg))

/**
 * Help is on its way. The buoy turns one stripe on (90°) with a heavy
 * ease-out, like a ratchet. Rest is 90°, so leaving mid-turn completes
 * forwards.
 */
export const LifeBuoyIcon = createIcon({
  name: 'life-buoy',
  category: 'communication',
  keywords: ['help', 'support', 'rescue', 'lifebuoy', 'life ring', 'safety', 'assistance', 'help center'],
  variants: (k) => ({
    buoy: {
      rest: { rotate: 90, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 90], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <m.g variants={v.buoy} style={origin(12, 12)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <g fill="currentColor" stroke="none">
        {STRIPES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </m.g>
  ),
})
