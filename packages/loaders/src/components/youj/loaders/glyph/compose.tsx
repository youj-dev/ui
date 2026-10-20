'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { CONTOURS, LETTER_BOXES, METRICS, TITTLE, world } from './word'

export const meta = {
  id: 'compose',
  title: 'Compose',
  category: 'glyph',
  technique: 'lines',
  tags: ['assemble', 'wordmark', 'strokes', 'scatter', '3d', 'type', 'brand', 'build'],
  description: 'The wordmark’s strokes drift in space, then fly in and lock into the word, the tittle landing last; after a beat they let go and drift apart again.',
  order: 4,
  colors: [{ part: 'Stroke', mono: 'ink' }],
} satisfies LoaderMeta

/* Every outline of the word is cut into equal runs. Apart, the word is an
 * exploded drawing of itself: each run stands a little out from its
 * letter's centre and on its own depth layer (three layers, the letters
 * staggered between them), the layers breathing, so it still reads as the
 * word, opened up in space. The view turns to show those layers while the
 * word is apart and squares up as it closes. The runs fly home letter by
 * letter, round each outline in order (`emphasized`), the type's guides
 * come in under them, and the tittle lands last (`enter`, its one
 * arrival). After a beat the runs let go in the same order (`exit`) and
 * the tittle lifts first. Apart at both ends of the loop.
 *
 * Color: a stroke adrift is tinted `c1`, and settles to the ink as it locks into the word. */

const SCALE = 3.7
const SPREAD = 6
const LAYER = 14

interface Run {
  /** Its points at home, in world units (y up), and the point mid-way along it. */
  pts: [number, number, number][]
  mid: [number, number]
  /** Where it stands while apart: out from its letter's centre, and its depth. */
  out: [number, number]
  z: number
  /** When it flies home and when it lets go, in loop progress. */
  at: number
  /** The phase of its layer's breathing. */
  phase: number
}

/** A closed polyline cut into `n` runs of equal length, each keeping every corner it passes, sharing its ends with its neighbours. */
function cut(pts: [number, number][], n: number): [number, number][][] {
  const lengths = [0]
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]))
  const total = lengths[lengths.length - 1]!
  const at = (s: number): [number, number] => {
    let j = 1
    while (j < lengths.length - 1 && lengths[j]! < s) j++
    const u = (s - lengths[j - 1]!) / (lengths[j]! - lengths[j - 1]! || 1)
    return [mix(pts[j - 1]![0], pts[j]![0], u), mix(pts[j - 1]![1], pts[j]![1], u)]
  }
  const runs: [number, number][][] = []
  for (let k = 0; k < n; k++) {
    const s0 = (total * k) / n
    const s1 = (total * (k + 1)) / n
    const run: [number, number][] = [at(s0)]
    for (let i = 1; i < pts.length - 1; i++) if (lengths[i]! > s0 + 1e-6 && lengths[i]! < s1 - 1e-6) run.push(pts[i]!)
    run.push(at(s1))
    runs.push(run)
  }
  return runs
}

function build(outer: number, inner: number): Run[] {
  const runs: Run[] = []
  CONTOURS.forEach((c, ci) => {
    const box = LETTER_BOXES[c.letter]!
    const [lx, ly] = world((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, SCALE)
    const counter = ci === 2
    const pieces = cut(c.pts, counter ? inner : outer)
    pieces.forEach((piece, k) => {
      const pts = piece.map(([x, y]) => world(x, y, SCALE))
      const [mx, my] = world(...piece[Math.floor(piece.length / 2)]!, SCALE)
      const len = Math.hypot(mx - lx, my - ly) || 1
      const order = (k + (counter ? 0.5 : 0)) / pieces.length
      runs.push({
        pts,
        mid: [mx, my],
        out: [((mx - lx) / len) * SPREAD, ((my - ly) / len) * SPREAD * 0.8],
        z: LAYER * (((k + c.letter) % 3) - 1) + (c.letter % 2 ? 4 : -4),
        at: c.letter * 0.055 + order * 0.04,
        phase: (((k + c.letter) % 3) / 3) * TAU,
      })
    })
  })
  return runs
}

const DETAIL = [
  { below: 32, runs: build(3, 2) },
  { below: Infinity, runs: build(6, 4) },
]

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 5.5,
  still: 0.2,
  draw(pen, t, view) {
    const { runs } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const stroke = clamp(view.size * 0.026, 1, 2.2) / view.px
    const hair = 1 / view.px

    // How far home each run is, and the word as a whole: the view turns to show the layers while it's apart.
    const home = (run: Run) =>
      view.ease.emphasized(span(t, 0.05 + run.at, 0.33 + run.at)) * (1 - view.ease.exit(span(t, 0.68 + run.at * 0.6, 0.86 + run.at * 0.6)))
    let whole = 0
    for (const run of runs) whole += home(run) / runs.length
    const apart = 1 - whole
    const yaw = 0.07 * Math.sin(TAU * t) + 0.42 * apart
    const pitch = -0.1 - 0.2 * apart
    const project = camera({ yaw, pitch, distance: 380, cx: view.w / 2, cy: view.h / 2 + 1 })
    const at = (x: number, y: number, z: number, out: Projected) => project(x, y, z, out)

    // The type's guides come in under the word as it closes; each keeps its number of dashes as the view turns.
    const left = world(LETTER_BOXES[0]!.x0 - 1.8, 0, SCALE)[0]
    const right = world(LETTER_BOXES[3]!.x1 + 1.8, 0, SCALE)[0]
    const dashes = Math.max(4, Math.round((right - left) / (6 * hair)))
    for (const gy of METRICS) {
      const y = world(0, gy, SCALE)[1]
      at(left, y, 0, p)
      at(right, y, 0, q)
      const d = Math.hypot(q.x - p.x, q.y - p.y) / (2 * dashes - 1)
      depth.path([p.x, p.y, q.x, q.y], -999, { width: hair, alpha: (gy === 20 ? 0.28 : 0.13) * whole ** 1.5, dash: small ? undefined : [d, d] })
    }

    for (const run of runs) {
      const h = home(run)
      const away = 1 - h
      // Apart, a run stands out from its letter on its layer, the layers breathing; home, it's the word.
      const breathe = 1 + 0.14 * Math.sin(TAU * t + run.phase)
      const dx = run.out[0] * away * breathe
      const dy = run.out[1] * away * breathe
      const dz = run.z * away * breathe
      xy.length = 0
      let z = 0
      for (const [x, y] of run.pts) {
        at(x + dx, y + dy, dz, p)
        xy.push(p.x, p.y)
        z += p.z / run.pts.length
      }
      const near = clamp((z + LAYER * 1.5) / (LAYER * 3))
      // Adrift, a stroke takes the color; locked into the word, it's the ink.
      depth.path(xy, z, { width: stroke, alpha: mix(0.3 + 0.35 * near, 0.95, h ** 1.4), join: 'round', cap: 'round', tone: blend('ink', 'c1', 0.8 * away) })
    }

    // The tittle, last to land, first to leave.
    const land = view.ease.enter(span(t, 0.47, 0.6)) * (1 - view.ease.exit(span(t, 0.64, 0.74)))
    if (land > 0.005) {
      const s = TITTLE.size * mix(0.55, 1, land)
      const x0 = TITTLE.x + (TITTLE.size - s) / 2
      const y0 = TITTLE.y + (TITTLE.size - s) / 2 - (1 - land) * 4
      xy.length = 0
      for (const [x, y] of [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s]] as const) {
        at(...world(x, y, SCALE), p)
        xy.push(p.x, p.y)
      }
      depth.poly(xy, p.z + 0.01, land, 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 2, tones: meta.colors }

/** The wordmark's strokes fly in from space and lock into the word, then drift apart again. */
export function LoaderCompose(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
