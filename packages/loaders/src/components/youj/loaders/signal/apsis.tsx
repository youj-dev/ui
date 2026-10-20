'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'apsis', title: 'Apsis', category: 'signal', technique: 'lines',
  tags: ['orbit', 'ellipse', 'kepler', 'equal area', 'astronomy', 'satellite'],
  description: 'A small faceted satellite accelerates around an elliptical orbit and slows at its far apsis. Three equal-time swept sectors reveal equal areas around the focus, while a companion circles the moving body in an inclined plane.',
  order: 22,
  colors: [{ part: 'Swept area', mono: 'ink' }],
} satisfies LoaderMeta

/* An eccentric orbit seen from above and a little to the side, drawn as an
 * astronomer constructs it: the apsidal line dashed through both foci with a
 * tick at each apsis, the empty focus a small cross, and (when there's room)
 * twelve ticks at equal intervals of time, crowding at the far apsis and
 * spreading out near the lit central body. The satellite runs the orbit once
 * a loop by Kepler's equation, three equal-time sectors trailing it from the
 * focus, and a companion circles it in an inclined plane, passing behind it
 * and in front. The view sways a little so the orbit reads as a plane in
 * space. Every motion is a whole turn a loop, so there's no seam.
 *
 * Color: the newest swept sector is `c1`, the older ones settling to the ink. */

type V3 = [number, number, number]
const E = 0.38, A = 35, B = A * Math.sqrt(1 - E * E)
/** The orbit plane's inclination: it turns about the apsidal line. */
const TILT = 0.24, TY = -Math.sin(TILT), TZ = Math.cos(TILT)
// Newton solves eccentric anomaly, so the sweep obeys equal areas in equal time.
function anomaly(m: number) {
  let e = m
  for (let i = 0; i < 7; i++) e -= (e - E * Math.sin(e) - m) / (1 - E * Math.cos(e))
  return e
}
const orbit = (a: number, out: V3, r = 1) => { out[0] = -A * E + r * A * Math.cos(a); out[1] = r * B * Math.sin(a) * TY; out[2] = r * B * Math.sin(a) * TZ }
const depth = new Depth()
const p = point(), q = point()
const v: V3 = [0, 0, 0], w: V3 = [0, 0, 0], body: V3 = [0, 0, 0]
const sector: V3[] = Array.from({ length: 15 }, () => [0, 0, 0])
const arc: V3[] = Array.from({ length: 7 }, () => [0, 0, 0])
const xy: number[] = []

/** The satellite: an octahedron, its faces lit. */
const VERTICES: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
const FACES = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]]
const corners = VERTICES.map(() => point())

/** The central body: a faceted sphere, bands of latitude by meridians, per level of detail. */
const GLOBES = [[3, 6], [4, 8], [5, 10]].map(([bands, meridians]) => {
  const at = (i: number, j: number): V3 => {
    const lat = -Math.PI / 2 + (Math.PI * i) / bands!
    const lon = (TAU * j) / meridians!
    return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
  }
  const facets: { c: V3[]; n: V3 }[] = []
  for (let i = 0; i < bands!; i++) for (let j = 0; j < meridians!; j++) {
    const c = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
    const n: V3 = [0, 0, 0]
    for (const k of c) { n[0] += k[0] / 4; n[1] += k[1] / 4; n[2] += k[2] / 4 }
    facets.push({ c, n })
  }
  return facets
})
const facet = Array.from({ length: 4 }, () => point())

function orb(project: Project, turn: ReturnType<typeof orient>, c: V3, radius: number) {
  VERTICES.forEach(([x, y, z], i) => project(c[0] + x * radius, c[1] + y * radius, c[2] + z * radius, corners[i]!))
  for (const face of FACES) {
    const n: V3 = [0, 0, 0]
    xy.length = 0
    let z = 0
    for (const i of face) { const w = VERTICES[i]!; n[0] += w[0]; n[1] += w[1]; n[2] += w[2]; xy.push(corners[i]!.x, corners[i]!.y); z += corners[i]!.z / 3 }
    const normal = turn(...n)
    if (normal[2] > 0) depth.face(xy, z, lambert(...normal))
  }
}

export const scene: Scene = {
  beats: 6, still: 0.37,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const lod = small ? 0 : view.size < 80 ? 1 : 2
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.16 + 0.06 * Math.sin(TAU * t), pitch: -0.98 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2 + 12, cy: 50 })
    const turn = orient(pose)
    const now = TAU * t

    // The orbit, brighter and a little wider on its near side.
    const samples = small ? 40 : 80
    for (let i = 0; i < samples; i++) {
      orbit(TAU * i / samples, v); project(...v, p)
      orbit(TAU * (i + 1) / samples, v); project(...v, q)
      depth.line(p, q, hair * clamp((p.k + q.k) / 2, 0.8, 1.15) * (small ? 1.1 : 1), clamp(0.52 + (p.z + q.z) / 120, 0.26, 0.9))
    }

    if (lod > 0) {
      // The apsidal line through both foci, dashed, stopping at the central body's rim.
      const rim = 7.4
      for (const [from, to] of [[A * (1 - E) + 3.5, rim], [-rim, -A * (1 + E) - 3.5]] as const) {
        project(from, 0, 0, p); project(to, 0, 0, q)
        depth.path([p.x, p.y, q.x, q.y], -40, { width: hair * 0.8, alpha: 0.34, dash: [2.4 * hair, 2.2 * hair] })
      }
      // A tick across the orbit at each apsis, in the orbit's plane.
      for (const x of [A * (1 - E), -A * (1 + E)]) {
        project(x, -2.6 * TY, -2.6 * TZ, p); project(x, 2.6 * TY, 2.6 * TZ, q)
        depth.line(p, q, hair, 0.62)
      }
      // The empty focus: a small cross on the apsidal line.
      const f = -2 * A * E
      for (const s of [-1, 1]) {
        project(f - 1.8, -1.8 * s * TY, -1.8 * s * TZ, p); project(f + 1.8, 1.8 * s * TY, 1.8 * s * TZ, q)
        depth.line(p, q, hair, 0.55)
      }
    }
    if (lod === 2) {
      // Twelve ticks at equal intervals of time: crowded at the far apsis, spread near the focus.
      for (let k = 0; k < 12; k++) {
        const e = anomaly(TAU * k / 12)
        orbit(e, v, 0.955); project(...v, p)
        orbit(e, w, 1.045); project(...w, q)
        depth.line(p, q, hair * 0.8, clamp(0.3 + (p.z + q.z) / 160, 0.16, 0.46))
      }
    }

    // Three adjacent sectors, each the same interval of mean anomaly: equal areas.
    for (let k = 0; k < (small ? 1 : 3); k++) {
      sector[0]![0] = 0; sector[0]![1] = 0; sector[0]![2] = 0
      for (let i = 1; i < sector.length; i++) orbit(anomaly(now - (k + 1) * 0.5 + 0.5 * (i - 1) / (sector.length - 2)), sector[i]!)
      const f = projectPath(sector, project, xy)
      depth.poly(f.xy, -60 - k, (small ? 0.09 : 0.065) * (1 - k / 4), blend('c1', 'ink', k / 3))
      depth.path(f.xy, -59.5 - k, { width: hair * 0.65, alpha: 0.34 * (1 - k / 4), closed: true, join: 'round', tone: blend('c1', 'ink', k / 3) })
    }

    // The central body at the focus: a lit faceted sphere.
    const R = small ? 6.2 : 5.6
    for (const { c, n } of GLOBES[lod]!) {
      const normal = turn(...n)
      if (normal[2] <= 0) continue
      xy.length = 0
      let z = 0
      c.forEach((k, i) => { project(k[0] * R, k[1] * R, k[2] * R, facet[i]!); xy.push(facet[i]!.x, facet[i]!.y); z += facet[i]!.z / 4 })
      depth.face(xy, z, lambert(...normal))
    }

    orbit(anomaly(now), body)
    // The companion's orbit, in four arcs so the satellite hides its far side and is hidden by its near one.
    const radius = small ? 4.8 : 3.6
    if (!small) {
      for (let s = 0; s < 4; s++) {
        for (let i = 0; i < arc.length; i++) {
          const a = TAU * (s + i / (arc.length - 1)) / 4
          arc[i]![0] = body[0] + 7.5 * Math.cos(a); arc[i]![1] = body[1] + 5.5 * Math.sin(a); arc[i]![2] = body[2] + 3 * Math.sin(a)
        }
        const f = projectPath(arc, project, xy)
        depth.path(f.xy, f.z, { width: hair * 0.65, alpha: 0.32, join: 'round' })
      }
      const a = now * 3
      project(body[0] + 7.5 * Math.cos(a), body[1] + 5.5 * Math.sin(a), body[2] + 3 * Math.sin(a), p)
      depth.dot(p, 1.25 / view.px, 0.85)
    }
    orb(project, turn, body, radius)
    project(...body, p)
    // A short rim, rather than a fully accented body, marks the current observation.
    const r = radius * p.k
    depth.path([p.x - r * 0.65, p.y - r * 0.35, p.x, p.y - r * 0.72, p.x + r * 0.6, p.y - r * 0.35], p.z + radius + 0.1, { width: hair * 1.15, alpha: 1, tone: 'accent', join: 'round' })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An eccentric orbit exposes its equal-time swept areas and moving companion. */
export function LoaderApsis(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
