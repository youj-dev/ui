'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, blend, camera, clamp, mix, span, Depth, point, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'weave',
  title: 'Weave',
  category: 'color',
  technique: 'lines',
  tags: ['loom', 'textile', 'warp', 'weft', 'shuttle', 'interlace', 'cloth'],
  description: 'A loom in the isometric view: warp threads in one color part into a shed, the accent shuttle carries a weft thread of another color across, the reed beats it in, and the cloth grows row by row.',
  order: 8,
  colors: [
    { part: 'Warp', mono: 'ink' },
    { part: 'Weft', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* Plain weave at the fell of the cloth. The warp runs from the breast beam
 * into the cloth; for each row it parts into a shed (alternate threads up,
 * the rest down), the shuttle crosses through it (`standard`), laying the
 * weft behind it, the reed sweeps forward and beats the row into the cloth
 * (`emphasized`), and the cloth moves back by one row. Each crossing is a
 * short knuckle, the over thread above the under one, so the depth buffer
 * draws the interlace true. Four rows a loop, the shuttle going there and
 * back twice, so the loop ends where it began.
 *
 * Color: the warp is a tint of `c1` and the weft `c2`, so the
 * cloth reads as two colors interlaced; without `colors` the weft is the
 * stronger ink and the warp the lighter. The shuttle is the accent. */

const ROWS_PER_LOOP = 4
const HALF = 22
const S = 5
const A = 0.9
const FELL = 14
const BEAM = FELL + 13

const DETAIL = [
  { below: 32, warps: 5, rows: 4 },
  { below: 80, warps: 7, rows: 6 },
  { below: Infinity, warps: 9, rows: 7 },
]

const depth = new Depth()
const p = point()
const q = point()
const line: number[] = []

/** Over (+) or under (−) at warp `i`, row `j`: plain weave. */
const over = (i: number, j: number) => ((((i + j) % 2) + 2) % 2 === 0 ? A : -A)

/** The warp: a tint of its color, so the weft it carries reads first. */
const WARP = blend('ink', 'c1', 0.6)

export const scene: Scene = {
  beats: 6,
  still: 0.3,
  draw(pen, t, view) {
    const { warps, rows } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const project = camera({ yaw: -0.55 + 0.05 * Math.sin(TAU * t), pitch: -0.78, distance: 260, cx: view.w / 2, cy: view.h / 2 + 2 })
    const hair = 1 / view.px
    const weftW = clamp(view.size * 0.018, 1.1, 2) / view.px
    const warpW = weftW * 0.9
    const dx = (2 * HALF) / warps
    const x = (i: number) => -HALF + (i + 0.5) * dx
    const kx = dx * 0.26
    const kz = S * 0.26

    const u = (t * ROWS_PER_LOOP) % ROWS_PER_LOOP
    const c = Math.floor(u)
    const local = u - c
    const pass = view.ease.standard(span(local, 0.04, 0.68))
    const beat = view.ease.emphasized(span(local, 0.7, 0.98))
    const shed = Math.sin(Math.PI * span(local, 0, 0.74))
    const s = c + beat
    const rowZ = (j: number) => FELL - (s - j) * S
    const age = (j: number) => s - j
    const fade = (j: number) => 1 - span(age(j), rows - 1.4, rows)
    const rightward = c % 2 === 0
    const shuttleX = rightward ? mix(-HALF - 6, HALF + 6, pass) : mix(HALF + 6, -HALF - 6, pass)

    const seg = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, width: number, alpha: number, tone: Tone) => {
      if (alpha <= 0.01) return
      project(ax, ay, az, p)
      project(bx, by, bz, q)
      depth.line(p, q, width, alpha, tone)
    }

    // The warp: from the breast beam, parted in the shed, into the cloth, a knuckle at each row.
    for (let i = 0; i < warps; i++) {
      const xi = x(i)
      line.length = 0
      line.push(BEAM, 0, 1)
      line.push(rowZ(c) + kz + 4, -over(i, c) * (1 + 2.6 * shed), 1)
      for (let j = c; j > c - rows - 1; j--) {
        const f = fade(j)
        line.push(rowZ(j) + kz, -over(i, j), f, rowZ(j) - kz, -over(i, j), f)
      }
      for (let k = 3; k < line.length; k += 3) {
        const alpha = 0.72 * Math.min(line[k - 1]!, line[k + 2]!)
        seg(xi, line[k - 2]!, line[k - 3]!, xi, line[k + 1]!, line[k]!, warpW, alpha, WARP)
      }
    }

    // The weft: each row a thread across, a knuckle at each warp; the newest only as far as the shuttle has carried it.
    for (let j = c; j > c - rows - 1; j--) {
      const z = rowZ(j)
      const f = fade(j)
      if (f <= 0.01) continue
      const laying = j === c && local < 0.7
      line.length = 0
      line.push(-HALF - 1.5, 0)
      for (let i = 0; i < warps; i++) line.push(x(i) - kx, over(i, j), x(i) + kx, over(i, j))
      line.push(HALF + 1.5, 0)
      const rightwardRow = ((j % 2) + 2) % 2 === 0
      for (let k = 2; k < line.length; k += 2) {
        const ax = line[k - 2]!
        const bx = line[k]!
        if (laying) {
          const mid = (ax + bx) / 2
          if (rightwardRow ? mid > shuttleX : mid < shuttleX) continue
        }
        seg(ax, line[k - 1]!, z, bx, line[k + 1]!, z, weftW, 0.9 * f, 'c2')
      }
    }

    // The breast beam and the reed, sweeping forward to beat each row in.
    if (!small) {
      project(-HALF - 4, 0, BEAM, p)
      project(HALF + 4, 0, BEAM, q)
      depth.line(p, q, hair, 0.4)
      const reed = FELL + 7 - 6.5 * Math.sin(Math.PI * span(local, 0.7, 0.98))
      project(-HALF - 2, 2.2, reed, p)
      project(HALF + 2, 2.2, reed, q)
      depth.line(p, q, hair * 1.4, 0.5)
    }

    // The shuttle, crossing at the fell.
    project(shuttleX, 1.8, FELL + 0.6, p)
    p.z += 20
    depth.square(p, clamp(view.size * 0.045, 2.6, 5.4) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Warp and weft in two colors interlace on a loom, the accent shuttle laying each row. */
export function LoaderWeave(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
