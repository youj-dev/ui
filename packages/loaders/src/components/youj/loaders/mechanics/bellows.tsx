'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, point, projectPath, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'bellows', title: 'Bellows', category: 'mechanics', technique: 'lines',
  tags: ['pneumatic', 'concertina', 'pressure', 'valves', 'folds', '3d'],
  description: 'A hand lever rocks on its post and, through a pinned link, draws a radial concertina open and presses it shut. Air comes in through the intake valve as it opens and leaves through the outlet as it closes, each flap lifting on its hinge as the flow passes.',
  order: 12,
  colors: [{ part: 'Valves', mono: 'ink' }],
} satisfies LoaderMeta

/* A lever pump. The lever rocks on its post on a sine (a hand at work, no
 * pauses), its pinned link lifting and lowering the top plate, and the
 * concertina between the plates folds and unfolds, each pleat a pair of lit
 * frusta. The two check valves sit on the base: the intake flap lifts while
 * the bellows open and the outlet's while they close, each by as much as
 * the flow, and a short accent pulse runs along whichever pipe is drawing.
 *
 * Color: each valve’s flap and pipe warm toward `c1` while air flows through it, and cool to the ink as it shuts, so the intake and the outlet take turns. */

const BASE_Y = -24
const PIVOT: [number, number] = [27, 7]
const ARM = 27
const LINK = 10
const depth = new Depth()
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const ring: V3[] = []
const xy: number[] = []
const p = point(), q = point(), r = point(), s = point()

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

/** A lit disc plate, its rim and the side wall toward the viewer, lying flat at height y. */
function cap(project: Project, turn: Turn, y: number, radius: number, thick: number, sides: number, hair: number) {
  for (let i = 0; i < sides; i++) {
    const a = (TAU * i) / sides
    const b = (TAU * (i + 1)) / sides
    const n = turn(Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2))
    if (n[2] <= 0) continue
    box[0] = [radius * Math.cos(a), y, radius * Math.sin(a)]
    box[1] = [radius * Math.cos(b), y, radius * Math.sin(b)]
    box[2] = [radius * Math.cos(b), y - thick, radius * Math.sin(b)]
    box[3] = [radius * Math.cos(a), y - thick, radius * Math.sin(a)]
    const f = projectPath(box, project, xy)
    depth.face(f.xy, f.z, lambert(...n))
  }
  ring.length = 0
  for (let i = 0; i < sides; i++) ring.push([radius * Math.cos((TAU * i) / sides), y, radius * Math.sin((TAU * i) / sides)])
  const top = projectPath(ring, project, xy)
  depth.face(top.xy, top.z + 0.05, lambert(...turn(0, 1, 0)))
  depth.path(top.xy, top.z + 0.06, { width: hair, alpha: 0.85, closed: true, join: 'round' })
}

export const scene: Scene = {
  beats: 5.5, still: 0.36,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const folds = small ? 3 : view.size < 80 ? 4 : 5
    const sides = small ? 12 : 20
    const pose = { yaw: -0.44 + (small ? 0 : 0.05) * Math.sin(TAU * t), pitch: -0.36 }
    const project = camera({ ...pose, distance: 320, cx: view.w / 2 - 2, cy: 50 })
    const turn = orient(pose)
    const hair = clamp(view.size * 0.006, 0.9, 1.25) / view.px

    // The lever rocks on a sine; its end over the bellows lifts the link, the link lifts the plate.
    const theta = 0.31 * Math.cos(TAU * t + Math.PI)
    const qx = PIVOT[0] - ARM * Math.cos(theta)
    const qy = PIVOT[1] + ARM * Math.sin(theta)
    const top = qy - Math.sqrt(LINK * LINK - qx * qx)
    const height = top - 1.2 - BASE_Y
    // How fast the bellows open (+) or close (−), for the valves and the flow.
    const flow = Math.sin(TAU * t)

    // The plinth and the base plate.
    block(project, turn, [-36, BASE_Y - 8.5, -12], [31, BASE_Y - 3, 12], hair * 0.9, 0.6, -60)
    cap(project, turn, BASE_Y, 15, 3, sides, hair)

    // Each radial fold is a pair of conical frusta, with its own real normal.
    for (let j = 0; j < folds * 2; j++) {
      const y0 = BASE_Y + (height * j) / (folds * 2)
      const y1 = BASE_Y + (height * (j + 1)) / (folds * 2)
      const r0 = j % 2 ? 14.5 : 10
      const r1 = j % 2 ? 10 : 14.5
      for (let i = 0; i < sides; i++) {
        const a = (TAU * i) / sides, b = (TAU * (i + 1)) / sides
        const normal = turn(Math.cos((a + b) / 2), (r0 - r1) / (y1 - y0), Math.sin((a + b) / 2))
        if (normal[2] <= 0) continue
        project(r0 * Math.cos(a), y0, r0 * Math.sin(a), p)
        project(r0 * Math.cos(b), y0, r0 * Math.sin(b), q)
        project(r1 * Math.cos(b), y1, r1 * Math.sin(b), r)
        project(r1 * Math.cos(a), y1, r1 * Math.sin(a), s)
        const z = (p.z + q.z + r.z + s.z) / 4
        depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], z, lambert(...normal) * 0.8)
        if (j % 2) depth.line(p, q, hair * p.k, clamp(0.6 + z / 110, 0.35, 0.9))
      }
    }
    cap(project, turn, top, 15, 2.4, sides, hair)

    // The link from the plate's lug to the lever, pinned at both ends.
    const lugY = top + 1.6
    const link = projectPath([[0, lugY, 3], [qx, qy, 3]], project, xy)
    depth.path(link.xy, 30, { width: hair * 2.2, alpha: 0.9, cap: 'round' })
    block(project, turn, [-2.2, top, -1.2], [2.2, lugY + 0.6, 2.4], hair * 0.8, 0.75)
    pin(depth, project, turn, 0, lugY, 3.1, small ? 1.7 : 1.4, hair * 0.8, 'ink', 30.5)

    // The post, and the lever rocking on it.
    block(project, turn, [PIVOT[0] - 2, BASE_Y - 3, -2], [PIVOT[0] + 2, PIVOT[1] - 1.6, 2], hair * 0.85, 0.7)
    const c = Math.cos(theta)
    const sn = Math.sin(theta)
    const along = (u: number, w: number, z: number): V3 => [PIVOT[0] - u * c - w * sn, PIVOT[1] + u * sn - w * c, z]
    const lever = projectPath([along(-9, -1.2, 2.6), along(ARM + 3, -1.2, 2.6), along(ARM + 3, 1.2, 2.6), along(-9, 1.2, 2.6)], project, xy)
    depth.face(lever.xy, 31, lambert(...turn(0, 0, 1)))
    depth.path(lever.xy, 31.01, { width: hair, alpha: 0.85, closed: true, join: 'round' })
    pin(depth, project, turn, PIVOT[0], PIVOT[1], 2.7, small ? 2 : 1.7, hair * 0.85, 'ink', 31.5)
    pin(depth, project, turn, qx, qy, 3.2, small ? 1.6 : 1.35, hair * 0.8, 'ink', 31.6)
    // Its grip.
    const grip = projectPath([along(-9, 0, 2.6), along(-14, 0, 2.6)], project, xy)
    depth.path(grip.xy, 31.02, { width: hair * 4.2, alpha: 0.8, cap: 'round' })

    // Two check valves on the base, each a housing, a pipe away and a flap that lifts with the flow.
    for (const side of [-1, 1]) {
      const opening = side < 0 ? Math.max(0, flow) : Math.max(0, -flow)
      const x0 = side * 15
      const x1 = side * 34
      const y = BASE_Y - 1.6
      // The pipe, a lit tube, and the housing where it leaves the base plate.
      const pipe = projectPath([[x0, y, 3], [x1, y, 3]], project, xy)
      depth.path(pipe.xy, pipe.z, { width: hair * (small ? 3.4 : 4.2), alpha: 0.42, cap: 'butt' })
      depth.path(pipe.xy, pipe.z + 0.01, { width: hair * 0.9, alpha: 0.85, cap: 'butt', tone: blend('ink', 'c1', opening) })
      const hx = side * 19
      block(project, turn, [hx - 2.6, y - 2.4, 0.6], [hx + 2.6, y + 2.4, 5.4], hair * 0.8, 0.75)
      // The flap, hinged at the housing's top edge, swinging out with the flow.
      const swing = 1.2 * opening
      const hinge: V3 = [hx + side * 2.7, y + 2.2, 3]
      const tip: V3 = [hinge[0] + side * 4.2 * Math.sin(swing), hinge[1] - 4.2 * Math.cos(swing), 3]
      const flap = projectPath([hinge, tip], project, xy)
      depth.path(flap.xy, 40, { width: hair * 1.6, alpha: 0.95, cap: 'round', tone: blend('ink', 'c1', opening) })
      if (!small) pin(depth, project, turn, ...hinge, 0.8, hair * 0.7, 'ink', 40.5)
      // A pulse of air along the pipe that's drawing, as strong as the flow.
      if (opening > 0.02) {
        const u = side < 0 ? 1 - ((t * 2) % 1) : ((t * 2) % 1)
        const along0 = x0 + (x1 - x0) * clamp(u - 0.12)
        const along1 = x0 + (x1 - x0) * clamp(u + 0.12)
        const pulse = projectPath([[along0, y, 3], [along1, y, 3]], project, xy)
        depth.path(pulse.xy, 41, { width: hair * 1.8, alpha: opening * Math.sin(Math.PI * u), tone: 'accent', cap: 'round' })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A lever-worked concertina breathes through two check valves. */
export function LoaderBellows(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
