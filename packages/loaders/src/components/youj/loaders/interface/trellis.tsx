'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'trellis', title: 'Trellis', category: 'interface', technique: 'lines',
  tags: ['alignment', 'sequence', 'dynamic programming', 'wavefront', 'matrix', 'processing'],
  description: 'A sequence alignment fills its cost table along dependency diagonals. The working diagonal lifts from its sockets, each cell retains its computed cost, and a raised traceback walks the optimal edits back to the origin before the table unwrites.',
  order: 24,
  colors: [{ part: 'Traceback', mono: 'ink' }],
} satisfies LoaderMeta

type Cell = [number, number]
function alignment(a: number[], b: number[]) {
  const n = a.length
  const costs = Array.from({ length: n + 1 }, () => Array<number>(n + 1).fill(0))
  const parent = Array.from({ length: n + 1 }, () => Array<Cell>(n + 1))
  for (let i = 1; i <= n; i++) {
    costs[i]![0] = i; costs[0]![i] = i
    parent[i]![0] = [i - 1, 0]; parent[0]![i] = [0, i - 1]
  }
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) {
    const diagonal = costs[r - 1]![c - 1]! + (a[c - 1] === b[r - 1] ? 0 : 1)
    const up = costs[r - 1]![c]! + 1, left = costs[r]![c - 1]! + 1
    const cost = Math.min(diagonal, up, left)
    costs[r]![c] = cost
    parent[r]![c] = cost === diagonal ? [r - 1, c - 1] : cost === up ? [r - 1, c] : [r, c - 1]
  }
  const path: Cell[] = [[n, n]]
  while (path[path.length - 1]!.some((v) => v !== 0)) {
    const [r, c] = path[path.length - 1]!
    path.push(parent[r]![c]!)
  }
  return { a, b, n, costs, path }
}
const LEVELS = [
  alignment([1, 3, 2, 4], [1, 2, 4, 3]),
  alignment([1, 3, 2, 1, 4, 2], [1, 2, 1, 4, 3, 2]),
]
const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 6, still: 0.69,
  draw(pen, t, view) {
    const small = view.size < 32
    const { a, b, n, costs, path } = LEVELS[small ? 0 : 1]!
    const project = camera({ yaw: -0.3, pitch: -0.36, distance: 300, cx: view.w / 2 + 1, cy: 52 })
    const hair = (small ? 1.05 : 1) / view.px
    const step = 58 / n
    const x = (c: number) => -29 + c * step
    const y = (r: number) => 29 - r * step
    const cell = step * 0.72
    const wave = span(t, 0.04, 0.6) * (2 * n + 1)
    const unwrite = span(t, 0.82, 0.99) * (2 * n + 2)
    const clear = 1 - view.ease.exit(span(t, 0.81, 0.92))

    // The boundary costs are the empty-prefix edit counts. Interior cells
    // can seat only after the diagonal containing all their parents.
    for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) {
      const diagonal = r + c
      const boundary = r === 0 || c === 0
      const ready = boundary ? 1 : view.ease.standard(clamp(wave - diagonal)) * (1 - view.ease.exit(clamp(unwrite - (2 * n - diagonal))))
      const lift = boundary ? 0 : 4 * Math.sin(Math.PI * clamp(wave - diagonal)) * clear
      window(depth, project, x(c), y(r), 0, cell, cell, hair * 0.65, boundary ? 0.24 : 0.14, -1)
      if (ready <= 0.004) continue
      const order = window(depth, project, x(c), y(r), 0.6 + lift, cell, cell, hair * 0.8, boundary ? 0.42 : 0.78 * ready, boundary ? 0.02 : 0.07 * ready)
      const cost = costs[r]![c]!
      // Cost is encoded as a measured run, including a short zero witness.
      project(x(c) - cell * 0.32, y(r), 0.7 + lift, p)
      project(x(c) - cell * 0.32 + cell * (0.08 + 0.55 * cost / n), y(r), 0.7 + lift, q)
      depth.path([p.x, p.y, q.x, q.y], order + 0.04, { width: hair * (small ? 1.15 : 1.35), alpha: (boundary ? 0.4 : 0.88) * ready })
      if (!small && lift > 0.2) rule(depth, project, x(c) - cell / 2, y(r) + cell / 2, 0, x(c) - cell / 2, y(r) + cell / 2, lift, hair * 0.6, 0.28 * clear)
    }

    // The two input sequences keep their identities while the table fills.
    // Their small notches are data, not letterforms or numerals.
    for (let i = 0; i < n; i++) {
      const c = i + 1
      rule(depth, project, x(c) - cell * 0.3, 39, 0, x(c) + cell * (a[i]! / 4 - 0.3), 39, 0, hair * 1.35, 0.72)
      rule(depth, project, -39, y(c) - cell * 0.3, 0, -39, y(c) + cell * (b[i]! / 4 - 0.3), 0, hair * 1.35, 0.72)
    }
    if (!small) {
      rule(depth, project, -34, 35, 0, 34, 35, 0, hair * 0.65, 0.22)
      rule(depth, project, -35, -34, 0, -35, 34, 0, hair * 0.65, 0.22)
    }

    // A travelling diagonal bracket marks the dependency frontier. Its
    // ends follow the rectangular table, rather than crossing the frame.
    const front = clamp(wave, 0, 2 * n)
    const scan = view.ease.standard(span(t, 0.035, 0.1)) * (1 - view.ease.exit(span(t, 0.58, 0.64)))
    if (scan > 0.004) {
      const c0 = Math.max(0, front - n), c1 = Math.min(n, front)
      rule(depth, project, x(c0), y(front - c0), 7, x(c1), y(front - c1), 7, hair * 1.1, 0.62 * scan, 'accent')
    }

    // Actual optimal parents drive the traceback. Diagonal matches and
    // horizontal/vertical edits remain visible as different path steps.
    const trace = span(t, 0.63, 0.8) * (path.length - 1)
    for (let i = 0; i < path.length - 1; i++) {
      const u = view.ease.emphasized(clamp(trace - i))
      if (u <= 0 || clear <= 0.004) continue
      const [r0, c0] = path[i]!, [r1, c1] = path[i + 1]!
      project(x(c0), y(r0), 5, p)
      project(mix(x(c0), x(c1), u), mix(y(r0), y(r1), u), 5, q)
      const order = (p.z + q.z) / 2 + 0.05
      depth.path([p.x, p.y, q.x, q.y], order, { width: hair * 1.6, alpha: clear, cap: 'round', tone: 'c1' })
      if (u < 1) {
        depth.path([mix(p.x, q.x, 0.6), mix(p.y, q.y, 0.6), q.x, q.y], order + 0.01, { width: hair * 1.8, alpha: clear, tone: 'accent', cap: 'round' })
        window(depth, project, mix(x(c0), x(c1), u), mix(y(r0), y(r1), u), 5, cell * 0.7, cell * 0.7, hair, clear, -1)
      }
      if (!small) rule(depth, project, x(c0), y(r0), 0.7, x(c0), y(r0), 5, hair * 0.6, 0.35 * clear)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Dependency diagonals fill a sequence alignment and reveal its optimal traceback.
 *
 * Color: the traceback, the optimal path back through the table, is `c1`; the table and the sequences keep the ink, the frontier and the path’s head the accent. */
export function LoaderTrellis(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
