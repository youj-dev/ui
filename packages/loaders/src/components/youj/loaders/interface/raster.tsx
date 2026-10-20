'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'raster', title: 'Raster', category: 'interface', technique: 'lines',
  tags: ['interlace', 'scan', 'imaging', 'fields', 'raster', 'reconstruction', 'progress'],
  description: 'Two interlaced scan fields reconstruct a shaded architectural section on a tilted plate. Odd lines seat before the even lines fill their gaps; a raised scanning rail follows the active row, then the fields lift away in reverse order to expose the empty plate again.',
  order: 16,
  colors: [{ part: 'Scan line', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
interface Row { y: number; spans: readonly (readonly [number, number])[] }

// A generic vaulted section: a broad arch, two piers and its footing.
// Intersecting the silhouette with horizontal scan lines produces geometry
// once per detail level, rather than manufacturing it on every draw.
function scanRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const y = -23 + 46 * i / (count - 1)
    if (y < -16) return { y, spans: [[-25, 25]] }
    const outer = y < 0 ? 25 : Math.sqrt(Math.max(0, 25 ** 2 - y ** 2))
    const inner = y < 0 ? 13 : Math.sqrt(Math.max(0, 13 ** 2 - y ** 2))
    return { y, spans: y < 13 ? [[-outer, -inner], [inner, outer]] : [[-outer, outer]] }
  })
}

/* The scan is boustrophedon: each line is written in the opposite direction
 * to the one before, so the head turns at the plate's edge and indexes two
 * rows (the interlace) instead of flying back across it. Between the fields
 * it lifts and travels back down through the air, taking longer. In units of
 * one line's writing time: a short approach, an index move before each
 * line, the field change, and the lines themselves.
 *
 * Color: each scan line is written in `c1` and settles to the ink over the next two lines, so the colour rides just behind the shoe; the plate and rails keep the ink, the shoe’s edge the accent. */
const INDEX = 0.7
const FIELD = 1.6
function plan(rows: Row[]) {
  const per = rows.length / 2
  const byOrder = rows.map((_, o) => (o < per ? 2 * o : 2 * (o - per) + 1))
  const moves = byOrder.map((_, o) => (o === 0 ? 0.6 : o === per ? FIELD : INDEX))
  const starts: number[] = []
  let at = 0
  for (const move of moves) {
    at += move
    starts.push(at)
    at += 1
  }
  const order = rows.map((_, i) => byOrder.indexOf(i))
  return { rows, per, byOrder, order, moves, starts, total: at }
}
const PLANS = [plan(scanRows(6)), plan(scanRows(10)), plan(scanRows(14))]
const CORNERS: V3[] = [[-33, -31, 0], [33, -31, 0], [33, 31, 0], [-33, 31, 0]]
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
const p = point()
const q = point()
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.49,
  draw(pen, t, view) {
    const small = view.size < 32
    const { rows, per, byOrder, order, moves, starts, total } = PLANS[small ? 0 : view.size < 80 ? 1 : 2]!
    const n = rows.length
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.35, pitch: -0.48 }
    const project = camera({ ...pose, distance: 260, cx: view.w / 2, cy: 50 })
    const turn = orient(pose)
    const plate = projectPath(CORNERS, project, xy)
    depth.poly(plate.xy, -60, 0.035, 'ink', true)
    depth.path(plate.xy, -59, { width: hair * 0.8, alpha: 0.35, closed: true })

    // Where the scan is, in line units; and the release, last line written first, each lifting over a few lines' time.
    const write = span(t, 0.04, 0.66) * total
    const SOFT = 3
    const release = span(t, 0.7, 0.97) * (n + SOFT)
    const ahead = (o: number) => o % 2 === 0
    rows.forEach((row, i) => {
      const o = order[i]!
      const on = view.ease.standard(clamp(write - starts[o]!))
      const off = view.ease.standard(clamp((release - (n - 1 - o)) / SOFT))
      const seated = on * (1 - off)
      const ghost = small ? 0.13 : 0.1
      const z = mix(4.5, 0.8, on) + 3.7 * off
      // Registration ghosts identify the missing even scan lines, rather
      // than fading the whole image in and calling that reconstruction.
      for (const [x0, x1] of row.spans) {
        project(x0, row.y, 0.1, p)
        project(x1, row.y, 0.1, q)
        depth.path([p.x, p.y, q.x, q.y], -58, { width: hair * 0.75, alpha: ghost })
        if (seated <= 0.004) continue
        // Drawn on behind the head, from the side it started.
        const head = ahead(o) ? mix(-28, 28, on) : mix(28, -28, on)
        const a = ahead(o) ? x0 : Math.max(x0, head)
        const b = ahead(o) ? Math.min(x1, head) : x1
        if (b <= a) continue
        project(a, row.y, z, p)
        project(b, row.y, z, q)
        const shade = x0 < 0 ? 0.6 : 0.85
        // A line is written in its color and settles to the ink over the next two lines' time.
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.1, { width: hair * (small ? 1.22 : 1.35), alpha: shade * seated, cap: 'butt', tone: blend('c1', 'ink', clamp((write - starts[o]! - 1) / 2)) })
      }
      if (!small) {
        project(-29, row.y, 0.1, p)
        project(-27, row.y, 0.1, q)
        depth.line(p, q, hair * 0.65, 0.18 + 0.5 * seated)
      }
    })

    // The raised rail and its scan shoe: along a line while it's written, then indexing to the next at the edge it reached.
    const show = view.ease.standard(span(t, 0.01, 0.08)) * (1 - view.ease.exit(span(t, 0.66, 0.72)))
    if (show > 0.004) {
      let o = 0
      while (o < n - 1 && write >= starts[o + 1]! - moves[o + 1]!) o++
      let x: number, y: number, lift: number
      // Off the plate between lines, the rail rises and lightens.
      let air = 0
      if (write < starts[o]!) {
        const travel = view.ease.emphasized(clamp(1 - (starts[o]! - write) / moves[o]!))
        const fromY = o === 0 ? -28 : rows[byOrder[o - 1]!]!.y
        x = o === 0 ? -28 : ahead(o - 1) ? 28 : -28
        y = mix(fromY, rows[byOrder[o]!]!.y, travel)
        air = Math.sin(Math.PI * travel)
        lift = 5 + (o === per ? 7 : 3) * air
      } else {
        const u = view.ease.standard(clamp(write - starts[o]!))
        x = ahead(o) ? mix(-28, 28, u) : mix(28, -28, u)
        y = rows[byOrder[o]!]!.y
        lift = 5
      }
      project(-31, y, lift, p)
      project(31, y, lift, q)
      depth.line(p, q, hair * 0.85, 0.5 * show * (1 - 0.45 * air))

      // A short, lit scan shoe follows the rail; only its front edge wears
      // the accent, so this remains an ink drawing in either colour scheme.
      for (let i = 0; i < 4; i++) {
        quad[i]![0] = x + (i === 1 || i === 2 ? 2.3 : -2.3) * show
        quad[i]![1] = y + (i < 2 ? -1.6 : 1.6) * show
        quad[i]![2] = lift + 0.3
      }
      const path = projectPath(quad, project, xy)
      depth.face(path.xy, 60, lambert(...turn(0, 0, 1)))
      project(x - 2.3, y - 1.6, lift + 0.4, p)
      project(x + 2.3, y - 1.6, lift + 0.4, q)
      depth.path([p.x, p.y, q.x, q.y], 61, { width: hair * 1.3, alpha: show, tone: 'accent' })
    }

    if (!small) {
      // Rails and corner registration ticks belong to the instrument, not
      // the image. The image alone changes between scan fields.
      for (const x of [-31, 31]) {
        project(x, -28, 5, p)
        project(x, 28, 5, q)
        depth.line(p, q, hair * 0.7, 0.24)
      }
      for (const [x, y] of [[-33, -31], [33, -31], [33, 31], [-33, 31]] as const) {
        project(x, y, 0, p)
        project(x - Math.sign(x) * 4, y, 0, q)
        depth.line(p, q, hair, 0.6)
        project(x, y - Math.sign(y) * 4, 0, q)
        depth.line(p, q, hair, 0.6)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two interlaced scan fields seat an architectural section before withdrawing in reverse order. */
export function LoaderRaster(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
