import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The canopy as cubics so it can furl without changing structure: a dome
 * from the tip at (12, 3) down to two rib ends, closed by three scallops.
 * `w` is the half-span, `edge` the rib ends' height, `sag` the scallop depth. */
const n = (v: number) => +v.toFixed(2)
const canopy = (w: number, edge: number, sag: number) => {
  const k = 0.5523
  const drop = edge - 3
  const lift = n(edge - (4 / 3) * sag)
  const xs = [12 + w, 12 + w / 3, 12 - w / 3, 12 - w].map(n)
  const scallops = xs
    .slice(1)
    .map((x, i) => `C${xs[i]} ${lift} ${x} ${lift} ${x} ${edge}`)
    .join(' ')
  return `M${n(12 - w)} ${edge} C${n(12 - w)} ${n(edge - k * drop)} ${n(12 - k * w)} 3 12 3 C${n(12 + k * w)} 3 ${n(12 + w)} ${n(edge - k * drop)} ${n(12 + w)} ${edge} ${scallops} Z`
}
const OPEN = canopy(9, 12, 2)
const FURLED = canopy(2, 15, 0.4)
const shaft = (top: number) => `M12 ${top} V19.5 A2 2 0 0 1 8 19.5`

/**
 * Shaking off the rain: the canopy furls tight around the shaft, then snaps
 * back open and flicks a drop off each rib end.
 */
export const UmbrellaIcon = createIcon({
  name: 'umbrella',
  category: 'weather',
  keywords: ['rain', 'protection', 'insurance', 'cover', 'weather', 'shelter'],
  variants: (k) => {
    const times = [0, 0.3, 0.4, 1]
    const eases = ['exit', 'linear', 'emphasized'] as const
    const drop = (dir: 1 | -1) => ({
      rest: { x: 0, y: 0, opacity: 0, transition: k.tween('fast') },
      active: {
        x: [0, 0, dir * 2],
        y: [0, 0, 2.5],
        opacity: [0, 1, 0],
        transition: seq(k, 'slow', [0, 0.15, 1], ['linear', 'exit'], k.duration('deliberate') * 0.55),
      },
    })
    return {
      canopy: {
        rest: { d: OPEN, transition: k.tween('base') },
        active: { d: [null, FURLED, FURLED, OPEN], transition: seq(k, 'deliberate', times, [...eases]) },
      },
      shaft: {
        rest: { d: shaft(10), transition: k.tween('base') },
        active: { d: [null, shaft(14.6), shaft(14.6), shaft(10)], transition: seq(k, 'deliberate', times, [...eases]) },
      },
      left: drop(-1),
      right: drop(1),
    }
  },
  render: (v) => (
    <>
      <m.path d={OPEN} variants={v.canopy} />
      <m.path d={shaft(10)} variants={v.shaft} />
      <m.path d="M3 13.5 h.01" strokeWidth={2} variants={v.left} />
      <m.path d="M21 13.5 h.01" strokeWidth={2} variants={v.right} />
    </>
  ),
})
