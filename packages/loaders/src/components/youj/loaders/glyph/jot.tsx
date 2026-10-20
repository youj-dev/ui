'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, span, Depth, point, type Scene } from '../field'
import { WORDMARK, flatten } from '../glyphs'
import type { LoaderMeta } from '../categories'
import { TITTLE } from './word'

export const meta = {
  id: 'jot',
  title: 'Jot',
  category: 'glyph',
  technique: 'planes',
  tags: ['j', 'letter', 'solid', 'extruded', '3d', 'brand', 'tittle', 'turntable'],
  description: 'The youj j as a solid letter, every face lit by its own angle, turns once and lands, while its tittle spins above it as a cube in the accent.',
  order: 2,
  colors: [{ part: 'Index', mono: 'ink' }],
} satisfies LoaderMeta

/* The j is its real outline (the wordmark's stem and hook), extruded to the
 * depth of its stem. Every face is flat-lit from its normal (lambert), back
 * faces are dropped, and the rest are painted far to near as solid planes,
 * so the letter is opaque on any background and reads as one object. It
 * turns a full turn on the `emphasized` curve (wind-up, fast middle, a long
 * landing) and rests a beat; the tittle, a small cube in the accent, spins
 * twice and bobs above it on its own. A full turn ends where it began, so
 * the loop has no seam.
 *
 * Color: the turntable’s index, which stays with the viewer, is `c1`; the letter stays the ink and the tittle the accent. */

const SCALE = 3.4
const HALF_DEPTH = 3.6
const CENTER = { x: 34.6, y: 14 }
const toWorld = ([x, y]: [number, number]): [number, number] => [(x - CENTER.x) * SCALE, -(y - CENTER.y) * SCALE]

/** The j's outline in world x and y, counter-clockwise, without the repeated closing point. */
function outline(steps: number): [number, number][] {
  const pts = flatten(WORDMARK[3]!.outlines[0]!, steps).map(toWorld)
  const [a, b] = [pts[0]!, pts[pts.length - 1]!]
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) pts.pop()
  let area = 0
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length]!
    area += x * ny - nx * y
  })
  return area < 0 ? pts.reverse() : pts
}

const DETAIL = [
  { below: 32, j: outline(3) },
  { below: Infinity, j: outline(8) },
]

/** A cube's six faces: corners by index (bit 1 is +x, bit 2 +y, bit 4 +z), in order round the face, and outward normals. */
const CUBE_FACES: [number[], [number, number, number]][] = [
  [[0, 1, 3, 2], [0, 0, -1]],
  [[4, 5, 7, 6], [0, 0, 1]],
  [[0, 1, 5, 4], [0, -1, 0]],
  [[2, 3, 7, 6], [0, 1, 0]],
  [[0, 2, 6, 4], [-1, 0, 0]],
  [[1, 3, 7, 5], [1, 0, 0]],
]

/** The view it rests at, and its turntable: radius and height (just under the j's descender). */
const REST = -0.55
const DISC = 17
const BASE = -36

const depth = new Depth()
const p = point()
const q = point()

export const scene: Scene = {
  beats: 4.5,
  still: 0.2,
  draw(pen, t, view) {
    const { j } = DETAIL.find((d) => view.size < d.below)!
    const pose = { yaw: REST + TAU * view.ease.emphasized(span(t, 0.04, 0.9)), pitch: -0.3 }
    const project = camera({ ...pose, distance: 260, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const hair = 1 / view.px
    const n = j.length

    // The turntable it stands on: a rim, a dial of ticks that turns with it (its zero longer), and an index
    // that stays with the viewer, so the turn is read against it and lands back on zero.
    for (let i = 0; i < 48; i++) {
      const a = (TAU * i) / 48
      const b = (TAU * (i + 1)) / 48
      project(DISC * Math.sin(a), BASE, DISC * Math.cos(a), p)
      project(DISC * Math.sin(b), BASE, DISC * Math.cos(b), q)
      depth.line(p, q, hair, 0.18 + 0.2 * clamp((p.z + q.z) / (4 * DISC) + 0.5))
    }
    if (view.size >= 40) {
      for (let i = 0; i < 12; i++) {
        const a = (TAU * i) / 12
        const r1 = DISC + (i === 0 ? 4 : 2)
        project(DISC * Math.sin(a), BASE, DISC * Math.cos(a), p)
        project(r1 * Math.sin(a), BASE, r1 * Math.cos(a), q)
        depth.line(p, q, hair, i === 0 ? 0.6 : 0.3)
      }
      const a = REST - pose.yaw
      project((DISC + 5) * Math.sin(a), BASE, (DISC + 5) * Math.cos(a), p)
      project((DISC + 8) * Math.sin(a), BASE, (DISC + 8) * Math.cos(a), q)
      depth.line(p, q, hair * 1.6, 0.75, 'c1')
    }

    const face = (corners: [number, number, number][], normal: [number, number, number], tone: 'ink' | 'accent' = 'ink') => {
      const v = turn(...normal)
      if (v[2] <= 0.02) return
      let z = 0
      const xy = corners.flatMap(([x, y, zz]) => {
        project(x, y, zz, p)
        z += p.z
        return [p.x, p.y]
      })
      depth.face(xy, z / corners.length, lambert(...v), tone)
    }

    // The walls, one quad per edge of the outline, facing out.
    for (let i = 0; i < n; i++) {
      const [ax, ay] = j[i]!
      const [bx, by] = j[(i + 1) % n]!
      const len = Math.hypot(bx - ax, by - ay) || 1
      face(
        [
          [ax, ay, HALF_DEPTH],
          [bx, by, HALF_DEPTH],
          [bx, by, -HALF_DEPTH],
          [ax, ay, -HALF_DEPTH],
        ],
        [(by - ay) / len, -(bx - ax) / len, 0],
      )
    }
    // The caps, and a hairline round the front one so the letter's edge stays crisp.
    face(
      j.map(([x, y]) => [x, y, HALF_DEPTH]),
      [0, 0, 1],
    )
    face(
      j.map(([x, y]) => [x, y, -HALF_DEPTH]),
      [0, 0, -1],
    )
    if (turn(0, 0, 1)[2] > 0.02) {
      let z = 0
      const xy = j.flatMap(([x, y]) => {
        project(x, y, HALF_DEPTH, p)
        z += p.z
        return [p.x, p.y]
      })
      depth.path(xy, z / n + 0.01, { width: hair, alpha: 0.35, closed: true })
    }

    // The tittle: a cube in the accent, spinning twice a loop and bobbing over the stem.
    const [tx, ty] = toWorld([TITTLE.x + TITTLE.size / 2, TITTLE.y + TITTLE.size / 2])
    const s = (TITTLE.size * SCALE) / 2
    const spin = TAU * 2 * t + 0.4
    const bob = Math.sin(TAU * t) * 1.6
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    const corner = (i: number): [number, number, number] => {
      const x = i & 1 ? s : -s
      const y = i & 2 ? s : -s
      const z = i & 4 ? s : -s
      return [tx + x * cos + z * sin, ty + bob + y, -x * sin + z * cos]
    }
    for (const [idx, [nx, ny, nz]] of CUBE_FACES) {
      face(
        idx.map(corner),
        [nx * cos + nz * sin, ny, -nx * sin + nz * cos],
        'accent',
      )
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The youj j as a solid, flat-lit letter turns and lands; its tittle spins above it as an accent cube. */
export function LoaderJot(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
