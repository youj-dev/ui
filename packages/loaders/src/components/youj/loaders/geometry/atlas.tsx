'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'atlas', title: 'Atlas', category: 'geometry', technique: 'lines',
  tags: ['globe', 'cartography', 'routes', 'graticule', 'great circle'],
  description: 'Two journeys trace great circles over a wireframe globe. Meridians dim behind the sphere, route wakes brighten on the near hemisphere, and the whole graticule rocks gently as the journeys pass.',
  order: 19,
  colors: [{ part: 'First journey', mono: 'ink' }, { part: 'Second journey', mono: 'ink' }],
} satisfies LoaderMeta

/* A desk globe in wire: the graticule on an axis tilted as the Earth's is,
 * held at its poles by pins in a meridian ring that comes round one side
 * and down to a pedestal on a round base. Two journeys run round great
 * circles, each drawn ahead as a faint planned route and behind as a wake
 * that brightens on the near side; each route passes two cities, which
 * light as a journey reaches them. One journey's head is the accent. Lines
 * round the back of the globe are faint, the outline (the sphere's real
 * perspective silhouette) firm, and the stand rocks the whole globe gently
 * through the loop.
 *
 * Color: each journey has its own hue, the first `c1`, the second
 * `c2`: its wake leaves in it and fades to the ink, and a city
 * glows in it as the head arrives. The first journey’s head stays the
 * accent. */

type V3 = [number, number, number]
const R = 24
const RING = 27.6
const CY = 7
const GROUND = -36
const TILT = 0.41
const AXIS: V3 = [Math.sin(TILT), Math.cos(TILT), 0]
const E1: V3 = [Math.cos(TILT), -Math.sin(TILT), 0]
const E3: V3 = [0, 0, 1]

/** A point on the globe (or at radius r) from latitude and longitude, in the globe's tilted frame. */
function sphere(lat: number, lon: number, r: number, out: V3): V3 {
  const c = Math.cos(lat)
  for (let i = 0; i < 3; i++) out[i] = r * (c * Math.cos(lon) * E1[i]! + Math.sin(lat) * AXIS[i]! + c * Math.sin(lon) * E3[i]!)
  out[1] += CY
  return out
}

/** A great circle: two unit vectors spanning its plane, in the globe's frame (as lat/lon of its node and its tilt). */
const ROUTES = [
  { node: 0.3, incline: 0.95, phase: 0, cities: [0.18, 0.62] },
  { node: 2.1, incline: -0.62, phase: 0.42, cities: [0.33, 0.8] },
].map(({ node, incline, phase, cities }) => {
  const u: V3 = [0, 0, 0]
  const v: V3 = [0, 0, 0]
  sphere(0, node, 1, u)
  u[1] -= CY
  const w: V3 = [0, 0, 0]
  sphere(0, node + Math.PI / 2, 1, w)
  w[1] -= CY
  for (let i = 0; i < 3; i++) v[i] = Math.cos(incline) * w[i]! + Math.sin(incline) * AXIS[i]!
  return { u, v, phase, cities }
})

const LEVELS = [
  { samples: 24, lats: [0], longs: 2 },
  { samples: 36, lats: [-0.6, 0, 0.6], longs: 3 },
  { samples: 48, lats: [-1.05, -0.55, 0, 0.55, 1.05], longs: 6 },
]

const depth = new Depth()
const p = point()
const q = point()
const w: V3 = [0, 0, 0]
const xy: number[] = []

export const scene: Scene = {
  beats: 5.5, still: 0.29,
  draw(pen, t, view) {
    const small = view.size < 32
    const lod = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.05 : 1) / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.2 : 1.35) / view.px
    const dash = clamp(view.size * 0.014, 2, 3.5) / view.px
    // The rock: out and back once a loop, on the theme's curve, so it rests at both turns.
    const rock = view.ease.standard(t < 0.5 ? 2 * t : 2 * (1 - t))
    // Below 32px there is no stand, so the globe alone fills the frame.
    const zoom = small ? 1.32 : 1
    const lens = camera({ yaw: 0.34 + 0.2 * rock, pitch: -0.2, distance: 300, cx: view.w / 2 + (small ? 0 : 3.5), cy: view.h / 2 + (small ? 0 : 3) })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y - CY) * zoom + (small ? 0 : CY), z * zoom, out)
    const put = (v: V3, out: Projected) => project(v[0], v[1], v[2], out)
    // Depth of the globe's centre, to tell the near hemisphere from the far one.
    project(0, CY, 0, p)
    const mid = p.z
    const near = (z: number) => clamp((z - mid) / R + 0.5)

    // The outline: the sphere's perspective silhouette, a circle round its projected centre.
    const k = p.k
    const cx = p.x
    const cy = p.y
    const radius = (R * zoom * k * 300) / Math.sqrt(300 ** 2 - (R * zoom) ** 2)
    xy.length = 0
    for (let i = 0; i < lod.samples; i++) xy.push(cx + radius * Math.cos((TAU * i) / lod.samples), cy + radius * Math.sin((TAU * i) / lod.samples))
    depth.path(xy, mid + R * 0.9, { width: line, alpha: 0.8, closed: true })

    // The graticule: parallels and meridians, faint behind, the equator firmer.
    const segment = (a: V3, b: V3, width: number, alpha: number, tone: 'ink' | 'accent' = 'ink') => {
      put(a, p)
      put(b, q)
      depth.line(p, q, width, alpha, tone)
    }
    const s0: V3 = [0, 0, 0]
    const s1: V3 = [0, 0, 0]
    for (const lat of lod.lats) {
      for (let i = 0; i < lod.samples; i++) {
        sphere(lat, (TAU * i) / lod.samples, R, s0)
        sphere(lat, (TAU * (i + 1)) / lod.samples, R, s1)
        put(s0, p)
        put(s1, q)
        const n = near((p.z + q.z) / 2)
        depth.line(p, q, hair * (lat === 0 ? 1.15 : 0.85), n < 0.5 ? 0.1 : (0.14 + 0.3 * n) * (lat === 0 ? 1.3 : 1))
      }
    }
    for (let j = 0; j < lod.longs; j++) {
      const lon = (Math.PI * j) / lod.longs
      for (let i = 0; i < lod.samples; i++) {
        sphere((TAU * i) / lod.samples, lon, R, s0)
        sphere((TAU * (i + 1)) / lod.samples, lon, R, s1)
        put(s0, p)
        put(s1, q)
        const n = near((p.z + q.z) / 2)
        depth.line(p, q, hair * 0.85, n < 0.5 ? 0.09 : 0.12 + 0.28 * n)
      }
    }

    // The stand: the meridian ring round one side, pins at the poles, the pedestal and its base.
    if (!small) {
      xy.length = 0
      let zr = 0
      const steps = 24
      for (let i = 0; i <= steps; i++) {
        const a = (Math.PI * i) / steps
        for (let c = 0; c < 3; c++) w[c] = RING * (Math.cos(a) * AXIS[c]! - Math.sin(a) * E1[c]!)
        w[1] += CY
        put(w, p)
        xy.push(p.x, p.y)
        zr += p.z / (steps + 1)
      }
      depth.path(xy, zr, { width: line, alpha: 0.75, join: 'round' })
      for (const s of [1, -1]) {
        for (let c = 0; c < 3; c++) {
          s0[c] = s * R * AXIS[c]!
          s1[c] = s * (RING + 1.2) * AXIS[c]!
        }
        s0[1] += CY
        s1[1] += CY
        segment(s0, s1, hair * 1.3, 0.8)
        put(s1, p)
        p.z += 1
        if (view.size >= 64) depth.square(p, 2.6 * hair, 0.9)
      }
      // From the ring's foot straight down to the base.
      for (let c = 0; c < 3; c++) s0[c] = -RING * AXIS[c]!
      s0[1] += CY
      s1[0] = s0[0]
      s1[1] = GROUND + 2
      s1[2] = s0[2]
      segment(s0, s1, line, 0.7)
      xy.length = 0
      for (let i = 0; i <= 36; i++) {
        const a = (TAU * i) / 36
        project(s0[0] + 13 * Math.cos(a), GROUND, s0[2] + 13 * Math.sin(a), p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -400, { width: hair, alpha: 0.5, closed: true })
      xy.length = 0
      for (let i = 0; i <= 36; i++) {
        const a = (TAU * i) / 36
        project(s0[0] + 19 * Math.cos(a), GROUND, s0[2] + 19 * Math.sin(a), p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -401, { width: hair, alpha: 0.24, closed: true, dash: [dash, dash * 0.8] })
    }

    // The journeys: a faint planned route ahead, a wake behind, two cities that light as the head reaches them.
    const at = (route: (typeof ROUTES)[number], a: number, r: number, out: V3) => {
      for (let c = 0; c < 3; c++) out[c] = r * (Math.cos(a) * route.u[c]! + Math.sin(a) * route.v[c]!)
      out[1] += CY
      return out
    }
    ROUTES.forEach((route, n) => {
      if (small && n) return
      const head = TAU * (t + route.phase)
      // Each journey's wake is its own color, fading to the ink behind it.
      const tone = n ? 'c2' : 'c1'
      const steps = lod.samples
      for (let i = 0; i < steps; i++) {
        const u = i / steps
        at(route, head - TAU * u, R + 0.25, s0)
        at(route, head - TAU * (i + 1) / steps, R + 0.25, s1)
        put(s0, p)
        put(s1, q)
        const lit = near((p.z + q.z) / 2)
        const wake = Math.max(0, 1 - u / 0.34) ** 1.3
        const planned = 0.08 + 0.14 * lit
        depth.line(p, q, hair * (wake > 0 ? 1.1 + 0.9 * wake : 0.8), Math.max(planned, (0.2 + 0.78 * wake) * (0.22 + 0.78 * lit)), blend('ink', tone, wake))
      }
      for (const city of route.cities) {
        const a = TAU * city
        at(route, a, R + 0.3, s0)
        put(s0, p)
        // How recently the head passed it: bright on arrival, settling back.
        const since = (((t + route.phase - city) % 1) + 1) % 1
        const glow = Math.max(0, 1 - since / 0.25) ** 2
        const lit = near(p.z)
        p.z += 0.5
        if (!small) depth.square(p, (2.2 + 1.4 * glow) * hair, (0.45 + 0.5 * glow) * (0.25 + 0.75 * lit), blend('ink', tone, glow))
      }
      at(route, head, R + 0.4, s0)
      put(s0, p)
      const lit = near(p.z)
      p.z += 1
      depth.dot(p, (small ? 1.5 : 2) / view.px, 0.35 + 0.65 * lit, n ? tone : 'accent')
    })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Great-circle journeys cross a depth-shaded spherical graticule. */
export function LoaderAtlas(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
