'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, orient, span, Depth, point, type Projected, type Scene, type Stroke } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'torsion',
  title: 'Torsion',
  category: 'geometry',
  technique: 'lines',
  tags: ['twist', 'tower', 'square', 'prism', 'helix', 'wireframe', 'hidden line'],
  description:
    'A square tower drawn in slices and edges takes a quarter turn from the base up, so it wrings into a twist and straightens again, its accent cap turning last; edges round the back are dashed.',
  order: 11,
  colors: [{ part: 'Hidden lines', mono: 'ink' }],
} satisfies LoaderMeta

/* A square prism in wire: square slices up its height and its four long
 * edges, standing on its dashed footprint with a chain-line axis through
 * it. A quarter turn starts at the base and climbs (each height turns
 * `emphasized`, a moment after the one below), so the tower wrings into a
 * twist, the long edges becoming helices, and straightens as the turn
 * reaches the top, where the cap, in the accent, lands it. A quarter turn
 * is the square's own symmetry, so the tower ends as it began. Lines on the
 * faces turned away are dashed, as hidden lines are: a long edge changes
 * from solid to dashed exactly where its faces turn away, and a slice's
 * edge crosses from one to the other as its face passes edge-on, so no line
 * ever blinks. The view sways a little throughout.
 *
 * Color: the hidden lines of the twisting bar are dashed in `c1`,
 * so the twist reads through it; the twisted edge stays the accent. */

const H = 25
const R = 14 * Math.SQRT2
const PITCH = -0.46
const YAW = 0.32
const ZOOM = 1.14

const DETAIL = [
  { below: 32, slices: 4, samples: 14 },
  { below: 80, slices: 6, samples: 22 },
  { below: Infinity, slices: 8, samples: 32 },
]

const depth = new Depth()
const a = point()
const b = point()
const pts: number[] = []
const gs: number[] = []
const zs: number[] = []
const run: number[] = []

export const scene: Scene = {
  beats: 5.5,
  still: 0.36,
  draw(pen, t, view) {
    const { slices, samples } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const yaw = YAW + 0.1 * Math.sin(TAU * t)
    const lens = camera({ yaw, pitch: PITCH, distance: 290, cx: view.w / 2, cy: view.h / 2 + 3 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    const turn = orient({ yaw, pitch: PITCH })
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.2 : 1.35) / view.px
    const dash = clamp(view.size * 0.015, 2, 3.6) / view.px

    // The turn at height y: a quarter, starting at the base and reaching the top last.
    const twist = (y: number) => {
      const start = 0.02 + 0.58 * ((y + H) / (2 * H))
      return (Math.PI / 2) * view.ease.emphasized(span(t, start, start + 0.36))
    }
    /** How squarely the face whose normal points at `angle` faces the eye: above 0 toward it. */
    const facing = (angle: number) => turn(Math.cos(angle), 0, Math.sin(angle))[2]
    // Sorted by their own depth (then across the screen), so a quarter-turned tower draws the very same frame.
    const order = (z: number, x: number) => z / 1000 + x / 1e6
    const solid: Stroke = { width: line, alpha: 0.9, cap: 'round', join: 'round' }
    const hiddenAlpha = small ? 0.26 : 0.36

    // The footprint, dashed, which the base turns off and lands back on, and the axis, a chain line.
    if (view.size >= 64) {
      const foot = H + 3
      const half = R / Math.SQRT2
      const corners = [[half, half], [half, -half], [-half, -half], [-half, half]] as const
      corners.forEach(([x0, z0], i) => {
        const [x1, z1] = corners[(i + 1) % 4]!
        project(x0, -foot, z0, a)
        project(x1, -foot, z1, b)
        depth.path([a.x, a.y, b.x, b.y], -200, { width: hair, alpha: 0.3, dash: fitDash(Math.hypot(b.x - a.x, b.y - a.y), dash) })
      })
      project(0, H + 6, 0, a)
      project(0, -foot - 3, 0, b)
      const length = Math.hypot(b.x - a.x, b.y - a.y)
      depth.path([a.x, a.y, b.x, b.y], -150, { width: hair, alpha: 0.32, dash: [dash * 2.6, dash * 0.7, dash * 0.5, dash * 0.7], offset: -(length % (dash * 4.5)) / 2 })
    }

    // The slices: four edges each, from the corner just past angle 0 round, so a quarter turn lands on the same numbers.
    // An edge is solid while its face is toward us and dashed while it's away, crossing between the two as the face passes edge-on.
    for (let j = 0; j < slices; j++) {
      const y = -H + (2 * H * j) / (slices - 1)
      const th = twist(y)
      const first = Math.floor(((-(th + Math.PI / 4) % TAU) + TAU) / (Math.PI / 2)) % 4
      const cap = j === slices - 1
      for (let e = 0; e < 4; e++) {
        const k = first + e
        const c0 = th + Math.PI / 4 + (k * Math.PI) / 2
        const c1 = c0 + Math.PI / 2
        project(R * Math.cos(c0), y, R * Math.sin(c0), a)
        project(R * Math.cos(c1), y, R * Math.sin(c1), b)
        const z = order((a.z + b.z) / 2, a.x + b.x)
        if (cap) {
          depth.path([a.x, a.y, b.x, b.y], 30 + z, { ...solid, width: line * 1.2, alpha: 1, tone: 'accent' })
          continue
        }
        const w = view.ease.standard(clamp((facing(c0 + Math.PI / 4) + 0.08) / 0.16))
        if (w > 0.004) depth.path([a.x, a.y, b.x, b.y], 10 + z, { ...solid, alpha: 0.7 * w })
        if (w < 0.996) {
          const len = Math.hypot(b.x - a.x, b.y - a.y)
          depth.path([a.x, a.y, b.x, b.y], -10 + z, { width: hair, alpha: hiddenAlpha * (1 - w), dash: small ? undefined : fitDash(len, dash), tone: 'c1' })
        }
      }
    }

    // The long edges: helices while the turn climbs, solid where a face beside them faces us, split exactly where it stops.
    for (let k = 0; k < 4; k++) {
      pts.length = 0
      gs.length = 0
      zs.length = 0
      for (let i = 0; i <= samples; i++) {
        const y = -H + (2 * H * i) / samples
        const c = twist(y) + Math.PI / 4 + (k * Math.PI) / 2
        project(R * Math.cos(c), y, R * Math.sin(c), a)
        pts.push(a.x, a.y)
        zs.push(a.z)
        // The cap is seen from above, so the edge is always in view at the top.
        gs.push(i === samples ? Math.max(0.02, facing(c - Math.PI / 4), facing(c + Math.PI / 4)) : Math.max(facing(c - Math.PI / 4), facing(c + Math.PI / 4)))
      }
      // Walk the samples, cutting a run wherever the visibility changes sign, at the interpolated crossing.
      let i0 = 0
      let start: [number, number] = [pts[0]!, pts[1]!]
      let front = gs[0]! > 0
      const emit = (end: [number, number], to: number, fixedStart: boolean, fixedEnd: boolean) => {
        run.length = 0
        run.push(start[0], start[1])
        for (let i = i0 + 1; i < to; i++) run.push(pts[2 * i]!, pts[2 * i + 1]!)
        run.push(end[0], end[1])
        if (run.length < 4) return
        let zsum = 0
        let xsum = 0
        for (let i = i0; i < to; i++) {
          zsum += zs[i]!
          xsum += pts[2 * i]!
        }
        const z = order(zsum / Math.max(1, to - i0), xsum)
        if (front) {
          depth.path(run, 12 + z, solid)
          return
        }
        // Dashes count from a fixed end of the edge (its foot or its top), so they never crawl as the cut moves.
        if (!fixedStart && fixedEnd) {
          const back: number[] = []
          for (let i = run.length - 2; i >= 0; i -= 2) back.push(run[i]!, run[i + 1]!)
          run.length = 0
          run.push(...back)
        }
        let len = 0
        for (let i = 2; i < run.length; i += 2) len += Math.hypot(run[i]! - run[i - 2]!, run[i + 1]! - run[i - 1]!)
        depth.path(run, -12 + z, { width: hair, alpha: hiddenAlpha, dash: small ? undefined : fitDash(len, dash), tone: 'c1' })
      }
      let fixed = true
      for (let i = 1; i <= samples; i++) {
        const g0 = gs[i - 1]!
        const g1 = gs[i]!
        if (g0 > 0 !== g1 > 0) {
          const u = g0 / (g0 - g1)
          const cut: [number, number] = [pts[2 * i - 2]! + (pts[2 * i]! - pts[2 * i - 2]!) * u, pts[2 * i - 1]! + (pts[2 * i + 1]! - pts[2 * i - 1]!) * u]
          emit(cut, i, fixed, false)
          start = cut
          i0 = i - 1
          front = g1 > 0
          fixed = false
        }
      }
      emit([pts[2 * samples]!, pts[2 * samples + 1]!], samples, fixed, true)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A wire square tower wrings into a twist as a quarter turn climbs it, and straightens; its accent cap turns last. */
export function LoaderTorsion(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
