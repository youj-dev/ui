'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { disc, part, pin, rod, type Turn, type V3 } from './machine'

export const meta = {
  id: 'yoke', title: 'Yoke', category: 'mechanics', technique: 'lines',
  tags: ['crank', 'slot', 'piston', 'reciprocation', 'linkage'],
  description: 'A crank pin slides inside a slotted yoke, turning the disc’s steady revolution into the harmonic stroke of a piston in a cut-away cylinder. The slot, rod and piston stay constrained as the drive passes both dead centres.',
  order: 3,
  colors: [{ part: 'Piston', mono: 'ink' }],
} satisfies LoaderMeta

/* A Scotch yoke on a base. The crank disc turns at constant speed (that is
 * the point of the mechanism: a uniform turn in, a pure harmonic stroke
 * out); its accent pin rides up and down the slot of the yoke plate, which
 * can only slide sideways, so the yoke, its rod and the piston follow the
 * pin's x exactly. The disc shows through the slot, the cylinder is cut
 * away to show the piston inside, and at larger sizes a dimension line
 * marks the stroke between the two dead centres with an index that follows
 * the piston.
 *
 * Color: the piston’s rings and the stroke’s dimension are `c1`, the piston’s travel; the yoke, disc and cylinder keep the ink and the crank pin the accent. */

const AXLE: V3 = [-16, 4, 0]
const CRANK = 10
const DISC = 15
const ROD = 31
const BASE = -21
const LIP = 4
const depth = new Depth()
const xy: number[] = []
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const outline: V3[] = []
const holes: V3[][] = [[], [], []]
const plateOut: V3[] = []
const slot: V3[] = []
const boss: V3[] = []
const shell: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const p = point()
const q = point()

/** A lit box from its min and max corners: the faces toward the viewer, each outlined. */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[0, -1, 0], [[lo[0], lo[1], lo[2]], [hi[0], lo[1], lo[2]], [hi[0], lo[1], hi[2]], [lo[0], lo[1], hi[2]]]],
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
    depth.face(f.xy, f.z, lambert(...v))
    if (edge > 0) depth.path(f.xy, f.z + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  }
}

/** A rounded slot or plate outline: a stadium-cornered rectangle, counter-clockwise, in the plane z. */
function rounded(x0: number, y0: number, x1: number, y1: number, r: number, z: number, out: V3[], steps = 4): V3[] {
  out.length = 0
  const corners: [number, number, number][] = [
    [x1 - r, y0 + r, -Math.PI / 2],
    [x1 - r, y1 - r, 0],
    [x0 + r, y1 - r, Math.PI / 2],
    [x0 + r, y0 + r, Math.PI],
  ]
  for (const [cx, cy, start] of corners) for (let i = 0; i <= steps; i++) {
    const a = start + (Math.PI / 2) * (i / steps)
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z])
  }
  return out
}

export const scene: Scene = {
  beats: 4.5, still: 0.16,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.15 : 1.05) / view.px
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.36 + (small ? 0 : 0.05 * Math.sin(TAU * t)), pitch: -0.27 }
    const lens = camera({ ...pose, distance: 255, cx: view.w / 2 + 1, cy: small ? 48 : 45 })
    // Below 32px the engine fills more of the frame: the base is a line there, so there's room.
    const zoom = small ? 1.16 : 1
    const project: Project = (x, y, z, out) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient(pose)
    // A uniform turn: the yoke's stroke is then exactly harmonic.
    const theta = TAU * t + 0.6
    const px = AXLE[0] + CRANK * Math.cos(theta)
    const py = AXLE[1] + CRANK * Math.sin(theta)

    // The base, the disc's pillow block, and the cylinder's cradle.
    if (!small) {
      block(project, turn, [-35, BASE - 4.5, -11], [39, BASE, 8], hair * 0.9, 0.55)
      block(project, turn, [AXLE[0] - 3.6, BASE, -11], [AXLE[0] + 3.6, AXLE[1], -7.4], hair * 0.9, 0.6)
      for (const x of [7, 30]) block(project, turn, [x, BASE, -7.5], [x + 4, AXLE[1] - 5.6, -1.2], hair * 0.9, 0.55)
    } else rod(depth, project, [-34, BASE, 0], [38, BASE, 0], hair * 1.2, 0.7)

    // The crank disc: lightening holes, a hub, its shaft end.
    const cut = small ? [] : holes.map((h, k) => disc(AXLE[0] + 8.6 * Math.cos(theta + Math.PI / 3 + (TAU * k) / 3), AXLE[1] + 8.6 * Math.sin(theta + Math.PI / 3 + (TAU * k) / 3), -4, 2.8, large ? 18 : 12, h))
    const face = part(depth, project, turn, disc(AXLE[0], AXLE[1], -4, DISC, small ? 24 : 48, outline), cut, 3, hair, large ? 0.9 : 0)
    const hub = part(depth, project, turn, disc(AXLE[0], AXLE[1], -2.8, 4, small ? 12 : 20, boss), [], 1.2, hair * 0.9, 0, 0.85)
    pin(depth, project, turn, AXLE[0], AXLE[1], -2.7, 1.8, hair * 0.85, 'ink', hub + 0.01)
    if (large) {
      // The crank pin's circle, dashed, on the disc face.
      const f = projectPath(disc(AXLE[0], AXLE[1], -3.98, CRANK, 48, plateOut), project, xy)
      depth.path(f.xy, face + 0.02, { width: hair * 0.7, alpha: 0.3, closed: true, dash: [2.2 * hair, 2.2 * hair] })
    }

    // The yoke: a plate slotted top to bottom, sliding only sideways; the disc shows through its slot.
    const yokeFront = part(depth, project, turn, rounded(px - 5, AXLE[1] - 16.5, px + 5, AXLE[1] + 16.5, 1.6, 0, plateOut), [rounded(px - 1.95, AXLE[1] - 12, px + 1.95, AXLE[1] + 12, 1.95, 0, slot, 5)], 2, hair, large ? 0.7 : 0)
    // The pin: a stub from the disc through the slot, capped in the accent.
    rod(depth, project, [px, py, -4], [px, py, -2], small ? hair * 2.6 : 3.4, 0.8)
    pin(depth, project, turn, px, py, 1.4, small ? 2.3 : 1.9, hair * 0.85, 'accent', yokeFront + 0.3)

    // The rod: a lit bar from the yoke's boss to the piston.
    block(project, turn, [px + 5, AXLE[1] - 2.2, -2], [px + 7.2, AXLE[1] + 2.2, 0.4], hair * 0.8, 0.6)
    block(project, turn, [px + 7.2, AXLE[1] - 1.1, -1.9], [px + ROD, AXLE[1] + 1.1, 0.1], hair * 0.7, small ? 0 : 0.5)

    // The cylinder, its near half cut away: the inner wall lit strip by strip, the rims, the end caps.
    const x0 = 3
    const x1 = 37
    const R = 5.4
    const strips = small ? 4 : large ? 12 : 8
    for (let i = 0; i < strips; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / strips
      const b = Math.PI / 2 + (Math.PI * (i + 1)) / strips
      const set = (v: V3, x: number, ang: number) => {
        v[0] = x
        v[1] = AXLE[1] + R * Math.sin(ang)
        v[2] = -1 + R * Math.cos(ang)
      }
      set(shell[0]!, x0, a)
      set(shell[1]!, x1, a)
      set(shell[2]!, x1, b)
      set(shell[3]!, x0, b)
      const m = (a + b) / 2
      const n = turn(0, -Math.sin(m), -Math.cos(m))
      if (n[2] <= 0) continue
      const f = projectPath(shell, project, xy)
      depth.face(f.xy, f.z - 6, lambert(...n) * 0.92)
    }
    for (const ang of [Math.PI / 2, -Math.PI / 2]) {
      rod(depth, project, [x0, AXLE[1] + R * Math.sin(ang), -1 + R * Math.cos(ang)], [x1, AXLE[1] + R * Math.sin(ang), -1 + R * Math.cos(ang)], hair, 0.85)
    }
    // The gland at the open end and the closed head, as half rings.
    for (const x of [x0, x1]) {
      xy.length = 0
      let z = 0
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI / 2 + (Math.PI * i) / 12
        project(x, AXLE[1] + (R + 1.2) * Math.sin(a), -1 + (R + 1.2) * Math.cos(a), p)
        xy.push(p.x, p.y)
        z += p.z / 13
      }
      depth.path(xy, z, { width: hair * (x === x0 ? 1.6 : 1.2), alpha: 0.8, join: 'round' })
    }

    // The piston, cut with the cylinder: its section face hatched, its rings scored, its crown a half disc.
    const piston = px + ROD
    const P0 = piston
    const P1 = piston + 7
    const pr = R - 0.4
    const cutFace = projectPath([[P0, AXLE[1] - pr, -1], [P1, AXLE[1] - pr, -1], [P1, AXLE[1] + pr, -1], [P0, AXLE[1] + pr, -1]], project, xy)
    const cutZ = cutFace.z + 4
    depth.face(cutFace.xy, cutZ, lambert(...turn(0, 0, 1)))
    depth.path(cutFace.xy, cutZ + 0.01, { width: hair * 0.85, alpha: 0.8, closed: true })
    xy.length = 0
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / 10
      project(P1, AXLE[1] + pr * Math.sin(a), -1 + pr * Math.cos(a), p)
      xy.push(p.x, p.y)
    }
    const crown = turn(1, 0, 0)
    if (crown[2] > 0) {
      depth.face(xy, cutZ - 0.5, lambert(...crown))
      depth.path(xy, cutZ - 0.49, { width: hair * 0.8, alpha: 0.7, closed: true })
    }
    if (!small) {
      for (const dx of [1.4, 2.7]) rod(depth, project, [P0 + dx, AXLE[1] - pr, -1], [P0 + dx, AXLE[1] + pr, -1], hair * 0.75, 0.55, 'c1', cutZ + 0.02)
      if (large) {
        // Section hatching at 45° on the cut face, beyond the rings.
        const a = P0 + 3.4
        const H = 2 * pr
        for (let c = a - H + 0.7; c < P1; c += 1.25) {
          const lo = Math.max(0, a - c)
          const hi = Math.min(H, P1 - c)
          if (hi - lo < 0.2) continue
          rod(depth, project, [lo + c, AXLE[1] - pr + lo, -1], [hi + c, AXLE[1] - pr + hi, -1], hair * 0.55, 0.32, 'ink', cutZ + 0.02, { cap: 'butt' })
        }
      }
    }

    if (large) {
      // The stroke, dimensioned between the dead centres, with an index on the piston face.
      const lo = AXLE[0] - CRANK + ROD
      const hi = AXLE[0] + CRANK + ROD
      const y = AXLE[1] - R - 2.6
      rod(depth, project, [lo, y, LIP], [hi, y, LIP], hair * 0.7, 0.45, 'c1', 80)
      for (const x of [lo, hi]) rod(depth, project, [x, y - 1.4, LIP], [x, y + 1.4, LIP], hair * 0.8, 0.6, 'c1', 80)
      project(piston, y + 0.4, LIP, p)
      project(piston, y + 2.6, LIP, q)
      p.z = q.z = 81
      depth.line(p, q, hair * 1.2, 0.85)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A rotating crank drives a slotted yoke and its guided piston. */
export function LoaderYoke(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
