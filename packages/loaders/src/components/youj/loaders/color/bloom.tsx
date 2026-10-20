'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'bloom',
  title: 'Bloom',
  category: 'color',
  technique: 'planes',
  tags: ['dye', 'diffuse', 'spread', 'drop', 'chromatography', 'grid', 'ink'],
  description: 'The accent particle drops onto a grid of tiles and color spreads out from it like dye in water, separating into an inner and an outer ring, then fades back to the ink before the next drop.',
  order: 5,
  colors: [
    { part: 'Core', mono: 'ink' },
    { part: 'Edge', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* A square grid of flat tiles on the floor, seen from above. The accent
 * particle falls into its middle (`exit`, a short trail behind it) and the
 * color it carries diffuses outward through the tiles: fast at first, then
 * slower (a square root, as diffusion goes), its edge soft. Like ink on
 * blotting paper it separates into two rings, the core and a wider edge.
 * The tiles it reaches darken and swell a touch; then the bloom fades back
 * into the grid while the particle dissolves, and the next one falls.
 *
 * Color: the dye. Tiles inside the inner ring take `c1`, those in
 * the outer ring `c2`, each blended up from the ink by how much dye
 * has reached it and back down as it fades. Monochrome, the rings read as
 * the inner one darker than the outer. */

const HALF = 30
const HIT = 0.14
const DETAIL = [
  { below: 32, n: 7 },
  { below: 80, n: 11 },
  { below: Infinity, n: 15 },
]

const depth = new Depth()
const p = point()
const xy: number[] = []
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const

export const scene: Scene = {
  beats: 5,
  still: 0.4,
  draw(pen, t, view) {
    t %= 1
    const { n } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: Math.PI / 4 + 0.05 * Math.sin(TAU * t), pitch: -0.82, distance: 280, cx: view.w / 2, cy: view.h * 0.56 })
    const step = (2 * HALF) / n
    const tile = step * 0.76

    // How far the dye has reached (a square root: quick, then slower) and how much of it is still in the grid.
    const r = (HALF * 1.25) * Math.sqrt(span(t, HIT, 0.72))
    const amount = span(t, HIT, HIT + 0.04) * (1 - view.ease.standard(span(t, 0.6, 0.93)))
    const soft = 7

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx = -HALF + (i + 0.5) * step
        const cz = -HALF + (j + 0.5) * step
        const d = Math.hypot(cx, cz)
        const dyed = amount * clamp((r - d) / soft)
        // The core ring is the inner half of what's reached; the edge ring the rest.
        const core = d < r * 0.5
        const a = dyed * (core ? 1 : 0.8)
        const s = (tile / 2) * (1 + 0.1 * a)
        xy.length = 0
        let z = 0
        for (const [sx, sz] of CORNERS) {
          project(cx + sx * s, 0, cz + sz * s, p)
          xy.push(p.x, p.y)
          z += p.z
        }
        const near = clamp((z / 4 + 40) / 80)
        depth.poly(xy, z / 4, 0.11 + 0.1 * near + (core ? 0.5 : 0.36) * a, blend('ink', core ? 'c1' : 'c2', a))
      }
    }

    // The drop: it falls with a short trail, lands, then dissolves as the bloom fades.
    const side = clamp(view.size * 0.045, 2.2, 4.4) / view.px
    if (t < HIT) {
      const appear = span(t, 0, 0.03)
      for (let ghost = 3; ghost >= 0; ghost--) {
        const y = 46 * (1 - view.ease.exit(Math.max(0, t / HIT - ghost * 0.05)))
        if (ghost > 0 && y <= 0.5) continue
        project(0, Math.max(y, 0.5), 0, p)
        p.z = 300 - ghost
        depth.square(p, side * (ghost ? 0.7 : 1), appear * (ghost ? 0.3 - ghost * 0.07 : 1), 'accent')
      }
    } else {
      const left = 1 - view.ease.standard(span(t, 0.62, 0.9))
      project(0, 0.5, 0, p)
      p.z = 300
      depth.square(p, side * mix(0.55, 1, left), left, 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The accent drops into a grid and color diffuses out from it in two rings, then fades. */
export function LoaderBloom(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
