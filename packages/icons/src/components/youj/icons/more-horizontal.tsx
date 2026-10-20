import { m } from 'motion/react'
import { createIcon, after, origin } from './icon-base'

/* A dot and a bar share one command structure, four cubics and a close, so a
 * dot can stretch into a bar point for point. The dot walks a unit circle in
 * quarter turns from angle `a` (dir 1 = clockwise); the bar walks
 * P → mid → Q → mid → P, which strokes as a line with round ends. */
const f = (x: number, y: number) => `${+x.toFixed(2)} ${+y.toFixed(2)}`

function dot(cx: number, cy: number, a: number, dir: 1 | -1) {
  const k = 0.5523 * dir
  const at = (i: number) => {
    const t = ((a + 90 * dir * i) * Math.PI) / 180
    return { x: cx + Math.cos(t), y: cy + Math.sin(t), dx: -Math.sin(t) * k, dy: Math.cos(t) * k }
  }
  let d = `M${f(at(0).x, at(0).y)}`
  for (let i = 0; i < 4; i++) {
    const p = at(i)
    const q = at(i + 1)
    d += ` C${f(p.x + p.dx, p.y + p.dy)} ${f(q.x - q.dx, q.y - q.dy)} ${f(q.x, q.y)}`
  }
  return `${d} Z`
}

function bar(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const stops = [[x1, y1], [mx, my], [x2, y2], [mx, my], [x1, y1]] as const
  let d = `M${f(x1, y1)}`
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = stops[i]!
    const [bx, by] = stops[i + 1]!
    d += ` C${f(ax + (bx - ax) / 3, ay + (by - ay) / 3)} ${f(ax + ((bx - ax) * 2) / 3, ay + ((by - ay) * 2) / 3)} ${f(bx, by)}`
  }
  return `${d} Z`
}

/* The outer dots become the arms of the same × the menu icon closes into. */
const LEFT = [dot(5, 12, 180, 1), bar(6.34, 6.34, 17.66, 17.66)] as const
const RIGHT = [dot(19, 12, 0, -1), bar(17.66, 6.34, 6.34, 17.66)] as const

/**
 * More ↔ close, for overflow menus. The outer dots stretch into the arms of
 * an × as they swing to the center, and the middle dot gives way to the
 * crossing; closing draws them back into dots. `active` = open (close).
 */
export const MoreHorizontalIcon = createIcon({
  name: 'more-horizontal',
  category: 'navigation',
  keywords: ['ellipsis', 'more', 'overflow', 'menu', 'options', 'actions', 'close'],
  states: ['more', 'close'],
  variants: (k) => ({
    left: {
      rest: { d: LEFT[0], transition: k.spring('snappy') },
      active: { d: LEFT[1], transition: k.spring('snappy') },
    },
    right: {
      rest: { d: RIGHT[0], transition: k.spring('snappy') },
      active: { d: RIGHT[1], transition: k.spring('snappy') },
    },
    middle: {
      rest: { scale: 1, opacity: 1, transition: after(k, k.duration('fast'), 'fast', 'enter') },
      active: { scale: 0, opacity: 0, transition: k.tween('fast', 'exit') },
    },
  }),
  render: (v) => (
    <g fill="currentColor">
      <m.path d={LEFT[0]} variants={v.left} />
      <m.circle cx="12" cy="12" r="1" variants={v.middle} style={origin(12, 12)} />
      <m.path d={RIGHT[0]} variants={v.right} />
    </g>
  ),
})
