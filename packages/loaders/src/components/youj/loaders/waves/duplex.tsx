'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, point, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { block, brightness, cylinder, detail, edge, frame, hairline, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'duplex',
  title: 'Duplex',
  category: 'waves',
  technique: 'planes',
  tags: ['interference', 'surface', 'ripple', 'coherent', 'water', 'superposition', '3d'],
  description: 'Two fixed exciters send coherent ripples across a lit square surface. Their heights add into moving crests and quiet corridors; a sparse wire skin reveals the cancellation while two small emitter rims breathe out of phase.',
  order: 3,
  colors: [{ part: 'Second exciter', mono: 'ink' }],
} satisfies LoaderMeta

const LEVELS = [5, 8, 13].map((n) => ({ n, grid: Array.from({ length: (n + 1) ** 2 }, () => [0, 0, 0] as V3) }))
const ring = Array.from({ length: 33 }, () => [0, 0, 0] as V3)
const xy: number[] = []
const p = point()
const depth = new Depth()
const sources = [-12, 12]

function height(x: number, z: number, t: number) {
  let y = 0
  for (const sx of sources) {
    const d = Math.hypot(x - sx, z)
    y += 3.7 * Math.sin(TAU * (d / 17 - 2 * t)) / (1 + d / 44)
  }
  return y * Math.max(0, 1 - (Math.max(Math.abs(x), Math.abs(z)) / 33) ** 6)
}

/* Color: the second exciter’s ripples are `c1`, paired with the
 * first’s accent; the lit surface stays the ink. */

export const scene: Scene = {
  beats: 5,
  still: 0.21,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { n, grid } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = -0.34 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.7
    const project = camera({ yaw, pitch, distance: 280, cx: view.w / 2, cy: 51 })
    const turn = orient({ yaw, pitch })
    for (let iz = 0; iz <= n; iz++) {
      for (let ix = 0; ix <= n; ix++) {
        const v = grid[iz * (n + 1) + ix]!
        v[0] = -28 + 56 * ix / n
        v[2] = -28 + 56 * iz / n
        v[1] = height(v[0], v[2], u)
      }
    }
    // Each cell is a genuinely lit plane with a normal from its current slope.
    for (let iz = 0; iz < n; iz++) {
      for (let ix = 0; ix < n; ix++) {
        const a = grid[iz * (n + 1) + ix]!
        const b = grid[iz * (n + 1) + ix + 1]!
        const c = grid[(iz + 1) * (n + 1) + ix + 1]!
        const d = grid[(iz + 1) * (n + 1) + ix]!
        const step = 56 / n
        const light = lambert(...turn(-(b[1] + c[1] - a[1] - d[1]) / (2 * step), 1, -(c[1] + d[1] - a[1] - b[1]) / (2 * step)))
        xy.length = 0
        let z = 0
        for (let j = 0; j < 4; j++) {
          const v = j === 0 ? a : j === 1 ? b : j === 2 ? c : d
          project(...v, p)
          xy.push(p.x, p.y)
          z += p.z
        }
        depth.face(xy, z / 4, light * 0.75)
        // Fine cell edges follow their own face, so the solid never hides its skin.
        depth.path(xy, z / 4 + 0.05, { width: hair * 0.8, alpha: brightness(z / 4) * 0.85, closed: true })
      }
    }
    for (let s = 0; s < 2; s++) {
      const sx = sources[s]!
      const breath = view.ease.standard(0.5 - 0.5 * Math.cos(TAU * (2 * u + s * 0.5)))
      for (let i = 0; i < ring.length; i++) {
        const a = TAU * i / (ring.length - 1)
        const x = sx + (2.1 + 0.6 * breath) * Math.cos(a)
        const z = (2.1 + 0.6 * breath) * Math.sin(a)
        const v = ring[i]!
        v[0] = x
        v[1] = height(x, z, u) + 1.2
        v[2] = z
      }
      wire(depth, project, ring, hair * 1.2, 0.95, s === 0 ? 'accent' : 'c1')
    }
    // The tank: a lit frame round the surface, its walls just above the highest crest.
    frame(depth, project, turn, 28.3, 3.4, 9, 5.5, hair * 0.9, { bevel: lod === 2 ? 0.7 : 0 })
    // The exciters: a gantry across the tank on two posts, and a plunger through it to each source,
    // riding the surface it drives.
    if (lod > 0) {
      for (const x of [-30, 30]) block(depth, project, turn, [x, 9.75, -3], [1, 4.25, 1], hair * 0.75)
      block(depth, project, turn, [0, 14.8, -3], [31.2, 0.8, 1.2], hair * 0.8, 'ink', { bevel: lod === 2 ? 0.4 : 0 })
    }
    for (let s = 0; s < 2; s++) {
      const sx = sources[s]!
      const tip = height(sx, 0, u) + 0.9
      if (lod > 0) {
        cylinder(depth, project, turn, [sx, tip, -3], 'y', 0.75, 15.6 - tip + 1.2, 8, hair * 0.7)
        edge(depth, project, [sx, tip, -3], [sx, tip, 0], hair * 1.3, 0.85)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Two coherent ripple sources interfere on a faceted, perspective surface. */
export function LoaderDuplex(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
