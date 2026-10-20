'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { type Tone, blend, TAU, camera, clamp, lambert, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'core',
  title: 'Core',
  category: 'geometry',
  technique: 'planes',
  tags: ['cube', 'exploded view', 'octants', 'isometric', 'reveal', 'assemble', 'blocks'],
  description:
    'A cube parts into its eight corner blocks in an exploded view, showing a small accent cube turning at its heart, then closes over it and lands square.',
  order: 13,
  colors: [{ part: 'Exploded view', mono: 'ink' }],
} satisfies LoaderMeta

/* The illustrations' boxes take an exploded view: a cube made of eight
 * corner blocks moves apart along its diagonals, the top four a moment
 * ahead (`enter`, a burst that settles), and at the center the brand's
 * square, grown into a cube in the accent, turns a quarter turn. Then the
 * blocks close over it (`emphasized`: a wind-up, a fast middle, a long
 * landing) and the cube is whole again, at rest at both ends of the loop.
 * Every face is lit by its normal; nearer blocks cover farther ones.
 *
 * Color: as the blocks part, their edges warm toward `c1` and the
 * phantom cube they came from is drawn in it; the core stays the accent. */

const H = 15
const GAP = 8.5
const CORE = 6.5
const YAW = -0.42
const PITCH = -0.5

type V3 = [number, number, number]

/** The eight blocks, by the octant they sit in: the top four first. */
const OCTANTS: V3[] = [1, -1].flatMap((y) => [1, -1].flatMap((x) => [1, -1].map((z) => [x, y, z] as V3)))
/** A box's six faces: corner indices (bit 0 x, bit 1 y, bit 2 z) and outward normal. */
const FACES: { c: [number, number, number, number]; n: V3 }[] = [
  { c: [1, 3, 7, 5], n: [1, 0, 0] },
  { c: [0, 4, 6, 2], n: [-1, 0, 0] },
  { c: [2, 6, 7, 3], n: [0, 1, 0] },
  { c: [0, 1, 5, 4], n: [0, -1, 0] },
  { c: [4, 5, 7, 6], n: [0, 0, 1] },
  { c: [0, 2, 3, 1], n: [0, 0, -1] },
]

const depth = new Depth()
/** The camera's turn, for the faces' light: set each frame, as the view sways. */
let turn = orient({ yaw: YAW, pitch: PITCH })
const corners = Array.from({ length: 8 }, () => point())
const mid = point()
const a = point()
const b = point()

/** Adds a lit box (min corner, size, turned by `spin` about the vertical through its center) to the buffer. */
function box(project: (x: number, y: number, z: number, out: Projected) => Projected, lo: V3, size: number, spin: number, hair: number, tone: 'ink' | 'accent', edge: Tone = 'ink') {
  const half = size / 2
  const cx = lo[0] + half
  const cy = lo[1] + half
  const cz = lo[2] + half
  const cs = Math.cos(spin)
  const sn = Math.sin(spin)
  for (let i = 0; i < 8; i++) {
    const dx = i & 1 ? half : -half
    const dy = i & 2 ? half : -half
    const dz = i & 4 ? half : -half
    project(cx + dx * cs + dz * sn, cy + dy, cz - dx * sn + dz * cs, corners[i]!)
  }
  project(cx, cy, cz, mid)
  for (const { c, n } of FACES) {
    const [nx, ny, nz] = turn(n[0] * cs + n[2] * sn, n[1], -n[0] * sn + n[2] * cs)
    if (nz <= 0.001) continue
    const xy = c.flatMap((k) => [corners[k]!.x, corners[k]!.y])
    depth.face(xy, mid.z, lambert(nx, ny, nz), tone)
    if (hair > 0) depth.path(xy, mid.z, { width: hair, alpha: tone === 'accent' ? 0 : 0.4, closed: true, join: 'miter', tone: edge })
  }
}

export const scene: Scene = {
  beats: 5.5,
  still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32
    const yaw = YAW + 0.18 * Math.sin(TAU * t)
    const project = camera({ yaw, pitch: PITCH, distance: 320, cx: view.w / 2, cy: view.h / 2 + 1 })
    turn = orient({ yaw, pitch: PITCH })
    const hair = small ? 0 : 1 / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px

    // The core: grows in as the blocks part, turns a quarter, shrinks as they close.
    const grow = view.ease.enter(span(t, 0.16, 0.4)) * (1 - view.ease.standard(span(t, 0.66, 0.84)))
    if (grow > 0.01) {
      const size = CORE * 2 * grow
      const spin = (Math.PI / 2) * view.ease.emphasized(span(t, 0.3, 0.66))
      box(project, [-size / 2, -size / 2, -size / 2], size, spin, hair, 'accent')
    }

    // The cube the blocks came from, a dashed phantom behind them while they are apart, as an exploded view draws it.
    const apart = view.ease.enter(span(t, 0.06, 0.36)) - view.ease.emphasized(span(t, 0.6, 0.92))
    if (view.size >= 64 && apart > 0.01) {
      for (let e = 0; e < 12; e++) {
        const axis = Math.floor(e / 4)
        const s1 = e & 1 ? H : -H
        const s2 = e & 2 ? H : -H
        const at = (v: number): V3 => (axis === 0 ? [v, s1, s2] : axis === 1 ? [s1, v, s2] : [s1, s2, v])
        project(...at(-H), a)
        project(...at(H), b)
        depth.path([a.x, a.y, b.x, b.y], -1000, { width: 1 / view.px, alpha: 0.32 * apart, tone: 'c1', dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
      }
    }

    // The blocks: apart along their diagonals (top four first), then back together.
    OCTANTS.forEach(([x, y, z]) => {
      const lead = y > 0 ? 0 : 0.04
      const open = view.ease.enter(span(t, 0.06 + lead, 0.36 + lead)) - view.ease.emphasized(span(t, 0.6 + lead * 0.5, 0.92 + lead * 0.5))
      const d = GAP * open
      const lo: V3 = [x > 0 ? d : -H - d, y > 0 ? d : -H - d, z > 0 ? d : -H - d]
      box(project, lo, H, 0, hair, 'ink', blend('ink', 'c1', 0.6 * open))
    })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A cube parts into its eight corner blocks, an accent cube turning at its heart, and closes again. */
export function LoaderCore(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
