'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, projectPath, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'
import { type Turn, type V3 } from './machine'

export const meta = {
  id: 'heddle', title: 'Heddle', category: 'mechanics', technique: 'lines',
  tags: ['loom', 'weaving', 'warp', 'weft', 'shuttle', 'textile'],
  description: 'Two heddle shafts open the warp into a shed and a boat shuttle flies a pick through it from box to box. The reed beats the accent pick into the fell, the shed crosses, the shuttle flies back, and the woven cloth winds steadily onto its beam.',
  order: 7,
  colors: [{ part: 'Warp', mono: 'ink' }],
} satisfies LoaderMeta

/* A loom seen from the weaver's side, a little from above. The warp runs
 * from its beam at the back, through the eyes of two heddle shafts and the
 * reed, to the fell, where the cloth begins and winds onto the cloth beam
 * at the front. Everything is driven like a real loom, so nothing ever
 * parks: the shafts swap the shed on a soft square wave, the batten swings
 * on its crank (cos²), and the shuttle flies through the open shed between
 * its two boxes, laying the accent pick behind it. The reed pushes the pick
 * into the fell; it cools to ink as it joins the cloth, which takes up two
 * picks a loop, so the weave has moved on by exactly one repeat at the seam.
 *
 * Color: the ends on one shaft lean toward `c1`, the other shaft’s keep the ink, so the shed opens in two colors; the pick stays the accent and cools to the ink as it’s beaten in. */

const X = 14 // the warp's half-width
const BOX = 21.5 // where the shuttle rests, each side
const Z_BACK = -21
const Z_HEDDLE = -9.5
const Z_REST = -1.5 // the reed at the back of its swing
const Z_FELL = 8
const Z_BEAM = 18.5
const SPACING = 1.5 // between picks in the cloth
const LIFT = 6.4 // each sheet's lift at the heddle eye
const BEAT = 0.47 // the first beat; the second is half a loop later
const S = 1.5 // the drawing's scale, world to view

const LEVELS = [5, 7, 9].map((count) => ({ count, xs: Array.from({ length: count }, (_, j) => -X + (2 * X * j) / (count - 1)) }))
const depth = new Depth()
const xy: number[] = []
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const p = point()
const q = point()
const BOAT = [[-4.6, 0], [-2.6, -1.35], [2.6, -1.35], [4.6, 0], [2.6, 1.35], [-2.6, 1.35]] as const
const boat: V3[] = BOAT.map(() => [0, 0, 0])
const wall: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])

/** The soft square wave the shafts follow: +1 shed A, −1 shed B, crossing at 0 and ½. */
const shedAt = (t: number) => Math.tanh(2.4 * Math.sin(TAU * t)) / Math.tanh(2.4)
/** The batten on its crank: 0 at the back, 1 at the fell, at each beat. */
const battenAt = (t: number) => (0.5 + 0.5 * Math.cos(2 * TAU * (t - BEAT))) ** 2

/** A lit box between two corners: its faces toward the viewer, outlined. */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number, tone: Tone = 'ink', bias = 0) {
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
    depth.face(f.xy, f.z + bias, lambert(...v), tone)
    if (edge > 0) depth.path(f.xy, f.z + bias + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  }
}

/** A beam across the loom: an eight-sided roller, lit facet by facet. */
function roller(project: Project, turn: Turn, z: number, y: number, r: number, hair: number, spin: number) {
  for (let i = 0; i < 8; i++) {
    const a = spin + (TAU * i) / 8
    const b = spin + (TAU * (i + 1)) / 8
    const n = turn(0, Math.sin((a + b) / 2), Math.cos((a + b) / 2))
    if (n[2] <= 0) continue
    box[0] = [-X - 3, y + r * Math.sin(a), z + r * Math.cos(a)]
    box[1] = [X + 3, y + r * Math.sin(a), z + r * Math.cos(a)]
    box[2] = [X + 3, y + r * Math.sin(b), z + r * Math.cos(b)]
    box[3] = [-X - 3, y + r * Math.sin(b), z + r * Math.cos(b)]
    const f = projectPath(box, project, xy)
    depth.face(f.xy, f.z, lambert(...n))
    depth.path([f.xy[0]!, f.xy[1]!, f.xy[2]!, f.xy[3]!], f.z + 0.01, { width: hair * 0.7, alpha: 0.35 })
  }
}

export const scene: Scene = {
  beats: 6, still: 0.3,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const { count, xs } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.15 : 1.05) / view.px
    const thread = hair * (small ? 1 : 0.9)
    const pose = { yaw: -0.3 + (small ? 0 : 0.05) * Math.sin(TAU * t), pitch: -0.8 }
    const cam = camera({ ...pose, distance: 300, cx: view.w / 2 + 1, cy: 50 })
    const project: Project = (x, y, z, out) => cam(x * S, y * S, z * S, out)
    const turn = orient(pose)

    const shed = shedAt(t)
    const batten = battenAt(t)
    const reedZ = Z_REST + (Z_FELL - 3 - Z_REST) * batten
    const race = reedZ + 3.4
    // The shuttle flies box to box: fast through the shed, easing into each box.
    const fly = -Math.tanh(2.4 * Math.cos(TAU * t)) / Math.tanh(2.4)
    const sx = BOX * fly

    // The beams: the warp's at the back, the cloth's at the front, winding the weave on.
    roller(project, turn, Z_BACK - 0.8, -0.9, 1.5, hair, 0.2)
    roller(project, turn, Z_BEAM + 1.4, -2, 1.9, hair, 0.2)

    // The warp: back beam → heddle eye (lifted by its shaft) → fell, then woven to the cloth beam.
    for (let j = 0; j < count; j++) {
      const x = xs[j]!
      const sign = j % 2 ? 1 : -1
      const eye = sign * LIFT * shed
      const near = j / (count - 1)
      const alpha = 0.62 + 0.2 * near
      // One shaft's ends in its color, the other's in the ink: the two halves of the shed read apart.
      const tone = j % 2 ? blend('ink', 'c1', 0.7) : 'ink'
      const pieces: [V3, V3][] = [
        [[x, 0.6, Z_BACK - 0.8], [x, eye, Z_HEDDLE]],
        [[x, eye, Z_HEDDLE], [x, eye * (Z_FELL - race) / (Z_FELL - Z_HEDDLE), race]],
        [[x, eye * (Z_FELL - race) / (Z_FELL - Z_HEDDLE), race], [x, 0, Z_FELL]],
      ]
      for (const [a, b] of pieces) {
        const path = projectPath([a, b], project, xy)
        depth.path(path.xy, path.z + 0.2 * Math.sign(eye), { width: thread, alpha, cap: 'round', tone })
      }
      // In the cloth the warp runs straight on to the beam.
      const woven = projectPath([[x, 0, Z_FELL], [x, 0, Z_BEAM + 0.2]], project, xy)
      depth.path(woven.xy, woven.z, { width: thread, alpha: alpha * 0.85, cap: 'round', tone })
    }

    // The cloth: each pick over every other end, alternating row to row (plain weave), moving off toward
    // the beam and fading as it winds on. The newest pick cools from the accent to ink as it joins.
    const latest = BEAT + 0.5 * Math.floor((t - BEAT) / 0.5)
    const pitch = xs[1]! - xs[0]!
    for (let m = 0; m < 12; m++) {
      const beatenAt = latest - 0.5 * m
      const z = Z_FELL + 2 * (t - beatenAt) * SPACING
      const fade = 1 - span(z, Z_BEAM - 3.5, Z_BEAM)
      if (fade <= 0) continue
      const parity = Math.round((beatenAt - BEAT) * 2) % 2 ? 1 : 0
      const cool = m === 0 ? span(t - beatenAt, 0, 0.16) : 1
      for (let j = parity; j < count; j += 2) {
        const a = Math.max(-X - 0.8, xs[j]! - pitch * 0.5)
        const b = Math.min(X + 0.8, xs[j]! + pitch * 0.5)
        const over = projectPath([[a, 0.1, z], [b, 0.1, z]], project, xy)
        depth.path(over.xy, over.z + 0.1, { width: thread * 1.2, alpha: 0.8 * fade * cool })
        if (cool < 1) depth.path(over.xy, over.z + 0.11, { width: thread * 1.3, alpha: 1 - cool, tone: 'accent' })
      }
    }

    // The pick being laid, until the reed beats it in: from the selvage it turned at, along the race behind the shuttle.
    const from = t < 0.5 ? -X - 0.8 : X + 0.8
    const reach = clamp(sx, -X - 0.8, X + 0.8)
    if (t % 0.5 < BEAT && Math.abs(reach - from) > 0.05) {
      const pick = projectPath([[from, 0.15, race - 0.4], [reach, 0.15, race - 0.4]], project, xy)
      depth.path(pick.xy, pick.z + 0.05, { width: thread * 1.25, alpha: 1, tone: 'accent', cap: 'round' })
    }
    // Out of the shed, the weft runs on from the selvage to the shuttle in its box.
    if (Math.abs(sx) > X + 0.8) {
      const end = Math.sign(sx) * (X + 0.8)
      const tail = projectPath([[end, 0.15, Math.min(race - 0.4, Z_FELL)], [sx, 0.6, race]], project, xy)
      depth.path(tail.xy, tail.z, { width: thread, alpha: 0.7, tone: 'accent', cap: 'round' })
    }

    // The heddle shafts, drawn light behind the batten: each a frame of staves, a wire down to each eye.
    for (let sh = 0; sh < 2; sh++) {
      const lift = (sh ? -1 : 1) * LIFT * shed
      const z = Z_HEDDLE + (sh ? 0.9 : -0.9)
      const frame = projectPath([[-X - 2.2, lift - 7, z], [X + 2.2, lift - 7, z], [X + 2.2, lift + 7, z], [-X - 2.2, lift + 7, z]], project, xy)
      depth.path(frame.xy, frame.z - 0.5, { width: hair * (small ? 1 : 1.25), alpha: small ? 0.5 : 0.62, closed: true, join: 'round' })
      if (!small) {
        for (let j = sh ? 0 : 1; j < count; j += 2) {
          const x = xs[j]!
          const wire = projectPath([[x, lift - 7, z], [x, lift + 7, z]], project, xy)
          depth.path(wire.xy, wire.z - 0.4, { width: hair * 0.6, alpha: 0.4 })
          project(x, lift, z, p)
          p.z -= 0.3
          depth.dot(p, (large ? 0.9 : 0.75) / view.px, 0.85)
        }
      }
    }

    // The batten: the reed's dents between the threads, its cap above and the race board the shuttle rides.
    block(project, turn, [-X - 2.4, 8.2, reedZ - 0.7], [X + 2.4, 9.6, reedZ + 0.7], hair * 0.8, 0.75)
    block(project, turn, [-BOX - 5, -2.6, reedZ - 0.7], [BOX + 5, -1.3, reedZ + 6.2], hair * 0.8, 0.7)
    for (const side of [-1, 1]) block(project, turn, [side * (X + 2.4) - 0.7, -1.3, reedZ - 0.7], [side * (X + 2.4) + 0.7, 8.2, reedZ + 0.7], hair * 0.8, 0.7)
    if (!small) for (let j = 0; j <= count; j++) {
      const x = j === 0 ? -X - 1.2 : j === count ? X + 1.2 : (xs[j - 1]! + xs[j]!) / 2
      const dent = projectPath([[x, -1.3, reedZ], [x, 8.2, reedZ]], project, xy)
      depth.path(dent.xy, dent.z, { width: hair * 0.6, alpha: 0.5 })
    }
    // A box at each end of the race, open toward the shed.
    for (const side of [-1, 1]) {
      const inner = side * (BOX - 5)
      const outer = side * (BOX + 5)
      block(project, turn, [Math.min(inner, outer), -1.3, reedZ + 5.6], [Math.max(inner, outer), 2.6, reedZ + 6.2], hair * 0.8, 0.6)
      block(project, turn, [outer - (side > 0 ? 0.6 : 0), -1.3, reedZ + 0.8], [outer + (side > 0 ? 0 : 0.6), 2.6, reedZ + 6.2], hair * 0.8, 0.6)
    }

    // The boat shuttle: lit walls and top, its accent pirn showing through the slot.
    BOAT.forEach(([x, z], i) => {
      boat[i]![0] = sx + x
      boat[i]![1] = 1.3
      boat[i]![2] = race + z
    })
    for (let i = 0; i < boat.length; i++) {
      const a = boat[i]!
      const b = boat[(i + 1) % boat.length]!
      const n = turn(b[2] - a[2], 0, a[0] - b[0])
      if (n[2] <= 0) continue
      for (let k = 0; k < 4; k++) {
        const v = k === 0 || k === 3 ? a : b
        wall[k]![0] = v[0]
        wall[k]![1] = k < 2 ? -1.2 : 1.3
        wall[k]![2] = v[2]
      }
      const side = projectPath(wall, project, xy)
      depth.face(side.xy, side.z, lambert(...n))
    }
    const top = projectPath(boat, project, xy)
    depth.face(top.xy, top.z + 0.2, lambert(...turn(0, 1, 0)))
    depth.path(top.xy, top.z + 0.3, { width: hair, alpha: 0.95, closed: true, join: 'round' })
    project(sx - 2.1, 1.35, race, p)
    project(sx + 2.1, 1.35, race, q)
    depth.path([p.x, p.y, q.x, q.y], top.z + 0.4, { width: hair * 1.6, alpha: 1, tone: 'accent', cap: 'round' })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Heddle shafts open the shed, a shuttle flies a pick through it, the reed beats it in and the cloth winds on. */
export function LoaderHeddle(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
