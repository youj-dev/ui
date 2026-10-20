'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'fathom', title: 'Fathom', category: 'interface', technique: 'lines',
  tags: ['graph', 'search', 'breadth first', 'frontier', 'route', 'discovery'],
  description: 'A search frontier discovers a spatial graph one hop at a time. Visited stations lift off their ghost sockets, cross-links reveal cycles, and the reached destination traces its shortest route back to the source before the search releases.',
  order: 13,
  colors: [{ part: 'Scan', mono: 'ink' }],
} satisfies LoaderMeta

/* Stations are discs on posts: undiscovered, a ring at rest; reached, the
 * disc lifts off its ghost socket, takes a filled core and sends one ring
 * out. The search scans each edge from its nearer end: an edge of the BFS
 * tree is drawn solid with a chevron pointing away from the source, a
 * cross-link (a cycle closing) dashed. The reached destination's core takes
 * the accent, the shortest route is traced back to the source in a heavy
 * line led by an accent front, and the search releases in reverse depth.
 *
 * Color: the scan, each link as it’s explored and the ring each station sends out, is `c1`; the shortest route back is the ink, its front the accent. */

type V3 = [number, number, number]
const NODES: V3[] = [[-28, -24, 6], [-31, 0, -3], [-10, -21, -9], [-9, 6, 9], [8, -16, 8], [26, -25, -2], [28, -1, 8], [12, 15, -10], [-15, 29, -2], [30, 29, 0], [-31, 20, 4]]
const EDGES = [[0, 1], [0, 2], [1, 3], [1, 10], [2, 3], [2, 4], [3, 7], [3, 8], [4, 6], [4, 5], [5, 6], [6, 7], [6, 9], [7, 9], [7, 8], [8, 10]] as const
// Discover once at module load: the scene animates a real BFS result.
const hops = NODES.map(() => Infinity)
const parents = NODES.map(() => -1)
const queue = [0]
hops[0] = 0
for (let at = 0; at < queue.length; at++) for (const [a, b] of EDGES) {
  const from = queue[at]!, to = a === from ? b : b === from ? a : -1
  if (to < 0 || hops[to]! < Infinity) continue
  hops[to] = hops[from]! + 1; parents[to] = from; queue.push(to)
}
const route: number[] = [9]
while (parents[route[route.length - 1]!]! >= 0) route.push(parents[route[route.length - 1]!]!)
/** Each edge, scanned from its nearer end; a tree edge is the one that discovered its far end. */
const LINKS = EDGES.map(([a, b]) => {
  const from = hops[a]! <= hops[b]! ? a : b, to = from === a ? b : a
  return { from, to, tree: parents[to] === from }
})
const DEST = 9
const depth = new Depth()
const world: V3[] = NODES.map(() => [0, 0, 0])
const ring: V3[] = Array.from({ length: 25 }, () => [0, 0, 0])
const xy: number[] = []
const p = point(), q = point(), r = point()

export const scene: Scene = {
  beats: 6, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.27, pitch: -0.24, distance: 340, cx: view.w / 2, cy: 50 })
    const radius = small ? 3.6 : 3.2
    const included = (i: number) => !small || (i !== 5 && i !== 8 && i !== 10)
    // A station is reached as the scan arrives and released in reverse depth; both moves rest to rest.
    const ready = (i: number) => view.ease.standard(span(t, 0.03 + hops[i]! * 0.115, 0.11 + hops[i]! * 0.115)) * (1 - view.ease.standard(span(t, 0.82 + (4 - hops[i]!) * 0.016, 0.92 + (4 - hops[i]!) * 0.016)))
    const release = 1 - view.ease.standard(span(t, 0.79, 0.88))
    NODES.forEach(([x, y, z], i) => { const k = ready(i); world[i]![0] = x; world[i]![1] = y + k * 3.2; world[i]![2] = z + k * 3 })
    const ends = (A: V3, B: V3, out: [V3, V3]) => {
      const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], len = Math.hypot(dx, dy, dz)
      const trim = (radius + 0.3) / len
      out[0] = [A[0] + dx * trim, A[1] + dy * trim, A[2] + dz * trim]
      out[1] = [B[0] - dx * trim, B[1] - dy * trim, B[2] - dz * trim]
      return out
    }
    const seg: [V3, V3] = [[0, 0, 0], [0, 0, 0]]
    for (const { from, to, tree } of LINKS) {
      if (!included(from) || !included(to)) continue
      const [start, end] = ends(world[from]!, world[to]!, seg)
      const f = projectPath([start, end], project, xy)
      depth.path(f.xy, f.z, { width: hair * 0.7, alpha: 0.17 })
      // The scan runs from the nearer station to the farther, and stays drawn until the search releases.
      const scan = view.ease.standard(span(t, 0.065 + hops[from]! * 0.115, 0.15 + hops[from]! * 0.115))
      if (scan <= 0 || release <= 0) continue
      project(...start, p)
      project(mix(start[0], end[0], scan), mix(start[1], end[1], scan), mix(start[2], end[2], scan), q)
      depth.path([p.x, p.y, q.x, q.y], f.z + 0.02, { width: hair, alpha: 0.72 * release, tone: 'c1', dash: tree || small ? undefined : [2.2 * hair, 1.8 * hair] })
      // A tree edge carries a chevron midway, pointing away from the source, once the scan has passed it.
      const mark = span(scan, 0.55, 0.8) * release
      if (tree && view.size >= 56 && mark > 0) {
        const u = 0.56
        project(mix(start[0], end[0], u), mix(start[1], end[1], u), mix(start[2], end[2], u), p)
        project(mix(start[0], end[0], u - 0.08), mix(start[1], end[1], u - 0.08), mix(start[2], end[2], u - 0.08), q)
        const dx = p.x - q.x, dy = p.y - q.y, l = Math.hypot(dx, dy) || 1
        const s = Math.max(1.9, 2.2 * hair)
        const ux = dx / l, uy = dy / l
        depth.path([p.x - s * (ux - uy * 0.8), p.y - s * (uy + ux * 0.8), p.x, p.y, p.x - s * (ux + uy * 0.8), p.y - s * (uy - ux * 0.8)], f.z + 0.03, { width: hair, alpha: 0.85 * mark, join: 'miter' })
      }
    }
    // The shortest route traces back from the destination to the source in a heavy line, an accent front leading it.
    const clear = 1 - view.ease.exit(span(t, 0.8, 0.9))
    for (let k = 0; k < route.length - 1; k++) {
      const [start, end] = ends(world[route[k]!]!, world[route[k + 1]!]!, seg)
      const draw = view.ease.standard(span(t, 0.58 + k * 0.055, 0.645 + k * 0.055))
      if (draw <= 0 || clear <= 0) continue
      project(...start, p); project(mix(start[0], end[0], draw), mix(start[1], end[1], draw), mix(start[2], end[2], draw), q)
      const z = (p.z + q.z) / 2 + 0.05
      depth.path([p.x, p.y, q.x, q.y], z, { width: hair * 1.7, alpha: 0.95 * clear, cap: 'round' })
      const front = Math.sin(Math.PI * draw) * clear
      if (front > 0.01) {
        const back = clamp(draw - 0.35)
        project(mix(start[0], end[0], back), mix(start[1], end[1], back), mix(start[2], end[2], back), r)
        depth.path([r.x, r.y, q.x, q.y], z + 0.01, { width: hair * 1.9, alpha: front, tone: 'accent', cap: 'round' })
      }
    }
    NODES.forEach((node, i) => {
      if (!included(i)) return
      const k = ready(i), c = world[i]!
      const circle = (v: V3, rr: number) => {
        for (let j = 0; j < ring.length; j++) {
          const a = TAU * j / (ring.length - 1)
          ring[j]![0] = v[0] + rr * Math.cos(a); ring[j]![1] = v[1] + rr * Math.sin(a); ring[j]![2] = v[2] + 0.1
        }
        return projectPath(ring, project, xy)
      }
      // The ghost socket it lifts off, and the post between them.
      if (!small && k > 0.004) {
        const g = circle(node, radius)
        depth.path(g.xy, g.z, { width: hair * 0.65, alpha: 0.2 * span(k, 0, 0.4), closed: true })
        project(...node, p); project(...c, q)
        depth.line(p, q, hair * 0.6, 0.3 * k)
      }
      // The disc: it knocks out the lines beneath it; its rim brightens and a filled core grows as it's reached.
      const f = circle(c, radius)
      const step = route.indexOf(i)
      const onRoute = step < 0 ? 0 : view.ease.standard(span(t, 0.58 + Math.max(0, step - 1) * 0.055, 0.645 + Math.max(0, step - 1) * 0.055)) * clear
      depth.poly(f.xy, f.z + 0.2, k * 0.1, 'ink', true)
      depth.path(f.xy, f.z + 0.22, { width: hair * (1 + 0.4 * onRoute), alpha: 0.32 + 0.6 * k, closed: true })
      if (i === 0 && !small) {
        const o = circle(c, radius + 1.5)
        depth.path(o.xy, o.z + 0.22, { width: hair * 0.7, alpha: 0.3 + 0.3 * k, closed: true })
      }
      const core = (small ? 1.6 : 1.2) * view.ease.standard(span(k, 0.15, 1))
      if (core > 0.02) {
        project(...c, p)
        const reached = i === DEST ? view.ease.standard(span(t, 0.5, 0.58)) * clear : 0
        depth.square({ x: p.x, y: p.y, z: f.z + 0.25, k: 1 }, 2 * core, 0.9)
        if (reached > 0.01) depth.square({ x: p.x, y: p.y, z: f.z + 0.26, k: 1 }, 2 * core, reached, 'accent')
      }
      // Discovery sends one ring out from the station.
      if (!small) {
        const pulse = span(t, 0.03 + hops[i]! * 0.115, 0.16 + hops[i]! * 0.115)
        if (pulse > 0 && pulse < 1) {
          const o = circle(c, radius + 4.5 * view.ease.enter(pulse))
          depth.path(o.xy, o.z + 0.15, { width: hair * 0.7, alpha: 0.4 * (1 - pulse), tone: 'c1', closed: true })
        }
      }
    })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A breadth-first discovery lifts a graph and resolves a shortest return route. */
export function LoaderFathom(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
