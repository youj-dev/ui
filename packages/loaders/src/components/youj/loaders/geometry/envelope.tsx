'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'envelope', title: 'Envelope', category: 'geometry', technique: 'lines',
  tags: ['convex hull', 'boundary', 'support', 'spatial', 'wrapping', 'enclosure'],
  description: 'A support ray tests inner samples and wraps the outermost sites into a convex boundary. Accepted edges join in order, the closed enclosure lifts on fine witness lines, and its perimeter unwrites back to the starting support.',
  order: 48,
  colors: [{ part: 'Boundary', mono: 'ink' }],
} satisfies LoaderMeta

type Site = readonly [number, number]
const SITES: readonly Site[] = [[-28, -14], [-8, -28], [22, -22], [30, 5], [11, 27], [-20, 22], [-8, -4], [11, 3], [-9, 13]]
const cross = (a: Site, b: Site, c: Site) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
// Gift wrapping over the actual samples: interior sites cannot enter the hull.
const HULL: number[] = []
let at = SITES.reduce((best, p, i) => p[0] < SITES[best]![0] ? i : best, 0)
const start = at
do {
  HULL.push(at)
  let next = (at + 1) % SITES.length
  for (let i = 0; i < SITES.length; i++) {
    if (i === at) continue
    if (cross(SITES[at]!, SITES[next]!, SITES[i]!) < 0) next = i
  }
  at = next
} while (at !== start)
const depth = new Depth()
const p = point(), q = point()
const ring: number[] = []

export const scene: Scene = {
  beats: 5.8, still: 0.67,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const project = camera({ yaw: -0.35, pitch: -0.92, distance: 330, cx: view.w / 2, cy: 53 })
    const lift = clamp(view.ease.emphasized(span(t, 0.62, 0.73))) * (1 - clamp(view.ease.standard(span(t, 0.76, 0.85))))
    const height = -5 + lift * 19
    const write = span(t, 0.035, 0.61) * HULL.length
    const erase = span(t, 0.84, 0.985) * HULL.length

    // Sample sockets are rings and fixed posts, with no moving point cloud.
    SITES.forEach(([x, z], i) => {
      if (small && i === 8) return
      const outer = HULL.includes(i)
      const radius = small ? 2.6 : 2
      ring.length = 0
      for (let k = 0; k < 8; k++) {
        const a = TAU * k / 8
        project(x + radius * Math.cos(a), -5, z + radius * Math.sin(a), p)
        ring.push(p.x, p.y)
      }
      project(x, -5, z, p)
      const near = clamp(0.78 + p.z / 150, 0.5, 1)
      depth.poly(ring, p.z, 0.035, 'ink', true)
      depth.path(ring, p.z + 0.02, { width: hair * 0.8, alpha: (outer ? 0.72 : 0.38) * near, closed: true })
      if (!small) {
        project(x, -10, z, q)
        depth.line(p, q, hair * 0.7, near * 0.28)
      }
    })

    HULL.forEach((a, i) => {
      const b = HULL[(i + 1) % HULL.length]!
      const A = SITES[a]!, B = SITES[b]!
      const enter = clamp(view.ease.standard(span(clamp(write - i), 0.3, 1)))
      const exit = clamp(view.ease.exit(clamp(erase - (HULL.length - 1 - i))))
      const k = enter * (1 - exit)
      project(A[0], -5, A[1], p)
      project(B[0], -5, B[1], q)
      depth.line(p, q, hair * 0.65, 0.13)
      if (k > 0.003) {
        project(A[0], height, A[1], p)
        project(mix(A[0], B[0], k), height, mix(A[1], B[1], k), q)
        // Each accepted edge joins in the boundary's color and settles part of the way to the ink.
        depth.line(p, q, hair * (small ? 1.12 : 1.2) * (p.k + q.k) / 2, clamp(0.8 + (p.z + q.z) / 280, 0.55, 0.95), blend('c1', 'ink', 0.55 * k))
        if (lift > 0.003) {
          project(A[0], -5, A[1], q)
          depth.line(p, q, hair * 0.7, lift * 0.4)
        }
        if (i === HULL.length - 1 && lift > 0.003) {
          project(mix(A[0], B[0], 0.78), height, mix(A[1], B[1], 0.78), p)
          project(B[0], height, B[1], q)
          depth.line(p, q, hair * 1.4, lift, 'accent')
        }
      }

      // A tentative interior ray pivots onto the accepted exterior edge.
      // Its end moves; the already certified edges remain fixed.
      const u = write - i
      if (u > 0 && u < 1 && t < 0.62) {
        const C = SITES[6 + i % 3]!
        const choose = clamp(view.ease.emphasized(span(u, 0.05, 0.55)))
        const x = mix(C[0], B[0], choose), z = mix(C[1], B[1], choose)
        const shown = Math.sin(Math.PI * u) ** 2
        project(A[0], -3, A[1], p)
        project(x, -3, z, q)
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.1, { width: hair * 0.8, alpha: shown * 0.65, dash: small ? undefined : [3 * hair, 2 * hair] })
        project(mix(A[0], x, 0.76), -3, mix(A[1], z, 0.76), p)
        depth.line(p, q, hair * 1.6, shown, 'accent')
      }
    })

    if (!small) {
      for (const [x, z] of [[-34, -33], [34, -33], [34, 33], [-34, 33]] as const) {
        project(x, -10, z, p)
        project(x - Math.sign(x) * 4, -10, z, q)
        depth.line(p, q, hair * 0.75, 0.25)
        project(x, -10, z - Math.sign(z) * 4, q)
        depth.line(p, q, hair * 0.75, 0.25)
      }
    }
    depth.flush(pen)
  },
}

/* Color: each accepted hull edge joins in `c1` and settles part
 * way to the ink, so the enclosure holds a quiet tint; the lift witnesses
 * and perimeter stay the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A convex support wraps a sample field and lifts its certified enclosure. */
export function LoaderEnvelope(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
