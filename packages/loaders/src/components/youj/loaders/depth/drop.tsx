'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'drop',
  title: 'Drop',
  category: 'depth',
  technique: 'particles',
  tags: ['ripple', 'floor', 'isometric', 'impact', 'wave', 'particle', 'grid'],
  description: 'The brand’s square particle falls onto an isometric floor of particles, and a ring runs out through it, lifting each particle it passes before the floor settles.',
  order: 2,
  colors: [{ part: 'Ripple', mono: 'ink' }],
} satisfies LoaderMeta

/* The floor is the illustrations' isometric grid, seen in perspective from
 * above; the particle drops in the accent, quickening as it falls (`exit`),
 * while a square landing mark draws in round the spot it will hit. Where it
 * lands it becomes the floor's centre particle, the accent passing to it
 * and fading as the particle settles to the floor's size, and a ring
 * travels out through the floor (rising in a few frames, never in one),
 * lifting each particle it passes, nearer and brighter as it rises, and
 * dying away before the floor's edge. The view sways a little all the
 * while, and the floor is flat again by the end of the loop, as it was at
 * the start, so there's no seam.
 *
 * Color: a particle the ring lifts warms toward `c1` as it rises, and settles to the ink. */

const HALF = 31
const H0 = 54
const HIT = 0.3
const LAND = 2.3

const DETAIL = [
  { below: 32, n: 9 },
  { below: 80, n: 13 },
  { below: Infinity, n: 17 },
]

const depth = new Depth()
const p = point()
const q = point()

/** Brightness by depth: the floor's far corner faint, its near corner full. */
const shade = (z: number) => 0.2 + 0.62 * clamp((z + 44) / 88)

export const scene: Scene = {
  beats: 3.5,
  still: 0.52,
  draw(pen, t, view) {
    t %= 1
    const { n } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: Math.PI / 4 + 0.06 * Math.sin(TAU * t), pitch: -0.62, distance: 260, cx: view.w / 2, cy: view.h * 0.6 })
    const side = clamp(view.size * 0.036, 1.25, 2.6) / view.px
    const hair = 1 / view.px
    const step = (2 * HALF) / (n - 1)
    const mid = (n - 1) / 2

    // The ring: a short wave packet running out from the impact, rising over a few frames, fading to nothing by the loop's end.
    const since = span(t, HIT, 1)
    const front = since * 58
    const energy = view.ease.enter(span(t, HIT, HIT + 0.035)) * (1 - since) ** 1.7
    // The accent passes to the floor's centre particle as the drop lands, and fades as it settles to the floor's size.
    const struck = t < HIT ? 0 : 1 - view.ease.standard(span(t, HIT, HIT + 0.24))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -HALF + i * step
        const z = -HALF + j * step
        const d = Math.hypot(x, z) - front
        const h = energy * 10 * Math.exp(-((d / 9) ** 2)) * Math.cos(d * 0.42)
        project(x, h, z, p)
        const lift = clamp(h / 10, -1, 1)
        const alpha = shade(p.z) + 0.45 * Math.max(lift, 0) - 0.1 * Math.max(-lift, 0)
        const size = side * (1 + 0.3 * Math.max(lift, 0))
        if (i === mid && j === mid && struck > 0) {
          const s = mix(size, side * LAND, struck)
          depth.square(p, s, alpha * (1 - struck))
          p.z += 0.001
          depth.square(p, s, struck, 'accent')
        } else depth.square(p, size, alpha, blend('ink', 'c1', clamp(lift * 1.4)))
      }
    }

    // The landing mark: a square drawn in round the spot as the drop nears it, closing on it at the impact.
    if (view.size >= 40) {
      const near = span(t, 0.08, HIT)
      const mark = Math.sin(Math.PI * near) ** 0.6
      if (mark > 0.01) {
        const r = mix(13, 3.5, view.ease.standard(near))
        const corners: [number, number][] = [
          [-r, -r],
          [r, -r],
          [r, r],
          [-r, r],
        ]
        corners.forEach(([x0, z0], k) => {
          const [x1, z1] = corners[(k + 1) % 4]!
          project(x0, 0, z0, p)
          project(x1, 0, z1, q)
          p.z = q.z = -80
          depth.line(p, q, hair, 0.5 * mark)
        })
      }
    }

    // The particle, falling with a short wake, until it meets the floor: it lands at the size the centre particle takes.
    if (t < HIT) {
      const fall = view.ease.exit(t / HIT)
      const appear = view.ease.standard(span(t, 0, 0.07))
      for (let ghost = 3; ghost >= 0; ghost--) {
        const y = H0 * (1 - view.ease.exit(Math.max(0, t / HIT - ghost * 0.035)))
        if (ghost > 0 && y <= 0) continue
        project(0, Math.max(y, 0), 0, p)
        // The wake thins out before the landing, so nothing is left hanging when the particle meets the floor.
        const tail = ghost === 0 ? 1 : (0.32 - ghost * 0.07) * (1 - span(t, HIT - 0.06, HIT - 0.01))
        depth.square(p, side * (ghost === 0 ? LAND : 1.5), appear * tail * (ghost === 0 ? 1 : 0.6 + 0.4 * fall), 'accent')
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The square particle drops onto an isometric floor of particles, and a ring runs out through it. */
export function LoaderDrop(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
