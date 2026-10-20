'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'slice',
  title: 'Slice',
  category: 'depth',
  technique: 'mixed',
  tags: ['scan', 'lattice', 'cube', 'voxel', 'section', '3d', 'compute'],
  description: 'A cube of particles turns slowly while a scan plane sweeps up through it and back, each layer lighting up as the plane passes.',
  order: 5,
  colors: [{ part: 'Scan', mono: 'ink' }],
} satisfies LoaderMeta

/* The cube is the illustrations' isometric block as a lattice of square
 * particles, turning a quarter turn a loop (a cube's quarter turn is the
 * cube again, so the loop has no seam). The scan plane, an accent frame
 * with a breath of fill, rises through it and comes back down
 * (`emphasized` each way); a layer it crosses lights to full, the rest
 * stand back by their depth.
 *
 * Color: the layer the plane passes glows toward `c1`, and its glow settles back to the ink. */

const HALF = 20
const DETAIL = [
  { below: 32, n: 4 },
  { below: Infinity, n: 5 },
]

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const zs = [0, 0, 0, 0]
const PLANE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const
/** How long a layer glows after the plane has passed it, as a share of the loop. */
const AFTER = 0.09
const lit: number[] = []
const shade = (z: number) => 0.18 + 0.5 * clamp((z + 40) / 80)

export const scene: Scene = {
  beats: 4.5,
  still: 0.3,
  draw(pen, t, view) {
    const { n } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: 0.62 + (Math.PI / 2) * t, pitch: -0.5, distance: 240, cx: view.w / 2, cy: view.h / 2 })
    const side = clamp(view.size * 0.04, 1.3, 2.8) / view.px
    const hair = 1 / view.px
    const step = (2 * HALF) / (n - 1)
    const up = view.ease.emphasized(span(t, 0.04, 0.46))
    const down = view.ease.emphasized(span(t, 0.54, 0.96))
    const level = mix(-HALF - 5, HALF + 5, up - down)
    /** Where in its window the plane's ease reaches `v` (0–1): the ease is monotonic, so a bisection finds it. */
    const reach = (v: number) => {
      let lo = 0
      let hi = 1
      for (let i = 0; i < 22; i++) {
        const m = (lo + hi) / 2
        if (view.ease.emphasized(m) < v) lo = m
        else hi = m
      }
      return (lo + hi) / 2
    }

    // Each layer lights as the plane reaches it and keeps an afterglow that fades over the moments after
    // it passed (worked out from when it passed, so it fades smoothly): a fast pass reads as a scan, not a flash.
    for (let j = 0; j < n; j++) {
      const y = -HALF + j * step
      const v = (y + HALF + 5) / (2 * HALF + 10)
      const rose = 0.04 + 0.42 * reach(v)
      const fell = 0.54 + 0.42 * reach(1 - v)
      let since = Infinity
      for (const c of [rose, fell, fell - 1]) if (t >= c) since = Math.min(since, t - c)
      const glow = since < AFTER ? (1 - since / AFTER) ** 1.6 : 0
      lit[j] = Math.max(clamp(1 - Math.abs(y - level) / (step * 0.75)), glow)
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          const l = lit[j]!
          project(-HALF + i * step, -HALF + j * step, -HALF + k * step, p)
          depth.square(p, side * (1 + 0.35 * l), shade(p.z) + (1 - shade(p.z)) * l, blend('ink', 'c1', 0.85 * l))
        }
      }
    }

    // A lit layer shows its section: the rows and columns that join its particles, in hairlines.
    if (view.size >= 40) {
      // Each runs left to right on screen, so a quarter turn (the cube's own symmetry) draws the very same lines.
      const rule = (l: number) => (p.x <= q.x ? depth.line(p, q, hair, 0.3 * l) : depth.line(q, p, hair, 0.3 * l))
      for (let j = 0; j < n; j++) {
        const l = lit[j]!
        if (l < 0.03) continue
        const y = -HALF + j * step
        for (let i = 0; i < n; i++) {
          const c = -HALF + i * step
          project(c, y, -HALF, p)
          project(c, y, HALF, q)
          rule(l)
          project(-HALF, y, c, p)
          project(HALF, y, c, q)
          rule(l)
        }
      }
    }

    // The scan plane: an accent frame a little wider than the cube, with a breath of fill.
    const e = HALF + 6
    PLANE.forEach(([sx, sz], i) => {
      project(sx * e, level, sz * e, p)
      xy[2 * i] = p.x
      xy[2 * i + 1] = p.y
      zs[i] = p.z
    })
    xy.length = 8
    const z = (zs[0]! + zs[1]! + zs[2]! + zs[3]!) / 4
    const visible = clamp(1 - Math.abs(level) / (HALF + 5) + 0.25)
    depth.poly(xy, z - 60, 0.07 * visible, 'accent')
    depth.path(xy, z + 60, { width: hair, alpha: 0.85 * visible, closed: true, tone: 'accent' })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A cube of particles turns while an accent scan plane sweeps through it, lighting each layer it crosses. */
export function LoaderSlice(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
