'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'alveole', title: 'Alveole', category: 'geometry', technique: 'planes',
  tags: ['pneumatic', 'quilt', 'membrane', 'chambers', 'soft body', '3d'],
  description: 'Four stitched membrane chambers inflate in a diagonal pressure wave. Their sealed borders stay flat while the skins rise into softly lit pillows; a narrow inlet seam carries the pressure onward as the preceding chamber relaxes.',
  order: 33,
  colors: [{ part: 'Quilting', mono: 'ink' }],
} satisfies LoaderMeta

/* A welded pad of four air chambers on a thin sheet, each pillow sealed by a
 * double seam, the pad's edge stitched round. Pressure enters at one corner
 * and travels the diagonal: the first chamber fills (`emphasized`), passes
 * it through the two inlets beside it to the next two, and they to the last,
 * each relaxing slowly (`standard`) once it has passed it on; a chamber
 * never quite empties, so the skin always holds a little air. An inlet
 * swells while the pressure crosses it, its seam lit in the accent. The
 * pillows are faceted skins lit by their normals, with quilting lines that
 * follow them; the view sways a little. Each chamber fills once a loop, a
 * third of a loop behind the one before, so the wave runs on forever.
 *
 * Color: each chamber’s quilting lines warm toward `c1` as it
 * inflates and cool as it settles, so the pressure wave shows as a wave of
 * color; the skins stay lit ink and the inlet seam the accent. */

const C = 26
const B = 3.2
const INS = 2.6
const SIDE = C - 2 * INS
const H = 8.5
const SHEET = 2.4
const YAW = -0.55
const PITCH = -0.62
const ZOOM = 1.06

/** The pillow's profile across a chamber: full in the middle, soft at the shoulders, a quilt and not a dome. */
const prof = (u: number) => 1 - Math.abs(2 * u - 1) ** 3
const slope = (u: number) => -6 * Math.sign(2 * u - 1) * (2 * u - 1) ** 2

const CELLS = [0, 1].flatMap((j) => [0, 1].map((i) => ({ i, j, x0: -C + i * C + INS, z0: -C + j * C + INS, order: i + j })))
/** The inlets: each joins a chamber to the next one down the diagonal, across their shared seam. */
const INLETS = [
  { from: 0, to: 1, axis: 'x' as const, x: 0, z: -C / 2 },
  { from: 0, to: 2, axis: 'z' as const, x: -C / 2, z: 0 },
  { from: 1, to: 3, axis: 'z' as const, x: C / 2, z: 0 },
  { from: 2, to: 3, axis: 'x' as const, x: 0, z: C / 2 },
]

const DETAIL = [
  { below: 32, n: 4, ribs: [] as number[] },
  { below: 80, n: 5, ribs: [0.5] },
  { below: Infinity, n: 8, ribs: [1 / 3, 2 / 3] },
]

const depth = new Depth()
const P = [point(), point(), point(), point()]
const a = point()
const b = point()
const xy: number[] = []
/** Each facet's depth in the chamber being drawn, for the quilting lines on it. */
const keys: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.33,
  draw(pen, t, view) {
    const { n, ribs } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const fine = view.size >= 64
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const yaw = YAW + 0.05 * Math.sin(TAU * t)
    const lens = camera({ yaw, pitch: PITCH, distance: 300, cx: view.w / 2, cy: view.h * 0.5 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, (y - 2) * ZOOM, z * ZOOM, out)
    const turn = orient({ yaw, pitch: PITCH })

    // How full each chamber is: it fills fast, passes the pressure on and relaxes slowly, never quite flat.
    const lift = CELLS.map(({ order }) => {
      const phase = (t - order / 3 + 1) % 1
      return 0.1 + 0.9 * view.ease.emphasized(span(phase, 0, 0.3)) * (1 - view.ease.standard(span(phase, 0.4, 0.95)))
    })

    // The sheet the chambers are welded to: a thin slab, lit on its edges.
    const E = C + B
    for (const [nx, nz, x0, z0, x1, z1] of [
      [0, 1, -E, E, E, E],
      [1, 0, E, E, E, -E],
      [-1, 0, -E, -E, -E, E],
      [0, -1, E, -E, -E, -E],
    ] as const) {
      const [vx, vy, vz] = turn(nx, 0, nz)
      if (vz <= 0.001) continue
      xy.length = 0
      for (const [x, y, z] of [[x0, -SHEET, z0], [x1, -SHEET, z1], [x1, 0, z1], [x0, 0, z0]] as const) {
        project(x, y, z, a)
        xy.push(a.x, a.y)
      }
      depth.face(xy, -1000, lambert(vx, vy, vz))
    }
    xy.length = 0
    for (const [x, z] of [[-E, -E], [E, -E], [E, E], [-E, E]] as const) {
      project(x, 0, z, a)
      xy.push(a.x, a.y)
    }
    // The sheet is a darker stock than the skins, so the pillows stand off it (more so when small).
    depth.face(xy, -900, lambert(...turn(0, 1, 0)) * (small ? 0.55 : 0.7))
    depth.path(xy, -899, { width: line, alpha: 0.75, closed: true, join: 'miter' })

    // Seams: a double weld round every chamber and a stitched line round the pad, all on the flat sheet.
    const seam = (x0: number, z0: number, side: number, key: number, alpha: number, dashed: boolean) => {
      xy.length = 0
      for (const [x, z] of [[x0, z0], [x0 + side, z0], [x0 + side, z0 + side], [x0, z0 + side]] as const) {
        project(x, 0.02, z, a)
        xy.push(a.x, a.y)
      }
      depth.path(xy, key, { width: hair, alpha, closed: true, join: 'miter', dash: dashed ? [1.5 / view.px, 1.3 / view.px] : undefined })
    }
    // Below 32px the pillows' shading carries their edges, and the seams would only clutter them.
    if (!small) {
      for (const cell of CELLS) {
        seam(cell.x0, cell.z0, SIDE, -890, fine ? 0.45 : 0.32, false)
        if (fine) seam(cell.x0 - 1.1, cell.z0 - 1.1, SIDE + 2.2, -890, 0.3, true)
      }
      seam(-E + 1.4, -E + 1.4, 2 * E - 2.8, -890, 0.3, fine)
    }

    // The inlets: a narrow tube across the seam that swells while the pressure crosses it.
    const W = 2.2
    for (const inlet of INLETS) {
      const k = lift[inlet.from]! * lift[inlet.to]!
      const swell = clamp((k - 0.02) / 0.5)
      const h = 0.5 + 3 * swell
      const half = INS + 1.2
      // Along the inlet (s) and across it (w): its top, as two lit strips either side of its crest.
      const at = (s: number, w: number, y: number, out: Projected) =>
        inlet.axis === 'x' ? project(inlet.x + s, y, inlet.z + w, out) : project(inlet.x + w, y, inlet.z + s, out)
      for (const side of [-1, 1]) {
        xy.length = 0
        at(-half, side * W, 0.02, P[0]!)
        at(half, side * W, 0.02, P[1]!)
        at(half, 0, h, P[2]!)
        at(-half, 0, h, P[3]!)
        for (const p of P) xy.push(p.x, p.y)
        // Both strips are drawn and sorted by depth (the far one goes under the crest), so neither blinks as the tube swells.
        const [vx, vy, vz] = inlet.axis === 'x' ? turn(0, W, side * h) : turn(side * h, W, 0)
        depth.face(xy, (P[0]!.z + P[1]!.z + P[2]!.z + P[3]!.z) / 4, lambert(vx, vy, Math.max(vz, 0)))
      }
      at(-half, 0, h + 0.05, a)
      at(half, 0, h + 0.05, b)
      depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2 + 0.5, { width: line, alpha: 0.95 * swell ** 1.5, tone: 'accent', cap: 'round' })
    }

    // The chambers: faceted skins over their welded borders, lit by their own normals, with quilting lines that follow them.
    CELLS.forEach((cell, c) => {
      const hgt = H * (small ? 1.3 : 1) * lift[c]!
      const y = (u: number, v: number) => hgt * prof(u) * prof(v)
      const du = 1 / n
      for (let jv = 0; jv < n; jv++) {
        for (let iu = 0; iu < n; iu++) {
          const u = iu * du
          const v = jv * du
          project(cell.x0 + SIDE * u, y(u, v), cell.z0 + SIDE * v, P[0]!)
          project(cell.x0 + SIDE * (u + du), y(u + du, v), cell.z0 + SIDE * v, P[1]!)
          project(cell.x0 + SIDE * (u + du), y(u + du, v + du), cell.z0 + SIDE * (v + du), P[2]!)
          project(cell.x0 + SIDE * u, y(u, v + du), cell.z0 + SIDE * (v + du), P[3]!)
          const uc = u + du / 2
          const vc = v + du / 2
          const [nx, ny, nz] = turn((-hgt * slope(uc) * prof(vc)) / SIDE, 1, (-hgt * prof(uc) * slope(vc)) / SIDE)
          // No facet is culled: a skin seen from above hides its own far side by depth alone, so nothing blinks out at the crest.
          const key = (P[0]!.z + P[1]!.z + P[2]!.z + P[3]!.z) / 4
          keys[jv * n + iu] = key
          xy.length = 0
          for (const p of P) xy.push(p.x, p.y)
          depth.face(xy, key, lambert(nx, ny, Math.max(nz, 0)))
        }
      }
      // Quilting lines across the skin, both ways, riding its surface: each piece just over the facet it lies on. They warm with the chamber's pressure.
      const quilt = blend('ink', 'c1', 0.85 * lift[c]!)
      const steps = n * 3
      for (const r of ribs) {
        for (const dir of [0, 1]) {
          for (let k = 0; k < steps; k++) {
            const s0 = k / steps
            const s1 = (k + 1) / steps
            const [u0, v0, u1, v1] = dir ? [r, s0, r, s1] : [s0, r, s1, r]
            const under = keys[Math.min(n - 1, Math.floor(((v0 + v1) / 2) * n)) * n + Math.min(n - 1, Math.floor(((u0 + u1) / 2) * n))]!
            project(cell.x0 + SIDE * u0, y(u0, v0) + 0.12, cell.z0 + SIDE * v0, a)
            project(cell.x0 + SIDE * u1, y(u1, v1) + 0.12, cell.z0 + SIDE * v1, b)
            depth.path([a.x, a.y, b.x, b.y], under + 0.001, { width: hair * 0.8, alpha: fine ? 0.34 : 0.2, cap: 'round', tone: quilt })
          }
        }
      }
    })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A welded quilt breathes through four independently lit air chambers. */
export function LoaderAlveole(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
