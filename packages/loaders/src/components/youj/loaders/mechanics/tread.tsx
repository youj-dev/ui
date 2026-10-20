'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, point, projectPath, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { disc, part, pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'tread', title: 'Tread', category: 'mechanics', technique: 'lines',
  tags: ['track', 'rollers', 'links', 'belt', 'contact', '3d'],
  description: 'Hinged track shoes, chained at their edge, circulate round a drive wheel and an idler on a side frame. The lower run lies on moving ground without slipping, the road wheels turn at the exact belt speed, and one accent shoe makes the circuit.',
  order: 13,
  colors: [{ part: 'Wheels', mono: 'ink' }],
} satisfies LoaderMeta

/* A crawler track unit. The belt is a capsule of shoes, each with a grouser
 * across its face, hinged to the next by a pin and chained along the near
 * edge by link plates from pin to pin. Inside the loop: the drive wheel
 * (right) and the idler (left) on a side frame, with two road wheels
 * bearing on the lower run. The belt travels its whole length once a loop,
 * its speed easing a little either side of even (a driven feel, never a
 * stop); the wheels turn at its speed, and the ground's rulings pass under
 * it as fast as the belt lays it down, so the lower run never slips. One
 * shoe wears the accent.
 *
 * Color: the drive wheel, the idler and the road wheels are edged in `c1`, the track and frame in the ink; one shoe still makes the circuit in the accent. */

const RADIUS = 11
const HALF = (Math.PI * RADIUS) / 2
const LENGTH = 4 * HALF + TAU * RADIUS
const WIDTH = 6
const CHAIN = WIDTH + 0.5
const FACE = 7.4
const GROUND = -RADIUS - 1
const FLOOR = -1000
const LEVELS = [14, 22, 30]
const wheel: V3[] = []
const frame: V3[] = []
const frameHoles: V3[][] = [[], []]
const rings: V3[][] = Array.from({ length: 9 }, () => [])
const boss: V3[] = []
const plate: V3[] = []
const xy: number[] = []
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const depth = new Depth()
const p = point(), q = point(), r = point(), s = point()

/** Where distance d round the capsule lands (from the start of the lower run, travelling right): x, y and the direction of travel. */
function at(d: number): [number, number, number] {
  d = ((d % LENGTH) + LENGTH) % LENGTH
  if (d < 2 * HALF) return [-HALF + d, -RADIUS, 0]
  d -= 2 * HALF
  if (d < Math.PI * RADIUS) {
    const a = -Math.PI / 2 + d / RADIUS
    return [HALF + RADIUS * Math.cos(a), RADIUS * Math.sin(a), a + Math.PI / 2]
  }
  d -= Math.PI * RADIUS
  if (d < 2 * HALF) return [HALF - d, RADIUS, Math.PI]
  const a = Math.PI / 2 + (d - 2 * HALF) / RADIUS
  return [-HALF + RADIUS * Math.cos(a), RADIUS * Math.sin(a), a + Math.PI / 2]
}

/** The ground: a lit slab sorted under everything that stands on it. */
function ground(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[1, 0, 0], [[hi[0], lo[1], hi[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [hi[0], hi[1], hi[2]]]],
  ]
  faces.forEach(([n, corners], k) => {
    const v = turn(...n)
    if (v[2] <= 0.02) return
    corners.forEach((c, i) => {
      box[i]![0] = c[0]!
      box[i]![1] = c[1]!
      box[i]![2] = c[2]!
    })
    const f = projectPath(box, project, xy)
    depth.face(f.xy, FLOOR + k, lambert(...v))
    depth.path(f.xy, FLOOR + k + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  })
}

export const scene: Scene = {
  beats: 5, still: 0.23,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const links = LEVELS[small ? 0 : large ? 2 : 1]!
    const pitch = LENGTH / links
    const hair = (small ? 1.15 : 1.05) / view.px
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.48 + (small ? 0 : 0.05 * Math.sin(TAU * t)), pitch: -0.34 }
    const lens = camera({ ...pose, distance: 236, cx: view.w / 2 + 1, cy: small ? 50 : 48 })
    // Below 32px the unit fills more of the frame: the ground is a line there, so there's room.
    const zoom = small ? 1.22 : 1
    const project: Project = (x, y, z, out) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient(pose)
    // The belt goes round once a loop, easing a little either side of an even speed.
    const travel = LENGTH * (t - (0.2 * Math.sin(TAU * t)) / TAU)
    const spin = travel / RADIUS

    // The ground, its rulings passing under at the belt's speed.
    if (small) {
      project(-29, GROUND, 0, p)
      project(29, GROUND, 0, q)
      p.z = q.z = FLOOR
      depth.line(p, q, hair * 1.1, 0.6)
    } else ground(project, turn, [-38, GROUND - 3, -12], [38, GROUND, 12], hair * 0.9, 0.5)
    const rule = LENGTH / 16
    if (!small) for (let i = -6; i <= 6; i++) {
      const x = i * rule + (travel % rule)
      const alpha = clamp((36 - Math.abs(x)) / 9) * 0.42
      if (alpha < 0.01) continue
      project(x, GROUND, -11, p)
      project(x, GROUND, 11, q)
      p.z = q.z = FLOOR + 5
      depth.line(p, q, hair * 0.8, alpha)
    }

    // The shoes: plates lit on the face we see, a grouser across the outer face.
    const halfShoe = pitch * 0.42
    for (let i = 0; i < links; i++) {
      const [x, y, a] = at(i * pitch + travel)
      const dx = Math.cos(a) * halfShoe
      const dy = Math.sin(a) * halfShoe
      project(x - dx, y - dy, -WIDTH, p)
      project(x + dx, y + dy, -WIDTH, q)
      project(x + dx, y + dy, WIDTH, r)
      project(x - dx, y - dy, WIDTH, s)
      const z = (p.z + q.z + r.z + s.z) / 4
      const n = turn(Math.sin(a), -Math.cos(a), 0)
      const out = n[2] >= 0
      const light = out ? lambert(...n) : lambert(-n[0], -n[1], -n[2]) * 0.82
      depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], z, light, i === 0 ? 'accent' : 'ink')
      depth.line(s, r, hair * clamp(s.k, 0.85, 1.15), clamp(0.62 + z / 120, 0.35, 0.92))
      if (!small && out) {
        const ox = Math.sin(a) * 0.9
        const oy = -Math.cos(a) * 0.9
        project(x + ox, y + oy, -WIDTH, p)
        project(x + ox, y + oy, WIDTH, q)
        depth.line(p, q, hair * (large ? 1.1 : 0.9), 0.55, i === 0 ? 'accent' : 'ink')
      }
    }

    // The chain along the near edge: a link plate from pin to pin over each shoe, the pins' ends on top.
    if (!small) {
      const rr = 1.15
      for (let i = 0; i < links; i++) {
        const [ax, ay] = at(i * pitch + travel - pitch / 2)
        const [bx, by] = at(i * pitch + travel + pitch / 2)
        const len = Math.hypot(bx - ax, by - ay) || 1
        const ux = (bx - ax) / len
        const uy = (by - ay) / len
        plate.length = 0
        for (let k = 0; k <= 5; k++) {
          const ang = Math.atan2(-ux, uy) - (Math.PI * k) / 5
          plate.push([bx + rr * Math.cos(ang), by + rr * Math.sin(ang), CHAIN])
        }
        for (let k = 0; k <= 5; k++) {
          const ang = Math.atan2(ux, -uy) - (Math.PI * k) / 5
          plate.push([ax + rr * Math.cos(ang), ay + rr * Math.sin(ang), CHAIN])
        }
        const f = projectPath(plate, project, xy)
        depth.face(f.xy, f.z, lambert(...turn(0, 0, 1)) * 0.92)
        depth.path(f.xy, f.z + 0.01, { width: hair * 0.75, alpha: 0.6, closed: true, join: 'round' })
        project(bx, by, CHAIN + 0.1, p)
        p.z = f.z + 0.02
        depth.dot(p, (large ? 0.75 : 0.6) / view.px, 0.85)
      }
    }

    // The side frame between the wheels, then the drive wheel, the idler and the road wheels in front of it.
    if (!small) {
      frame.length = 0
      const fr = 3.6
      const corners: [number, number, number][] = [[HALF - fr, -7 + fr, -Math.PI / 2], [HALF - fr, 3.5 - fr, 0], [-HALF + fr, 3.5 - fr, Math.PI / 2], [-HALF + fr, -7 + fr, Math.PI]]
      for (const [cx, cy, start] of corners) for (let i = 0; i <= 4; i++) frame.push([cx + fr * Math.cos(start + (Math.PI / 2) * (i / 4)), cy + fr * Math.sin(start + (Math.PI / 2) * (i / 4)), FACE - 1.6])
      const cut = large ? frameHoles.map((h, k) => disc(-3.3 + 6.6 * k, -0.6, FACE - 1.6, 2.1, 14, h)) : []
      part(depth, project, turn, frame, cut, 1.6, hair * 0.9, 0, 0.7)
    }
    for (const [x, count] of [[HALF, 4], [-HALF, 5]] as const) {
      // The drive wheel with four holes, the idler with five; both turn with the belt.
      const offset = x > 0 ? 0 : 4
      const holes = small ? [] : rings.slice(offset, offset + count).map((h, k) => disc(x + 5.4 * Math.cos(spin + (TAU * k) / count), 5.4 * Math.sin(spin + (TAU * k) / count), FACE, x > 0 ? 1.7 : 1.4, 12, h))
      const layer = part(depth, project, turn, disc(x, 0, FACE, 8.8, small ? 18 : 40, wheel), holes, 2.6, hair, large ? 0.9 : 0, 0.8, undefined, false, 'c1')
      const hub = part(depth, project, turn, disc(x, 0, FACE + 1.2, x > 0 ? 3.4 : 2.8, small ? 10 : 18, boss), [], 1.2, hair * 0.85, 0, 0.8)
      pin(depth, project, turn, x, 0, FACE + 1.25, 1.4, hair * 0.8, 'ink', Math.max(hub, layer) + 0.01)
    }
    if (!small) for (const x of [-6.6, 6.6]) {
      // Road wheels roll on the chain's inner edge, a spoke mark showing their turn.
      const rw = 3.2
      const cy = -RADIUS + 1.15 + rw
      const layer = part(depth, project, turn, disc(x, cy, FACE - 0.2, rw, 20, boss), [], 1.8, hair * 0.85, 0, 0.75, undefined, false, 'c1')
      const turnW = travel / rw
      project(x + 1.1 * Math.cos(turnW), cy + 1.1 * Math.sin(turnW), FACE - 0.18, p)
      project(x + (rw - 0.7) * Math.cos(turnW), cy + (rw - 0.7) * Math.sin(turnW), FACE - 0.18, q)
      p.z = q.z = layer + 0.02
      depth.line(p, q, hair * 0.9, 0.7)
      pin(depth, project, turn, x, cy, FACE - 0.15, 1, hair * 0.75, 'ink', layer + 0.03)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A continuous linked track returns over two rolling hubs. */
export function LoaderTread(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
