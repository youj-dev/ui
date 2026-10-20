'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'traverse', title: 'Traverse', category: 'interface', technique: 'lines',
  tags: ['volume', 'voxel', 'ray', 'rendering', 'sampling', 'integration'],
  description: 'A sampling ray walks the exact cell boundaries of a volume. Each crossed voxel reveals its occupied interval, the working cell opens in lit faces, and a transmittance witness accumulates the integrated density before the traversal retraces.',
  order: 44,
  colors: [{ part: 'Beam', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const START: V3 = [-24, -15, 17], END: V3 = [24, 17, -16]
const FACES = [
  { corners: [2, 3, 7, 6], normal: [0, 1, 0] as V3 },
  { corners: [4, 5, 7, 6], normal: [0, 0, 1] as V3 },
  { corners: [1, 3, 7, 5], normal: [1, 0, 0] as V3 },
  { corners: [0, 2, 6, 4], normal: [-1, 0, 0] as V3 },
]
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]
function plan(n: number) {
  const cuts = [0, 1]
  for (let axis = 0; axis < 3; axis++) for (let j = 1; j < n; j++) {
    const u = (-24 + j * 48 / n - START[axis]!) / (END[axis]! - START[axis]!)
    if (u > 0 && u < 1) cuts.push(u)
  }
  cuts.sort((a, b) => a - b)
  const unique = cuts.filter((v, i) => i === 0 || v - cuts[i - 1]! > 1e-6)
  let integral = 0
  const length = Math.hypot(...END.map((v, i) => v - START[i]!))
  const cells = unique.slice(0, -1).map((from, i) => {
    const to = unique[i + 1]!, u = (from + to) / 2
    const c = START.map((v, axis) => -24 + (Math.floor((mix(v, END[axis]!, u) + 24) / (48 / n)) + 0.5) * 48 / n) as V3
    const density = 0.13 + 0.65 * Math.exp(-(c[0] ** 2 + c[1] ** 2 + c[2] ** 2) / 500)
    const before = integral
    integral += (to - from) * length * density * 0.045
    return { from, to, c, density, before, after: integral }
  })
  return { n, cells, total: integral }
}
const PLANS = [plan(3), plan(4)]
const P = Array.from({ length: 8 }, () => point()), p = point(), q = point()
const xy: number[] = [], depth = new Depth()

export const scene: Scene = {
  beats: 5.75, still: 0.43,
  draw(pen, t, view) {
    const small = view.size < 32, hair = (small ? 1.05 : 1) / view.px
    const { n, cells, total } = PLANS[small ? 0 : 1]!
    const pose = { yaw: -0.58, pitch: -0.45 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 46 })
    const turn = orient(pose)
    const u = view.ease.standard(span(t, 0.06, 0.65)) * (1 - view.ease.standard(span(t, 0.73, 0.96)))
    const show = view.ease.enter(span(t, 0.015, 0.08)) * (1 - view.ease.exit(span(t, 0.93, 0.985)))
    const corners = (c: V3, half: number) => {
      for (let j = 0; j < 8; j++) project(c[0] + (j & 1 ? half : -half), c[1] + (j & 2 ? half : -half), c[2] + (j & 4 ? half : -half), P[j]!)
    }
    corners([0, 0, 0], 24)
    for (const [a, b] of EDGES) depth.line(P[a!]!, P[b!]!, hair * 0.85, 0.25 + 0.28 * clamp((P[a!]!.z + P[b!]!.z + 65) / 130))
    if (!small) for (let j = 1; j < n; j++) {
      const v = -24 + j * 48 / n
      project(v, -24, -24, p); project(v, -24, 24, q); depth.line(p, q, hair * 0.55, 0.16)
      project(-24, -24, v, p); project(24, -24, v, q); depth.line(p, q, hair * 0.55, 0.16)
    }
    project(...START, p); project(...END, q)
    depth.line(p, q, hair * 0.75, 0.2)
    let integral = 0
    for (const cell of cells) {
      const progress = clamp((u - cell.from) / (cell.to - cell.from))
      if (progress <= 0.002) continue
      const working = u < cell.to && show > 0.004
      const half = 24 / n - 0.55
      corners(cell.c, half)
      if (working) for (const face of FACES) {
        const normal = turn(...face.normal)
        if (normal[2] <= 0) continue
        xy.length = 0
        let z = 0
        for (const j of face.corners) { xy.push(P[j]!.x, P[j]!.y); z += P[j]!.z / 4 }
        // An open sampling cell: two faint walls disclose the traversed
        // volume without hiding the beam behind a fully opaque cube.
        if (face.normal[1] === 0) depth.poly(xy, z, 0.035 + 0.07 * lambert(...normal), 'ink', true)
      }
      for (const [a, b] of EDGES) {
        const A = P[a!]!, B = P[b!]!
        depth.line(A, B, hair * (working ? 1 : 0.6), (working ? 0.78 : 0.32) * show * clamp(0.8 + (A.z + B.z) / 180, 0.45, 1))
      }
      const to = mix(cell.from, cell.to, progress)
      project(mix(START[0], END[0], cell.from), mix(START[1], END[1], cell.from), mix(START[2], END[2], cell.from), p)
      project(mix(START[0], END[0], to), mix(START[1], END[1], to), mix(START[2], END[2], to), q)
      depth.path([p.x, p.y, q.x, q.y], 90, { width: hair * (1.15 + cell.density), alpha: 0.88 * show, tone: working ? 'accent' : 'c1', cap: 'butt' })
      integral = mix(cell.before, cell.after, progress)
    }
    // The witness is a real Beer-Lambert accumulation over the intervals,
    // not a second clock with unrelated progress.
    const amount = (1 - Math.exp(-integral)) / (1 - Math.exp(-total))
    project(-24, -34, 24, p); project(24, -34, 24, q)
    depth.line(p, q, hair, 0.27)
    const x = mix(p.x, q.x, amount), y = mix(p.y, q.y, amount)
    if (amount > 0.001) depth.path([p.x, p.y, x, y], 100, { width: hair * 1.8, alpha: 0.85 * show, tone: 'c1' })
    const tick = clamp(2.1 * hair, 1.4, 6)
    depth.path([x, y - tick, x, y + tick], 101, { width: hair, alpha: 0.95 * show, tone: 'accent' })
    if (!small) for (let j = 0; j <= 4; j++) {
      project(-24 + j * 12, -34, 24, p); project(-24 + j * 12, -36, 24, q); depth.line(p, q, hair * 0.65, 0.32)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A cell-exact sampling ray integrates density across a wireframe volume.
 *
 * Color: the beam behind the cell it’s sampling, and the accumulation it adds to the gauge, are `c1`; the volume keeps the ink, the working stretch and the gauge’s tick the accent. */
export function LoaderTraverse(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
