'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'draft',
  title: 'Draft',
  category: 'geometry',
  technique: 'mixed',
  tags: ['isometric', 'box', 'blueprint', 'construction', 'pen', 'hidden line', 'dimension'],
  description:
    'An isometric box goes from a dashed ghost to a drawing: the accent pen traces its outline in one stroke, the lit edges catch, light floods the faces and a dimension line is set, then it returns to its ghost.',
  order: 2,
  colors: [{ part: 'Dimension', mono: 'ink' }],
} satisfies LoaderMeta

/* The illustrations' IsoBox, drawn the way a draftsman would. At rest it's a
 * ghost: every edge dashed, a place something will go. The pen (the brand's
 * square, in the accent) sets down at the near bottom corner and draws the
 * outline and the near vertical in one stroke, slowing onto each corner; the
 * two lit edges then run out from where it stops, and the faces fill, lit by
 * their normals: the top floods from the near corner back, the sides run
 * down from the lit edges. A dimension line is set beside it. The fill runs
 * on and off through the far edges, and the ink fades into the ghost, which
 * is where the loop starts.
 *
 * Color: the dimension line, its extension lines and ticks are `c1`
 *; the drawing stays ink and the pen the accent. */

const H = 19.5

/** The cube's corners, by where they land on screen. */
const C = [H, H, H] as const // the near top corner, at the middle
const B = [H, -H, H] as const // bottom
const LL = [-H, -H, H] as const
const UL = [-H, H, H] as const
const T = [-H, H, -H] as const // top
const UR = [H, H, -H] as const
const LR = [H, -H, -H] as const
const F = [-H, -H, -H] as const // the far bottom corner, hidden
const CORNERS = [C, B, LL, UL, T, UR, LR, F]
type Corner = (typeof CORNERS)[number]

/** One stroke through the outline and up the near vertical: corners in order. */
const STROKE: Corner[] = [B, LL, UL, T, UR, LR, B, C]
const LIT: [Corner, Corner][] = [
  [C, UL],
  [C, UR],
]
const EDGES: [Corner, Corner][] = [
  [B, LL],
  [LL, UL],
  [UL, T],
  [T, UR],
  [UR, LR],
  [LR, B],
  [B, C],
  [C, UL],
  [C, UR],
]
const HIDDEN: [Corner, Corner][] = [
  [F, LR],
  [F, T],
  [F, LL],
]
/**
 * The faces round the near corner: a corner and two edges from it (a, b in
 * 0–1 along them), the outward normal, and how the fill runs across it: on
 * the top from the near corner to the far one (a + b), on the sides down
 * from the lit edges (b).
 */
const FACES: { o: Corner; a: Corner; b: Corner; n: [number, number, number]; run: [number, number] }[] = [
  { o: C, a: UR, b: UL, n: [0, 1, 0], run: [0.5, 0.5] },
  { o: UL, a: C, b: LL, n: [0, 0, 1], run: [0, 1] },
  { o: C, a: UR, b: B, n: [1, 0, 0], run: [0, 1] },
]
/** How long after the top each face starts to fill. */
const LAG = [0, 0.04, 0.06]
const SQUARE: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
]

/** The part of a face's unit square where lo ≤ g ≤ hi, for g = wa·a + wb·b (two Sutherland–Hodgman cuts). */
function band([wa, wb]: [number, number], lo: number, hi: number): [number, number][] {
  let poly = SQUARE
  for (const [limit, above] of [
    [lo, true],
    [hi, false],
  ] as const) {
    const out: [number, number][] = []
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!
      const q = poly[(i + 1) % poly.length]!
      const gp = wa * p[0] + wb * p[1]
      const gq = wa * q[0] + wb * q[1]
      const inp = above ? gp >= limit : gp <= limit
      if (inp) out.push(p)
      if (inp !== (above ? gq >= limit : gq <= limit)) {
        const s = (limit - gp) / (gq - gp)
        out.push([mix(p[0], q[0], s), mix(p[1], q[1], s)])
      }
    }
    poly = out
    if (poly.length < 3) return []
  }
  return poly
}

/** The dimension line: beside the right face's bottom edge, out along +x on the floor. */
const DIM = 7.5
const YAW = -Math.PI / 4
const PITCH = -0.6155
const LIGHT = FACES.map((f) => lambert(...orient({ yaw: YAW, pitch: PITCH })(...f.n)))

const depth = new Depth()
const P = CORNERS.map(() => point())
const pen = point()
const a = point()
const b = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6.5,
  still: 0.3,
  draw(draw, t, view) {
    const project = camera({ yaw: YAW, pitch: PITCH, distance: 900, cx: view.w / 2 - 2, cy: view.h / 2 - 2 })
    const at = (c: Corner) => P[CORNERS.indexOf(c)]!
    CORNERS.forEach((c, i) => project(c[0], c[1], c[2], P[i]!))
    const small = view.size < 32
    const hair = 1 / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.35 : 1.5) / view.px
    const dash = clamp(view.size * 0.02, 2.5, 5) / view.px

    // The beats: the pen sets down, traces, the light catches, the faces fill; a hold; the fill runs off and the ink fades to the ghost.
    const trace = span(t, 0.06, 0.46)
    const lit = view.ease.enter(span(t, 0.44, 0.56))
    const fill = (i: number) => view.ease.standard(span(t, 0.47 + LAG[i]!, 0.61 + LAG[i]!))
    const drain = (i: number) => view.ease.standard(span(t, 0.74 + LAG[i]! * 0.7, 0.86 + LAG[i]! * 0.7))
    const measure = view.ease.enter(span(t, 0.58, 0.72))
    const fade = view.ease.standard(span(t, 0.84, 0.97))
    const shown = 1 - fade

    // The ghost: every edge dashed, each starting and ending on a dash. The hidden three, finer, sink under the faces.
    const ghost = (u: Corner, v: Corner, z: number, alpha: number, length: number) => {
      const p = at(u)
      const q = at(v)
      depth.path([p.x, p.y, q.x, q.y], z, { width: hair, alpha, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), length) })
    }
    for (const [u, v] of EDGES) ghost(u, v, -40, small ? 0.4 : 0.34, dash)
    const covered = Math.max(...FACES.map((_, i) => fill(i) - drain(i)))
    if (!small) for (const [u, v] of HIDDEN) ghost(u, v, -50, 0.22 * (1 - covered), dash * 0.6)

    // The faces, lit by their normals: the top floods from the near corner to the far one, the sides run down
    // from the lit edges; later the fill runs on and off through the far edges.
    FACES.forEach((face, i) => {
      const hi = fill(i)
      const lo = drain(i)
      if (hi - lo < 0.002) return
      const part = band(face.run, lo, hi)
      if (!part.length) return
      xy.length = 0
      for (const [u, v] of part) {
        project(
          face.o[0] + u * (face.a[0] - face.o[0]) + v * (face.b[0] - face.o[0]),
          face.o[1] + u * (face.a[1] - face.o[1]) + v * (face.b[1] - face.o[1]),
          face.o[2] + u * (face.a[2] - face.o[2]) + v * (face.b[2] - face.o[2]),
          a,
        )
        xy.push(a.x, a.y)
      }
      depth.face(xy, -10, LIGHT[i]!)
    })

    // The stroke so far, through the corners it has turned, to the pen. Each edge slows onto its corner.
    const legs = STROKE.length - 1
    const along = trace * legs
    const leg = Math.min(Math.floor(along), legs - 1)
    const within = trace >= 1 ? 1 : mix(along - leg, view.ease.emphasized(along - leg), 0.55)
    const from = STROKE[leg]!
    const to = STROKE[leg + 1]!
    project(mix(from[0], to[0], within), mix(from[1], to[1], within), mix(from[2], to[2], within), pen)
    pen.z = 50
    if (trace > 0 && shown > 0) {
      xy.length = 0
      for (let i = 0; i <= leg; i++) xy.push(at(STROKE[i]!).x, at(STROKE[i]!).y)
      xy.push(pen.x, pen.y)
      depth.path(xy, 10, { width: line, alpha: 0.85 * shown, cap: 'square', join: 'miter' })
    }

    // The lit edges run out from where the pen stopped.
    if (lit > 0) {
      for (const [u, v] of LIT) {
        const p = at(u)
        const q = at(v)
        depth.path([p.x, p.y, mix(p.x, q.x, lit), mix(p.y, q.y, lit)], 12, { width: line, alpha: shown, cap: 'square' })
      }
    }

    // The dimension line, drawn out from its middle, with extension lines and ticks.
    if (!small && measure > 0) {
      const alpha = 0.55 * measure * shown
      const x = H + DIM
      const z0 = -H * measure
      const z1 = H * measure
      project(x, -H, z0, a)
      project(x, -H, z1, b)
      depth.line(a, b, hair, alpha, 'c1')
      for (const z of [-H, H]) {
        project(H + 2, -H, z, a)
        project(x + 2.2, -H, z, b)
        depth.line(a, b, hair, alpha * 0.8, 'c1')
      }
      for (const z of [z0, z1]) {
        project(x - 1.5, -H, z - 1.5, a)
        project(x + 1.5, -H, z + 1.5, b)
        depth.line(a, b, line, alpha * 1.3, 'c1')
      }
    }

    // The pen: sets down at the start, rides the stroke, and lifts at its end.
    const down = span(t, 0.01, 0.06) * (1 - span(t, 0.47, 0.53))
    if (down > 0) {
      const side = clamp(view.size * 0.03, 2.2, 6.5) / view.px
      depth.square(pen, side * mix(0.4, 1, down), down, 'accent')
    }
    depth.flush(draw)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An isometric box drawn from its dashed ghost by the accent pen, filled, measured, and returned to its ghost. */
export function LoaderDraft(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
