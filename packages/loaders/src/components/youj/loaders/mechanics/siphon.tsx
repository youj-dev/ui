'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'siphon', title: 'Siphon', category: 'mechanics', technique: 'lines',
  tags: ['fluid', 'reservoirs', 'transfer', 'hydraulics', 'pipe', 'volume'],
  description: 'Two glass reservoirs on a base exchange a fixed volume through a primed, elevated tube. The levels rise and fall in counterphase, the column in the tube flows one way and back with an accent parcel riding it, and the surfaces ripple while the flow is strongest.',
  order: 10,
  colors: [{ part: 'Liquid', mono: 'ink' }],
} satisfies LoaderMeta

/* Two glass tanks, graduated, on a common base, joined by a tube clipped to
 * their rims and dipping to near their floors. The levels swing like
 * communicating vessels: one cosine, so they pass each other at full flow
 * and turn round without ever parking, and the two heights always add up
 * to the same volume. The column in the tube is drawn in dashes that the
 * flow carries along (their offset is the volume moved, so they run one
 * way, slow, and come back), with one accent parcel riding it over the
 * crown. Ripples on the surfaces swell with the flow.
 *
 * Color: the liquid is `c1`: each surface’s outline and ripples, and the column’s dashes in the tube, which warm with the flow and cool as it stops; the glass keeps the ink and the parcel the accent. */

const TANKS = [-23, 23]
const HALF = 9
const DEEP = 8
const FLOOR_Y = -29
const RIM = 15
const LIQUID = -5
const SWING = 13
const BACK = -1000
const pipe: V3[] = []
for (let i = 0; i <= 12; i++) pipe.push([-21, -24 + (44 * i) / 12, 4])
for (let i = 1; i <= 24; i++) {
  const a = Math.PI - (Math.PI * i) / 24
  pipe.push([21 * Math.cos(a), 20 + 11 * Math.sin(a), 4])
}
for (let i = 1; i <= 12; i++) pipe.push([21, 20 - (44 * i) / 12, 4])
/** Arc length along the tube at each sample, for the flow's dashes and the parcel. */
const along: number[] = [0]
for (let i = 1; i < pipe.length; i++) along.push(along[i - 1]! + Math.hypot(pipe[i]![0] - pipe[i - 1]![0], pipe[i]![1] - pipe[i - 1]![1]))
const TUBE = along[along.length - 1]!
const depth = new Depth()
const xy: number[] = []
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const p = point()
const q = point()

/** The point at arc length d along the tube. */
function tubeAt(d: number, out: V3) {
  let i = 1
  while (i < along.length - 1 && along[i]! < d) i++
  const f = clamp((d - along[i - 1]!) / (along[i]! - along[i - 1]! || 1))
  const a = pipe[i - 1]!
  const b = pipe[i]!
  out[0] = a[0] + (b[0] - a[0]) * f
  out[1] = a[1] + (b[1] - a[1]) * f
  out[2] = a[2] + (b[2] - a[2]) * f
  return out
}

/** A lit box from its min and max corners, its faces toward the viewer outlined; `layer` pins its depth (a base under everything). */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number, layer?: number) {
  const faces: [V3, number[][]][] = [
    [[0, 0, 1], [[lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]],
    [[0, 1, 0], [[lo[0], hi[1], hi[2]], [hi[0], hi[1], hi[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]]]],
    [[1, 0, 0], [[hi[0], lo[1], hi[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [hi[0], hi[1], hi[2]]]],
    [[-1, 0, 0], [[lo[0], lo[1], lo[2]], [lo[0], lo[1], hi[2]], [lo[0], hi[1], hi[2]], [lo[0], hi[1], lo[2]]]],
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
    const z = layer === undefined ? f.z : layer + k * 0.01
    depth.face(f.xy, z, lambert(...v))
    depth.path(f.xy, z + 0.005, { width: hair, alpha: edge, closed: true, join: 'round' })
  })
}

export const scene: Scene = {
  beats: 6,
  still: 0.28,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.1 : 1.0) / view.px
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.28 + (small ? 0 : 0.05 * Math.sin(TAU * t)), pitch: -0.36 }
    const project = camera({ ...pose, distance: 330, cx: view.w / 2, cy: view.h / 2 - 1 })
    const turn = orient(pose)
    // One cosine: the volume moved from the left tank to the right and back, never parked.
    const moved = 0.5 - 0.5 * Math.cos(TAU * t)
    const flow = Math.abs(Math.sin(TAU * t))

    block(project, turn, [-36, FLOOR_Y - 4, -12], [36, FLOOR_Y, 12], hair * 0.9, 0.55, BACK)

    TANKS.forEach((x, tank) => {
      const level = LIQUID + SWING * (tank === 0 ? 1 - 2 * moved : 2 * moved - 1)
      // The liquid: a translucent body, its lit surface on top.
      const body = projectPath([[x - HALF + 0.4, FLOOR_Y, DEEP - 0.4], [x + HALF - 0.4, FLOOR_Y, DEEP - 0.4], [x + HALF - 0.4, level, DEEP - 0.4], [x - HALF + 0.4, level, DEEP - 0.4]], project, xy)
      depth.poly(body.xy, body.z, 0.1)
      const side = projectPath([[x + HALF - 0.4, FLOOR_Y, DEEP - 0.4], [x + HALF - 0.4, FLOOR_Y, -DEEP + 0.4], [x + HALF - 0.4, level, -DEEP + 0.4], [x + HALF - 0.4, level, DEEP - 0.4]], project, xy)
      depth.poly(side.xy, side.z - 2, 0.07)
      const top = projectPath([[x - HALF + 0.4, level, DEEP - 0.4], [x + HALF - 0.4, level, DEEP - 0.4], [x + HALF - 0.4, level, -DEEP + 0.4], [x - HALF + 0.4, level, -DEEP + 0.4]], project, xy)
      depth.face(top.xy, top.z, lambert(...turn(0, 1, 0)))
      depth.path(top.xy, top.z + 0.02, { width: hair * 0.9, alpha: 0.75, closed: true, tone: 'c1' })
      if (!small) for (let row = 0; row < 3; row++) {
        // Ripples across the surface, strongest at full flow.
        xy.length = 0
        for (let j = 0; j <= 16; j++) {
          const xx = -HALF + 1 + ((2 * HALF - 2) * j) / 16
          const wave = 0.6 * flow * Math.sin(TAU * (2 * t - xx / 20) + tank * Math.PI + row) * Math.sin((Math.PI * j) / 16)
          project(x + xx, level + wave + 0.1, -DEEP + 3.5 + row * 4.5, p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, top.z + 0.03, { width: hair * 0.7, alpha: 0.32, join: 'round', tone: 'c1' })
      }

      // The glass: back edges faint, front edges bright, a thicker rim, a lit floor slab.
      const edges: [V3, V3, number][] = [
        [[x - HALF, FLOOR_Y, -DEEP], [x - HALF, RIM, -DEEP], 0.22],
        [[x + HALF, FLOOR_Y, -DEEP], [x + HALF, RIM, -DEEP], 0.22],
        [[x - HALF, FLOOR_Y, DEEP], [x - HALF, RIM, DEEP], 0.8],
        [[x + HALF, FLOOR_Y, DEEP], [x + HALF, RIM, DEEP], 0.8],
      ]
      for (const [a, b, alpha] of edges) {
        project(...a, p)
        project(...b, q)
        depth.line(p, q, hair, alpha)
      }
      const rim = projectPath([[x - HALF, RIM, DEEP], [x + HALF, RIM, DEEP], [x + HALF, RIM, -DEEP], [x - HALF, RIM, -DEEP]], project, xy)
      depth.path(rim.xy, rim.z + 1, { width: hair * (small ? 1.2 : 1.5), alpha: 0.9, closed: true, join: 'round' })
      block(project, turn, [x - HALF - 0.6, FLOOR_Y, -DEEP - 0.6], [x + HALF + 0.6, FLOOR_Y + 1.6, DEEP + 0.6], hair * 0.85, 0.6, BACK + 10 + tank)
      if (!small) {
        // Graduations up the front right edge: a long mark every fourth.
        for (let k = 0; k <= 12; k++) {
          const y = FLOOR_Y + 4 + k * 3.2
          project(x + HALF, y, DEEP, p)
          project(x + HALF - (k % 4 === 0 ? 3 : 1.6), y, DEEP, q)
          depth.line(p, q, hair * 0.7, k % 4 === 0 ? 0.6 : 0.35)
        }
      }
    })

    // The tube: a faint glass wall round a liquid column, clipped to each rim.
    for (let j = 1; j < pipe.length; j++) {
      project(...pipe[j - 1]!, p)
      project(...pipe[j]!, q)
      const k = (p.k + q.k) / 2
      depth.line(p, q, hair * (small ? 2.6 : 3.6) * k, 0.16)
      p.z += 0.01
      q.z += 0.01
      depth.line(p, q, hair * (small ? 1.1 : 1.3) * k, small ? 0.62 : 0.34)
    }
    for (const x of [-21, 21]) pin(depth, project, turn, x, RIM + 0.6, 4.6, small ? 1.3 : 1.1, hair * 0.8, 'ink')
    if (!small) {
      // The flow, carried along the column: dashes whose offset is the volume moved.
      const dash = 1.8
      const gap = 6.2
      const shift = moved * 3 * (dash + gap)
      for (let d = -(dash + gap) + (shift % (dash + gap)); d < TUBE; d += dash + gap) {
        const a = Math.max(0, d)
        const b = Math.min(TUBE, d + dash)
        if (b - a < 0.3) continue
        tubeAt(a, box[0]!)
        tubeAt((a + b) / 2, box[1]!)
        tubeAt(b, box[2]!)
        const f = projectPath(box.slice(0, 3), project, xy)
        depth.path(f.xy, f.z + 0.05, { width: hair * (large ? 1.7 : 1.5), alpha: 0.5 + 0.45 * flow, cap: 'butt', join: 'round', tone: blend('ink', 'c1', flow) })
      }
    }
    // The accent parcel: it rides the column from tank to tank, under the liquid at either end of its run.
    const s = 0.08 + 0.84 * moved
    const show = span(s, 0.1, 0.2) * (1 - span(s, 0.8, 0.9))
    if (show > 0.004) {
      const at = s * TUBE
      tubeAt(at - 2.2, box[0]!)
      tubeAt(at, box[1]!)
      tubeAt(at + 2.2, box[2]!)
      const f = projectPath(box.slice(0, 3), project, xy)
      depth.path(f.xy, f.z + 0.1, { width: hair * (small ? 1.8 : 2.2), alpha: show, tone: 'accent', cap: 'round', join: 'round' })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Complementary reservoir levels and a travelling flow front describe a reversible fluid transfer. */
export function LoaderSiphon(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
