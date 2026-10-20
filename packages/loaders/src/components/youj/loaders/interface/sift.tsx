'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, lambert, mix, orient, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'sift', title: 'Sift', category: 'interface', technique: 'planes',
  tags: ['sort', 'compare', 'swap', 'lanes', 'algorithm', 'steps'],
  description: 'Five unequal slats sort through alternating neighbouring comparisons. Each exchanging pair passes at separate depths, then the comparison schedule reverses to restore the starting order without a reset or a crossfade.',
  order: 9,
  colors: [{ part: 'Comparisons', mono: 'ink' }],
} satisfies LoaderMeta

/* Odd-even transposition sort, done with lit slats on five lanes, their
 * left ends on one line so their lengths compare at a glance. Each pass has
 * two beats: first its comparisons, a bracket joining each pair of lanes it
 * compares (fainter where the pair is already in order), showing as the last
 * swaps land; then the pairs out of order exchange lanes (`emphasized`), one
 * passing in front of the other, the slat going down marked at its end in
 * the accent. Five passes sort them; the same schedule run backwards
 * unsorts them, so the loop has no seam. Each slat ends in a darker,
 * slightly prouder cap.
 *
 * Color: each pass’s comparisons, the brackets joining the lanes it compares, are `c1`; the slats keep the ink, a swapping slat’s edge the accent. */

type V3 = [number, number, number]
interface Pass { before: number[]; after: number[]; start: number }
const passes: Pass[] = []
let order = [3, 1, 4, 2, 0]
for (let stage = 0; stage < 5; stage++) {
  const before = [...order]
  for (let i = stage % 2; i < 4; i += 2) if (order[i]! > order[i + 1]!) {
    const a = order[i]!; order[i] = order[i + 1]!; order[i + 1] = a
  }
  passes.push({ before, after: [...order], start: stage % 2 })
}
for (const pass of [...passes].reverse()) passes.push({ before: pass.after, after: pass.before, start: pass.start })
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const face: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const normals: V3[] = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [-1, 0, 0]]
/** Unit corners, reused for every slat instead of rebuilding boxes each frame. */
const corners: V3[][] = [
  [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
  [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
  [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]],
  [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
]
/** Where every slat's left end sits, and how long a slat of each value is. */
const LEFT = -27
const length = (value: number) => 17 + value * 8
const lane = (slot: number) => 32 - 16 * slot

export const scene: Scene = {
  beats: 6, still: 0.24,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1 : 1.15) / view.px
    const pose = { yaw: -0.32, pitch: -0.22 }
    const project = camera({ ...pose, distance: 258, cx: view.w / 2 + 1, cy: 50 })
    const turn = orient(pose)
    const clock = Math.min(t * passes.length, passes.length - 0.0000001)
    const index = Math.floor(clock)
    const pass = passes[index]!, next = passes[(index + 1) % passes.length]!, local = t === 1 ? 1 : clock % 1
    // Two beats a pass: its comparisons show as the last swaps land, then its own swaps run.
    const look = 1 - view.ease.standard(span(local, 0.24, 0.5))
    const ahead = view.ease.standard(span(local, 0.72, 1))
    const move = view.ease.emphasized(span(local, 0.08, 1))
    const separation = 8 * Math.sin(Math.PI * move)

    /** A lit box on the slats' plane, from x0 to x1, around lane height y, lifted z; light scaled by `shade`. */
    const box = (x0: number, x1: number, y: number, h: number, z: number, shade: number) => {
      const cx = (x0 + x1) / 2, half = (x1 - x0) / 2
      corners.forEach((c, i) => {
        const n = turn(...normals[i]!)
        if (n[2] <= 0) return
        c.forEach((v, j) => {
          face[j]![0] = cx + v[0] * half
          face[j]![1] = y + v[1] * h
          face[j]![2] = z + v[2] * 2
        })
        const projected = projectPath(face, project, xy)
        depth.face(projected.xy, projected.z, lambert(...n) * shade)
        if (i === 0) depth.path(projected.xy, projected.z + 0.02, { width: hair * 0.8, alpha: 0.8, closed: true })
      })
    }

    for (let slot = 0; slot < 5; slot++) {
      if (small) continue
      // Each lane: a rail behind the slats, from a knot at its start.
      project(LEFT - 4, lane(slot), -5, p); project(LEFT + length(4) + 5, lane(slot), -5, q)
      depth.line(p, q, hair * 0.65, 0.14)
      project(LEFT - 4, lane(slot), 0, p)
      depth.square(p, hair * 2.4, 0.4)
    }
    for (let value = 0; value < 5; value++) {
      const from = pass.before.indexOf(value), to = pass.after.indexOf(value)
      const y = lane(mix(from, to, move))
      const z = from === to ? 0 : from < to ? separation : -separation
      const h = 2.6
      const right = LEFT + length(value)
      box(LEFT, right - 2, y, h, z, 1)
      // The cap: a darker, slightly prouder end, its joint marking the slat's value.
      box(right - 2, right, y, h + 0.25, z, 0.78)
      if (from < to) {
        project(LEFT, y - h, z + 2.2, p); project(LEFT, y + h, z + 2.2, q)
        depth.line(p, q, hair * 1.5, Math.sin(Math.PI * move), 'accent')
      }
    }
    // A pass's comparisons: a bracket joining each pair of lanes it compares, fainter where the pair is already in order.
    if (view.size >= 40) for (const [shown, compare] of [[look, pass], [ahead, next]] as const) {
      if (shown < 0.01) continue
      for (let i = compare.start; i < 4; i += 2) {
        const swaps = compare.before[i] !== compare.after[i]
        const ya = lane(i), yb = lane(i + 1)
        const bracket = projectPath([[LEFT - 1.5, ya, 0], [LEFT - 4, ya, 0], [LEFT - 4, yb, 0], [LEFT - 1.5, yb, 0]], project, xy)
        depth.path(bracket.xy, bracket.z, { width: hair, alpha: (swaps ? 0.7 : 0.32) * shown, join: 'round', tone: 'c1' })
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Adjacent slats exchange lanes through depth, sort, then retrace their comparisons. */
export function LoaderSift(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
