import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* A regular octagon with its flats square to the grid. Its apothem is 8.75,
 * which gives it the area of the r=9 ring, so it weighs the same as the
 * circle-alert family; corners are rounded at r=1.75. Built clockwise from the
 * top-left corner. */
const f = (n: number) => +n.toFixed(2)
function octagon(apothem: number, round: number): string {
  const R = apothem / Math.cos(Math.PI / 8)
  const t = round * Math.tan(Math.PI / 8)
  const v = Array.from({ length: 8 }, (_, i) => {
    const a = -Math.PI / 2 - Math.PI / 8 + (i * Math.PI) / 4
    return [12 + R * Math.cos(a), 12 + R * Math.sin(a)] as const
  })
  const toward = (from: readonly [number, number], to: readonly [number, number]) => {
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const len = Math.hypot(dx, dy)
    return `${f(from[0] + (dx / len) * t)} ${f(from[1] + (dy / len) * t)}`
  }
  let d = `M${toward(v[0]!, v[1]!)}`
  for (let i = 1; i <= 8; i++) {
    const cur = v[i % 8]!
    d += ` L${toward(cur, v[i - 1]!)} A${round} ${round} 0 0 1 ${toward(cur, v[(i + 1) % 8]!)}`
  }
  return `${d} Z`
}

const OCTAGON = octagon(8.75, 1.75)

/** Stop. The sign braces with a short press, and the exclamation jumps with its point landing a beat after. */
export const OctagonAlertIcon = createIcon({
  name: 'octagon-alert',
  category: 'status',
  keywords: ['alert-octagon', 'stop', 'danger', 'error', 'critical', 'destructive', 'blocked', 'warning'],
  variants: (k) => ({
    sign: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.88, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base')) },
    },
    dot: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base') * 2) },
    },
  }),
  render: (v) => (
    <m.g variants={v.sign} style={origin(12, 12)}>
      <path d={OCTAGON} />
      <m.path d="M12 7.5 V12.5" variants={v.bar} />
      <m.path d="M12 16.25 L12.01 16.25" variants={v.dot} />
    </m.g>
  ),
})
