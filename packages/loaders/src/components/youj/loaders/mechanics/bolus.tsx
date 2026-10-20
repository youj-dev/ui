'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, point, projectPath, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rod, type V3 } from './machine'

export const meta = {
  id: 'bolus', title: 'Bolus', category: 'mechanics', technique: 'planes',
  tags: ['peristalsis', 'soft', 'pump', 'membrane', 'transport', 'constriction'],
  description: 'A soft conduit squeezes behind a travelling pocket. Lit compression collars on posts close in sequence and reopen as the bulge passes, and the cutaway membrane shows the accent bolus riding the pocket from end to end.',
  order: 31,
  colors: [{ part: 'Collars', mono: 'ink' }],
} satisfies LoaderMeta

// A periodic pressure profile on a finite cutaway. The seam does not
// teleport a pocket: an identical wave enters as the preceding one exits.
const HALF = 35
const PERIOD = 74
const wrap = (x: number) => x - PERIOD * Math.round(x / PERIOD)
const pulse = (x: number, width: number) => Math.exp(-((wrap(x) / width) ** 2))
const radius = (x: number, crest: number) => 8 - 6.3 * pulse(x - crest, 6.5) + 5.5 * pulse(x - crest - 15, 9)
const BEGIN = 0.42 * Math.PI
const END = 1.58 * Math.PI
const STATIONS = [[-25, 0, 25], [-28, -14, 0, 14, 28]]
const MERIDIANS = [BEGIN, Math.PI, END]
const quad = Array.from({ length: 4 }, () => [0, 0, 0] as V3)
const line: V3[] = Array.from({ length: 65 }, () => [0, 0, 0])
const xy: number[] = []
const p = point()
const q = point()
const depth = new Depth()

function surfacePoint(out: V3, x: number, r: number, a: number) {
  out[0] = x
  out[1] = r * Math.cos(a)
  out[2] = r * Math.sin(a)
}

export const scene: Scene = {
  beats: 5.5, still: 0.4,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.38, pitch: -1.05 }
    const project = camera({ ...pose, distance: 236, cx: view.w / 2, cy: 50 })
    const turn = orient(pose)
    const crest = -PERIOD / 2 + PERIOD * t
    const sections = small ? 20 : view.size < 80 ? 28 : 32
    const ribs = small ? 4 : 6

    // A longitudinal opening faces upward. The walls are an actual ruled
    // surface, lit by its radius gradient, with an exposed inner floor.
    for (let i = 0; i < sections; i++) {
      const x0 = -HALF + 2 * HALF * i / sections
      const x1 = -HALF + 2 * HALF * (i + 1) / sections
      const r0 = radius(x0, crest)
      const r1 = radius(x1, crest)
      for (let j = 0; j < ribs; j++) {
        const a = BEGIN + (END - BEGIN) * j / ribs
        const b = BEGIN + (END - BEGIN) * (j + 1) / ribs
        surfacePoint(quad[0]!, x0, r0, a)
        surfacePoint(quad[1]!, x1, r1, a)
        surfacePoint(quad[2]!, x1, r1, b)
        surfacePoint(quad[3]!, x0, r0, b)
        const aMid = (a + b) / 2
        const n = turn(-(r1 - r0) / (x1 - x0), Math.cos(aMid), Math.sin(aMid))
        const side = n[2] >= 0 ? 1 : -1
        const path = projectPath(quad, project, xy)
        depth.face(path.xy, path.z, lambert(n[0] * side, n[1] * side, n[2] * side) * (side > 0 ? 1 : 0.72))
      }
    }
    // Two cut edges, and sparse meridians: the deformation is visible even
    // before a hoop has squeezed. Each line is divided for proper occlusion.
    for (const a of MERIDIANS) {
      const cut = a === BEGIN || a === END
      for (let i = 0; i < sections; i += 2) {
        xy.length = 0
        let z = 0
        for (let k = i; k <= Math.min(i + 2, sections); k++) {
          const x = -HALF + 2 * HALF * k / sections
          project(x, radius(x, crest) * Math.cos(a), radius(x, crest) * Math.sin(a), p)
          xy.push(p.x, p.y)
          z += p.z
        }
        depth.path(xy, z / (xy.length / 2) + 0.1, { width: hair * (cut ? 1 : 0.65), alpha: cut ? 0.9 : 0.24, join: 'round' })
      }
    }

    // Hoops remain at fixed stations, so the peristaltic squeeze reads as
    // a succession of actuators rather than rings sliding down the pipe:
    // each a lit collar closing on the skin, on a post down to the bed.
    const stations = STATIONS[small ? 0 : 1]!
    const hoopSamples = small ? 14 : 18
    for (const x of stations) {
      const r = radius(x, crest) + 1.1
      for (let i = 0; i < hoopSamples; i++) {
        const a = TAU * i / hoopSamples
        const b = TAU * (i + 1) / hoopSamples
        for (let k = 0; k < 4; k++) {
          const u = k === 0 || k === 3 ? a : b
          quad[k]![0] = x + (k < 2 ? -1.1 : 1.1)
          quad[k]![1] = r * Math.cos(u)
          quad[k]![2] = r * Math.sin(u)
        }
        const m = (a + b) / 2
        const n = turn(0, Math.cos(m), Math.sin(m))
        const outside = n[2] > 0
        const s = outside ? 1 : -1
        const path = projectPath(quad, project, xy)
        depth.face(path.xy, path.z + 0.3, lambert(n[0] * s, n[1] * s, n[2] * s) * (outside ? 1 : 0.7), 'c1')
        if (outside) {
          project(...quad[0]!, p)
          project(...quad[1]!, q)
          const near = clamp(((p.z + q.z) / 2 + 30) / 60)
          depth.line(p, q, hair * 0.8, 0.35 + 0.5 * near)
        }
      }
      if (!small) {
        rod(depth, project, [x, -r - 0.4, 0], [x, -17.4, 0], hair * 2.2, 0.55)
        rod(depth, project, [x, -r - 0.4, 0], [x, -17.4, 0], hair * 0.8, 0.9)
      }
    }

    // The bolus itself: a lit pellet in the accent, carried in the pocket the squeeze drives along.
    // Near the ends it shrinks away, so the next one can arrive from the far end unseen.
    const centre = wrap(crest + 15)
    const grow = view.ease.standard(clamp((HALF + 1 - Math.abs(centre)) / 10))
    if (grow > 0.02) {
      const R = 4.4 * grow
      const y0 = -radius(centre, crest) + R + 0.6
      const rows = small ? 4 : 5
      const cols = small ? 8 : 10
      for (let j = 0; j < rows; j++) {
        const la = -Math.PI / 2 + (Math.PI * j) / rows
        const lb = la + Math.PI / rows
        for (let i = 0; i < cols; i++) {
          const oa = (TAU * i) / cols
          const ob = (TAU * (i + 1)) / cols
          const lm = (la + lb) / 2
          const om = (oa + ob) / 2
          const n = turn(Math.cos(lm) * Math.cos(om), Math.sin(lm), Math.cos(lm) * Math.sin(om))
          if (n[2] <= 0) continue
          const corners: [number, number][] = [[la, oa], [la, ob], [lb, ob], [lb, oa]]
          corners.forEach(([l, o], k) => {
            quad[k]![0] = centre + R * Math.cos(l) * Math.cos(o)
            quad[k]![1] = y0 + R * Math.sin(l)
            quad[k]![2] = R * Math.cos(l) * Math.sin(o)
          })
          const path = projectPath(quad, project, xy)
          depth.face(path.xy, path.z + 0.2, lambert(...n), 'accent')
        }
      }
    }
    // End rims expose the conduit thickness, and a stationary bed anchors
    // the passing pocket in space without filling the icon with hardware.
    for (const x of [-HALF, HALF]) {
      const r = radius(x, crest)
      for (let i = 0; i <= 32; i++) {
        const a = BEGIN + (END - BEGIN) * i / 32
        line[i]![0] = x
        line[i]![1] = r * Math.cos(a)
        line[i]![2] = r * Math.sin(a)
      }
      const rim = projectPath(line.slice(0, 33), project, xy)
      depth.path(rim.xy, rim.z + 0.3, { width: hair * 1.25, alpha: 0.8, join: 'round' })
    }
    // The bed the hoops stand on: a lit rail, its top and its near side.
    for (const [n, c] of [
      [[0, 1, 0], [[-37, -17.4, -2.4], [37, -17.4, -2.4], [37, -17.4, 2.4], [-37, -17.4, 2.4]]],
      [[0, 0, 1], [[-37, -17.4, 2.4], [37, -17.4, 2.4], [37, -20, 2.4], [-37, -20, 2.4]]],
    ] as [V3, V3[]][]) {
      const v = turn(...n)
      if (v[2] <= 0) continue
      const path = projectPath(c, project, xy)
      depth.face(path.xy, path.z - 20, lambert(...v))
      depth.path(path.xy, path.z - 19.99, { width: hair * 0.85, alpha: 0.6, closed: true, join: 'round' })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A travelling squeeze carries a pocket through a soft conduit held by fixed compression hoops.
 *
 * Color: the compression collars, the actuators, are lit in `c1`, so their squeeze reads against the ink conduit; the accent bolus rides through. */
export function LoaderBolus(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
