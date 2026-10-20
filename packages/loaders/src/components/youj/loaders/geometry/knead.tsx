'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'knead', title: 'Knead', category: 'geometry', technique: 'mixed',
  tags: ['elastic', 'soft body', 'compression', 'volume', 'membrane', 'press'],
  description: 'A guided platen compresses a gridded elastic volume against a bed. The body spreads sideways while preserving volume, its lit skin and meridians following the deformation, then regains its height as the platen rises.',
  order: 24,
  colors: [{ part: 'Grid', mono: 'ink' }],
} satisfies LoaderMeta

/* A small press: a base plate, two guide columns, a crown carrying a ram,
 * and the platen it drives, sliding on the columns in collars. The platen
 * comes down (`emphasized`), meets the body and presses it against the bed:
 * the body spreads sideways as much as it loses in height (rx · ry · rz
 * stays the same) and flattens where it touches, its lit skin and meridians
 * following. It creeps a little further under the held load, then the
 * platen lifts, the body recovers in contact all the way back to round, and
 * the platen parts from it to the top of its stroke. The ram's rod slides in
 * and out of its cylinder; the view sways the whole time.
 *
 * Color: the skin’s parallels and meridians warm toward `c1` under
 * the load and cool as the body recovers; the strain mark stays the accent. */

const BED = -21 // the bed's top
const BASE = 2.6 // base plate thickness
const COL = 35 // the columns' x
const CROWN = 31 // the crown's underside
const R0 = { x: 20, y: 18, z: 15 } // the body at rest
const LOW = 10.5 // its height under full load (half)
const PLATEN = 2.6 // platen thickness
const REST = BED + 2 * R0.y + 6 // the platen's underside at the top of its stroke
const PRESSED = BED + 2 * LOW

/** A box's faces: corner indices round each (bit 0 x, bit 1 y, bit 2 z) and its outward normal. */
const BOX: [number[], number, number, number][] = [
  [[2, 3, 7, 6], 0, 1, 0],
  [[0, 4, 5, 1], 0, -1, 0],
  [[4, 6, 7, 5], 0, 0, 1],
  [[0, 1, 3, 2], 0, 0, -1],
  [[1, 5, 7, 3], 1, 0, 0],
  [[0, 2, 6, 4], -1, 0, 0],
]

const depth = new Depth()
const P = Array.from({ length: 8 }, () => point())
const S = [point(), point(), point(), point()]
const a = point()
const b = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 5,
  still: 0.3,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 64
    const lat = small ? 6 : view.size < 80 ? 8 : 12
    const lon = small ? 12 : view.size < 80 ? 16 : 24
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : 1.3) / view.px
    const yaw = -0.34 + 0.07 * Math.sin(TAU * t)
    const pose = { yaw, pitch: -0.3 }
    const zoom = small ? 1.12 : 1.06
    const lens = camera({ ...pose, distance: 340, cx: view.w / 2, cy: view.h / 2 + 2 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y - 4) * zoom, z * zoom, out)
    const turn = orient(pose)

    // The stroke: down to the body and on into it, a slow creep under the held load, then back up.
    const press = view.ease.emphasized(span(t, 0.03, 0.4)) * (1 - view.ease.emphasized(span(t, 0.56, 0.95)))
    const creep = 0.7 * Math.sin(Math.PI * span(t, 0.36, 0.6))
    const platen = mix(REST, PRESSED, press) - creep
    const ry = Math.min(R0.y, (platen - BED) / 2)
    const spread = Math.sqrt(R0.y / ry)
    const rx = R0.x * spread
    const rz = R0.z * spread
    const cy = BED + ry
    // Flatter where it's pressed: the profile goes from an ellipse toward a squarer curve.
    const n = 2 + 1.5 * clamp((R0.y - ry) / (R0.y - LOW))
    // The skin's grid warms with the load, and cools as the body recovers.
    const strain = blend('ink', 'c1', 0.8 * press)
    const e = 2 / n

    /** A lit box, its outline in hairlines: faces toward the eye only, drawn at `key` (they're sorted by height, not depth). */
    const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, key: number, edge = 0.55) => {
      for (let i = 0; i < 8; i++) project(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0, P[i]!)
      for (const [ids, nx, ny, nz] of BOX) {
        const v = turn(nx, ny, nz)
        if (v[2] <= 0.001) continue
        xy.length = 0
        for (const i of ids) xy.push(P[i]!.x, P[i]!.y)
        depth.face(xy, key, lambert(v[0], v[1], v[2]))
        if (edge > 0) depth.path(xy, key + 0.001, { width: hair, alpha: edge, closed: true, join: 'miter' })
      }
    }

    // The base plate and the bed, then the columns standing on it.
    box(-COL - 3.5, COL + 3.5, BED - BASE, BED, -17, 17, -300)
    for (const s of [-1, 1]) {
      if (small) {
        project(s * COL, BED, 0, a)
        project(s * COL, CROWN, 0, b)
        depth.line(a, b, line, 0.7)
      } else box(s * COL - 1, s * COL + 1, BED, CROWN, -1, 1, -250 + s * 0.01, 0.4)
      // Graduations on the column's inner face: the platen's collar reads against them.
      if (fine) {
        for (let y = BED + 4; y < CROWN - 2; y += 4) {
          project(s * (COL - 1), y, 1, a)
          project(s * (COL - 1) - s * ((y - BED) % 12 < 1 ? 2.4 : 1.3), y, 1, b)
          depth.path([a.x, a.y, b.x, b.y], -240, { width: hair, alpha: 0.4 })
        }
      }
    }

    // The body: a lit elastic volume, its skin gridded.
    for (let i = 0; i < lat; i++) {
      for (let j = 0; j < lon; j++) {
        const p0 = (Math.PI * i) / lat
        const p1 = (Math.PI * (i + 1)) / lat
        const q0 = (TAU * j) / lon
        const q1 = (TAU * (j + 1)) / lon
        const pm = (p0 + p1) / 2
        const qm = (q0 + q1) / 2
        const sm = Math.abs(Math.sin(pm)) ** (2 - e)
        const cm = Math.sign(Math.cos(pm)) * Math.abs(Math.cos(pm)) ** (2 - e)
        const normal = turn((sm * Math.cos(qm)) / rx, cm / ry, (sm * Math.sin(qm)) / rz)
        if (normal[2] <= 0) continue
        const at = (phi: number, theta: number, out: Projected) => {
          const c = Math.cos(phi)
          const r = Math.abs(Math.sin(phi)) ** e
          return project(rx * r * Math.cos(theta), cy + ry * Math.sign(c) * Math.abs(c) ** e, rz * r * Math.sin(theta), out)
        }
        at(p0, q0, S[0]!)
        at(p0, q1, S[1]!)
        at(p1, q1, S[2]!)
        at(p1, q0, S[3]!)
        xy.length = 0
        let z = 0
        for (const p of S) {
          xy.push(p.x, p.y)
          z += p.z / 4
        }
        depth.face(xy, z, lambert(normal[0], normal[1], normal[2]))
        // Parallels and meridians lie on the skin and share its depth.
        if (i > 0 && i % (small ? 2 : view.size < 80 ? 2 : 3) === 0) depth.path([S[0]!.x, S[0]!.y, S[1]!.x, S[1]!.y], z + 0.12, { width: hair, alpha: 0.55, tone: strain })
        if (j % (small ? 3 : 4) === 0) depth.path([S[0]!.x, S[0]!.y, S[3]!.x, S[3]!.y], z + 0.12, { width: hair, alpha: 0.55, tone: strain })
        // A strain mark on the equator, stretching as the body spreads.
        if (i === lat / 2 && (j === Math.floor(lon / 4) || (!small && j === Math.floor(lon / 4) - 1)))
          depth.path([S[0]!.x, S[0]!.y, S[1]!.x, S[1]!.y], z + 0.2, { width: line * 1.15, alpha: 1, tone: 'accent' })
      }
    }

    // The platen: a lit plate riding the columns in collars, above everything below it.
    box(-COL + 2.2, COL - 2.2, platen, platen + PLATEN, -16, 16, 200)
    for (const s of [-1, 1]) box(s * COL - 2.2, s * COL + 2.2, platen - 0.7, platen + PLATEN + 0.7, -2.2, 2.2, 210 + s * 0.01, small ? 0 : 0.6)

    // The ram: its rod from the platen up into the cylinder hung from the crown, then the crown across the columns.
    if (!small) {
      box(-1, 1, platen + PLATEN, CROWN - 4, -1, 1, 300, 0.4)
      box(-3.2, 3.2, CROWN - 6, CROWN, -3.2, 3.2, 310)
    }
    box(-COL - 2.5, COL + 2.5, CROWN, CROWN + 3, -3, 3, 400)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A volume-preserving elastic body widens under a coordinated press stroke. */
export function LoaderKnead(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }

