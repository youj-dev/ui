'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { part, pin, rod, type Turn, type V3 } from './machine'

export const meta = {
  id: 'fulcrum', title: 'Fulcrum', category: 'mechanics', technique: 'lines',
  tags: ['balance', 'scale', 'counterweight', 'pans', 'gravity', 'equilibrium'],
  description: 'A sliding rider glides along a graduated balance beam, crossing the pivot and back. The beam answers its changing moment a beat behind, the suspended pans swing level beneath their hangers, and the pointer sweeps its scale through equilibrium.',
  order: 14,
  colors: [{ part: 'Pans', mono: 'ink' }],
} satisfies LoaderMeta

/* A beam balance on a knife edge. The rider glides the beam's graduations
 * from end to end on a sine, never parking; the beam follows its moment a
 * little late, as a damped balance does, so its tilt peaks just after the
 * rider turns; and each pan, hung from a hook on three cords, keeps level
 * by gravity while its hanger sways a touch behind the beam. The pointer,
 * fixed to the beam, sweeps the arc scale on the column and passes zero as
 * the rider crosses the pivot.
 *
 * Color: the rim of the pan on the rider’s side warms toward `c1` as the rider moves over it, and cools as it crosses back; the rider’s index stays the accent. */

const PIVOT_Y = 15
const HALF = 30
const DROP = 24
const depth = new Depth()
const xy: number[] = []
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const column: V3[] = [[-7, -31, 0], [7, -31, 0], [2.6, PIVOT_Y - 2.5, 0], [-2.6, PIVOT_Y - 2.5, 0]]
const lip: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const p = point()
const q = point()
/** The bowl: rings of the dish from rim to foot, as (radius, depth below the rim). */
const BOWL = [[10, 0], [8.4, 2.3], [5.2, 3.6], [0, 4]] as const

/** A lit box with axes u (along), v (up), w (toward the viewer), from its centre and half sizes. */
function box(project: Project, turn: Turn, c: V3, u: V3, v: V3, h: V3, hair: number, edge: number, bias = 0) {
  const w: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const axes = [u, v, w]
  for (let k = 0; k < 3; k++) {
    for (const sign of [-1, 1]) {
      const n = axes[k]!
      const view = turn(n[0] * sign, n[1] * sign, n[2] * sign)
      if (view[2] <= 0.02) continue
      const a = axes[(k + 1) % 3]!
      const b = axes[(k + 2) % 3]!
      const ha = h[(k + 1) % 3]!
      const hb = h[(k + 2) % 3]!
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
      if (sign < 0) corners.reverse()
      corners.forEach(([sa, sb], i) => {
        for (let j = 0; j < 3; j++) quad[i]![j] = c[j]! + n[j]! * h[k]! * sign + a[j]! * ha * sa! + b[j]! * hb * sb!
      })
      const f = projectPath(quad, project, xy)
      depth.face(f.xy, f.z + bias, lambert(...view))
      depth.path(f.xy, f.z + bias + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
    }
  }
}

export const scene: Scene = {
  beats: 5.75, still: 0.66,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.1 : 1) / view.px
    const pose = { yaw: -0.26 + (small ? 0 : 0.05) * Math.sin(TAU * t), pitch: -0.2 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 52 })
    const turn = orient(pose)
    // The rider glides end to end; the beam answers its moment a little late; the hangers sway later still.
    const rider = -Math.sin(TAU * t)
    const angle = 0.2 * Math.sin(TAU * (t - 0.06))
    const sway = 0.07 * Math.cos(TAU * (t - 0.1))
    const cs = Math.cos(angle)
    const sn = Math.sin(angle)
    const onBeam = (x: number, y: number, z: number, out: V3 = [0, 0, 0]): V3 => {
      out[0] = x * cs - y * sn
      out[1] = PIVOT_Y + x * sn + y * cs
      out[2] = z
      return out
    }
    const along: V3 = [cs, sn, 0]
    const up: V3 = [-sn, cs, 0]

    // The stand: a base, the tapered column, and the arc scale the pointer reads.
    box(project, turn, [0, -33, 0], [1, 0, 0], [0, 1, 0], [15, 2, 7], hair * 0.85, 0.6)
    const layer = part(depth, project, turn, column, [], 4.5, hair, large ? 0.7 : 0)
    if (!small) {
      for (let i = -3; i <= 3; i++) {
        const a = -Math.PI / 2 + i * 0.075
        const r0 = i === 0 ? 11.2 : 12.2
        const pa = projectPath([[r0 * Math.cos(a), PIVOT_Y + r0 * Math.sin(a), 0.1], [13.6 * Math.cos(a), PIVOT_Y + 13.6 * Math.sin(a), 0.1]], project, xy)
        depth.path(pa.xy, layer + 0.02, { width: hair * (i === 0 ? 1 : 0.7), alpha: i === 0 ? 0.85 : 0.5 })
      }
    }
    // The knife edge the beam rocks on.
    for (const [a, b, c] of [[[-2.4, PIVOT_Y - 2.5, 0], [2.4, PIVOT_Y - 2.5, 0], [0, PIVOT_Y, 0]]] as V3[][]) {
      for (let k = 0; k < 4; k++) {
        const v = k === 0 ? a! : k === 1 ? b! : c!
        lip[k]![0] = v[0]
        lip[k]![1] = v[1]
        lip[k]![2] = 0.2
      }
      const f = projectPath(lip.slice(0, 3), project, xy)
      depth.face(f.xy, layer + 0.01, lambert(...turn(0.2, 0.3, 1)))
    }

    // The beam, graduated along its top, with the pointer hanging from the pivot.
    box(project, turn, onBeam(0, 0, 2.5), along, up, [HALF, 1.4, 2], hair * 0.9, 0.85)
    if (large) {
      for (let i = -4; i <= 4; i++) {
        if (!i) continue
        const a = onBeam(i * 5, 1.4, 4.55)
        const b = onBeam(i * 5, i % 2 ? 0.6 : 0, 4.55)
        rod(depth, project, a, b, hair * 0.65, 0.55, 'ink', undefined, { cap: 'butt' })
      }
    }
    rod(depth, project, onBeam(0, 0, 0.3), onBeam(0, -12.6, 0.3), hair * 0.9, 0.9)
    pin(depth, project, turn, ...onBeam(0, 0, 4.6), small ? 2 : 1.7, hair * 0.85)

    // Each pan: a hook on the beam's end, three cords, and a lit dish kept level by gravity.
    for (const side of [-1, 1]) {
      const end = onBeam(side * (HALF - 2), -1.4, 2.5)
      const swing = sway * (side < 0 ? 1 : 0.85)
      // The pan on the rider's side warms toward its color, the other the ink: where the weight is.
      const loaded = blend('ink', 'c1', 0.8 * clamp(side * rider))
      const cx = end[0] + DROP * Math.sin(swing)
      const cy = end[1] - DROP * Math.cos(swing)
      // The dish, ring by ring, inside and outside, each facet lit by its own normal.
      for (let r = 0; r < BOWL.length - 1; r++) {
        const [r0, d0] = BOWL[r]!
        const [r1, d1] = BOWL[r + 1]!
        const segments = small ? 10 : 16
        for (let i = 0; i < segments; i++) {
          const a = (TAU * i) / segments
          const b = (TAU * (i + 1)) / segments
          const set = (k: number, rr: number, dd: number, aa: number) => {
            quad[k]![0] = cx + rr * Math.cos(aa)
            quad[k]![1] = cy - dd
            quad[k]![2] = 2.5 + rr * Math.sin(aa)
          }
          set(0, r0, d0, a)
          set(1, r0, d0, b)
          set(2, r1, d1, b)
          set(3, r1, d1, a)
          const m = (a + b) / 2
          const nr = d1 - d0
          const ny = -(r0 - r1)
          for (const sign of [1, -1]) {
            const n = turn(sign * nr * Math.cos(m), sign * ny, sign * nr * Math.sin(m))
            if (n[2] <= 0) continue
            const f = projectPath(quad, project, xy)
            depth.face(f.xy, f.z, lambert(...n) * (sign > 0 ? 1 : 0.86))
          }
        }
      }
      // The rim, split so its far half sorts behind the dish.
      for (let i = 0; i < 16; i++) {
        const a = (TAU * i) / 16
        const b = (TAU * (i + 1)) / 16
        project(cx + 10 * Math.cos(a), cy, 2.5 + 10 * Math.sin(a), p)
        project(cx + 10 * Math.cos(b), cy, 2.5 + 10 * Math.sin(b), q)
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.05, { width: hair * 1.05, alpha: clamp(0.62 + (p.z + q.z) / 60, 0.4, 0.95), tone: loaded })
      }
      for (const [dx, dz] of [[-8.6, -5], [8.6, -5], [0, 9.9]]) {
        rod(depth, project, end, [cx + dx!, cy, 2.5 + dz!], hair * 0.75, dz! > 0 ? 0.8 : 0.42)
      }
      rod(depth, project, onBeam(side * (HALF - 2), -1.4, 2.5), onBeam(side * (HALF - 2), -2.8, 2.5), hair * 1.3, 0.85)
    }

    // The rider: a lit block astride the beam, its accent index on top.
    const x = rider * 21
    box(project, turn, onBeam(x, 2.6, 2.5), along, up, [2.8, 1.2, 2.6], hair * 0.9, 0.9, 0.5)
    rod(depth, project, onBeam(x - 2.2, 3.85, 2.5), onBeam(x + 2.2, 3.85, 2.5), hair * 1.6, 1, 'accent', 50, { cap: 'butt' })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A rider changes the moment of a balance whose suspended dishes stay level. */
export function LoaderFulcrum(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
