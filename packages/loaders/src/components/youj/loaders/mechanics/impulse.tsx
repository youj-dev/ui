'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circle, rod, type Turn, type V3 } from './machine'

export const meta = {
  id: 'impulse', title: 'Impulse', category: 'mechanics', technique: 'planes',
  tags: ['cradle', 'momentum', 'pendulums', 'collision', 'energy'],
  description: 'Five suspended metal bobs pass an impulse from one end to the other. The end bobs swing as true pendulums, striking at full speed; the centre stays quiet while the accent runs through the contacts at each impact.',
  order: 4,
  colors: [{ part: 'Strings', mono: 'ink' }],
} satisfies LoaderMeta

/* A Newton's cradle on a lit base: two bent-tube frames, each bob hung in a
 * V of strings that meet at the eye on its crown. The end bobs move as true
 * pendulums: released from rest, falling faster to strike at full speed,
 * then the far bob rises slowing to rest and falls back (one cosine, its
 * negative half on one side and its positive half on the other), so the
 * row never parks. At each strike the impulse runs through the three
 * still bobs: a short accent mark lights each contact in turn. Shadows on
 * the base follow the swinging bobs.
 *
 * Color: an end bob’s strings warm toward `c1` as it swings out and cool as it strikes, so the color passes from end to end with the impulse; the contacts still flash the accent. */

const R = 5
const GAP = 2 * R
const RAIL = 25
const LENGTH = 28
const SWING = 0.46
const POST = 40.5
const BASE = -25
const LEVELS = [
  { rows: 5, cols: 10 },
  { rows: 7, cols: 14 },
  { rows: 9, cols: 18 },
].map(({ rows, cols }) => {
  const at = (lat: number, lon: number): V3 => [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
  const facets: { vertices: V3[]; normal: V3 }[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const lat0 = -Math.PI / 2 + (Math.PI * r) / rows
    const lat1 = lat0 + Math.PI / rows
    const lon0 = (TAU * c) / cols
    const lon1 = lon0 + TAU / cols
    facets.push({ vertices: [at(lat0, lon0), at(lat0, lon1), at(lat1, lon1), at(lat1, lon0)], normal: at((lat0 + lat1) / 2, (lon0 + lon1) / 2) })
  }
  return facets
})
const depth = new Depth()
const xy: number[] = []
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const tube: V3[] = []
const p = point()
const q = point()

/** A lit box from its min and max corners: the faces toward the viewer, each outlined. */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[1, 0, 0], [[hi[0], lo[1], hi[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [hi[0], hi[1], hi[2]]]],
    [[-1, 0, 0], [[lo[0], lo[1], lo[2]], [lo[0], lo[1], hi[2]], [lo[0], hi[1], hi[2]], [lo[0], hi[1], lo[2]]]],
  ]
  for (const [n, corners] of faces) {
    const v = turn(...n)
    if (v[2] <= 0.02) continue
    corners.forEach((c, i) => {
      quad[i]![0] = c[0]!
      quad[i]![1] = c[1]!
      quad[i]![2] = c[2]!
    })
    const f = projectPath(quad, project, xy)
    depth.face(f.xy, f.z, lambert(...v))
    depth.path(f.xy, f.z + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  }
}

/** A smooth bump, 1 at u = 0 and 0 from |u| ≥ 1, with no kink at its edges. */
const bump = (u: number) => (Math.abs(u) >= 1 ? 0 : Math.cos((Math.PI / 2) * u) ** 2)

export const scene: Scene = {
  beats: 6, still: 0.43,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.15 : 1.05) / view.px
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.25 + (small ? 0 : 0.07 * Math.sin(TAU * t)), pitch: -0.2 }
    const lens = camera({ ...pose, distance: 330, cx: view.w / 2, cy: small ? 52 : 50 })
    // Below 32px the cradle fills more of the frame: the base is a line there, so there's room.
    const zoom = small ? 1.12 : 1
    const project: Project = (x, y, z, out) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient(pose)
    const facets = LEVELS[small ? 0 : large ? 2 : 1]!

    // The base, and the two bent-tube frames standing on it (front and back).
    if (!small) {
      block(project, turn, [-POST - 3.5, BASE - 4.5, -11], [POST + 3.5, BASE, 11], hair * 0.9, 0.55)
      // A step round the top of the plinth.
      if (large) {
        const f = projectPath([[-POST - 2.3, BASE + 0.02, -9.8], [POST + 2.3, BASE + 0.02, -9.8], [POST + 2.3, BASE + 0.02, 9.8], [-POST - 2.3, BASE + 0.02, 9.8]], project, xy)
        depth.path(f.xy, f.z + 0.03, { width: hair * 0.7, alpha: 0.22, closed: true })
      }
    } else rod(depth, project, [-POST - 3, BASE, 0], [POST + 3, BASE, 0], hair * 1.2, 0.7)
    for (const z of small ? [7] : [-7, 7]) {
      const bend = 4
      tube.length = 0
      tube.push([-POST, BASE, z], [-POST, RAIL - bend, z])
      for (let i = 1; i < 6; i++) tube.push([-POST + bend - bend * Math.cos((Math.PI / 2) * (i / 6)), RAIL - bend + bend * Math.sin((Math.PI / 2) * (i / 6)), z])
      tube.push([-POST + bend, RAIL, z], [POST - bend, RAIL, z])
      for (let i = 1; i < 6; i++) tube.push([POST - bend + bend * Math.sin((Math.PI / 2) * (i / 6)), RAIL - bend + bend * Math.cos((Math.PI / 2) * (i / 6)), z])
      tube.push([POST, RAIL - bend, z], [POST, BASE, z])
      const f = projectPath(tube, project, xy)
      depth.path(f.xy, f.z, { width: hair * (small ? 1.1 : 1.9), alpha: z > 0 ? (small ? 0.7 : 0.92) : 0.5, join: 'round', cap: 'butt' })
      // Collars where the tubes enter the base.
      if (!small) for (const x of [-POST, POST]) rod(depth, project, [x, BASE, z], [x, BASE + 1.6, z], hair * 3.4, z > 0 ? 0.85 : 0.45)
    }

    // One cosine drives both ends: its negative half swings the left bob, its positive half the right.
    const c = Math.cos(TAU * t)
    project(0, BASE, 0, p)
    const plinth = p.z + 0.05
    for (let i = 0; i < 5; i++) {
      const pivot = (i - 2) * GAP
      const angle = i === 0 ? -SWING * Math.max(0, c) : i === 4 ? SWING * Math.max(0, -c) : 0
      const sn = Math.sin(angle)
      const cs = Math.cos(angle)
      const x = pivot + LENGTH * sn
      const y = RAIL - LENGTH * cs
      // The strings: a V from both rails to the eye on the bob's crown.
      const eye: V3 = [x - (R + 0.7) * sn, y + (R + 0.7) * cs, 0]
      // A swinging end bob's strings warm toward its color with its swing, and cool as it falls still.
      const strings = blend('ink', 'c1', 0.85 * Math.abs(angle) / SWING)
      for (const z of small ? [0] : [-6.5, 6.5]) rod(depth, project, [pivot, RAIL, z], eye, hair * 0.75, z < 0 ? 0.38 : 0.7, strings)
      if (large) circle(depth, project, eye[0], eye[1], 0, 0.7, hair * 0.75, 0.75, 'ink', 10)
      // A bob sorts as one body at its centre's depth (its front facets never overlap each other), so
      // neighbouring bobs can't interleave facet by facet and flicker where they touch.
      const centre = project(x, y, 0, p).z
      for (const facet of facets) {
        const n = turn(...facet.normal)
        if (n[2] <= 0) continue
        facet.vertices.forEach((v, j) => {
          quad[j]![0] = x + R * v[0]
          quad[j]![1] = y + R * v[1]
          quad[j]![2] = R * v[2]
        })
        const face = projectPath(quad, project, xy)
        depth.face(face.xy, centre, lambert(...n))
      }
      // The bob's shadow on the plinth: a darker patch of the lit top, softer and wider as the bob rises.
      if (!small) {
        const lift = y - (RAIL - LENGTH)
        const spread = 1 + lift / 8
        xy.length = 0
        for (let k = 0; k < 18; k++) {
          const a = (TAU * k) / 18
          project(x + 1.6 + R * 0.9 * spread * Math.cos(a), BASE + 0.05, -2 + R * 0.7 * spread * Math.sin(a), p)
          xy.push(p.x, p.y)
        }
        depth.face(xy, plinth + i * 0.001, lambert(...turn(0, 1, 0)) * (1 - 0.16 / spread))
      }
    }

    // The impulse: at each strike, an accent mark runs through the four contacts, from the struck side.
    for (let k = 0; k < 4; k++) {
      const x = (k - 1.5) * GAP
      const width = small ? 0.055 : 0.03
      const glow = bump((t - (0.25 + k * 0.014)) / width) + bump((t - (0.75 + (3 - k) * 0.014)) / width)
      if (glow < 0.004) continue
      project(x, RAIL - LENGTH - R * 0.62, R + 0.4, p)
      project(x, RAIL - LENGTH + R * 0.62, R + 0.4, q)
      p.z = q.z = R + 10
      depth.line(p, q, hair * clamp(1.6 * glow + 0.6, 0.6, 1.9), glow, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Suspended bobs exchange an impulse, with quiet centre bobs and lit metal surfaces. */
export function LoaderImpulse(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
