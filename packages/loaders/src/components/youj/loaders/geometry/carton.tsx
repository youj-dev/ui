'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, mix, orient, span, Depth, point, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'carton',
  title: 'Carton',
  category: 'geometry',
  technique: 'planes',
  tags: ['cube', 'net', 'fold', 'box', 'package', 'isometric', 'crease'],
  description:
    'A cube’s net, drawn as a die-cut with dashed creases, folds up face by face into a box while the view closes in; the lid shuts on the accent square printed on it, then the box opens flat again.',
  order: 3,
  colors: [{ part: 'Creases', mono: 'ink' }],
} satisfies LoaderMeta

/* A die-cut carton: six squares in a cross, cut lines solid and creases
 * dashed, as a packaging drawing marks them. The flaps rise one after
 * another (`emphasized`, far ones first), each toned by where its face now
 * points, the creases turning into edges as they fold, and the lid comes
 * over last, bringing the square printed on its outside into view as the
 * box closes. The view eases in as the net becomes a box and sways a little
 * so the volume reads; then everything opens again in reverse, flat at both
 * ends of the loop.
 *
 * Color: the score lines waiting to fold are `c1`, and each crease
 * settles to the ink as it folds; the printed square stays the accent. */

const S = 24
const h = S / 2

type V3 = [number, number, number]

/** A flap: where its crease is, which way it runs, and which way the flap lies when flat. */
interface Flap {
  o: V3
  u: V3
  d: V3
  /** Fold windows, as loop progress: up, then down. */
  up: [number, number]
  down: [number, number]
}

const FLAPS: Flap[] = [
  { o: [0, 0, -h], u: [-1, 0, 0], d: [0, 0, -1], up: [0.06, 0.22], down: [0.78, 0.9] }, // back: carries the lid
  { o: [-h, 0, 0], u: [0, 0, -1], d: [-1, 0, 0], up: [0.12, 0.28], down: [0.74, 0.86] }, // left
  { o: [h, 0, 0], u: [0, 0, 1], d: [1, 0, 0], up: [0.18, 0.34], down: [0.7, 0.82] }, // right
  { o: [0, 0, h], u: [1, 0, 0], d: [0, 0, 1], up: [0.24, 0.4], down: [0.66, 0.78] }, // front
]
const LID = { up: [0.34, 0.5] as [number, number], down: [0.6, 0.72] as [number, number] }

/** A face's four corners in world units, its inside normal, and its crease state. */
interface Face {
  c: V3[]
  n: V3
  /** 0 flat to 1 folded square: how far its crease has become an edge. */
  fold: number
  lid?: boolean
}

const faces: Face[] = Array.from({ length: 6 }, () => ({ c: [0, 1, 2, 3].map(() => [0, 0, 0] as V3), n: [0, 1, 0] as V3, fold: 0 }))
const set = (v: V3, x: number, y: number, z: number) => {
  v[0] = x
  v[1] = y
  v[2] = z
}

/** Where a point on a flap lands: `u` along its crease, `d` out from it and `w` off its face, folded up by `a`. */
function place(out: V3, f: Flap, u: number, d: number, w: number, a: number) {
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const along = d * cos - w * sin
  const up = d * sin + w * cos
  set(out, f.o[0] + u * f.u[0] + along * f.d[0], up, f.o[2] + u * f.u[2] + along * f.d[2])
}

const fold = (view: View, t: number, up: [number, number], down: [number, number]) =>
  view.ease.emphasized(span(t, up[0], up[1])) - view.ease.emphasized(span(t, down[0], down[1]))

const depth = new Depth()
const P = [point(), point(), point(), point()]
const Q = [point(), point(), point(), point()]
const mid = point()
const tmp: V3 = [0, 0, 0]

export const scene: Scene = {
  beats: 6.5,
  still: 0.31,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.2 : view.size < 80 ? 1.1 : 1.25) / view.px
    const dash = Math.max(2, view.size * 0.016) / view.px

    // Fold the net: the base, the four flaps, and the lid on the back flap.
    const base = faces[0]!
    set(base.c[0]!, -h, 0, -h)
    set(base.c[1]!, h, 0, -h)
    set(base.c[2]!, h, 0, h)
    set(base.c[3]!, -h, 0, h)
    set(base.n, 0, 1, 0)
    base.fold = 1
    let folded = 0
    FLAPS.forEach((f, i) => {
      const k = fold(view, t, f.up, f.down)
      const a = (k * Math.PI) / 2
      const face = faces[i + 1]!
      place(face.c[0]!, f, -h, 0, 0, a)
      place(face.c[1]!, f, h, 0, 0, a)
      place(face.c[2]!, f, h, S, 0, a)
      place(face.c[3]!, f, -h, S, 0, a)
      set(face.n, -Math.sin(a) * f.d[0], Math.cos(a), -Math.sin(a) * f.d[2])
      face.fold = k
      folded += k
    })
    const back = FLAPS[0]!
    const a = (fold(view, t, back.up, back.down) * Math.PI) / 2
    const k = fold(view, t, LID.up, LID.down)
    const b = (k * Math.PI) / 2
    const lid = faces[5]!
    const lidAt = (out: V3, u: number, r: number) => place(out, back, u, S + r * Math.cos(b), r * Math.sin(b), a)
    lidAt(lid.c[0]!, -h, 0)
    lidAt(lid.c[1]!, h, 0)
    lidAt(lid.c[2]!, h, S)
    lidAt(lid.c[3]!, -h, S)
    set(lid.n, -Math.sin(a + b) * back.d[0], Math.cos(a + b), -Math.sin(a + b) * back.d[2])
    lid.fold = k
    lid.lid = true
    folded = (folded + k) / 5

    // The view: from the net's middle to the box's, closing in as it folds, with a slow sway.
    const yaw = -Math.PI / 4 + 0.12 * Math.sin(TAU * t)
    const pitch = -0.62
    const zoom = mix(1, 1.34, view.ease.standard(k))
    const tx = 0
    const ty = mix(0, h, folded)
    const tz = mix(-h, 0, folded)
    const cam = camera({ yaw, pitch, distance: 420, cx: view.w / 2, cy: view.h / 2 + 1 })
    const project = (v: V3, out: (typeof P)[number]) => cam((v[0] - tx) * zoom, (v[1] - ty) * zoom, (v[2] - tz) * zoom, out)
    const turn = orient({ yaw, pitch })

    faces.forEach((face, i) => {
      face.c.forEach((c, j) => project(c, P[j]!))
      // Which side we see: the inside (plain board, a little darker) or the outside (the one that ends up showing).
      const [nx, ny, nz] = turn(face.n[0], face.n[1], face.n[2])
      const inside = nz > 0
      const s = inside ? 1 : -1
      set(tmp, (face.c[0]![0] + face.c[2]![0]) / 2, (face.c[0]![1] + face.c[2]![1]) / 2, (face.c[0]![2] + face.c[2]![2]) / 2)
      project(tmp, mid)
      const z = mid.z
      const xy = [P[0]!.x, P[0]!.y, P[1]!.x, P[1]!.y, P[2]!.x, P[2]!.y, P[3]!.x, P[3]!.y]
      depth.face(xy, z, lambert(nx * s, ny * s, nz * s) * (inside ? 0.82 : 1))

      // Cut lines solid; the crease (corners 0–1, shared with the face it hangs from) dashed until it folds.
      if (i > 0) {
        depth.path([P[1]!.x, P[1]!.y, P[2]!.x, P[2]!.y, P[3]!.x, P[3]!.y, P[0]!.x, P[0]!.y], z, { width: hair, alpha: 0.85, join: 'miter' })
        const crease = [P[0]!.x, P[0]!.y, P[1]!.x, P[1]!.y]
        const len = Math.hypot(P[1]!.x - P[0]!.x, P[1]!.y - P[0]!.y)
        const edge = span(face.fold, 0.15, 0.6)
        if (edge < 1) depth.path(crease, z, { width: hair, alpha: (small ? 0.4 : 0.6) * (1 - edge), dash: small ? undefined : fitDash(len, dash), tone: 'c1' })
        if (edge > 0) depth.path(crease, z, { width: hair, alpha: 0.85 * edge, tone: blend('c1', 'ink', edge) })
      }

      // The square printed on the lid's outside: it comes into view as the lid shuts.
      if (face.lid && !inside) {
        const r = S * 0.13
        const sq = [
          [-r, h - r],
          [r, h - r],
          [r, h + r],
          [-r, h + r],
        ]
        sq.forEach(([u, v], j) => {
          lidAt(tmp, u!, v!)
          project(tmp, Q[j]!)
        })
        depth.poly([Q[0]!.x, Q[0]!.y, Q[1]!.x, Q[1]!.y, Q[2]!.x, Q[2]!.y, Q[3]!.x, Q[3]!.y], z, 1, 'accent')
      }
    })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A die-cut cube net folds into a box, the lid shutting on the accent square, and opens flat again. */
export function LoaderCarton(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
