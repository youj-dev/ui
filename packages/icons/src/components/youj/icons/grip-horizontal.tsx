import { m } from 'motion/react'
import { createIcon, type IconVariants } from './icon-base'

/* grip's dot and bar, which share one command structure (four cubics and a
 * close) so a dot can stretch into a bar point for point. The dot walks a
 * unit circle in quarter turns from angle `a` (dir 1 = clockwise); the bar
 * walks P → mid → Q → mid → P, which strokes as a line with round ends. */
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

/* grip turned a quarter, on the same 6-unit square lattice: three columns,
 * two rows. Each column's x idle, and where its bar stands once gripped
 * (they draw in by one). */
const COLUMNS = [
  [6, 7],
  [12, 12],
  [18, 17],
] as const
/* Each dot stretches toward its partner; the halves meet at y 12 as one bar. */
const DOTS = COLUMNS.flatMap(([x, gx]) => [
  [dot(x, 9, 270, 1), bar(gx, 9, gx, 12)],
  [dot(x, 15, 90, -1), bar(gx, 15, gx, 12)],
])

/**
 * Horizontal drag handle, idle ↔ grabbed. When gripped, each column's dots
 * reach for each other and fuse into an upright bar while the columns draw
 * in tight; letting go springs them back into dots. `active` = grabbed.
 */
export const GripHorizontalIcon = createIcon({
  name: 'grip-horizontal',
  category: 'navigation',
  keywords: ['drag', 'handle', 'reorder', 'move', 'grab', 'sort', 'dots', 'horizontal', 'drag handle', 'resize'],
  states: ['idle', 'grabbed'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      DOTS.map(([idle, grabbed], i) => [
        `d${i}`,
        { rest: { d: idle, transition: k.spring('snappy') }, active: { d: grabbed, transition: k.spring('snappy') } },
      ]),
    ),
  render: (v) => (
    <g fill="currentColor">
      {DOTS.map(([idle], i) => (
        <m.path key={idle} d={idle} variants={v[`d${i}`]} />
      ))}
    </g>
  ),
})
