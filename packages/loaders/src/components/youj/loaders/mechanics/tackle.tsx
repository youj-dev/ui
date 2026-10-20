'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, orient, Depth, polylineLength, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circle, disc, part, pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'tackle', title: 'Tackle', category: 'mechanics', technique: 'lines',
  tags: ['pulley', 'hoist', 'rope', 'tension', 'mechanical advantage'],
  description: 'A moving sheave hoists a suspended load while the free rope pays out at twice its travel. The rope runs over both sheaves with an accent tag riding it, and its length stays constant throughout the lift and return.',
  order: 6,
  colors: [{ part: 'Rope', mono: 'ink' }],
} satisfies LoaderMeta

/* A 2:1 tackle under a box beam: the rope is tied to an eye on the beam,
 * runs down round the moving sheave (its block carries the load on a hook
 * and shackle), up over the fixed sheave in its strap, and down to the
 * free end's weight. The lift is one smooth cosine, so it hauls and lowers
 * without parking. The rope is drawn by arc length from its tied end, and
 * the rope is inextensible, so the accent tag rides with the material:
 * up the second fall at twice the load's speed and over the fixed sheave.
 * The sheaves turn at the rope's speed.
 *
 * Color: the rope leans toward `c1` along its whole run, so it reads apart from the sheaves and the frame; its tag stays the accent. */

const R = 8
const SHEAVE = 7.2
const BEAM = 36
const FIXED: V3 = [16, 25, 0]
const ANCHOR_X = -8
const LIFT = 12
const rope: V3[] = []
const outline: V3[] = []
const holes: V3[][] = [[], [], [], [], [], []]
const strap: V3[] = []
const boss: V3[] = []
const xy: number[] = []
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const depth = new Depth()

/** A lit box from its min and max corners: the faces toward the viewer, each outlined. */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[0, -1, 0], [[lo[0], lo[1], lo[2]], [hi[0], lo[1], lo[2]], [hi[0], lo[1], hi[2]], [lo[0], lo[1], hi[2]]]],
    [[1, 0, 0], [[hi[0], lo[1], hi[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [hi[0], hi[1], hi[2]]]],
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
    depth.path(f.xy, f.z + 0.01, { width: hair, alpha: edge, closed: true, join: 'round' })
  }
}

/** A strap plate from the axle up or down to y, behind its sheave. */
function strapPlate(x: number, y0: number, y1: number, w: number, z: number) {
  const lo = Math.min(y0, y1)
  const hi = Math.max(y0, y1)
  strap.length = 0
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI + (Math.PI * i) / 6
    strap.push([x + w * Math.cos(a), lo + w * Math.sin(a), z])
  }
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI * i) / 6
    strap.push([x + w * Math.cos(a), hi + w * Math.sin(a), z])
  }
  return strap
}

export const scene: Scene = {
  beats: 5.5, still: 0.31,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.15 : 1.05) / view.px
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.3 + (small ? 0 : 0.05 * Math.sin(TAU * t)), pitch: -0.16 }
    const project = camera({ ...pose, distance: 330, cx: view.w / 2 - 5, cy: 49 })
    const turn = orient(pose)
    // One smooth haul and return: the load rises LIFT, the free end falls twice that.
    const lift = LIFT * (0.5 - 0.5 * Math.cos(TAU * t))
    const y = -8 + lift
    const tail = -10 - 2 * lift

    // The beam, the eye the rope is tied to, the fixed sheave's strap.
    block(project, turn, [-24, BEAM, -5], [34, BEAM + 4, 5], hair * 0.9, 0.6)
    if (large) for (const x of [-18, 0, 28]) pin(depth, project, turn, x, BEAM + 2, 5.05, 0.8, hair * 0.7, 'ink')
    circle(depth, project, ANCHOR_X, BEAM - 1.4, 0, 1.3, hair * 1.1, 0.85, 'ink', 12)
    part(depth, project, turn, strapPlate(FIXED[0], FIXED[1], BEAM, 3, -1.7), [], 1.4, hair * 0.85, 0, 0.7)

    // The moving block: its strap down to the hook, the shackle, the load.
    part(depth, project, turn, strapPlate(0, y, y - 11, 3, -1.7), [], 1.4, hair * 0.85, 0, 0.7)
    circle(depth, project, 0, y - 12.6, 0, 1.4, hair * 1.1, 0.85, 'ink', 12)
    block(project, turn, [-8.5, y - 23, -5], [8.5, y - 14, 5], hair * 0.9, 0.7)
    if (!small) {
      // The shackle's bow over the load, and a plate line round its face.
      circle(depth, project, 0, y - 14, 5.2, 1.6, hair * 0.9, 0.75, 'ink', 12)
      if (large) {
        const f = projectPath([[-7.3, y - 21.8, 5.02], [7.3, y - 21.8, 5.02], [7.3, y - 15.2, 5.02], [-7.3, y - 15.2, 5.02]], project, xy)
        depth.path(f.xy, f.z + 0.5, { width: hair * 0.7, alpha: 0.3, closed: true })
      }
    }

    // The sheaves: lit discs turning with the rope, a groove inside the rim, a hub.
    const sheaves: [number, number, number][] = [[0, y, -lift / R], [FIXED[0], FIXED[1], (2 * lift) / R]]
    sheaves.forEach(([x, yy, a], k) => {
      const cut = small ? [] : holes.slice(k * 3, k * 3 + 3).map((h, j) => disc(x + 4.2 * Math.cos(a + (TAU * j) / 3), yy + 4.2 * Math.sin(a + (TAU * j) / 3), 1.6, 1.3, 12, h))
      const layer = part(depth, project, turn, disc(x, yy, 1.6, SHEAVE, small ? 18 : 36, outline), cut, 3.2, hair, 0)
      if (!small) circle(depth, project, x, yy, 1.62, SHEAVE - 1.1, hair * 0.7, 0.35, 'ink', 36, layer + 0.01)
      const hub = part(depth, project, turn, disc(x, yy, 2.6, 2.3, small ? 10 : 16, boss), [], 1, hair * 0.85, 0, 0.8)
      pin(depth, project, turn, x, yy, 2.65, 1.1, hair * 0.75, 'ink', hub + 0.01)
    })

    // The rope: tied end, round the moving sheave, over the fixed one, down to the free end.
    rope.length = 0
    rope.push([ANCHOR_X, BEAM - 2.7, 0])
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI + (Math.PI * i) / 16
      rope.push([R * Math.cos(a), y + R * Math.sin(a), 0])
    }
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI - (Math.PI * i) / 16
      rope.push([FIXED[0] + R * Math.cos(a), FIXED[1] + R * Math.sin(a), 0])
    }
    rope.push([FIXED[0] + R, tail, 0])
    // Short pieces, so the rope sorts in front of each sheave where it wraps it and behind nothing.
    const path = projectPath(rope, project, xy)
    const length = polylineLength(path.xy)
    depth.path(path.xy, 100, { width: hair * (small ? 1.3 : 1.7), alpha: 0.88, join: 'round', tone: blend('ink', 'c1', 0.75) })
    // The accent tag, at a fixed place on the rope measured from its tied end (the rope can't stretch,
    // so it rides with the rope): it climbs the second fall at twice the load's speed and over the sheave.
    const tag = BEAM - 2.7 + 8 + Math.PI * R + 12
    depth.path(path.xy, 100.02, { width: hair * (small ? 2 : 2.6), alpha: 1, tone: 'accent', dash: [3.6, length + 10], offset: -(tag - 1.8), cap: 'butt', join: 'round' })

    // The free end's weight.
    block(project, turn, [FIXED[0] + R - 2.4, tail - 5, -2.4], [FIXED[0] + R + 2.4, tail, 2.4], hair * 0.85, 0.7)
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A constant-length reeving lifts a load with a two-to-one displacement. */
export function LoaderTackle(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
