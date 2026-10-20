'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, span, Depth, point, projectPath, type Projected, type Scene } from '../field'
import { TITTLE, WORDMARK, flatten } from '../glyphs'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'plumb',
  title: 'Plumb',
  category: 'glyph',
  technique: 'paths',
  tags: ['j', 'tittle', 'pendulum', 'wireframe', 'letter', 'brand', 'plumb-line'],
  description: 'The youj j hangs as a hollow wireform from its fixed accent tittle, swings across a drafting plumb-line, and lands upright before the next pull. Narrow lit walls reveal the letter’s depth.',
  order: 7,
  colors: [{ part: 'Plumb line', mono: 'ink' }],
} satisfies LoaderMeta

/* The j's real outline as a hollow wireform: a drafting outline in front,
 * a fainter one behind, and narrow lit walls between them. It hangs from
 * its tittle, made a bearing: a small solid block in the accent with a pin
 * through it, and a wire bail from the top of the stem hooked over the pin,
 * so the letter visibly turns on something. Behind it, on the plumb-line's
 * plane, a dashed plumb-line and a scale: an arc with a tick at plumb and
 * at either reach. The j is pulled aside, swings across (`emphasized`),
 * comes back and lands upright on the plumb-line, rests a moment while the
 * view sways, and is pulled again. Every move starts and ends at rest, the
 * way a pendulum turns, and the view never stops.
 *
 * Color: the drafting plumb-line, its arc and its ticks are `c1`; the wireform j stays the ink and the tittle the accent. */

const SCALE = 3.3
const PIVOT = 33
const THICKNESS = 3.4
const TX = TITTLE.x + TITTLE.size / 2
const TY = TITTLE.y + TITTLE.size / 2
/** The stem's top, below the pivot, in world units: where the bail is fixed. */
const STEM_TOP = -(8.57 - TY) * SCALE
const HALF_T = (TITTLE.size * SCALE) / 2
const BLOCK = 2.4
const REACH = 0.34
const ARC = 34

function outline(steps: number) {
  const pts = flatten(WORDMARK[3]!.outlines[0]!, steps).map(([x, y]): [number, number] => [(x - TX) * SCALE, -(y - TY) * SCALE])
  pts.pop() // flatten repeats the closing point.
  // World x/y is counter-clockwise, so each wall's outward normal is
  // (dy, -dx, 0). This is the original wordmark, never a substituted font.
  return pts.reverse()
}

const DETAIL = [
  { below: 32, pts: outline(2) },
  { below: 80, pts: outline(5) },
  { below: Infinity, pts: outline(10) },
].map((d) => ({ ...d, front: d.pts.map((): [number, number, number] => [0, 0, THICKNESS]), back: d.pts.map((): [number, number, number] => [0, 0, -THICKNESS]) }))
const BLOCK_FACES: { c: number[]; n: [number, number, number] }[] = [
  { c: [4, 5, 7, 6], n: [0, 0, 1] },
  { c: [1, 3, 7, 5], n: [1, 0, 0] },
  { c: [0, 4, 6, 2], n: [-1, 0, 0] },
  { c: [2, 6, 7, 3], n: [0, 1, 0] },
  { c: [0, 1, 5, 4], n: [0, -1, 0] },
]
const depth = new Depth()
const p = point()
const q = point()
const corners = Array.from({ length: 8 }, () => point())
const xy: number[] = []
const wall: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 5,
  still: 0.2,
  draw(pen, t, view) {
    const { pts, front, back } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const fine = view.size >= 40
    const pose = { yaw: 0.48 + 0.07 * Math.sin(TAU * t), pitch: -0.18 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2 + 7, cy: view.h / 2 + 1 })
    const turn = orient(pose)
    const hair = (small ? 0.85 : 1) / view.px
    // Pulled aside, it swings across, comes back to land upright on the plumb-line, rests, and is pulled again.
    const angle =
      -0.32 +
      0.66 * view.ease.emphasized(span(t, 0.02, 0.3)) -
      0.34 * view.ease.emphasized(span(t, 0.3, 0.56)) -
      0.32 * view.ease.emphasized(span(t, 0.64, 0.98))
    const cs = Math.cos(angle)
    const sn = Math.sin(angle)
    /** A point on the letter (relative to the pivot) where the swing has taken it. */
    const swung = (x: number, y: number, z: number, out: Projected) => project(x * cs - y * sn, PIVOT + x * sn + y * cs, z, out)

    // The plumb-line and its scale, on a plane behind the letter.
    if (fine) {
      project(0, PIVOT + 6, -9, p)
      project(0, PIVOT - 72, -9, q)
      const len = Math.hypot(q.x - p.x, q.y - p.y)
      const n = Math.max(3, Math.round(len / (5.5 * hair)))
      depth.path([p.x, p.y, q.x, q.y], -60, { width: hair, alpha: 0.24, dash: [len / (2 * n - 1), len / (2 * n - 1)], tone: 'c1' })
      xy.length = 0
      for (let i = 0; i <= 24; i++) {
        const a = -0.42 + (0.84 * i) / 24
        project(ARC * Math.sin(a), PIVOT - ARC * Math.cos(a), -9, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -60, { width: hair, alpha: 0.3, join: 'round', tone: 'c1' })
      for (const [a, long] of [[-0.32, 0], [0, 1], [REACH, 0]] as const) {
        const r0 = ARC - (long ? 3 : 2)
        const r1 = ARC + (long ? 3 : 2)
        project(r0 * Math.sin(a), PIVOT - r0 * Math.cos(a), -9, p)
        project(r1 * Math.sin(a), PIVOT - r1 * Math.cos(a), -9, q)
        depth.line(p, q, hair, long ? 0.5 : 0.34, 'c1')
      }
    }

    pts.forEach(([x, y], i) => {
      front[i]![0] = back[i]![0] = x * cs - y * sn
      front[i]![1] = back[i]![1] = PIVOT + x * sn + y * cs
    })
    if (!small) {
      const rear = projectPath(back, project, xy)
      depth.path(rear.xy, rear.z, { width: hair * 0.75, alpha: 0.3, closed: true })
    }

    // Only the thin walls are solid. The front remains a drafting outline,
    // its paper backing hiding the far edges within the narrow stem.
    pts.forEach(([ax, ay], i) => {
      const next = (i + 1) % pts.length
      const [bx, by] = pts[next]!
      const nx = by - ay
      const ny = ax - bx
      const normal = turn(nx * cs - ny * sn, nx * sn + ny * cs, 0)
      if (normal[2] <= 0.01) return
      wall[0] = front[i]!
      wall[1] = front[next]!
      wall[2] = back[next]!
      wall[3] = back[i]!
      const f = projectPath(wall, project, xy)
      depth.face(f.xy, f.z, lambert(...normal))
    })
    const face = projectPath(front, project, xy)
    depth.poly(face.xy, face.z, 0.035, 'ink', true)
    depth.path(face.xy, face.z + 0.01, { width: hair, alpha: 0.94, closed: true, join: 'round' })

    // The bail: a wire from the top of the stem, its legs up under the bearing and over the pin.
    const legs = fine ? [-1.5, 1.5] : [0]
    for (const x of legs) {
      swung(x, STEM_TOP, 0, p)
      swung(x, -1.6, 0, q)
      depth.line(p, q, hair * (fine ? 1 : 1.2), 0.8)
    }
    if (fine) {
      xy.length = 0
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI - (Math.PI * i) / 8
        swung(1.5 * Math.cos(a), -1.6 + 1.5 * Math.sin(a), 0, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, p.z - 0.5, { width: hair, alpha: 0.8, join: 'round' })
    }

    // The bearing: the tittle as a small solid block in the accent, held still, the pin through its middle.
    for (let i = 0; i < 8; i++) {
      const x = i & 1 ? HALF_T : -HALF_T
      const y = i & 2 ? HALF_T : -HALF_T
      const z = i & 4 ? BLOCK : -BLOCK
      project(x, PIVOT + y, z, corners[i]!)
    }
    for (const { c, n } of BLOCK_FACES) {
      const v = turn(...n)
      if (v[2] <= 0.01) continue
      xy.length = 0
      let z = 0
      for (const i of c) {
        xy.push(corners[i]!.x, corners[i]!.y)
        z += corners[i]!.z / 4
      }
      // Its face is the brand's square, full accent; its sides are lit, so it reads as a block.
      if (n[2] === 1) depth.poly(xy, 40 + z / 100, 1, 'accent')
      else depth.face(xy, 40 + z / 100, lambert(...v), 'accent')
    }
    project(0, PIVOT, BLOCK + 0.1, p)
    p.z = 41
    depth.dot(p, clamp(1.1, 0.9 / view.px, 2.4), 0.9)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The wireframe youj j swings from its square tittle and lands on a plumb-line. */
export function LoaderPlumb(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
