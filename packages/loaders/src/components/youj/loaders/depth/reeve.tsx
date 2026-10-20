'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'reeve',
  title: 'Reeve',
  category: 'depth',
  technique: 'lines',
  tags: ['shuttle', 'gate', 'thread', 'square', 'circuit', 'isometric', 'occlusion'],
  description: 'A square shuttle threads two upright gates on an isometric circuit, its short ink wake passing through the openings and behind the lit jambs. It lands briefly at each square corner.',
  order: 8,
  colors: [{ part: 'Wake', mono: 'ink' }],
} satisfies LoaderMeta

/* A square track laid as a model railway is drawn: two rails on sleepers,
 * square at the corners, a registration cross under each corner. Two gates
 * stand across it, each two lit posts under a lintel, and the track runs
 * through their openings. The shuttle, a small cube in the accent, runs
 * the circuit a side at a time, landing on each corner (`standard`: off
 * from rest, onto it at rest) and setting off again; its ink wake is where
 * it was a moment ago, so it stretches as the shuttle runs and draws in
 * behind it as it lands. Rails, wake and shuttle are cut in short pieces
 * sorted by depth, so the near posts hide them and the far ones are hidden
 * by them. The view sways a little all the while.
 *
 * Color: the wake leaves the shuttle in `c1` and settles to the ink along its length. */

const X = 30
const Z = 20
const ROUTE = [
  [-X, -Z],
  [X, -Z],
  [X, Z],
  [-X, Z],
] as const
const GAUGE = 1.7
const GATES = [
  { x: 13, z: -Z },
  { x: -13, z: Z },
] as const

/** One circuit in world x and z, a quarter a side, wrapped. */
function at(u: number, out: [number, number]): [number, number] {
  const phase = (((u % 1) + 1) % 1) * 4
  const i = Math.floor(phase)
  const a = ROUTE[i]!
  const b = ROUTE[(i + 1) % 4]!
  out[0] = mix(a[0], b[0], phase - i)
  out[1] = mix(a[1], b[1], phase - i)
  return out
}

/** A box's faces: corner indices (bit 1 +x, bit 2 +y, bit 4 +z) and outward normals. */
const BOX: [number[], [number, number, number]][] = [
  [[0, 1, 3, 2], [0, 0, -1]],
  [[4, 6, 7, 5], [0, 0, 1]],
  [[0, 4, 5, 1], [0, -1, 0]],
  [[2, 3, 7, 6], [0, 1, 0]],
  [[0, 2, 6, 4], [-1, 0, 0]],
  [[1, 5, 7, 3], [1, 0, 0]],
]

const DETAIL = [
  { below: 32, pieces: 6, wake: 6 },
  { below: 80, pieces: 10, wake: 10 },
  { below: Infinity, pieces: 16, wake: 16 },
]

const depth = new Depth()
const p = point()
const q = point()
const C = Array.from({ length: 8 }, () => point())
const here: [number, number] = [0, 0]
const there: [number, number] = [0, 0]
const xy: number[] = []

export const scene: Scene = {
  beats: 4.5,
  still: 0.38,
  draw(pen, t, view) {
    t %= 1
    const { pieces, wake } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const yaw = -0.64 + 0.06 * Math.sin(TAU * t)
    const pose = { yaw, pitch: -0.7 }
    const project = camera({ ...pose, distance: 250, cx: view.w / 2, cy: view.h / 2 + 4 })
    const turn = orient(pose)
    const hair = (small ? 1.1 : 0.95) / view.px
    const shade = (z: number) => 0.4 + 0.6 * clamp((z + 35) / 70)

    // A lit box (posts, lintel, the shuttle), its visible faces sorted at its center's depth plus `bias`.
    const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tone: 'ink' | 'accent', edge: number) => {
      for (let i = 0; i < 8; i++) project(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0, C[i]!)
      project((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, p)
      for (const [ids, n] of BOX) {
        const v = turn(n[0], n[1], n[2])
        if (v[2] <= 0.001) continue
        xy.length = 0
        for (const i of ids) xy.push(C[i]!.x, C[i]!.y)
        depth.face(xy, p.z, lambert(v[0], v[1], v[2]), tone)
        if (edge > 0) depth.path(xy, p.z + 0.001, { width: hair, alpha: edge, closed: true, join: 'miter' })
      }
    }

    // The track: rails in short pieces (one, below 32px), square at the corners, on sleepers.
    for (let side = 0; side < 4; side++) {
      const [ax, az] = ROUTE[side]!
      const [bx, bz] = ROUTE[(side + 1) % 4]!
      const dx = Math.sign(bx - ax)
      const dz = Math.sign(bz - az)
      // Outward from the circuit: the rail on that side is the outer one.
      const ox = dz
      const oz = -dx
      for (const g of small ? [0] : [-GAUGE, GAUGE]) {
        // Each rail runs on (outer) or stops short (inner) by its offset, so the two meet square at the corners.
        for (let i = 0; i < pieces; i++) {
          const u0 = i / pieces
          const u1 = (i + 1) / pieces
          project(mix(ax - dx * g, bx + dx * g, u0) + ox * g, 0, mix(az - dz * g, bz + dz * g, u0) + oz * g, p)
          project(mix(ax - dx * g, bx + dx * g, u1) + ox * g, 0, mix(az - dz * g, bz + dz * g, u1) + oz * g, q)
          depth.line(p, q, hair * (small ? 1.2 : 1), 0.7 * shade((p.z + q.z) / 2))
        }
      }
      if (!small) {
        const ties = view.size < 80 ? 6 : 9
        for (let i = 0; i < ties; i++) {
          const u = (i + 0.5) / ties
          const cx = mix(ax, bx, u)
          const cz = mix(az, bz, u)
          project(cx - ox * GAUGE * 1.8, -0.4, cz - oz * GAUGE * 1.8, p)
          project(cx + ox * GAUGE * 1.8, -0.4, cz + oz * GAUGE * 1.8, q)
          depth.line(p, q, hair, 0.35 * shade((p.z + q.z) / 2))
        }
      }
    }
    // A registration cross under each corner.
    if (!small) {
      for (const [x, z] of ROUTE) {
        const arm = 3.4
        project(x - arm, -0.6, z, p)
        project(x + arm, -0.6, z, q)
        p.z = q.z = -90
        depth.line(p, q, hair, 0.3)
        project(x, -0.6, z - arm, p)
        project(x, -0.6, z + arm, q)
        p.z = q.z = -90
        depth.line(p, q, hair, 0.3)
      }
    }

    // The gates: two posts and a lintel, standing across the track; the track runs through the opening.
    const post = small ? 2.6 : 2.2
    for (const { x, z } of GATES) {
      for (const s of [-1, 1]) box(x - post / 2, -2.5, z + s * 6.2 - post / 2, x + post / 2, 11, z + s * 6.2 + post / 2, 'ink', small ? 0 : 0.35)
      box(x - post / 2 - 0.4, 11, z - 6.2 - post / 2 - 1.2, x + post / 2 + 0.4, 13.6, z + 6.2 + post / 2 + 1.2, 'ink', small ? 0 : 0.35)
    }

    // The shuttle: a side at a time, from rest to rest, landing on each corner.
    const along = (time: number) => {
      const w = ((time % 1) + 1) % 1
      const side = Math.floor(w * 4)
      return (side + view.ease.standard(span(w * 4 - side, 0.08, 0.86))) / 4
    }
    const travel = along(t)
    // Its wake is where it was a moment ago: long while it runs, drawn in behind it as it lands.
    for (let i = 0; i < wake; i++) {
      const a = along(t - (0.07 * i) / wake)
      const b = along(t - (0.07 * (i + 1)) / wake)
      // Unwrap across the seam so a piece never spans the whole circuit.
      const bb = b > a + 0.5 ? b - 1 : b < a - 0.5 ? b + 1 : b
      if (Math.abs(a - bb) < 1e-5) continue
      at(a, here)
      at(bb, there)
      project(here[0], 1.2, here[1], p)
      project(there[0], 1.2, there[1], q)
      depth.line(p, q, hair * (small ? 1.8 : 2.4) * ((p.k + q.k) / 2), (1 - i / wake) ** 1.1 * (0.35 + 0.65 * shade((p.z + q.z) / 2)), blend('c1', 'ink', i / wake))
    }
    at(travel, here)
    const s = small ? 2.6 : 2
    box(here[0] - s, 0.3, here[1] - s, here[0] + s, 0.3 + 2 * s, here[1] + s, 'accent', 0)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A square shuttle and its ink wake thread two lit gates on a depth-sorted circuit. */
export function LoaderReeve(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
