'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'truss', title: 'Truss', category: 'geometry', technique: 'lines',
  tags: ['bridge', 'structure', 'space frame', 'triangulation', 'load', 'architecture'],
  description: 'Two triangulated bridge frames assemble bay by bay and lock together with transverse ties. A small proof load rolls across the deck, revealing a restrained elastic deflection, then returns as the braces withdraw toward the abutments.',
  order: 30,
  colors: [{ part: 'Members', mono: 'ink' }],
} satisfies LoaderMeta

/* A deck on two lit abutments, with a load cart waiting at one end. Two
 * frames rise over it bay by bay, a top chord and a diagonal at a time
 * (the chord still to come dashed in, as a drawing would show it), every
 * panel point gaining its gusset as its members arrive; then transverse
 * ties lock the frames together. The cart, in the accent, rolls across and
 * back: the deck and both frames give a little under it, most where it
 * stands and least near a support. Then the ties and braces withdraw
 * toward the abutments. The view sways the whole time.
 *
 * Color: each member assembles in `c1` and settles to the ink once
 * it’s home, so the build runs bay by bay as a front of color; the proof
 * load stays the accent. */

const SPAN = 34 // half the span
const DECK = -10 // the deck's top and the bottom chords
const TOP = 14 // the top chords
const FRAME = 10 // the frames' z
const DROP = 2.2 // the deflection under the load, at mid-span

const depth = new Depth()
const P = Array.from({ length: 8 }, () => point())
const a = point()
const b = point()
const xy: number[] = []
const built: number[] = []

/** A box's faces: corner indices (bit 0 x, bit 1 y, bit 2 z) and outward normals. */
const BOX: [number[], number, number, number][] = [
  [[2, 3, 7, 6], 0, 1, 0],
  [[0, 4, 5, 1], 0, -1, 0],
  [[4, 6, 7, 5], 0, 0, 1],
  [[0, 1, 3, 2], 0, 0, -1],
  [[1, 5, 7, 3], 1, 0, 0],
  [[0, 2, 6, 4], -1, 0, 0],
]

export const scene: Scene = {
  beats: 6,
  still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 64
    const bays = small ? 4 : 6
    const hair = (small ? 1.1 : 1.05) / view.px
    const line = 1.3 / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const yaw = -0.44 + 0.07 * Math.sin(TAU * t)
    const pose = { yaw, pitch: -0.38 }
    const zoom = small ? 1.18 : 1.12
    const lens = camera({ ...pose, distance: 360, cx: view.w / 2, cy: view.h / 2 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y + 4) * zoom, z * zoom, out)
    const turn = orient(pose)

    // The cart: waits at the left, rolls across and back once the frames are tied.
    const travel = view.ease.emphasized(span(t, 0.36, 0.58)) - view.ease.emphasized(span(t, 0.62, 0.84))
    const loadX = mix(-SPAN + 7, SPAN - 7, travel)
    // The deflection: most under the cart, least near a support, and none at the supports.
    const sag = DROP * Math.cos((Math.PI * loadX) / (2 * SPAN))
    const deflect = (x: number) => -sag * Math.cos((Math.PI * x) / (2 * SPAN)) * Math.exp(-(((x - loadX) / 26) ** 2))

    const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, key: number, tone: 'ink' | 'accent' = 'ink', edge = 0.5) => {
      for (let i = 0; i < 8; i++) project(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0, P[i]!)
      for (const [ids, nx, ny, nz] of BOX) {
        const v = turn(nx, ny, nz)
        if (v[2] <= 0.001) continue
        xy.length = 0
        for (const i of ids) xy.push(P[i]!.x, P[i]!.y)
        depth.face(xy, key, lambert(v[0], v[1], v[2]), tone)
        if (edge > 0) depth.path(xy, key + 0.001, { width: hair, alpha: edge, closed: true, join: 'miter' })
      }
    }

    // The abutments, lit, with a bearing pad under each end of the deck.
    for (const s of [-1, 1]) {
      box(s * SPAN - 4.5, s * SPAN + 4.5, -25, DECK - 1.2, -14, 14, -300)
      if (!small) for (const z of [-FRAME, FRAME]) box(s * SPAN - 1.6, s * SPAN + 1.6, DECK - 1.2, DECK - 0.6, z - 1.6, z + 1.6, -290)
    }
    // The deck: a thin plate between the frames, its top bending with the load, a segment a bay.
    const segments = bays * 2
    for (let i = 0; i < segments; i++) {
      const x0 = -SPAN + (2 * SPAN * i) / segments
      const x1 = -SPAN + (2 * SPAN * (i + 1)) / segments
      project(x0, DECK + deflect(x0), FRAME, a)
      project(x1, DECK + deflect(x1), FRAME, b)
      project(x1, DECK + deflect(x1), -FRAME, P[0]!)
      project(x0, DECK + deflect(x0), -FRAME, P[1]!)
      const slope = (deflect(x1) - deflect(x0)) / (x1 - x0)
      const n = turn(-slope, 1, 0)
      depth.face([a.x, a.y, b.x, b.y, P[0]!.x, P[0]!.y, P[1]!.x, P[1]!.y], -200, lambert(n[0], n[1], n[2]))
      // The deck's front edge, a little heavier.
      depth.path([a.x, a.y, b.x, b.y], -199, { width: line, alpha: 0.75 })
    }

    const member = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, reveal: number, width: number, alpha: number) => {
      project(x0, y0 + deflect(x0), z0, a)
      const x = mix(x0, x1, reveal)
      project(x, mix(y0, y1, reveal) + deflect(x), mix(z0, z1, reveal), b)
      // A member comes in in the bridge's color and settles to the ink once it's home.
      depth.line(a, b, width, alpha, blend('c1', 'ink', reveal))
    }
    const node = (x: number, y: number, z: number, shown: number) => {
      if (!fine || shown <= 0.01) return
      project(x, y + deflect(x), z, a)
      depth.square(a, 2.2 / view.px, 0.9 * shown)
    }

    // The two frames, bay by bay: the bottom chord always, the top chord and a diagonal rising with each bay.
    built.length = 0
    for (let i = 0; i < bays; i++) {
      const rise = view.ease.emphasized(span(t, 0.02 + i * 0.035, 0.14 + i * 0.035))
      const clear = view.ease.emphasized(span(t, 0.8 + (bays - 1 - i) * 0.014, 0.92 + (bays - 1 - i) * 0.014))
      built.push(clamp(rise) * (1 - clear))
    }
    for (const z of [-FRAME, FRAME]) {
      const near = z > 0
      for (let i = 0; i < bays; i++) {
        const x0 = -SPAN + (2 * SPAN * i) / bays
        const x1 = -SPAN + (2 * SPAN * (i + 1)) / bays
        const k = built[i]!
        member(x0, DECK, z, x1, DECK, z, 1, near ? line : hair, near ? 0.85 : 0.42)
        // The chord still to come, dashed where it will be.
        if (!small && k < 0.999) {
          project(x0, TOP + deflect(x0), z, a)
          project(x1, TOP + deflect(x1), z, b)
          depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2, { width: hair, alpha: 0.22 * (1 - k), dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
        }
        if (k > 0.004) {
          member(x0, TOP, z, x1, TOP, z, k, near ? line : hair, (near ? 0.9 : 0.45) * clamp(k / 0.15))
          member(x0, i % 2 ? TOP : DECK, z, x1, i % 2 ? DECK : TOP, z, k, hair, (near ? 0.8 : 0.4) * clamp(k / 0.15))
        }
      }
      // Verticals and gussets at the panel points, as the members meeting there arrive.
      for (let i = 0; i <= bays; i++) {
        const x = -SPAN + (2 * SPAN * i) / bays
        const k = Math.max(i > 0 ? built[i - 1]! : 0, i < bays ? built[i]! : 0)
        if (k > 0.004) member(x, DECK, z, x, TOP, z, k, hair, (near ? 0.7 : 0.35) * clamp(k / 0.15))
        node(x, DECK, z, near ? k : k * 0.5)
        node(x, TOP, z, (near ? 1 : 0.5) * view.ease.enter(span(k, 0.85, 1)))
      }
    }
    // Transverse ties lock the frames together, then withdraw toward the abutments.
    for (let i = 0; i <= bays; i++) {
      const x = -SPAN + (2 * SPAN * i) / bays
      const edge = Math.abs(i - bays / 2) / (bays / 2)
      const tie = view.ease.enter(span(t, 0.2 + i * 0.02, 0.32 + i * 0.02)) * (1 - view.ease.exit(span(t, 0.78 + (1 - edge) * 0.04, 0.88 + (1 - edge) * 0.04)))
      if (tie > 0.004) member(x, TOP, -FRAME, x, TOP, FRAME, tie, hair, 0.55 * clamp(tie / 0.15))
      member(x, DECK, -FRAME, x, DECK, FRAME, 1, hair, 0.3)
    }

    // The cart, in the accent, on four wheels.
    const deck = DECK + deflect(loadX)
    box(loadX - 3.4, loadX + 3.4, deck + 1.7, deck + 5.1, -3.4, 3.4, 0, 'accent', 0)
    if (!small) {
      for (const dx of [-2.3, 2.3]) {
        for (const dz of [-3.7, 3.7]) {
          project(loadX + dx, deck + 1, dz, a)
          depth.dot(a, 1.15 / view.px, 0.9)
        }
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A bridge's paired triangles lock together before carrying a rolling load. */
export function LoaderTruss(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
