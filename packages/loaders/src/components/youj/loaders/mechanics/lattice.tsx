'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { pin, plate, rod, type Turn, type V3 } from './machine'

export const meta = {
  id: 'lattice', title: 'Lattice', category: 'mechanics', technique: 'lines',
  tags: ['scissor', 'lift', 'linkage', 'platform', 'constraint', 'deployment'],
  description: 'A ram under two parallel scissor linkages lifts a platform and its accent load. Every bar keeps its length as the feet roll inward along their rails, the crossing pins rise through three stages, and the deck rides smoothly up and back down to its bed.',
  order: 9,
  colors: [{ part: 'Crossings', mono: 'ink' }],
} satisfies LoaderMeta

/* A scissor lift on a base frame. Two parallel linkages of three stages,
 * every bar 29 units between its end pins (Pythagoras is the mechanism:
 * as a stage gets taller its feet draw in), tied across at every crossing.
 * A hydraulic ram between them pushes on the lowest crossing: its barrel
 * pivots on the base and its rod runs out as the stack rises. The feet
 * roll in rails on the base and the top ends roll under the deck, which
 * carries a small accent load. The rise is one smooth cosine: up and back
 * to the bed with no dwell.
 *
 * Color: the pins at the scissors’ crossings are `c1`, rising stage by stage as the deck lifts; the bars keep the ink and the load the accent. */

const BAR = 29
const BASE = -31
const SIDES = [-7, 7]
const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const box: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const set = (v: V3, x: number, y: number, z: number) => {
  v[0] = x
  v[1] = y
  v[2] = z
}

/** A lit box from its min and max corners, its faces toward the viewer outlined; `layer` pins its depth. */
function block(project: Project, turn: Turn, lo: V3, hi: V3, hair: number, edge: number, tone: 'ink' | 'accent' = 'ink', layer?: number) {
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
    depth.face(f.xy, z, lambert(...v), tone)
    if (edge > 0) depth.path(f.xy, z + 0.005, { width: hair, alpha: edge, closed: true, join: 'round' })
  })
}

export const scene: Scene = {
  beats: 5.75,
  still: 0.32,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.1 : 1) / view.px
    // One smooth rise and return: the bed, the top, the bed, never parked.
    const rise = 0.5 - 0.5 * Math.cos(TAU * t)
    const height = 7 + 12 * rise
    const half = Math.sqrt(BAR ** 2 - height ** 2) / 2
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.42 + (small ? 0 : 0.05 * Math.sin(TAU * t)), pitch: -0.24 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h / 2 + 1 })
    const turn = orient(pose)

    // The base frame and its two rails, sorted under everything.
    if (!small) block(project, turn, [-22, BASE - 5, -11], [22, BASE - 2.4, 11], hair * 0.9, 0.55, 'ink', -1000)
    for (const z of SIDES) {
      block(project, turn, [-20, BASE - 2.4, z - 1.6], [20, BASE - 1.2, z + 1.6], hair * 0.8, 0.5, 'ink', small ? undefined : -990 + z)
    }

    // The ram: its barrel pivots on the base, its rod pushes the lowest crossing.
    const foot: V3 = [-12, BASE - 1, 0]
    const head: V3 = [0, BASE + height / 2, 0]
    const dx = head[0] - foot[0]
    const dy = head[1] - foot[1]
    const len = Math.hypot(dx, dy)
    const barrel = 9
    const mid: V3 = [foot[0] + (dx * barrel) / len, foot[1] + (dy * barrel) / len, 0]
    if (!small) {
      rod(depth, project, foot, mid, 3.6, 0.85)
      rod(depth, project, mid, head, 1.5, 0.95)
      pin(depth, project, turn, foot[0], foot[1], 2, 1.3, hair * 0.75)
    }

    for (const z of SIDES) {
      for (let i = 0; i < 3; i++) {
        const y = BASE + i * height
        // Narrow extruded bars, lit by their edge normals; a pin at every end and at the crossing.
        for (const sign of [-1, 1]) {
          const ax = -sign * half
          const bx = sign * half
          const nx = (height / BAR) * 0.95
          const ny = (-(bx - ax) / BAR) * 0.95
          set(quad[0]!, ax + nx, y + ny, z + (sign > 0 ? 0.6 : -0.6))
          set(quad[1]!, bx + nx, y + height + ny, z + (sign > 0 ? 0.6 : -0.6))
          set(quad[2]!, bx - nx, y + height - ny, z + (sign > 0 ? 0.6 : -0.6))
          set(quad[3]!, ax - nx, y - ny, z + (sign > 0 ? 0.6 : -0.6))
          plate(depth, project, turn, quad, 1.2, hair * 0.7)
        }
        if (!small) {
          const front = z > 0
          pin(depth, project, turn, 0, y + height / 2, z + (front ? 1.9 : -1.9), large ? 1.2 : 1, hair * 0.7, 'c1')
          for (const sign of [-1, 1]) {
            if (i > 0) pin(depth, project, turn, sign * half, y, z + (front ? 1.9 : -1.9), large ? 1 : 0.85, hair * 0.7)
          }
        } else {
          project(0, y + height / 2, z + 1, p)
          depth.dot(p, 0.9 / view.px, 0.95, 'c1')
        }
      }
      // The feet roll in their rail; the top ends roll under the deck.
      if (!small) for (const sign of [-1, 1]) {
        for (const yy of [BASE - 0.1, BASE + 3 * height + 0.1]) pin(depth, project, turn, sign * half, yy, z + (z > 0 ? 1.9 : -1.9), large ? 1.35 : 1.1, hair * 0.75)
      }
    }
    // The cross ties between the two sides, at every crossing.
    if (!small) for (let i = 0; i < 3; i++) {
      project(0, BASE + i * height + height / 2, -7, p)
      project(0, BASE + i * height + height / 2, 7, q)
      depth.line(p, q, hair * 1.3, 0.55)
    }

    // The deck: a lit slab with a lip, and the accent load sitting on it.
    const top = BASE + 3 * height + 1.2
    block(project, turn, [-22, top, -11], [22, top + 2.2, 11], hair, 0.8)
    if (large) {
      const f = projectPath([[-20.6, top + 2.21, -9.6], [20.6, top + 2.21, -9.6], [20.6, top + 2.21, 9.6], [-20.6, top + 2.21, 9.6]], project, xy)
      depth.path(f.xy, f.z + 0.5, { width: hair * 0.7, alpha: 0.28, closed: true })
    }
    block(project, turn, [5.5, top + 2.2, -3.5], [11.5, top + 6.8, 2.5], hair * 0.85, 0.75, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A constrained double scissor mechanism deploys and retracts a shallow platform. */
export function LoaderLattice(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
