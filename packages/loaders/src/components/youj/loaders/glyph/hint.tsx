'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'hint',
  title: 'Hint',
  category: 'glyph',
  technique: 'planes',
  tags: ['pixel', 'grid', 'raster', 'hinting', 'favicon', 'j', 'type', 'render'],
  description: 'The j hinted to whole pixels, as the favicon is: its outline lies on a pixel grid seen in perspective, then pixels drop into their cells line by line as the outline fades, and lift away again.',
  order: 6,
  colors: [{ part: 'Outline', mono: 'ink' }],
} satisfies LoaderMeta

/* The grid is 8 by 14 cells on a plane tipped toward the viewer, with the
 * favicon's j on it as its designer drew it for 16px: first its outline
 * (stem, rounded heel, foot and tittle), then its pixels (a two-pixel stem,
 * the foot, a 2x2 tittle in the accent), in reading order. Each pixel is a
 * shallow lit tile: it grows out of nothing as it falls into its cell
 * (`enter`), its cell outlined beneath it to show where it will land, and
 * it sits flush. As the last one lands, the outline fades; after a beat
 * the pixels lift off in reverse, each shrinking away as it rises, and the
 * outline returns. The view sways a little throughout. Outline only at
 * both ends.
 *
 * Color: the vector outline the pixels stand for and each cell marked as a pixel lands are `c1`; the pixels are the ink, the tittle’s the accent. */

const COLS = 8
const ROWS = 14
const CELL = 5
const INSET = 0.6
const TILE = 1.3
/** The favicon's 16px j (logo.ts), on the grid: # ink, A the accent tittle. */
const BITMAP = [
  '........',
  '....AA..',
  '....AA..',
  '........',
  '....##..',
  '....##..',
  '....##..',
  '....##..',
  '....##..',
  '....##..',
  '....##..',
  '..####..',
  '..###...',
  '........',
]
const PIXELS = BITMAP.flatMap((row, r) => [...row].flatMap((c, col) => (c === '.' ? [] : [{ r, col, accent: c === 'A' }])))

const x0 = (-COLS / 2) * CELL
const z0 = (-ROWS / 2) * CELL
const at = (col: number, row: number): [number, number, number] => [x0 + col * CELL, 0.3, z0 + row * CELL]
/** The favicon j's own outline in grid cells (its stem, its rounded heel, its foot), and its tittle. */
const OUTLINES: [number, number, number][][] = [
  [
    at(4, 4),
    at(6, 4),
    at(6, 12),
    ...[1, 2, 3, 4, 5].map((i) => {
      const a = (Math.PI / 2) * (i / 6)
      return at(5 + Math.cos(a), 12 + Math.sin(a))
    }),
    at(5, 13),
    at(2, 13),
    at(2, 11),
    at(4, 11),
  ],
  [at(4, 1), at(6, 1), at(6, 3), at(4, 3)],
]
/** A tile's faces: its top, then the two sides toward the viewer (corner indices: bit 0 +x, bit 1 +z, bit 2 top). */
const TILE_FACES: { c: number[]; n: [number, number, number] }[] = [
  { c: [4, 5, 7, 6], n: [0, 1, 0] },
  { c: [2, 3, 7, 6], n: [0, 0, 1] },
  { c: [1, 3, 7, 5], n: [1, 0, 0] },
  { c: [0, 2, 6, 4], n: [-1, 0, 0] },
  { c: [0, 1, 5, 4], n: [0, 0, -1] },
]

const depth = new Depth()
const p = point()
const corners = Array.from({ length: 8 }, () => point())
const xy: number[] = []

export const scene: Scene = {
  beats: 5,
  still: 0.44,
  draw(pen, t, view) {
    const small = view.size < 32
    const pose = { yaw: -0.42 + 0.07 * Math.sin(TAU * t), pitch: -0.86 }
    const project = camera({ ...pose, distance: 230, cx: view.w / 2 + 1, cy: view.h / 2 - 2 })
    const turn = orient(pose)
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.026, 1, 2.2) / view.px

    // The grid, in hairlines.
    for (let c = 0; c <= COLS; c++) {
      const a = projectPath(
        [
          [x0 + c * CELL, 0, z0],
          [x0 + c * CELL, 0, z0 + ROWS * CELL],
        ],
        project,
        xy,
      )
      const edge = c === 0 || c === COLS
      // Below 32px every other line, so the grid stays a grid and doesn't turn to grey.
      if (small && !edge && c % 2) continue
      depth.path(a.xy, -999, { width: hair, alpha: edge ? 0.3 : small ? 0.14 : 0.18 })
    }
    for (let r = 0; r <= ROWS; r++) {
      const a = projectPath(
        [
          [x0, 0, z0 + r * CELL],
          [x0 + COLS * CELL, 0, z0 + r * CELL],
        ],
        project,
        xy,
      )
      const edge = r === 0 || r === ROWS
      if (small && !edge && r % 2) continue
      depth.path(a.xy, -999, { width: hair, alpha: edge ? 0.3 : small ? 0.14 : 0.18 })
    }

    // The pixels, in reading order, falling into their cells and lifting away in reverse.
    const n = PIXELS.length
    PIXELS.forEach(({ r, col, accent }, i) => {
      const land = view.ease.enter(span(t, 0.08 + (i / n) * 0.34, 0.2 + (i / n) * 0.34))
      const lift = span(t, 0.66 + ((n - 1 - i) / n) * 0.2, 0.76 + ((n - 1 - i) / n) * 0.2)
      if (land <= 0 || lift >= 1) return
      // Its cell, outlined while it falls into it and while it leaves it.
      const mark = Math.sin(Math.PI * land) + Math.sin(Math.PI * lift)
      if (!small && mark > 0.01) {
        xy.length = 0
        for (const [dx, dz] of [[0, 0], [1, 0], [1, 1], [0, 1]] as const) {
          project(x0 + (col + dx) * CELL, 0.05, z0 + (r + dz) * CELL, p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, -900, { width: hair, alpha: 0.55 * mark, closed: true, tone: accent ? 'accent' : 'c1' })
      }
      // The tile: grown out of nothing on its way down, flush once it lands, shrinking away as it rises.
      const size = view.ease.enter(clamp(land * 1.4)) * (1 - view.ease.exit(lift))
      if (size <= 0.01) return
      const h = (1 - land) * 18 + view.ease.exit(lift) * 12
      const half = (CELL / 2 - INSET) * size
      const cx = x0 + (col + 0.5) * CELL
      const cz = z0 + (r + 0.5) * CELL
      const thick = TILE * size
      for (let k = 0; k < 8; k++) project(cx + (k & 1 ? half : -half), h + (k & 4 ? thick : 0), cz + (k & 2 ? half : -half), corners[k]!)
      // Below 32px a pixel is a flat square of ink: lit faces that small would be too faint to read in a light theme.
      if (small) {
        xy.length = 0
        let z = 0
        for (const k of [4, 5, 7, 6]) {
          xy.push(corners[k]!.x, corners[k]!.y)
          z += corners[k]!.z / 4
        }
        depth.poly(xy, z + h, 0.92, accent ? 'accent' : 'ink')
        return
      }
      for (const face of TILE_FACES) {
        const v = turn(...face.n)
        if (v[2] <= 0.01) continue
        xy.length = 0
        let z = 0
        for (const k of face.c) {
          xy.push(corners[k]!.x, corners[k]!.y)
          z += corners[k]!.z / 4
        }
        depth.face(xy, z + h + (face.n[1] ? 0.2 : 0), lambert(...v), accent ? 'accent' : 'ink')
        if (face.n[1]) depth.path(xy, z + h + 0.21, { width: hair, alpha: 0.45 * size, closed: true, tone: accent ? 'accent' : 'ink' })
      }
    })

    // The outline the pixels stand for, fading as they arrive and back as they leave.
    const vector = 1 - view.ease.standard(span(t, 0.4, 0.54)) * (1 - view.ease.standard(span(t, 0.82, 0.96)))
    if (vector > 0.01) {
      for (const outline of OUTLINES) {
        const o = projectPath(outline, project, xy)
        depth.path(o.xy, 999, { width: stroke, alpha: 0.95 * vector, closed: true, join: 'round', tone: blend('ink', 'c1', 0.6) })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The j snaps to a pixel grid in perspective: pixels drop in as its outline fades, then lift away. */
export function LoaderHint(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
