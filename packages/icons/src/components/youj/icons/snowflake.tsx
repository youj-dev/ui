import { m } from 'motion/react'
import { createIcon, drawIn, drawn, origin, type IconVariants } from './icon-base'

/* Hexagonal, as real ice is: three arms through the center and a branch
 * pair frosted onto each arm near its tip, opening outward at 45°. */
const at = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return `${+(12 + r * Math.cos(a)).toFixed(2)} ${+(12 + r * Math.sin(a)).toFixed(2)}`
}
const ARMS = [-90, -30, 30].map((a) => `M${at(a, 9.5)} L${at(a + 180, 9.5)}`)
const TIPS = [-90, -30, 30, 90, 150, 210]
const branch = (a: number) => {
  const p = at(a, 6.5).split(' ').map(Number) as [number, number]
  const end = (d: number) => {
    const r = ((a + d) * Math.PI) / 180
    return `${+(p[0] + 2.5 * Math.cos(r)).toFixed(2)} ${+(p[1] + 2.5 * Math.sin(r)).toFixed(2)}`
  }
  return `M${end(45)} L${p[0]} ${p[1]} L${end(-45)}`
}

/**
 * Crystallising: the flake turns one sixth, landing on its own silhouette,
 * as frost re-forms on each arm tip in turn. Rest is 60° so leaving
 * mid-turn finishes it forwards.
 */
export const SnowflakeIcon = createIcon({
  name: 'snowflake',
  category: 'weather',
  keywords: ['snow', 'winter', 'cold', 'freeze', 'frost', 'ice', 'weather'],
  variants: (k): IconVariants => ({
    flake: {
      rest: { rotate: 60, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 60], transition: k.tween('deliberate', 'emphasized') },
    },
    ...Object.fromEntries(
      TIPS.map((_, i) => [`b${i}`, { rest: drawn(k), active: drawIn(k, 'base', k.duration('fast') + i * k.stagger('base'), 'standard') }]),
    ),
  }),
  render: (v) => (
    <m.g variants={v.flake} style={origin(12, 12)}>
      {ARMS.map((d) => (
        <path key={d} d={d} />
      ))}
      {TIPS.map((a, i) => (
        <m.path key={a} d={branch(a)} variants={v[`b${i}`]} />
      ))}
    </m.g>
  ),
})
