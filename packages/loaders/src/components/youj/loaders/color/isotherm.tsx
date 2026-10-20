'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'isotherm',
  title: 'Isotherm',
  category: 'color',
  technique: 'lines',
  tags: ['contour', 'terrain', 'topography', 'height', 'map', 'front', 'isometric'],
  description: 'A terrain drawn in contour lines, stacked in perspective at their heights and graded in color from the valleys to the peaks, while a warm front passes across it; the accent marks the summit.',
  order: 12,
  colors: [
    { part: 'Peaks', mono: 'ink' },
    { part: 'Valleys', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* A small terrain (a summit, a shoulder and a saddle between) traced as
 * contour lines, each lifted to its own height and seen from above and to
 * one side, so the map reads as the landform. The contours are worked out
 * once per level of detail (marching squares over the height field) and
 * kept. A warm front, a soft band, passes across the terrain once a loop
 * (`standard`), lighting the lines it crosses; the terrain sways a little.
 * The accent particle stands on the summit, a hairline to its foot.
 *
 * Color: height. Each contour is graded from `c2` in the valleys
 * to `c1` at the peaks, and the front warms the lines it crosses
 * further toward `c1`. Monochrome, the height reads as brightness and the
 * front as a passing light. */

const HALF = 30
const PEAK: [number, number, number, number] = [6, -4, 20, 13]
const HILLS: [number, number, number, number][] = [PEAK, [-12, 10, 11, 11], [14, 16, -4, 9]]

/** The height field: a summit, a shoulder and a shallow dip. */
const height = (x: number, z: number) => HILLS.reduce((h, [hx, hz, a, r]) => h + a * Math.exp(-((x - hx) ** 2 + (z - hz) ** 2) / (2 * r * r)), 0)

/** Each contour's segments ([x0, z0, x1, z1, …]) at `levels` heights, from a `grid` × `grid` sampling of the field. */
function contours(grid: number, levels: number) {
  const step = (2 * HALF) / grid
  const v: number[] = []
  for (let j = 0; j <= grid; j++) for (let i = 0; i <= grid; i++) v.push(height(-HALF + i * step, -HALF + j * step))
  const at = (i: number, j: number) => v[j * (grid + 1) + i]!
  const out: { h: number; u: number; seg: number[] }[] = []
  for (let l = 0; l < levels; l++) {
    const u = (l + 0.5) / levels
    const h = 0.6 + u * (PEAK[2] - 1.2)
    const seg: number[] = []
    for (let j = 0; j < grid; j++) {
      for (let i = 0; i < grid; i++) {
        const c = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
        const xs = [-HALF + i * step, -HALF + (i + 1) * step, -HALF + (i + 1) * step, -HALF + i * step]
        const zs = [-HALF + j * step, -HALF + j * step, -HALF + (j + 1) * step, -HALF + (j + 1) * step]
        const cross: number[] = []
        for (let e = 0; e < 4; e++) {
          const a = c[e]!
          const b = c[(e + 1) % 4]!
          if (a < h === b < h) continue
          const k = (h - a) / (b - a)
          cross.push(xs[e]! + (xs[(e + 1) % 4]! - xs[e]!) * k, zs[e]! + (zs[(e + 1) % 4]! - zs[e]!) * k)
        }
        if (cross.length >= 4) seg.push(cross[0]!, cross[1]!, cross[2]!, cross[3]!)
        if (cross.length === 8) seg.push(cross[4]!, cross[5]!, cross[6]!, cross[7]!)
      }
    }
    out.push({ h, u, seg })
  }
  return out
}

const DETAIL = [
  { below: 32, lines: contours(14, 4) },
  { below: 80, lines: contours(20, 6) },
  { below: Infinity, lines: contours(28, 8) },
]
const LIFT = 0.9

const depth = new Depth()
const p = point()
const q = point()

export const scene: Scene = {
  beats: 5.5,
  still: 0.38,
  draw(pen, t, view) {
    t %= 1
    const { lines } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: -0.7 + 0.08 * Math.sin(TAU * t), pitch: -0.6, distance: 260, cx: view.w / 2, cy: view.h * 0.6 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.014, 1, 1.5) / view.px
    // The front: a soft band crossing the terrain on the diagonal, off it at both ends of the loop.
    const front = -80 + 160 * view.ease.standard(span(t, 0.08, 0.92))

    // The ground's square, faint, under everything.
    const ground = [
      [-HALF, -HALF],
      [HALF, -HALF],
      [HALF, HALF],
      [-HALF, HALF],
    ] as const
    ground.forEach(([x0, z0], k) => {
      const [x1, z1] = ground[(k + 1) % 4]!
      project(x0, 0, z0, p)
      project(x1, 0, z1, q)
      p.z = q.z = -500
      depth.line(p, q, hair, 0.22)
    })

    for (const { h, u, seg } of lines) {
      const y = h * LIFT
      for (let s = 0; s < seg.length; s += 4) {
        const mx = (seg[s]! + seg[s + 2]!) / 2
        const mz = (seg[s + 1]! + seg[s + 3]!) / 2
        const warm = Math.exp(-(((mx + mz) * 0.7 - front) ** 2) / 120)
        project(seg[s]!, y, seg[s + 1]!, p)
        project(seg[s + 2]!, y, seg[s + 3]!, q)
        const near = clamp(((p.z + q.z) / 2 + 40) / 80)
        depth.line(p, q, stroke, (0.28 + 0.32 * u) * (0.7 + 0.3 * near) + 0.38 * warm, blend('c2', 'c1', clamp(u + 0.45 * warm)))
      }
    }

    // The summit: the accent on top, a hairline down to the ground.
    const top = height(PEAK[0], PEAK[1]) * LIFT
    project(PEAK[0], top + 4, PEAK[1], p)
    project(PEAK[0], 0, PEAK[1], q)
    if (view.size >= 40) {
      const length = Math.hypot(q.x - p.x, q.y - p.y)
      const dash = 1.3 / view.px
      depth.path([p.x, p.y, q.x, q.y], 400, { width: hair, alpha: 0.3, dash: [dash, dash], offset: -(length % (2 * dash)) })
    }
    p.z = 401
    depth.square(p, clamp(view.size * 0.045, 2.2, 4.2) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A contour-line terrain graded in color by height, a warm front passing across it. */
export function LoaderIsotherm(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
