'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule } from './computing'

export const meta = {
  id: 'medoid', title: 'Medoid', category: 'interface', technique: 'lines',
  tags: ['clustering', 'dataset', 'exemplar', 'partition', 'distance', 'training'],
  description: 'Record tiles assign themselves to three exemplars through distance spokes. Each cluster elects the actual record with the least total distance, the spokes transfer to their new hubs, and fitted enclosures close around the groups before the assignment releases.',
  order: 21,
  colors: [{ part: 'Membership', mono: 'ink' }],
} satisfies LoaderMeta

type Site = [number, number]
type V3 = [number, number, number]
const GROUPS: Site[][] = [
  [[-29, -17], [-18, -23], [-16, -12], [-23, -10], [-10, -21]],
  [[24, -19], [12, -17], [18, -5], [27, -9], [9, -6]],
  [[-8, 24], [4, 16], [7, 28], [-3, 11], [16, 20]],
]
const distance = (a: Site, b: Site) => Math.hypot(a[0] - b[0], a[1] - b[1])
const cross = (a: Site, b: Site, c: Site) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
function hull(sites: Site[]) {
  const sorted = [...sites].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const half = (points: Site[]) => {
    const edge: Site[] = []
    for (const p of points) {
      while (edge.length > 1 && cross(edge[edge.length - 2]!, edge[edge.length - 1]!, p) <= 0) edge.pop()
      edge.push(p)
    }
    edge.pop()
    return edge
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

// A real assign/update step per detail level. The elected hub is a record,
// never a centroid floating somewhere that the dataset does not contain.
const LEVELS = [3, 4, 5].map((count) => {
  const sites = GROUPS.flatMap((group) => group.slice(0, count))
  const seeds = [0, count, count * 2]
  const assign = (centers: number[]) => sites.map((p) => {
    let best = 0
    for (let k = 1; k < centers.length; k++) if (distance(p, sites[centers[k]!]!) < distance(p, sites[centers[best]!]!)) best = k
    return best
  })
  const membership = assign(seeds)
  const elected = seeds.map((seed, k) => {
    const members = sites.map((_, i) => i).filter((i) => membership[i] === k)
    let best = seed, cost = Infinity
    for (const candidate of members) {
      const total = members.reduce((sum, i) => sum + distance(sites[candidate]!, sites[i]!), 0)
      if (total < cost) { best = candidate; cost = total }
    }
    return best
  })
  const final = assign(elected)
  const enclosures = elected.map((_, k) => {
    const members = sites.filter((_, i) => final[i] === k)
    const center = sites[elected[k]!]!
    return hull(members).map(([x, z]): V3 => [center[0] + (x - center[0]) * 1.2, 0, center[1] + (z - center[1]) * 1.2])
  })
  return { sites, seeds, elected, membership, final, enclosures }
})
const depth = new Depth()
const xy: number[] = []
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const hubs: V3[] = Array.from({ length: 3 }, () => [0, 0, 0])
const p = point()
const BED: V3[] = [[-35, 0, -30], [34, 0, -30], [34, 0, 34], [-35, 0, 34]]

export const scene: Scene = {
  beats: 6, still: 0.6,
  draw(pen, t, view) {
    const small = view.size < 32
    const level = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const { sites, seeds, elected, membership, final, enclosures } = level
    const pose = { yaw: -0.25, pitch: -0.98 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: 50 })
    const turn = orient(pose)
    const hair = (small ? 1.05 : 1) / view.px
    const reset = 1 - view.ease.exit(span(t, 0.78, 0.97))
    const update = view.ease.emphasized(span(t, 0.3, 0.46)) * reset
    const assigned = view.ease.standard(span(t, 0.04, 0.27)) * reset
    const enclosure = view.ease.standard(span(t, 0.47, 0.64)) * (1 - view.ease.exit(span(t, 0.74, 0.88)))
    const bed = projectPath(BED, project, xy)
    depth.poly(bed.xy, -100, 0.025)
    if (!small) depth.path(bed.xy, -99, { width: hair * 0.65, alpha: 0.2, closed: true })

    seeds.forEach((seed, k) => {
      const a = sites[seed]!, b = sites[elected[k]!]!
      hubs[k]![0] = mix(a[0], b[0], update)
      hubs[k]![1] = 2.2 + 6 * assigned
      hubs[k]![2] = mix(a[1], b[1], update)
    })
    sites.forEach(([x, z], i) => {
      const from = membership[i]!, to = final[i]!
      const a = hubs[from]!, b = hubs[to]!
      const hx = mix(a[0], b[0], update), hz = mix(a[2], b[2], update)
      const grow = view.ease.standard(span(t, 0.06 + (i % 5) * 0.022, 0.21 + (i % 5) * 0.022)) * reset
      if (grow > 0.004) rule(depth, project, hx, a[1], hz, mix(hx, x, grow), mix(a[1], 1, grow), mix(hz, z, grow), hair * 0.75, 0.55 * grow, 'c1')

      // Records stay in place. The elected record rises on its own witness;
      // only the distance hub travels during the exemplar handover.
      const selected = elected.includes(i) ? update : seeds.includes(i) ? assigned * (1 - update) : 0
      const y = 1 + 2.6 * selected
      const w = small ? 3.1 : 2.35, d = small ? 2.3 : 1.8
      for (let j = 0; j < 4; j++) { quad[j]![0] = x + (j === 0 || j === 3 ? -w : w); quad[j]![1] = y; quad[j]![2] = z + (j < 2 ? -d : d) }
      const tile = projectPath(quad, project, xy)
      depth.face(tile.xy, tile.z, lambert(...turn(0, 1, 0)) * (0.62 + selected * 0.32))
      depth.path(tile.xy, tile.z + 0.03, { width: hair * (selected > 0.5 ? 1.2 : 0.85), alpha: clamp(0.72 + tile.z / 180), closed: true })
      if (!small) rule(depth, project, x - w * 0.6, y + 0.05, z, x + w * 0.4, y + 0.05, z, hair * 0.7, 0.65)
    })

    for (let k = 0; k < 3; k++) {
      if (enclosure > 0.004) {
        const boundary = projectPath(enclosures[k]!, project, xy)
        const n = boundary.xy.length / 2
        // Each enclosure draws edge by edge; it does not materialize as a fill.
        for (let j = 0; j < n; j++) {
          const u = clamp(enclosure * n - j), next = (j + 1) % n
          if (u <= 0) continue
          depth.path([xy[j * 2]!, xy[j * 2 + 1]!, mix(xy[j * 2]!, xy[next * 2]!, u), mix(xy[j * 2 + 1]!, xy[next * 2 + 1]!, u)], boundary.z, { width: hair, alpha: 0.6 * enclosure })
        }
      }
      const hub = hubs[k]!
      if (assigned <= 0.004) continue
      const r = small ? 3.7 : 3.1
      for (let j = 0; j < 4; j++) { quad[j]![0] = hub[0] + (j === 0 || j === 3 ? -r : r); quad[j]![1] = hub[1]; quad[j]![2] = hub[2] + (j < 2 ? -r : r) }
      const frame = projectPath(quad, project, xy)
      depth.poly(frame.xy, frame.z, 0.06, 'ink', true)
      depth.path(frame.xy, frame.z + 0.03, { width: hair * 1.2, alpha: assigned, closed: true })
      rule(depth, project, hub[0], 0, hub[2], hub[0], hub[1], hub[2], hair * 0.75, 0.38 * assigned)
      if (k === 1) {
        project(hub[0] - r, hub[1], hub[2] + r, p)
        const x0 = p.x, y0 = p.y, z0 = p.z
        project(hub[0] + r, hub[1], hub[2] + r, p)
        depth.path([x0, y0, p.x, p.y], (z0 + p.z) / 2 + 0.05, { width: hair * 1.4, alpha: assigned, tone: 'accent' })
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Distance spokes transfer from seed records to elected cluster exemplars.
 *
 * Color: the membership spokes, each site’s line to its hub, are `c1` as they grow and re-route; the sites, hubs and enclosures keep the ink, one hub’s edge the accent. */
export function LoaderMedoid(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
