'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, orient, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { block, detail, edge, hairline, orb, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'tensor',
  title: 'Tensor',
  category: 'waves',
  technique: 'lines',
  tags: ['gravity', 'binary', 'quadrupole', 'spacetime', 'mesh', 'strain', '3d'],
  description: 'Two equal masses orbit in their own wells in a spacetime mesh. A quadrupolar ripple stretches one direction as it contracts the other, radiating outward twice per orbit, and an L-shaped detector at the mesh’s corner trades its arm lengths as each ripple passes.',
  order: 2,
  colors: [{ part: 'Second mass', mono: 'ink' }],
} satisfies LoaderMeta

/* A binary pair sits in the sheet, each mass in the dimple it makes, and
 * orbits once a loop. The sheet carries the quadrupole: a ripple that
 * stretches the mesh along one axis while it squeezes the other, radiating
 * out from the pair twice per orbit and fading with distance. At the far
 * corner an interferometer (a station and two arms at right angles) reads
 * the same strain: one arm grows as the other shrinks, in time with the
 * ripple passing it. The far grid fades into depth, a dashed ring marks
 * the orbit, and one mass wears the accent.
 *
 * Color: the second mass is `c1`, paired with the first in the accent; the mesh stays the ink. */

const LEVELS = [5, 8, 11].map((rows) => ({ rows, lines: Array.from({ length: 2 * (rows + 1) }, () => Array.from({ length: 41 }, () => [0, 0, 0] as V3)) }))
const orbit = Array.from({ length: 49 }, () => [0, 0, 0] as V3)
const centers: V3[] = [[0, 0, 0], [0, 0, 0]]
const HALF = 29
const RADIUS = 9.5
const MASS = 3.6
/** The interferometer's corner station and its arm length. */
const STATION: V3 = [-HALF + 4, 0, HALF - 4]
const ARM = 16
const depth = new Depth()

/** The ripple's strain at (x, z): a quadrupole radiating outward twice per orbit. */
function strain(x: number, z: number, u: number) {
  const r = Math.hypot(x, z)
  const a = Math.atan2(z, x)
  return Math.sin(TAU * (2 * u - r / 40) - 2 * a) * (1 - Math.exp(-r / 8)) * Math.exp(-r / 75)
}

/** The sheet's height at (x, z): both wells, and the ripple's ruck. */
function sheet(x: number, z: number, u: number) {
  let well = 0
  for (const c of centers) well -= 11 * Math.exp(-((x - c[0]) ** 2 + (z - c[2]) ** 2) / 54)
  return well + 2.8 * strain(x, z, u)
}

export const scene: Scene = {
  beats: 5.5,
  still: 0.18,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { rows, lines } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = -0.22 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.62
    const project = camera({ yaw, pitch, distance: 250, cx: view.w / 2, cy: 54 })
    const turn = orient({ yaw, pitch })
    for (let j = 0; j < 2; j++) {
      const a = TAU * u + j * Math.PI
      centers[j]![0] = RADIUS * Math.cos(a)
      centers[j]![2] = RADIUS * Math.sin(a)
    }
    for (let axis = 0; axis < 2; axis++) {
      for (let row = 0; row <= rows; row++) {
        const line = lines[axis * (rows + 1) + row]!
        const fixed = -HALF + (2 * HALF * row) / rows
        for (let i = 0; i < line.length; i++) {
          const along = -HALF + (2 * HALF * i) / (line.length - 1)
          const x = axis ? fixed : along
          const z = axis ? along : fixed
          const h = strain(x, z, u)
          const v = line[i]!
          v[0] = x * (1 + 0.055 * h)
          v[1] = sheet(x, z, u)
          v[2] = z * (1 - 0.055 * h)
        }
        wire(depth, project, line, hair, row === 0 || row === rows ? 0.35 : 0.74, 'ink', 6)
      }
    }
    // The masses, each resting in its own well; the orbit dashed through them.
    for (let j = 0; j < 2; j++) {
      const c = centers[j]!
      c[1] = sheet(c[0], c[2], u) + MASS * 0.92
    }
    if (lod > 0) {
      for (let i = 0; i <= 48; i++) {
        const a = (TAU * i) / 48
        const v = orbit[i]!
        v[0] = RADIUS * Math.cos(a)
        v[2] = RADIUS * Math.sin(a)
        v[1] = sheet(v[0], v[2], u) + 0.3
      }
      wire(depth, project, orbit, hair * 0.75, 0.42, 'ink', 4, [2 * hair, 2 * hair])
    }
    orb(depth, project, centers[0]!, MASS, view, 'accent')
    orb(depth, project, centers[1]!, MASS, view, 'c1')

    // The detector at the far corner: its station, and two arms at right angles trading length with the strain.
    if (lod > 0) {
      const h = strain(STATION[0] + ARM / 2, STATION[2] - ARM / 2, u)
      const y = sheet(STATION[0], STATION[2], u) + 1.5
      const lx = ARM * (1 + 0.16 * h)
      const lz = ARM * (1 - 0.16 * h)
      block(depth, project, turn, [STATION[0], y, STATION[2]], [2, 1.5, 2], hair * 0.8)
      edge(depth, project, [STATION[0] + 2, y, STATION[2]], [STATION[0] + lx, y, STATION[2]], hair * 1.5, 0.9)
      edge(depth, project, [STATION[0], y, STATION[2] - 2], [STATION[0], y, STATION[2] - lz], hair * 1.5, 0.9)
      // An end mirror on each arm, square to it.
      edge(depth, project, [STATION[0] + lx, y, STATION[2] - 1.4], [STATION[0] + lx, y, STATION[2] + 1.4], hair * 1.8, 0.95)
      edge(depth, project, [STATION[0] - 1.4, y, STATION[2] - lz], [STATION[0] + 1.4, y, STATION[2] - lz], hair * 1.8, 0.95)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A binary pair pulls travelling, alternating strain through a spacetime mesh. */
export function LoaderTensor(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
