'use client'

import { blend, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'datum', title: 'Datum', category: 'geometry', technique: 'lines',
  tags: ['survey', 'cartography', 'triangulation', 'map', 'terrain', 'measurement'],
  description: 'Paired bearings from a fixed baseline locate four survey corners. Their short range arcs meet at each measured site, the parcel perimeter closes, and height witnesses raise a two-facet terrain model before the survey lowers and releases in reverse order.',
  order: 54,
  colors: [{ part: 'Bearings', mono: 'ink' }],
} satisfies LoaderMeta

const SITES = [[-22, -9, 8], [8, -21, 15], [27, 6, 10], [-5, 25, 18]] as const
const ANCHORS = [[-32, -29], [32, -29]] as const
const FACETS = [[0, 1, 2], [0, 2, 3]] as const
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const heights = new Float64Array(4)

export const scene: Scene = {
  beats: 6, still: 0.63,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.2, pitch: -0.84 }
    const project = camera({ ...pose, distance: 420, cx: 50, cy: 53 })
    const turn = orient(pose)
    const clear = 1 - view.ease.exit(span(t, 0.88, 0.99))
    const lift = view.ease.standard(span(t, 0.55, 0.7)) * (1 - view.ease.standard(span(t, 0.77, 0.86)))
    project(-32, -1, -29, p); project(32, -1, -29, q)
    depth.line(p, q, hair * 1.1, 0.6)
    for (const anchor of ANCHORS) {
      project(anchor[0] - 3, -1, anchor[1], p); project(anchor[0] + 3, -1, anchor[1], q); depth.line(p, q, hair * 1.35, 0.8)
      project(anchor[0], -1, anchor[1] - 3, p); project(anchor[0], -1, anchor[1] + 3, q); depth.line(p, q, hair * 1.35, 0.8)
    }
    for (let i = 0; i < SITES.length; i++) {
      const site = SITES[i]!, start = 0.025 + i * 0.12
      const ready = view.ease.standard(span(t, start + 0.075, start + 0.13)) * clear
      const height = heights[i] = site[2] * lift
      for (let anchor = 0; anchor < 2; anchor++) {
        const a = ANCHORS[anchor]!, reach = view.ease.standard(span(t, start + anchor * 0.018, start + 0.1 + anchor * 0.018))
        const active = Math.sin(Math.PI * span(t, start, start + 0.14)) * clear
        project(a[0], 0, a[1], p); project(mix(a[0], site[0], reach), 0, mix(a[1], site[1], reach), q)
        if (reach > 0 && clear > 0) depth.line(p, q, hair * 0.8, (0.12 * ready + 0.55 * active) * clear, blend('ink', 'c1', active))
        if (!small && active > 0.002) {
          const angle = Math.atan2(site[1] - a[1], site[0] - a[0]), radius = Math.hypot(site[0] - a[0], site[1] - a[1])
          xy.length = 0; let z = 0
          for (let k = 0; k <= 10; k++) {
            const theta = angle + (k / 10 - 0.5) * 7 / radius
            project(a[0] + radius * Math.cos(theta), 0.2, a[1] + radius * Math.sin(theta), p)
            xy.push(p.x, p.y); z += p.z / 11
          }
          depth.path(xy, z + 0.1, { width: hair, alpha: active, tone: anchor === 1 ? 'accent' : 'c1' })
        }
      }
      // Ground sockets and their height witnesses remain legible when the
      // terrain sheet covers the construction below.
      for (const axis of [0, 1]) {
        project(site[0] - (axis === 0 ? 2.4 : 0), height + 0.2, site[1] - (axis === 1 ? 2.4 : 0), p)
        project(site[0] + (axis === 0 ? 2.4 : 0), height + 0.2, site[1] + (axis === 1 ? 2.4 : 0), q)
        depth.line(p, q, hair * 1.15, 0.2 + ready * 0.7)
      }
      if (lift > 0.002) {
        project(site[0], 0, site[1], p); project(site[0], height, site[1], q)
        depth.line(p, q, hair * 0.75, 0.5 * lift)
      }
    }
    const close = view.ease.standard(span(t, 0.47, 0.55)) * clear
    if (close > 0.002) {
      for (const ids of FACETS) {
        xy.length = 0; let z = 0
        for (const id of ids) { const s = SITES[id]!; project(s[0], heights[id]!, s[1], p); xy.push(p.x, p.y); z += p.z / 3 }
        const a = SITES[ids[0]!]!, b = SITES[ids[1]!]!, c = SITES[ids[2]!]!
        const ux = b[0] - a[0], uy = heights[ids[1]!]! - heights[ids[0]!]!, uz = b[1] - a[1]
        const vx = c[0] - a[0], vy = heights[ids[2]!]! - heights[ids[0]!]!, vz = c[1] - a[1]
        const n = turn(uz * vy - uy * vz, ux * vz - uz * vx, uy * vx - ux * vy)
        if (lift > 0.002) depth.face(xy, z - 0.02, lambert(...n))
        else depth.poly(xy, z - 0.02, 0.045 * close)
        depth.path(xy, z + 0.02, { width: hair * 0.75, alpha: 0.65 * close, closed: true })
      }
      for (let i = 0; i < 4; i++) {
        const a = SITES[i]!, b = SITES[(i + 1) % 4]!
        project(a[0], heights[i]! + 0.2, a[1], p)
        project(mix(a[0], b[0], close), mix(heights[i]!, heights[(i + 1) % 4]!, close) + 0.2, mix(a[1], b[1], close), q)
        depth.line(p, q, hair * 1.25, clamp(0.78 + (p.z + q.z) / 300, 0.5, 0.95) * close)
      }
    }
    depth.flush(pen)
  },
}
/* Color: the bearing being measured is drawn in `c1`, its range
 * arc too, and settles to the ink; the second station’s arc stays the
 * accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A baseline survey locates and raises a faceted parcel model. */
export function LoaderDatum(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
