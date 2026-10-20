'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'pivot', title: 'Pivot', category: 'interface', technique: 'lines',
  tags: ['matrix', 'elimination', 'pivot', 'solver', 'linear algebra', 'training'],
  description: 'A raised pivot row eliminates the entries beneath its diagonal. Real row operations shorten coefficient bars to zero, an outside bracket carries each subtraction to its target, and the resulting triangular matrix restores its coefficients in reverse order.',
  order: 36,
  colors: [{ part: 'Row operation', mono: 'ink' }],
} satisfies LoaderMeta

function elimination(input: number[][]) {
  const states = [input.map(row => [...row])]
  const operations: { source: number; target: number }[] = []
  for (let source = 0; source < input.length - 1; source++) for (let target = source + 1; target < input.length; target++) {
    const before = states[states.length - 1]!
    const after = before.map(row => [...row])
    const factor = before[target]![source]! / before[source]![source]!
    for (let col = source; col < input.length; col++) after[target]![col] = before[target]![col]! - factor * before[source]![col]!
    operations.push({ source, target }); states.push(after)
  }
  return { states, operations }
}
const LEVELS = [
  elimination([[2, 1, 1], [4, 3, 3], [2, 2, 3]]),
  elimination([[2, 1, 1, 0], [4, 3, 3, 1], [2, 2, 3, 1], [2, 2, 4, 3]]),
]
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.4,
  draw(pen, t, view) {
    const small = view.size < 32
    const { states, operations } = LEVELS[small ? 0 : 1]!
    const n = states[0]!.length
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.2, pitch: -0.2, distance: 340, cx: view.w / 2 + 2, cy: 50 })
    const forward = t <= 0.58
    const at = forward ? operations.length * span(t, 0.05, 0.52) : operations.length * (1 - span(t, 0.66, 0.96))
    const index = Math.min(operations.length - 1, Math.floor(at))
    const progress = at >= operations.length ? 1 : clamp(view.ease.emphasized(at - index))
    const before = states[index]!, after = states[index + 1]!, op = operations[index]!
    const active = (forward ? t > 0.05 && t < 0.52 : t > 0.66 && t < 0.96) ? Math.sin(Math.PI * progress) : 0
    const cell = (i: number) => -24 + 48 * i / (n - 1)
    const rowY = (i: number) => -cell(i)

    // Matrix brackets remain through the seam. The row being used lifts
    // above the coefficient field; the target follows at half that depth.
    for (const sign of [-1, 1]) {
      xy.length = 0
      for (const [x, y] of [[sign * 30, 31], [sign * 34, 31], [sign * 34, -31], [sign * 30, -31]]) {
        project(x!, y!, 0, p); xy.push(p.x, p.y)
      }
      depth.path(xy, -20, { width: hair, alpha: 0.65 })
    }
    for (let row = 0; row < n; row++) {
      const z = row === op.source ? active * 9 : row === op.target ? active * 4 : 0
      for (let col = 0; col < n; col++) {
        const value = mix(before[row]![col]!, after[row]![col]!, progress)
        const x = cell(col), y = rowY(row)
        // A faint full span makes a genuine zero read as an empty slot.
        project(x - 5, y, z, p); project(x + 5, y, z, q)
        depth.line(p, q, hair * 0.6, 0.17)
        if (Math.abs(value) > 0.015) {
          project(x - 5, y, z + 0.1, p); project(x - 5 + Math.abs(value) * 2.5, y, z + 0.1, q)
          depth.line(p, q, hair * (small ? 1.65 : 1.9), clamp(0.65 + p.z / 90, 0.55, 0.94), row === op.source && col === op.source && active > 0.1 ? 'accent' : 'ink')
        } else {
          project(x, y - 1.8, z, p); project(x, y + 1.8, z, q)
          depth.line(p, q, hair * 0.65, 0.35)
        }
        if (!small && row === col) {
          project(x - 6, y - 3.5, z, p); project(x + 6, y - 3.5, z, q)
          depth.line(p, q, hair * 0.6, 0.3)
        }
      }
    }
    if (active > 0.004) {
      xy.length = 0
      for (const [x, y, z] of [[-30, rowY(op.source), active * 9], [-39, rowY(op.source), 6], [-39, rowY(op.target), 6], [-30, rowY(op.target), active * 4]]) {
        project(x!, y!, z!, p); xy.push(p.x, p.y)
      }
      depth.path(xy, 35, { width: hair, alpha: active * 0.85, tone: 'c1' })
      project(-30, rowY(op.target) - 3, active * 4, p); project(-30, rowY(op.target) + 3, active * 4, q)
      depth.line(p, q, hair * 1.3, active, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Actual coefficient elimination advances one pivot operation at a time.
 *
 * Color: the row operation, the bracket from the pivot row to the row it updates, is `c1` while it works; the matrix keeps the ink, the pivot and the updated row’s mark the accent. */
export function LoaderPivot(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
