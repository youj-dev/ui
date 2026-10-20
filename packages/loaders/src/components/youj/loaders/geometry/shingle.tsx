'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'shingle', title: 'Shingle', category: 'geometry', technique: 'planes',
  tags: ['roof', 'panels', 'overlap', 'architecture', 'assembly', 'construction'],
  description: 'Paired roof panels seat course by course in alternating banks. Each new row tucks beneath the previous one, thin return edges expose the underlap, and a final ridge seam closes across the assembled roof before the panels lift in reverse order.',
  order: 39,
  colors: [{ part: 'Courses', mono: 'ink' }],
} satisfies LoaderMeta

/* A timber roof frame on four posts: a truss at each gable (rafters, tie
 * beam, king post), a ridge beam, eave plates and a dashed plan on the
 * ground. Sheets are run out over it bay by bay, banks alternating: each
 * bay's place is marked first, then its sheet runs from the ridge down the
 * rafters and lands on the eave (`emphasized`), its standing seams and its
 * thin eave return travelling with it. Every bay sits a little lower than
 * the one before, so each tucks under the previous one's lap. When the last
 * lands, the ridge cap runs along the crest, its seam in the accent; then
 * the cap lifts and the sheets draw back up to the ridge in reverse order.
 * Nothing appears or leaves at once: a sheet is only ever as long as it has
 * run, and the view sways the whole time.
 *
 * Color: each new panel’s exposed edge seats in `c1` and settles
 * to the ink, so the courses climb as a front of color; the ridge cap stays
 * the accent. */

const E = 27 // eave: half the span
const Y0 = -5 // eave height
const Y1 = 10 // ridge height
const Z = 22 // half the roof's length
const GROUND = -21
const RUN = E + 2.5 // a sheet's length down the slope from the ridge, with its overhang
const TOP = 0.8 // where a sheet starts below the ridge
const T = 1.15 // sheet thickness
const LAP = 4.5
const M = (Y1 - Y0) / E
const NL = Math.hypot(M, 1)
const YAW = -0.66
const PITCH = -0.7

type V3 = [number, number, number]

/** A point on a bank (side ±1), `d` out from the ridge, `h` off the roof plane, at z. */
function onRoof(side: number, d: number, h: number, z: number, out: V3): V3 {
  out[0] = side * (d + (M * h) / NL)
  out[1] = Y1 - M * d + h / NL
  out[2] = z
  return out
}

const depth = new Depth()
const P = Array.from({ length: 8 }, () => point())
const a = point()
const b = point()
const v: V3 = [0, 0, 0]
const xy: number[] = []
const slab: V3[] = Array.from({ length: 8 }, () => [0, 0, 0])
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 6.5,
  still: 0.56,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 64
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const rows = small ? 2 : 3
    const yaw = YAW + 0.08 * Math.sin(TAU * t)
    // Below 32px there are no posts or plan, so the roof alone fills the frame.
    const zoom = small ? 1.2 : 1.16
    const lens = camera({ yaw, pitch: PITCH, distance: 420, cx: view.w / 2, cy: view.h * (small ? 0.46 : 0.5) })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y - (small ? 2 : -3)) * zoom, z * zoom, out)
    const turn = orient({ yaw, pitch: PITCH })
    const put = (p: V3, out: Projected) => project(p[0], p[1], p[2], out)
    const frame = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, width: number, alpha: number, key = -200) => {
      project(x0, y0, z0, a)
      project(x1, y1, z1, b)
      depth.path([a.x, a.y, b.x, b.y], key + (a.z + b.z) / 1000, { width, alpha, cap: 'round' })
    }

    // The frame: a truss at each gable, the ridge beam, the eave plates; posts and the dashed plan below.
    for (const z of [-Z, Z]) {
      const near = z > 0
      const w = near ? line : hair
      const al = near ? 0.85 : 0.4
      frame(-E, Y0, z, 0, Y1, z, w, al)
      frame(0, Y1, z, E, Y0, z, w, al)
      if (!small) {
        frame(-E, Y0, z, E, Y0, z, hair, near ? 0.6 : 0.3)
        frame(0, Y0, z, 0, Y1, z, hair, near ? 0.5 : 0.25)
      }
    }
    if (!small) frame(-E, Y0, 0, 0, Y1, 0, hair, 0.3)
    frame(0, Y1, -Z, 0, Y1, Z, hair, 0.55)
    for (const s of [-1, 1]) frame(s * E, Y0, -Z, s * E, Y0, Z, hair, 0.5)
    if (!small) {
      for (const [x, z] of [[-E, -Z], [E, -Z], [E, Z], [-E, Z]] as const) frame(x, Y0, z, x, GROUND, z, hair, z > 0 ? 0.55 : 0.3)
      const plan: [number, number][] = [[-E, -Z], [E, -Z], [E, Z], [-E, Z]]
      plan.forEach(([x0, z0], i) => {
        const [x1, z1] = plan[(i + 1) % 4]!
        project(x0, GROUND, z0, a)
        project(x1, GROUND, z1, b)
        depth.path([a.x, a.y, b.x, b.y], -300, { width: hair, alpha: 0.28, dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
      })
    }
    // Joints: the brand's square where the near truss's members meet.
    if (fine) {
      for (const [x, y] of [[0, Y1], [-E, Y0], [E, Y0]] as const) {
        project(x, y, Z, a)
        a.z = -190
        depth.square(a, 2.4 / view.px, 0.9)
      }
    }

    // The sheets, bay by bay along the ridge, banks alternating; each lower than the one before, tucking under its lap.
    const count = rows * 2
    const bay = (2 * Z) / rows
    for (let r = 0; r < rows; r++) {
      for (let side = 0; side < 2; side++) {
        const i = r * 2 + side
        const s = side ? 1 : -1
        const start = 0.05 + (i * 0.3) / (count - 1)
        const back = 0.66 + ((count - 1 - i) * 0.21) / (count - 1)
        const run = view.ease.emphasized(span(t, start, start + 0.14)) - view.ease.emphasized(span(t, back, back + 0.12))
        const z0 = -Z - 0.6 + r * bay
        const z1 = z0 + bay + (r < rows - 1 ? LAP : 1.2)
        const h = 0.5 + 0.55 * (rows - 1 - r)
        const d0 = TOP
        const d1 = TOP + RUN

        // Its place, marked on the rafters before it runs and after it leaves.
        if (!small) {
          const mark = 1 - run
          const corners: [number, number][] = [[d0, z0], [d1, z0], [d1, z1], [d0, z1]]
          corners.forEach(([d, z], j) => {
            const [dn, zn] = corners[(j + 1) % 4]!
            put(onRoof(s, d, 0.05, z, v), a)
            put(onRoof(s, dn, 0.05, zn, v), b)
            const len = Math.hypot(b.x - a.x, b.y - a.y)
            depth.path([a.x, a.y, b.x, b.y], -150, { width: hair, alpha: 0.3 * mark, dash: view.size < 80 ? undefined : fitDash(len, dash * 0.8) })
          })
        }
        if (run <= 0.001) continue

        // The sheet: a thin slab from the ridge to its running edge.
        const dEnd = mix(d0, d1, run)
        // Its strokes come in with it: a sheet that has only just started is a hairline, not an outline.
        const grow = clamp(run / 0.08)
        for (let j = 0; j < 8; j++) put(onRoof(s, j % 4 === 0 || j % 4 === 3 ? d0 : dEnd, j < 4 ? h + T : h, j % 4 < 2 ? z0 : z1, slab[j]!), P[j]!)
        const key = 10 - r * 3 + (i % 2) * 0.1
        const face = (ids: number[], n: V3, k: number) => {
          const [nx, ny, nz] = turn(n[0], n[1], n[2])
          if (nz <= 0.001) return
          xy.length = 0
          for (const j of ids) xy.push(P[j]!.x, P[j]!.y)
          depth.face(xy, key + k, lambert(nx, ny, nz))
          depth.path(xy, key + k + 0.01, { width: hair, alpha: 0.5 * grow, closed: true, join: 'miter' })
        }
        // The running edge (its eave return), the bay's end toward us, and the top.
        face([1, 2, 6, 5], [s * 1, -M, 0], 0)
        face([2, 3, 7, 6], [0, 0, 1], 0)
        face([0, 1, 2, 3], [(s * M) / NL, 1 / NL, 0], 0.02)
        // The top's edges: the running edge brightest, as it leads.
        depth.path([P[1]!.x, P[1]!.y, P[2]!.x, P[2]!.y], key + 0.04, { width: line, alpha: 0.9 * grow, cap: 'round', tone: blend('c1', 'ink', grow) })
        // Standing seams down the slope, as far as the sheet has run.
        if (!small) {
          const seams = fine ? 3 : 2
          for (let k = 1; k <= seams; k++) {
            const z = mix(z0, z1 - (r < rows - 1 ? LAP : 0), k / (seams + 1))
            put(onRoof(s, d0 + 0.6, h + T + 0.02, z, v), a)
            put(onRoof(s, dEnd, h + T + 0.02, z, v), b)
            depth.path([a.x, a.y, b.x, b.y], key + 0.03, { width: hair, alpha: 0.42 * grow })
          }
        }
      }
    }

    // The ridge cap: runs along the crest once every bay has landed, its seam in the accent, and lifts first.
    const cap = view.ease.emphasized(span(t, 0.46, 0.58)) - view.ease.exit(span(t, 0.6, 0.68))
    if (cap > 0.001) {
      const zEnd = mix(-Z - 0.6, Z + 1.2, cap)
      const hTop = 0.5 + 0.55 * (rows - 1) + T + 0.15
      const capW = 3.2
      // Both halves share one crest line over the ridge, so the cap closes over it with no gap.
      const crest = Y1 + (hTop + 0.7) / NL
      for (const s of [-1, 1]) {
        quad[0]![0] = 0
        quad[0]![1] = crest
        quad[0]![2] = -Z - 0.6
        onRoof(s, capW, hTop, -Z - 0.6, quad[1]!)
        onRoof(s, capW, hTop, zEnd, quad[2]!)
        quad[3]![0] = 0
        quad[3]![1] = crest
        quad[3]![2] = zEnd
        xy.length = 0
        for (const c of quad) {
          put(c, a)
          xy.push(a.x, a.y)
        }
        const [nx, ny, nz] = turn((s * M) / NL, 1 / NL, 0)
        if (nz > 0) {
          depth.face(xy, 40, lambert(nx, ny, nz))
          depth.path(xy, 40.01, { width: hair, alpha: 0.6, closed: true, join: 'miter' })
        }
      }
      project(0, crest, -Z - 0.6, a)
      project(0, crest, zEnd, b)
      depth.path([a.x, a.y, b.x, b.y], 41, { width: line * 1.15, alpha: clamp(cap / 0.06), tone: 'accent', cap: 'square' })
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Pitched panels tuck into overlapping rows before their ridge seam closes. */
export function LoaderShingle(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
