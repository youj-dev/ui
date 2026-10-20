'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, clamp, TAU, camera, lambert, orient, span, Depth, point, projectPath, type Project, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { circle, disc, part, pin, rod, type Turn, type V3 } from './machine'

export const meta = {
  id: 'dwell', title: 'Dwell', category: 'mechanics', technique: 'mixed',
  tags: ['cam', 'follower', 'spring', 'lift', 'dwell'],
  description: 'A turning cam lifts a roller follower through its guide and compresses the return spring, holds it at full travel through the dwell, then lowers it onto the base circle. The roller rides the profile all the way round.',
  order: 2,
  colors: [{ part: 'Spring', mono: 'ink' }],
} satisfies LoaderMeta

/* A plate cam on a plinth, its roller follower in a fork on a guided rod.
 * The cam turns steadily, once a loop; its profile does the choreography:
 * a rise, a dwell at full lift, a gentler fall and a dwell on the base
 * circle (drawn dashed, so the lift reads against it). The follower can
 * only answer: the roller is solved onto the profile each frame, the rod
 * slides through the bracket, and the spring between the collar and the
 * bracket closes coil by coil as it lifts.
 *
 * Color: the spring warms toward `c1` as the follower lifts and compresses it, holds through the dwell, and cools to the ink as it lowers. */

const CAM_Y = -10
const BASE = 14.5
const LIFT = 9.5
const ROLLER = 3
const BRACKET = 35
const depth = new Depth()
const outlines = [40, 64, 96].map((n) => Array.from({ length: n }, () => [0, 0, 0] as V3))
const coil: V3[] = Array.from({ length: 121 }, () => [0, 0, 0])
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const boss: V3[] = []
const roller: V3[] = []
const cheek: V3[] = []
const xy: number[] = []
const p = point()
const q = point()
const radius = (u: number, view: View) => BASE + LIFT * (view.ease.emphasized(span(u, 0.12, 0.32)) - view.ease.standard(span(u, 0.58, 0.86)))

/** Upper envelope of the cam offset by the roller's radius, on the follower axis.
 * The contact normal changes during the rise, so radial height alone would
 * let the roller clip into the flank. A bounded search keeps it in contact. */
function follower(t: number, view: View) {
  const height = (a: number) => {
    const r = radius((t + a / TAU + 1) % 1, view)
    const x = r * Math.sin(a)
    return Math.abs(x) >= ROLLER ? -Infinity : r * Math.cos(a) + Math.sqrt(ROLLER * ROLLER - x * x)
  }
  let lo = -0.2, hi = 0.2
  for (let i = 0; i < 24; i++) {
    const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3
    if (height(a) > height(b)) hi = b
    else lo = a
  }
  return CAM_Y + Math.max(height(0), height((lo + hi) / 2))
}

/** A lit box between two corners: its faces toward the viewer, outlined. */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number, bias = 0) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[1, 0, 0], [[hi[0], lo[1], hi[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [hi[0], hi[1], hi[2]]]],
    [[-1, 0, 0], [[lo[0], lo[1], lo[2]], [lo[0], lo[1], hi[2]], [lo[0], hi[1], hi[2]], [lo[0], hi[1], lo[2]]]],
  ]
  for (const [n, corners] of faces) {
    const v = turn(...n)
    if (v[2] <= 0.02) continue
    corners.forEach((c, i) => {
      box[i]![0] = c[0]!
      box[i]![1] = c[1]!
      box[i]![2] = c[2]!
    })
    const f = projectPath(box, project, xy)
    depth.face(f.xy, f.z + bias, lambert(...v))
    depth.path(f.xy, f.z + bias + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  }
}

export const scene: Scene = {
  beats: 5.5, still: 0.38,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.05 : 1.05) / view.px
    const pose = { yaw: -0.3 + (small ? 0 : 0.05) * Math.sin(TAU * t), pitch: -0.2 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2 + 1, cy: 52 })
    const turn = orient(pose)
    const outline = outlines[small ? 0 : view.size < 80 ? 1 : 2]!
    const spin = -TAU * t
    for (let i = 0; i < outline.length; i++) {
      const u = i / outline.length
      const r = radius(u, view)
      const a = Math.PI / 2 + TAU * u + spin
      const v = outline[i]!
      v[0] = r * Math.cos(a)
      v[1] = CAM_Y + r * Math.sin(a)
      v[2] = 2
    }

    // The plinth and the frame: two posts up to the bracket the rod slides through.
    block(project, turn, [-24, -38, -9], [24, -34, 5], hair * 0.85, 0.6)
    if (!small) for (const x of [-15, 15]) block(project, turn, [x - 1.6, -34, -7.5], [x + 1.6, BRACKET, -4.5], hair * 0.8, 0.5, -12)
    block(project, turn, [-17, BRACKET, -7.5], [17, BRACKET + 3.2, 3.8], hair * 0.85, 0.75, 0.2)

    // The cam: lit plate, its hub, and an engraved index line turning with it.
    const layer = part(depth, project, turn, outline, [], 5, hair, large ? 0.9 : 0)
    if (large) circle(depth, project, 0, CAM_Y, 2.02, BASE, hair * 0.7, 0.4, 'ink', 72, layer + 0.01, [2.4 * hair, 2 * hair])
    const top = part(depth, project, turn, disc(0, CAM_Y, 3.4, small ? 4.4 : 4.2, 24, boss), [], 1.4, hair * 0.9, 0, 0.85)
    pin(depth, project, turn, 0, CAM_Y, 3.5, small ? 2.1 : 1.8, hair * 0.85, 'ink', top + 0.01)
    rod(depth, project, [5.6 * Math.cos(spin), CAM_Y + 5.6 * Math.sin(spin), 2.05], [11 * Math.cos(spin), CAM_Y + 11 * Math.sin(spin), 2.05], hair * 0.9, 0.55, 'ink', layer + 0.02)

    // The follower: roller in its fork, the rod, the collar, and the spring the collar compresses.
    const y = follower(t, view)
    block(project, turn, [-1.15, y + 1.2, -1.6], [1.15, y + 29, 1.6], hair * 0.85, 0.8)
    const rollerLayer = part(depth, project, turn, disc(0, y, 2.1, ROLLER, small ? 14 : 22, roller), [], 5, hair * 0.95, 0, 0.9)
    // The fork's front cheek, holding the roller's pin.
    cheek.length = 0
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (Math.PI * i) / 8
      cheek.push([1.9 * Math.cos(a), y + 1.9 * Math.sin(a), 2.9])
    }
    cheek.push([2.4, y + 5.6, 2.9], [-2.4, y + 5.6, 2.9])
    const forkLayer = part(depth, project, turn, cheek, [], 0.7, hair * 0.85, 0, 0.85, rollerLayer + 0.05)
    pin(depth, project, turn, 0, y, 3, small ? 1.3 : 1.05, hair * 0.8, 'accent', forkLayer + 0.01)
    block(project, turn, [-4.2, y + 9.2, -2.2], [4.2, y + 10.6, 2.2], hair * 0.85, 0.85, 0.1)
    // The spring: a helix from the collar to the bracket, split so its back coils pass behind the rod.
    const from = y + 10.6
    const coils = small ? 4 : 5.5
    const n = small ? 60 : 120
    for (let i = 0; i <= n; i++) {
      const u = i / n
      const a = TAU * coils * u
      const c = coil[i]!
      c[0] = 3.3 * Math.sin(a)
      c[1] = from + (BRACKET - from) * u
      c[2] = 3.3 * Math.cos(a)
    }
    // The spring warms toward its color as it's compressed, held through the dwell, cooling as it lets go.
    const spring = blend('ink', 'c1', 0.8 * clamp((y - CAM_Y - BASE - ROLLER) / LIFT))
    for (let i = 0; i < n; i++) {
      project(...coil[i]!, p)
      project(...coil[i + 1]!, q)
      const front = coil[i]![2] + coil[i + 1]![2] > 0
      depth.line(p, q, hair * (front ? 1.05 : 0.8), front ? 0.82 : 0.38, spring)
    }
    if (large) {
      // The follower's axis, drawn as a centre line.
      const axis = projectPath([[0, CAM_Y - 4, 5.6], [0, BRACKET + 7, 5.6]], project, xy)
      depth.path(axis.xy, -100, { width: hair * 0.7, alpha: 0.28, dash: [7 * hair, 2 * hair, 1.5 * hair, 2 * hair] })
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A cam, roller and return spring share a lift, a dwell and a controlled descent. */
export function LoaderDwell(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
