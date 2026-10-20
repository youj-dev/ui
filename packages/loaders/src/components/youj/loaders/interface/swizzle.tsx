'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, point, span, Depth, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'swizzle', title: 'Swizzle', category: 'interface', technique: 'planes',
  tags: ['matrix', 'transpose', 'reshape', 'dataset', 'rows', 'columns'],
  description: 'A matrix transposes around its anchored diagonal. Three pairs of record cards exchange row and column through separate depth lanes, retaining their contents; a diagonal register advances with each exchange before the transformation reverses.',
  order: 20,
  colors: [{ part: 'Contents', mono: 'ink' }],
} satisfies LoaderMeta

const PAIRS = [[0, 1], [0, 2], [1, 2]] as const
const depth = new Depth()
const p = point(), q = point()
const corners = Array.from({ length: 4 }, point)
const xy: number[] = []

/** A rectangle on a card's face, lit: the card itself, its header band, a content bar. Sorted at `at` when given (on top of its card), else by its own depth, which it returns.
 *
 * Color: each record’s contents, the bars it carries through the transpose, are `c1`, lit as a color is; the cards keep the ink, each diagonal tick the accent as its pair locks. */
function plate(project: Project, x0: number, y0: number, x1: number, y1: number, z: number, light: number, at?: number, tone: Tone = 'ink') {
  project(x0, y0, z, corners[0]!)
  project(x1, y0, z, corners[1]!)
  project(x1, y1, z, corners[2]!)
  project(x0, y1, z, corners[3]!)
  xy.length = 0
  let order = 0
  for (const c of corners) { xy.push(c.x, c.y); order += c.z / 4 }
  depth.face(xy, at ?? order, light, tone)
  return order
}

export const scene: Scene = {
  beats: 6, still: 0.36,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    // A slow sway keeps the matrix alive while it holds the transpose; none when tiny.
    const pose = { yaw: -0.27 + (small ? 0 : 0.035 * Math.sin(TAU * t)), pitch: -0.3 }
    const lens = camera({ ...pose, distance: 260, cx: view.w / 2 + 1, cy: 49 })
    const project: Project = (x, y, z, out) => lens(x * 1.16, y * 1.16, z * 1.16, out)
    const light = lambert(...orient(pose)(0, 0, 1))
    const half = 7.5
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const pair = PAIRS.findIndex(([a, b]) => (r === a && c === b) || (r === b && c === a))
      const k = pair < 0 ? 0 : clamp(view.ease.emphasized(span(t, 0.045 + pair * 0.125, 0.2 + pair * 0.125)) - view.ease.emphasized(span(t, 0.61 + (2 - pair) * 0.105, 0.765 + (2 - pair) * 0.105)))
      const x = mix((c - 1) * 20, (r - 1) * 20, k)
      const y = mix((1 - r) * 20, (1 - c) * 20, k)
      const lift = Math.sin(Math.PI * k) * (r < c ? 15 : -15)
      // The card: a lit face, a darker header band across its top, and its edges; the near (bottom) edge firmer.
      const z = plate(project, x - half, y - half, x + half, y + half, lift, light)
      plate(project, x - half, y + half * 0.5, x + half, y + half, lift, light * 0.8, z + 0.01)
      project(x - half, y - half, lift, corners[0]!)
      project(x + half, y - half, lift, corners[1]!)
      project(x + half, y + half, lift, corners[2]!)
      project(x - half, y + half, lift, corners[3]!)
      xy.length = 0
      for (const v of corners) xy.push(v.x, v.y)
      const edge = 0.65 + clamp((lift + 15) / 30) * 0.25
      depth.path(xy, z + 0.02, { width: hair * 0.85, alpha: edge, closed: true })
      depth.path(xy.slice(0, 4), z + 0.03, { width: hair * 1.1, alpha: edge })
      // Contents move with their record: this is a transpose, not a sort. A bar per row, each record its own lengths.
      const marks = small ? 1 : r + 1
      for (let j = 0; j < marks; j++) {
        const yy = y + 0.8 - j * 3
        const length = 6.4 + ((c * 2 + j * 3) % 4) * 1.4
        plate(project, x - 5, yy - 0.55, x - 5 + length, yy + 0.55, lift, light * 0.66, z + 0.04, 'c1')
      }
      // A diagonal record is anchored: a pin in its header's corner.
      if (r === c && !small) plate(project, x - half + 1.4, y + half - 3.2, x - half + 3.2, y + half - 1.4, lift, light * 0.45, z + 0.05)
    }
    // Three diagonal register ticks lock in sequence as the pair beside them lands: ink at rest, the accent while it locks.
    for (let i = 0; i < 3; i++) {
      const active = Math.sin(Math.PI * span(t, 0.06 + i * 0.125, 0.25 + i * 0.125)) ** 2
      const x = (i - 1) * 20, y = (1 - i) * 20
      for (const [ax, ay, bx, by] of [[x - 10, y + 10, x - 10, y + 5], [x - 10, y + 10, x - 5, y + 10]] as const) {
        project(ax, ay, 1, p); project(bx, by, 1, q)
        depth.line(p, q, hair, 0.22 * (1 - active))
        if (active > 0.004) depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.01, { width: hair * 1.2, alpha: 0.95 * active, tone: 'accent' })
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Record pairs transpose through opposite depth lanes around a fixed diagonal. */
export function LoaderSwizzle(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
