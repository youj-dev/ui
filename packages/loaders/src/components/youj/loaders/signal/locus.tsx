'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'locus',
  title: 'Locus',
  category: 'signal',
  technique: 'paths',
  tags: ['lissajous', 'curve', 'knot', 'harmonic', '3d', 'orbit', 'oscilloscope', 'trace'],
  description: 'A Lissajous figure in three dimensions, three tones in one closed curve over its shadow on a construction frame, turning in perspective while the accent traces it with a bright wake.',
  order: 7,
  colors: [{ part: 'Wake', mono: 'ink' }],
} satisfies LoaderMeta

/* Three tones, at 3 : 2 : 1 across, up and deep, draw one closed curve in
 * space: from the front it's the familiar 3 : 2 figure, and its depth
 * pulls the crossings apart. It floats over the docs' construction frame
 * laid on the floor, with registration marks at the corners and the curve's
 * shadow inside. It's drawn in short runs sorted by depth, nearer ones wider
 * and brighter, and turns a full turn about its axis each loop while the
 * accent runs round it twice, lighting a wake that fades behind it.
 *
 * Color: the accent’s bright wake along the curve is `c1`, fading back to the ink behind it. */

const SIZE = 25
const FLOOR = -SIZE - 7
const FRAME = SIZE + 1
const ARM = 3.4

const at = (a: number) => [SIZE * Math.sin(3 * a + 0.5), SIZE * Math.sin(2 * a), SIZE * Math.sin(a + 0.9)] as const
const curve = (n: number) => Array.from({ length: n }, (_, i) => at((TAU * i) / n))

const LEVELS = [{ points: curve(96) }, { points: curve(144) }, { points: curve(216) }]
const LAPS = 2
const RUN = 4
const WAKE = 0.32
const CORNERS = [
  [-FRAME, -FRAME],
  [FRAME, -FRAME],
  [FRAME, FRAME],
  [-FRAME, FRAME],
] as const

const depth = new Depth()
const p = point()
const q = point()

export const scene: Scene = {
  beats: 6,
  still: 0.18,
  draw(pen, t, view) {
    const lod = detail(view)
    const { points } = LEVELS[lod]!
    const { hair, line, head } = pens(view)
    const project = camera({ yaw: TAU * t + 0.4, pitch: -0.4, distance: 260, cx: view.w / 2, cy: view.h * 0.43 })
    const n = points.length
    const lead = (((t * LAPS) % 1) + 1) % 1
    const xy: number[] = []

    if (lod > 0) {
      // The construction frame on the floor: registration marks at its corners, its edges dashed when there's room.
      for (const [x, z] of CORNERS) {
        depth.line(project(x - ARM, FLOOR, z, p), project(x + ARM, FLOOR, z, q), hair, 0.42)
        depth.line(project(x, FLOOR, z - ARM, p), project(x, FLOOR, z + ARM, q), hair, 0.42)
      }
      if (lod === 2) {
        CORNERS.forEach(([x1, z1], c) => {
          const [x2, z2] = CORNERS[(c + 1) % 4]!
          xy.length = 0
          for (const [x, z] of [
            [x1 + Math.sign(x2 - x1) * (ARM + 2), z1 + Math.sign(z2 - z1) * (ARM + 2)],
            [x2 - Math.sign(x2 - x1) * (ARM + 2), z2 - Math.sign(z2 - z1) * (ARM + 2)],
          ] as const) {
            project(x, FLOOR, z, p)
            xy.push(p.x, p.y)
          }
          depth.path(xy, -1e3, { width: hair, alpha: 0.18, dash: [2 * hair, 3 * hair] })
        })
      }
      // The curve's shadow on the floor.
      xy.length = 0
      for (const [x, , z] of points) {
        project(x, FLOOR, z, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -1e3, { width: hair, alpha: 0.2, closed: true, join: 'round' })
    }

    // The curve in short runs (whole runs, so no two stretches overlap), each shaded by its depth and the wake.
    for (let r = 0; r < n; r += RUN) {
      xy.length = 0
      let z = 0
      let k = 0
      for (let i = r; i <= r + RUN; i++) {
        const [x, y, zz] = points[i % n]!
        project(x, y, zz, p)
        xy.push(p.x, p.y)
        z += p.z
        k += p.k
      }
      z /= RUN + 1
      k /= RUN + 1
      // How far behind the accent this run is, as a share of the curve.
      const behind = (((lead - (r + RUN / 2) / n) % 1) + 1) % 1
      const wake = behind < WAKE ? (1 - behind / WAKE) ** 1.6 : 0
      const near = clamp((z + SIZE * 1.3) / (SIZE * 2.6))
      depth.path(xy, z, { width: line * (0.75 + 0.45 * near + 0.35 * wake) * k, alpha: 0.16 + 0.26 * near + 0.58 * wake, join: 'round', tone: blend('ink', 'c1', 0.9 * wake) })
    }

    const [x, y, z] = at(TAU * lead)
    depth.square(project(x, y, z, p), head, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A Lissajous figure in three dimensions, turning while the accent traces it. */
export function LoaderLocus(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
