'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { type Tone, blend, TAU, camera, clamp, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'saddle',
  title: 'Saddle',
  category: 'geometry',
  technique: 'lines',
  tags: ['hyperbolic paraboloid', 'hypar', 'ruled surface', 'grid', 'roof', 'flex', 'wireframe'],
  description:
    'A square grid of straight lines flexes into a saddle and through to the opposite one, every line staying straight, on four posts like a hypar roof, while the accent line that generates it sweeps across.',
  order: 10,
  colors: [{ part: 'Rulings', mono: 'ink' }],
} satisfies LoaderMeta

/* A hyperbolic paraboloid, the roof architects build from straight beams:
 * a square of straight lines whose opposite corners rise and fall. Flat,
 * it's a grid; as two corners lift and the other two drop, every line stays
 * straight while the sheet curves both ways at once, a saddle, then flexes
 * back through flat to the opposite saddle. It stands on four posts over
 * its dashed footprint, the posts lengthening and shortening with their
 * corners. One line of the grid, in the accent, sweeps across and back: the
 * line a ruled surface is drawn by. Farther lines are fainter; the boundary
 * is heavier.
 *
 * Color: the second family of rulings leans toward `c1`, so the
 * two families of straight lines read apart; the generating line stays the
 * accent. */

const S = 25
const LIFT = 0.66
const FLOOR = -26

const DETAIL = [
  { below: 32, n: 5 },
  { below: 80, n: 9 },
  { below: Infinity, n: 13 },
]

const depth = new Depth()
const a = point()
const b = point()

export const scene: Scene = {
  beats: 6,
  still: 0.17,
  draw(pen, t, view) {
    const { n } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const project = camera({ yaw: Math.PI / 4 + 0.22 * Math.sin(TAU * t), pitch: -0.5, distance: 260, cx: view.w / 2, cy: view.h / 2 + 3 })
    const hair = (small ? 1.15 : 1) / view.px
    const bold = (small ? 1.3 : view.size < 80 ? 1.35 : 1.6) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    // Flat, saddle, flat, the opposite saddle, flat: one flex a loop.
    const k = LIFT * Math.sin(TAU * t)
    const height = (x: number, z: number) => (k * x * z) / S

    // A ruling from one edge to the other: straight in 3D, so two points draw it. Nearer is brighter.
    // The second family of rulings leans toward the surface's color, so the two read apart.
    const family = blend('ink', 'c1', 0.75)
    const ruling = (x0: number, z0: number, x1: number, z1: number, width: number, alpha: number, tone: Tone = 'ink', lift = 0) => {
      project(x0, height(x0, z0), z0, a)
      project(x1, height(x1, z1), z1, b)
      const z = (a.z + b.z) / 2
      const near = clamp((z + S * 1.4) / (S * 2.8))
      depth.path([a.x, a.y, b.x, b.y], z + lift, { width, alpha: alpha * (0.35 + 0.65 * near), tone, cap: 'round' })
    }
    for (let i = 0; i < n; i++) {
      const u = -S + (2 * S * i) / (n - 1)
      const edge = i === 0 || i === n - 1
      ruling(-S, u, S, u, edge ? bold : hair, edge ? 1 : 0.75)
      ruling(u, -S, u, S, edge ? bold : hair, edge ? 1 : 0.75, edge ? 'ink' : family)
    }

    // The generating line, sweeping across and back.
    const g = -S * Math.cos(TAU * t)
    ruling(-S, g, S, g, bold * 1.1, 1, 'accent', 0.5)

    // Four posts down to the dashed footprint.
    if (!small) {
      for (const [x, z] of [
        [S, S],
        [S, -S],
        [-S, -S],
        [-S, S],
      ] as const) {
        project(x, height(x, z), z, a)
        project(x, FLOOR, z, b)
        depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2 - 0.5, { width: hair, alpha: 0.45, dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
        // The joints: where each corner sits on its post, and the post's foot on the footprint.
        if (view.size >= 64) {
          a.z += 1
          depth.square(a, 2.6 * hair, 0.9)
          b.z = -99
          depth.square(b, 2 * hair, 0.45)
        }
      }
      const corners = [
        [S, S],
        [S, -S],
        [-S, -S],
        [-S, S],
      ] as const
      corners.forEach(([x0, z0], i) => {
        const [x1, z1] = corners[(i + 1) % 4]!
        project(x0, FLOOR, z0, a)
        project(x1, FLOOR, z1, b)
        depth.path([a.x, a.y, b.x, b.y], -100, { width: hair, alpha: 0.3, dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
      })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A grid of straight lines flexes into a saddle and the opposite saddle, as a hypar roof on posts, its accent generator sweeping. */
export function LoaderSaddle(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
