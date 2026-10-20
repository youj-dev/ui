'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'azimuth', title: 'Azimuth', category: 'signal', technique: 'lines',
  tags: ['navigation', 'survey', 'bearings', 'triangulation', 'map', '3d'],
  description: 'Three surveyed landmarks turn their bearings toward a common fix on a tilted map. Their uncertainty wedges narrow in sequence, the intersecting rays resolve a small coordinate cross, and the bearings release for the next observation.',
  order: 21,
  colors: [{ part: 'Bearings', mono: 'ink' }],
} satisfies LoaderMeta

/* A survey sheet in perspective: a map plane with a faint grid, the contour
 * lines of a low hill and a north arrow in its far corner. Three stations
 * stand on it, each a lit sighting pyramid on a base ring, its vane turned
 * along its bearing. The bearings start wide, each with its wedge of
 * uncertainty, and lock onto the fix in turn (`emphasized`), an accent front
 * running out along each as it does; between them they draw the navigator's
 * cocked hat, the small triangle three bearings make before they agree,
 * which shrinks to nothing as the last one locks. The fix then resolves as an
 * accent cross with a ring that sounds once, and the bearings release
 * (`standard`) for the next observation. The sheet sways a little all the
 * while, so the hold never freezes. Locked and released alike at both ends of
 * the loop, so there's no seam.
 *
 * Color: each station’s bearing line warms toward `c1` as it locks, and cools as the sheet clears. */

type V3 = [number, number, number]
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const STATIONS = [[-29, 19], [27, 18], [-8, -27]] as const
const FIX = [5, -2] as const
const RING = 3.4
/** The sheet's own depth: what's printed on it sorts beneath everything standing on it. */
const SHEET = -1000

/** A low hill's contour lines on the map: closed, gently irregular rings round a summit. */
const HILL = [-11, 8] as const
const CONTOURS = [5.5, 9.5, 13.5].map((r, k) =>
  Array.from({ length: 41 }, (_, i) => {
    const a = (TAU * i) / 40
    const wobble = 1 + 0.13 * Math.sin(2 * a + k * 0.7) + 0.07 * Math.sin(3 * a + 1.3 + k)
    return [HILL[0] + r * 1.25 * wobble * Math.cos(a), HILL[1] + r * wobble * Math.sin(a)] as const
  }),
)
/** A sighting pyramid's base corners, unit radius. */
const BASE = [0, 1, 2].map((k) => [Math.cos(0.5 + (TAU * k) / 3), Math.sin(0.5 + (TAU * k) / 3)] as const)

/** Where two bearings cross on the map, or null when they run (nearly) parallel. */
function cross(ax: number, az: number, a: number, bx: number, bz: number, b: number): [number, number] | null {
  const dx = Math.cos(a), dz = Math.sin(a), ex = Math.cos(b), ez = Math.sin(b)
  const det = dx * ez - dz * ex
  if (Math.abs(det) < 0.05) return null
  const s = ((bx - ax) * ez - (bz - az) * ex) / det
  return [ax + s * dx, az + s * dz]
}

export const scene: Scene = {
  beats: 6, still: 0.59,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const lod = small ? 0 : view.size < 80 ? 1 : 2
    const hair = clamp(view.size * 0.006, 0.9, 1.3) / view.px
    const pose = { yaw: -0.2 + 0.05 * Math.sin(TAU * t), pitch: -0.8 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: 51 })
    const turn = orient(pose)
    const clear = view.ease.standard(span(t, 0.75, 0.96))
    // The map is a plane with clipped grid lines, not a full wireframe box.
    // Everything printed on the sheet sorts beneath what stands on it, in the order it's drawn.
    xy.length = 0
    for (const [x, z] of [[-34, -32], [34, -32], [34, 30], [-34, 30]]) {
      project(x!, -0.2, z!, p); xy.push(p.x, p.y)
    }
    depth.poly(xy, SHEET, 0.025)
    depth.path(xy, SHEET + 1, { width: hair * 0.8, alpha: 0.32, closed: true })
    if (!small) for (const v of [-20, 0, 20]) {
      project(v, 0, -32, p); project(v, 0, 30, q); depth.path([p.x, p.y, q.x, q.y], SHEET + 2, { width: hair * 0.65, alpha: 0.12 })
      project(-34, 0, v, p); project(34, 0, v, q); depth.path([p.x, p.y, q.x, q.y], SHEET + 2, { width: hair * 0.65, alpha: 0.12 })
    }
    // The hill's contours, the inner ones a little stronger.
    if (lod > 0) for (let k = lod === 2 ? 0 : 1; k < CONTOURS.length; k++) {
      xy.length = 0
      for (const [x, z] of CONTOURS[k]!) { project(x, 0, z, p); xy.push(p.x, p.y) }
      depth.path(xy, SHEET + 3, { width: hair * 0.7, alpha: 0.24 - k * 0.04, closed: true, join: 'round' })
    }
    // A compass in the far corner: a ring, and a needle whose north half is solid.
    if (lod > 0) {
      const [nx, nz] = [25, -21.5]
      xy.length = 0
      for (let i = 0; i < 24; i++) { project(nx + 4.4 * Math.cos(TAU * i / 24), 0.2, nz + 4.4 * Math.sin(TAU * i / 24), p); xy.push(p.x, p.y) }
      depth.path(xy, SHEET + 4, { width: hair * 0.7, alpha: 0.4, closed: true })
      const north: V3 = [nx, 0.2, nz - 3.6], south: V3 = [nx, 0.2, nz + 3.6], west: V3 = [nx - 1.3, 0.2, nz], east: V3 = [nx + 1.3, 0.2, nz]
      xy.length = 0
      for (const c of [north, east, west]) { project(...c, p); xy.push(p.x, p.y) }
      depth.poly(xy, SHEET + 5, 0.7)
      xy.length = 0
      for (const c of [north, east, south, west]) { project(...c, p); xy.push(p.x, p.y) }
      depth.path(xy, SHEET + 5, { width: hair * 0.7, alpha: 0.6, closed: true, join: 'miter' })
    }

    const bearings: number[] = []
    for (let station = 0; station < 3; station++) {
      const [x, z] = STATIONS[station]!
      const trueAngle = Math.atan2(FIX[1] - z, FIX[0] - x)
      const delay = station * 0.115
      const lock = view.ease.emphasized(span(t, 0.07 + delay, 0.29 + delay)) * (1 - clear)
      const error = (station % 2 ? -1 : 1) * 0.34 * (1 - lock)
      const bearing = trueAngle + error
      bearings.push(bearing)
      const distance = Math.hypot(FIX[0] - x, FIX[1] - z)
      const uncertainty = 0.15 * (1 - lock) + 0.012
      const cs = Math.cos(bearing), sn = Math.sin(bearing)

      // The station: a base ring on the map and a lit sighting pyramid standing in it.
      xy.length = 0
      for (let i = 0; i <= 24; i++) { project(x + RING * Math.cos(TAU * i / 24), 0.15, z + RING * Math.sin(TAU * i / 24), p); xy.push(p.x, p.y) }
      depth.path(xy, SHEET + 9, { width: hair * 0.8, alpha: small ? 0.5 : 0.62, join: 'round' })
      const s = small ? 3 : 2.3, h = small ? 5 : 6.2
      for (let k = 0; k < 3; k++) {
        const [ax, az] = BASE[k]!, [bx, bz] = BASE[(k + 1) % 3]!
        // The side's outward normal: across its base edge, tipped up by the slope.
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, len = Math.hypot(mx, mz)
        const n = turn((mx / len) * h, s * len, (mz / len) * h)
        if (n[2] <= 0) continue
        xy.length = 0
        let fz = 0
        for (const [cx, cy, cz] of [[x + ax * s, 0.2, z + az * s], [x + bx * s, 0.2, z + bz * s], [x, h, z]] as const) {
          project(cx, cy, cz, p); xy.push(p.x, p.y); fz += p.z / 3
        }
        depth.face(xy, fz, lambert(...n))
        depth.path(xy, fz + 0.01, { width: hair * 0.6, alpha: 0.5, closed: true, join: 'round' })
      }
      // Its vane, turned along the bearing at the apex.
      if (lod === 2) {
        project(x - cs * 1.5, h, z - sn * 1.5, p); project(x + cs * 4, h, z + sn * 4, q)
        depth.line(p, q, hair, 0.8)
      }

      // The uncertainty sector is a shallow plane in the map, narrowing around its bearing.
      xy.length = 0
      project(x + RING * cs, 0.2, z + RING * sn, p); xy.push(p.x, p.y)
      const samples = small ? 4 : 10
      for (let i = 0; i <= samples; i++) {
        const a = bearing - uncertainty + 2 * uncertainty * i / samples
        project(x + distance * Math.cos(a), 0.2, z + distance * Math.sin(a), p)
        xy.push(p.x, p.y)
      }
      depth.poly(xy, SHEET + 10, 0.07 * (1 - lock))
      // The bearing leaves from the rim of its base ring.
      const rayLength = distance + 6
      project(x + RING * cs, 0.6, z + RING * sn, p)
      project(x + rayLength * cs, 0.6, z + rayLength * sn, q)
      depth.path([p.x, p.y, q.x, q.y], SHEET + 12, { width: hair * p.k, alpha: 0.42 + 0.38 * lock, tone: blend('ink', 'c1', 0.85 * lock) })
      if (!small) for (const a of [bearing - uncertainty, bearing + uncertainty]) {
        project(x + RING * Math.cos(a), 0.5, z + RING * Math.sin(a), p); project(x + distance * Math.cos(a), 0.5, z + distance * Math.sin(a), q)
        depth.path([p.x, p.y, q.x, q.y], SHEET + 11, { width: hair * 0.7, alpha: 0.24 * (1 - lock) })
      }
      // A short accent front runs along each bearing only while it acquires its fix.
      const phase = span(t, 0.07 + delay, 0.34 + delay)
      const u = view.ease.standard(phase)
      const a = RING + (distance - RING) * clamp(u - 0.065), b = RING + (distance - RING) * clamp(u + 0.065)
      project(x + a * cs, 0.9, z + a * sn, p)
      project(x + b * cs, 0.9, z + b * sn, q)
      depth.path([p.x, p.y, q.x, q.y], SHEET + 14, { width: hair * 1.5, alpha: Math.sin(Math.PI * phase), tone: 'accent' })
    }

    // The cocked hat: where the bearings cross in pairs. It shrinks to the fix as they agree.
    if (lod > 0) {
      const corners: [number, number][] = []
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3
        const c = cross(STATIONS[i]![0], STATIONS[i]![1], bearings[i]!, STATIONS[j]![0], STATIONS[j]![1], bearings[j]!)
        if (c) corners.push(c)
      }
      if (corners.length === 3) {
        let size = 0
        for (let i = 0; i < 3; i++) size += Math.hypot(corners[i]![0] - corners[(i + 1) % 3]![0], corners[i]![1] - corners[(i + 1) % 3]![1])
        const shown = clamp(1 - size / 80) * clamp(size / 3)
        if (shown > 0.01) {
          xy.length = 0
          for (const [cx, cz] of corners) { project(cx, 0.7, cz, p); xy.push(p.x, p.y) }
          depth.poly(xy, SHEET + 13, 0.14 * shown)
          depth.path(xy, SHEET + 13, { width: hair, alpha: 0.85 * shown, closed: true, join: 'miter' })
        }
      }
    }

    const resolve = view.ease.enter(span(t, 0.53, 0.61)) * (1 - clear)
    for (const axis of [0, 1]) {
      project(FIX[0] - (axis === 0 ? 4 : 0), 1, FIX[1] - (axis === 1 ? 4 : 0), p)
      project(FIX[0] + (axis === 0 ? 4 : 0), 1, FIX[1] + (axis === 1 ? 4 : 0), q)
      depth.path([p.x, p.y, q.x, q.y], SHEET + 16, { width: hair * 1.25, alpha: resolve, tone: 'accent' })
    }
    if (!small && resolve > 0) {
      // The fix's ring, and once, as it resolves, a ring sounding out from it.
      const ping = view.ease.standard(span(t, 0.56, 0.78))
      for (const [r, a] of [[6, resolve * 0.45], [6 + 7 * ping, resolve * 0.4 * (1 - ping)]] as const) {
        if (a < 0.005) continue
        xy.length = 0
        for (let i = 0; i < 24; i++) {
          const ang = TAU * i / 24
          project(FIX[0] + r * Math.cos(ang), 0.8, FIX[1] + r * Math.sin(ang), p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, SHEET + 15, { width: hair * 0.7, alpha: a, closed: true })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three map bearings narrow their uncertainty to resolve a coordinate fix. */
export function LoaderAzimuth(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
