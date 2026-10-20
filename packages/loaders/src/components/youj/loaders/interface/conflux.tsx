'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, polylineLength, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'conflux', title: 'Conflux', category: 'interface', technique: 'lines',
  tags: ['graph', 'fork', 'join', 'parallel', 'dependency', 'concurrent', 'progress'],
  description: 'An incoming request fans into three concurrent routes, whose checkpoints finish at different times. The join waits for every branch, closes its accent ring and releases the outgoing response before the network clears for the next request.',
  order: 10,
  colors: [{ part: 'Routes', mono: 'ink' }, { part: 'Checkpoints', mono: 'ink', role: 'success' }],
} satisfies LoaderMeta

/* A fork and a join in a shallow depth: the request arrives at the fork
 * (the accent), fans into three routes that bow through depth to their
 * checkpoints, and each route returns to the join. Every station is a ring
 * on a paper disc, so routes meet it at its rim; a station lights as its
 * route arrives (its rim firming, its core growing, a checkpoint's tick
 * drawing on), and the head of every route in flight is a small square.
 * The join closes its accent ring a third per returning branch, and only
 * then does the response leave. Then everything clears for the next one.
 *
 * Color: the branches in flight run in `c1`, and each checkpoint’s tick draws on in `c2` (success) as it’s reached; the joined ring and the response stay the accent. */

type V3 = [number, number, number]
interface Route { points: V3[]; from: number; to: number; accent: boolean }
const route = (start: V3, end: V3, from: number, to: number, accent = false): Route => ({
  points: Array.from({ length: 25 }, (_, i) => {
    const u = i / 24
    const smooth = u * u * (3 - 2 * u)
    return [mix(start[0], end[0], u), mix(start[1], end[1], smooth), mix(start[2], end[2], smooth)]
  }), from, to, accent,
})
const checkpoints: V3[] = [[0, 27, -8], [0, 0, 9], [0, -27, -8]]
const stations: V3[] = [[-26, 0, 0], ...checkpoints, [26, 0, 0]]
const routes: Route[] = [route([-40, 0, 0], [-26, 0, 0], 0.02, 0.14, true)]
checkpoints.forEach((c, i) => {
  routes.push(route([-26, 0, 0], c, 0.16 + i * 0.045, 0.31 + i * 0.07))
  routes.push(route(c, [26, 0, 0], 0.33 + i * 0.07, 0.48 + i * 0.07))
})
routes.push(route([26, 0, 0], [40, 0, 0], 0.68, 0.83, true))
/** When each station is reached: the fork by the request, each checkpoint by its route; the join closes by thirds. */
const ARRIVED = [0.14, 0.31, 0.38, 0.45]
const depth = new Depth()
const ring: V3[] = Array.from({ length: 33 }, () => [0, 0, 0])
const join: V3[] = Array.from({ length: 33 }, () => [0, 0, 0])
const fragment: V3[] = []
const xy: number[] = []
const p = point()

export const scene: Scene = {
  beats: 6, still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const head = clamp(view.size * 0.03, 2.2, 4.4) / view.px
    const project = camera({ yaw: -0.28, pitch: -0.32, distance: 270, cx: view.w / 2, cy: 50 })
    const clear = 1 - view.ease.exit(span(t, 0.87, 0.97))
    // Routes sit under every station: a station's paper disc covers their ends, so they meet it at its rim.
    for (const r of routes) {
      const f = projectPath(r.points, project, xy)
      depth.path(f.xy, -100 + f.z * 0.01, { width: hair * 0.8, alpha: 0.22, join: 'round' })
      const progress = view.ease.standard(span(t, r.from, r.to))
      if (progress <= 0 || clear <= 0) continue
      fragment.length = 0
      const at = progress * (r.points.length - 1)
      const whole = Math.floor(at)
      for (let i = 0; i <= whole; i++) fragment.push(r.points[i]!)
      if (whole < r.points.length - 1) {
        const a = r.points[whole]!, b = r.points[whole + 1]!
        fragment.push([mix(a[0], b[0], at - whole), mix(a[1], b[1], at - whole), mix(a[2], b[2], at - whole)])
      }
      const active = projectPath(fragment, project, xy)
      depth.path(active.xy, -99 + active.z * 0.01, { width: hair * 1.35, alpha: (r.accent ? 0.95 : 0.75) * clear, tone: r.accent ? 'accent' : 'c1', join: 'round' })
      // The head of a route in flight, fading as it reaches its station.
      const flight = Math.sin(Math.PI * clamp(progress * 1.06)) * clear
      if (!small && flight > 0.01 && progress < 1) {
        const tip = fragment[fragment.length - 1]!
        project(tip[0], tip[1], tip[2], p)
        p.z = -98
        depth.square(p, head, flight, r.accent ? 'accent' : 'c1')
      }
    }
    // Stations: rings on paper discs. Each lights as it's reached: the rim firms, the core grows, a checkpoint's tick draws on.
    stations.forEach(([x, y, z], j) => {
      const radius = j === 0 || j === 4 ? 4.6 : 5.2
      for (let i = 0; i < ring.length; i++) {
        const a = TAU * i / (ring.length - 1)
        ring[i]![0] = x + radius * Math.cos(a); ring[i]![1] = y + radius * Math.sin(a); ring[i]![2] = z + 0.5
      }
      const f = projectPath(ring, project, xy)
      const key = 100 + f.z * 0.01
      depth.poly(f.xy, key, 0.05, 'ink', true)
      depth.path(f.xy, key + 0.001, { width: hair, alpha: 0.55, closed: true })
      if (j === 4) {
        // Each returned branch closes one third; the outgoing edge waits for all three.
        let fraction = 0
        for (let branch = 0; branch < 3; branch++) fraction += view.ease.standard(span(t, 0.48 + branch * 0.07, 0.53 + branch * 0.07)) / 3
        if (fraction > 0 && clear > 0) {
          for (let i = 0; i < join.length; i++) {
            const a = -Math.PI / 2 + TAU * fraction * i / (join.length - 1)
            join[i]![0] = x + radius * Math.cos(a); join[i]![1] = y + radius * Math.sin(a); join[i]![2] = z + 0.6
          }
          const arc = projectPath(join, project, xy)
          depth.path(arc.xy, key + 0.003, { width: hair * 1.6, alpha: clear, tone: 'accent', cap: 'round' })
        }
        // Its core grows once the ring is whole, as the response leaves.
        const done = view.ease.standard(span(t, 0.64, 0.7)) * clear
        if (!small && done > 0.01) core(x, y, z, 1.6 * done, 0.9 * done, 'accent', key + 0.004)
        return
      }
      const ready = view.ease.standard(span(t, ARRIVED[j]!, ARRIVED[j]! + 0.06)) * clear
      if (ready <= 0.004) return
      depth.path(f.xy, key + 0.002, { width: hair * 1.6, alpha: ready, closed: true })
      if (j === 0) {
        if (!small) core(x, y, z, 1.6 * ready, 0.9 * ready, 'ink', key + 0.003)
      } else if (view.size >= 40) {
        const tick = projectPath([[x - 1.9, y, z + 0.6], [x - 0.4, y - 1.6, z + 0.6], [x + 2.1, y + 1.9, z + 0.6]], project, xy)
        const length = polylineLength(tick.xy)
        depth.path(tick.xy, key + 0.003, { width: hair * 0.9, alpha: Math.min(1, ready * 1.5), tone: 'c2', join: 'round', cap: 'round', dash: [length * ready, length + 1] })
      }
    })

    /** A station's lit core: a small disc at its centre. */
    function core(x: number, y: number, z: number, r: number, alpha: number, tone: 'ink' | 'accent', key: number) {
      for (let i = 0; i < ring.length; i++) {
        const a = TAU * i / (ring.length - 1)
        ring[i]![0] = x + r * Math.cos(a); ring[i]![1] = y + r * Math.sin(a); ring[i]![2] = z + 0.7
      }
      const c = projectPath(ring, project, xy)
      depth.poly(c.xy, key, alpha, tone)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three concurrent routes rendezvous before the joined response can leave. */
export function LoaderConflux(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
