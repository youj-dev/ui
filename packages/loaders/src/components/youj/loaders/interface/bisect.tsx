'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'bisect', title: 'Bisect', category: 'interface', technique: 'lines',
  tags: ['spatial index', 'kd tree', 'partition', 'median', 'search', 'dataset'],
  description: 'A spatial index divides a record field at alternating axis medians. Each divider rises only after its parent is set, leaving unequal nested search rooms; a lookup follows the actual partition decisions to one leaf, then the index withdraws from its deepest cuts.',
  order: 38,
  colors: [{ part: 'Lookup', mono: 'ink' }],
} satisfies LoaderMeta

type RecordPoint = readonly [number, number]
const RECORDS: RecordPoint[] = [[-26, -19], [-23, 6], [-18, 19], [-12, -13], [-9, 2], [-4, 18], [3, -20], [5, -5], [11, 12], [16, -15], [21, 2], [25, 18]]
interface Cut { bounds: [number, number, number, number]; axis: number; at: number; level: number; parent: number; records: RecordPoint[] }
const CUTS: Cut[] = []
function partition(records: RecordPoint[], bounds: Cut['bounds'], level: number, parent: number) {
  if (level >= 3 || records.length < 2) return
  const axis = level % 2
  const ordered = [...records].sort((a, b) => a[axis]! - b[axis]!)
  const half = Math.floor(ordered.length / 2)
  const at = (ordered[half - 1]![axis]! + ordered[half]![axis]!) / 2
  const id = CUTS.length
  CUTS.push({ bounds, axis, at, level, parent, records: ordered })
  const left: Cut['bounds'] = [...bounds], right: Cut['bounds'] = [...bounds]
  left[axis === 0 ? 1 : 3] = at; right[axis === 0 ? 0 : 2] = at
  partition(ordered.slice(0, half), left, level + 1, id)
  partition(ordered.slice(half), right, level + 1, id)
}
partition(RECORDS, [-31, 31, -25, 25], 0, -1)
const QUERY: RecordPoint = [20, 8]
const ROUTE: number[] = []
let parent = -1
while (true) {
  const index = CUTS.findIndex(cut => cut.parent === parent && QUERY[0] >= cut.bounds[0] && QUERY[0] <= cut.bounds[1] && QUERY[1] >= cut.bounds[2] && QUERY[1] <= cut.bounds[3])
  if (index < 0) break
  ROUTE.push(index); parent = index
}
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.54,
  draw(pen, t, view) {
    const small = view.size < 32
    const levels = small ? 2 : 3
    const hair = (small ? 1.05 : 0.95) / view.px
    const pose = { yaw: -0.23, pitch: -0.8 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 49 })
    const turn = orient(pose)
    xy.length = 0
    let order = 0
    for (const [x, z] of [[-31, -25], [31, -25], [31, 25], [-31, 25]]) {
      project(x!, -6, z!, p); xy.push(p.x, p.y); order += p.z / 4
    }
    depth.poly(xy, order - 0.02, 0.025, 'ink', true)
    depth.path(xy, order, { width: hair, alpha: 0.68, closed: true })

    for (const [id, cut] of CUTS.entries()) {
      if (cut.level >= levels) continue
      const { axis, at, bounds, level } = cut
      const from = 0.03 + level * 0.14
      const on = clamp(view.ease.emphasized(span(t, from, from + 0.13)))
      const off = view.ease.exit(span(t, 0.76 + (2 - level) * 0.06, 0.85 + (2 - level) * 0.06))
      const k = on * (1 - off)
      const a = axis === 0 ? bounds[2] : bounds[0], b = axis === 0 ? bounds[3] : bounds[1]
      const end = mix(a, b, on), top = -6 + 10 * k
      const pointAt = (along: number, y: number, out: typeof p) => axis === 0 ? project(at, y, along, out) : project(along, y, at, out)
      if (k > 0.004) {
        xy.length = 0
        let z = 0
        for (const [along, y] of [[a, -6], [end, -6], [end, top], [a, top]]) {
          pointAt(along!, y!, p); xy.push(p.x, p.y); z += p.z / 4
        }
        const normal = turn(axis === 0 ? 1 : 0, 0, axis === 0 ? 0 : 1)
        const sign = normal[2] < 0 ? -1 : 1
        // Paper-backed dividers hide rear records and crosscuts in depth.
        depth.face(xy, z, lambert(normal[0] * sign, normal[1] * sign, normal[2] * sign))
        depth.path(xy, z + 0.025, { width: hair * 0.75, alpha: 0.65 * k, closed: true })
      }
      const hop = ROUTE.indexOf(id)
      if (hop >= 0) {
        const lookup = view.ease.standard(span(t, 0.5 + hop * 0.065, 0.57 + hop * 0.065)) * (1 - view.ease.exit(span(t, 0.73, 0.8)))
        pointAt(a, top + 0.15, p); pointAt(mix(a, b, lookup), top + 0.15, q)
        depth.line(p, q, hair * 1.3, lookup * 0.95, hop === levels - 1 ? 'accent' : 'c1')
      }
    }
    if (!small) for (const [x, z] of RECORDS) {
      project(x - 1.6, -5.8, z, p); project(x + 1.6, -5.8, z, q)
      depth.line(p, q, hair * 0.85, clamp(0.5 + p.z / 150, 0.3, 0.72))
    }
    const found = view.ease.enter(span(t, 0.67, 0.73)) * (1 - view.ease.exit(span(t, 0.76, 0.83)))
    if (found > 0.004) {
      project(QUERY[0] - 3, -4, QUERY[1], p); project(QUERY[0] + 3, -4, QUERY[1], q)
      depth.line(p, q, hair * 1.3, found, 'accent')
      project(QUERY[0], -4, QUERY[1] - 3, p); project(QUERY[0], -4, QUERY[1] + 3, q)
      depth.line(p, q, hair, found, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Median dividers construct a spatial index and resolve one lookup.
 *
 * Color: the lookup’s path along the dividers is `c1` until its last hop, which is the accent; the field and its dividers keep the ink. */
export function LoaderBisect(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
