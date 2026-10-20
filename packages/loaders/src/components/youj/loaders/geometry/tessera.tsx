'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'tessera', title: 'Tessera', category: 'geometry', technique: 'planes',
  tags: ['tessellation', 'triangles', 'hinges', 'tiling', 'wave'],
  description: 'Six triangular tiles share a hexagonal footprint. A travelling fold lifts their inner tips in sequence, showing both lit sides before each tile settles into the tessellation; one hinge catches the accent at the crest.',
  order: 22,
  colors: [{ part: 'Hinges', mono: 'ink' }],
} satisfies LoaderMeta

/* Six thin triangular tiles fill a hexagonal tray, each hinged on its outer
 * edge (two knuckles on the rim). A fold travels round them: each tile's
 * inner tip lifts (`emphasized`), the tile standing up on its hinge until
 * its underside turns to the light, then settles back (`standard`), a sixth
 * of a turn behind the one before, so the wave never stops. Where a tile
 * lifts, the tray's shaded floor and its inner wall show beneath it. Every
 * face is a lit face of a real slab; a lifted tile is drawn over the flat
 * ones it rises above. The hinge of the tile at its crest catches the
 * accent.
 *
 * Color: the hinge marks of the folding tiles are `c1`; the tiles
 * stay lit ink and the crest the accent. */

type V3 = [number, number, number]
const R = 32
const T = 1.1
const RIM = 2.4
const FLOOR = -T - 0.35
const BASE = -3.6
const ZOOM = 1.3

const tiles = Array.from({ length: 6 }, (_, i) => {
  const a = (TAU * i) / 6
  const b = (TAU * (i + 1)) / 6
  const A: V3 = [R * Math.cos(a), 0, R * Math.sin(a)]
  const B: V3 = [R * Math.cos(b), 0, R * Math.sin(b)]
  const midpoint: V3 = [(A[0] + B[0]) / 2, 0, (A[2] + B[2]) / 2]
  return { A, B, midpoint }
})
const HEX = Array.from({ length: 6 }, (_, i) => [Math.cos((TAU * i) / 6), Math.sin((TAU * i) / 6)] as const)

const depth = new Depth()
const P = Array.from({ length: 6 }, () => point())
const a = point()
const b = point()
const xy: number[] = []
const corner: V3[] = Array.from({ length: 6 }, () => [0, 0, 0])
const ring: number[] = []

export const scene: Scene = {
  beats: 5, still: 0.28,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.25 : 1.4) / view.px
    const pose = { yaw: -0.34, pitch: -0.72 }
    const lens = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h * 0.55 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    const turn = orient(pose)
    const lit = (n: V3) => {
      const v = turn(n[0], n[1], n[2])
      return v[2] > 0.001 ? lambert(v[0], v[1], v[2]) : -1
    }
    const put = (v: V3, out: Projected) => project(v[0], v[1], v[2], out)

    // The tray: its shaded floor, its inner wall where a lifted tile uncovers it, its rim and outer wall.
    xy.length = 0
    for (const [c, s] of HEX) {
      project(R * c, FLOOR, R * s, a)
      xy.push(a.x, a.y)
    }
    depth.face(xy, -300, lambert(...turn(0, 1, 0)) * 0.5)
    HEX.forEach(([c0, s0], i) => {
      const [c1, s1] = HEX[(i + 1) % 6]!
      // The inner wall faces into the tray; the outer wall faces out.
      for (const [r, y0, y1, sign, key] of [
        [R, FLOOR, 0, -1, -290],
        [R + RIM, BASE, 0, 1, -280],
      ] as const) {
        const nx = sign * (c0 + c1)
        const nz = sign * (s0 + s1)
        const light = lit([nx, 0, nz])
        if (light < 0) continue
        project(r * c0, y1, r * s0, P[0]!)
        project(r * c1, y1, r * s1, P[1]!)
        project(r * c1, y0, r * s1, P[2]!)
        project(r * c0, y0, r * s0, P[3]!)
        xy.length = 0
        for (let j = 0; j < 4; j++) xy.push(P[j]!.x, P[j]!.y)
        depth.face(xy, key, light * (sign < 0 ? 0.75 : 1))
        if (sign > 0) depth.path(xy, key + 0.5, { width: hair, alpha: 0.5, closed: true, join: 'bevel' })
      }
    })
    // The rim's top: one ring, round the outside and back round the inside, so no seam crosses it.
    ring.length = 0
    for (const r of [R + RIM, R]) {
      const order = r === R ? [0, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 0]
      for (const k of order) {
        project(r * HEX[k]![0], 0, r * HEX[k]![1], a)
        ring.push(a.x, a.y)
      }
    }
    depth.face(ring, -279, lambert(...turn(0, 1, 0)))
    xy.length = 0
    for (const [c, s] of HEX) {
      project((R + RIM) * c, 0, (R + RIM) * s, a)
      xy.push(a.x, a.y)
    }
    depth.path(xy, -278, { width: line, alpha: 0.85, closed: true, join: 'bevel' })

    // The tiles: thin slabs hinged on the rim, lifting in a wave that travels round.
    tiles.forEach((tile, i) => {
      const u = (t - i / 6 + 1) % 1
      const lift = view.ease.emphasized(span(u, 0.04, 0.25)) * (1 - view.ease.standard(span(u, 0.3, 0.57)))
      const crest = view.ease.enter(span(u, 0.16, 0.25)) * (1 - view.ease.exit(span(u, 0.25, 0.36)))
      const ang = lift * 1.25
      const m = tile.midpoint
      const reach = Math.hypot(m[0], m[2])
      // The tile's top normal, turned up about the hinge with it.
      const out = [m[0] / reach, m[2] / reach]
      const n: V3 = [out[0]! * Math.sin(ang), Math.cos(ang), out[1]! * Math.sin(ang)]
      const tip: V3 = [m[0] * (1 - Math.cos(ang)), reach * Math.sin(ang), m[2] * (1 - Math.cos(ang))]
      const top = [tile.A, tile.B, tip]
      top.forEach((v, k) => {
        corner[k]![0] = v[0]
        corner[k]![1] = v[1]
        corner[k]![2] = v[2]
        corner[k + 3]![0] = v[0] - T * n[0]
        corner[k + 3]![1] = v[1] - T * n[1]
        corner[k + 3]![2] = v[2] - T * n[2]
      })
      corner.forEach((v, k) => put(v, P[k]!))
      // Drawn over the flat tiles it rises above, then by depth.
      let zsum = 0
      for (const p of P) zsum += p.z / 6
      const key = (lift > 0.004 ? 60 : 0) + zsum
      const cx = (corner[0]![0] + corner[1]![0] + corner[2]![0]) / 3 - (T / 2) * n[0]
      const cy = (corner[0]![1] + corner[1]![1] + corner[2]![1]) / 3 - (T / 2) * n[1]
      const cz = (corner[0]![2] + corner[1]![2] + corner[2]![2]) / 3 - (T / 2) * n[2]
      // The hinge side is behind the rim, so only the top, the underside and the two free sides are drawn.
      const faces = [[0, 1, 2], [5, 4, 3], [1, 4, 5, 2], [2, 5, 3, 0]]
      for (const f of faces) {
        // Each face's outward normal, from its corners, pointed away from the slab's middle.
        const [p0, p1, p2] = [corner[f[0]!]!, corner[f[1]!]!, corner[f[2]!]!]
        const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2]
        const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2]
        let nx = uy * vz - uz * vy
        let ny = uz * vx - ux * vz
        let nz = ux * vy - uy * vx
        let fx = 0, fy = 0, fz = 0
        for (const k of f) {
          fx += corner[k]![0] / f.length
          fy += corner[k]![1] / f.length
          fz += corner[k]![2] / f.length
        }
        if (nx * (fx - cx) + ny * (fy - cy) + nz * (fz - cz) < 0) [nx, ny, nz] = [-nx, -ny, -nz]
        const light = lit([nx, ny, nz])
        if (light < 0) continue
        xy.length = 0
        for (const k of f) xy.push(P[k]!.x, P[k]!.y)
        depth.face(xy, key, light)
        depth.path(xy, key + 0.01, { width: hair, alpha: 0.55, closed: true, join: 'bevel' })
      }
      // The hinge: two knuckles on the rim, and the accent along it at the crest.
      if (!small) {
        for (const k of [0.22, 0.78]) {
          const hx = mix(tile.A[0], tile.B[0], k)
          const hz = mix(tile.A[2], tile.B[2], k)
          const dx = (tile.B[0] - tile.A[0]) * 0.07
          const dz = (tile.B[2] - tile.A[2]) * 0.07
          project(hx - dx, 0.25, hz - dz, a)
          project(hx + dx, 0.25, hz + dz, b)
          depth.path([a.x, a.y, b.x, b.y], key + 0.03, { width: (view.size < 80 ? 1.8 : 2.2) / view.px, alpha: 0.6, cap: 'butt', tone: 'c1' })
        }
      }
      if (crest > 0.005) {
        put(tile.A, a)
        put(tile.B, b)
        depth.path([a.x, a.y, b.x, b.y], key + 0.04, { width: line * 1.2, alpha: crest, tone: 'accent', cap: 'square' })
      }
    })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A travelling fold lifts the inner tips of a triangular tessellation. */
export function LoaderTessera(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
