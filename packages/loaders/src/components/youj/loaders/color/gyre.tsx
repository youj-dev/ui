'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, blend, camera, clamp, Depth, point, type ExtraTone, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'gyre',
  title: 'Gyre',
  category: 'color',
  technique: 'particles',
  tags: ['orbit', 'rings', 'atom', 'gyroscope', 'weave', 'depth', 'particles'],
  description: 'Three tilted rings turn around the accent particle, each carrying particles in a color of its own, crossing in depth so the colors weave through each other.',
  order: 4,
  colors: [
    { part: 'First ring', mono: 'ink' },
    { part: 'Second ring', mono: 'ink' },
    { part: 'Third ring', mono: 'ink', role: 'c4' },
  ],
} satisfies LoaderMeta

/* Three rings of the same size, each tipped the same way off the floor and
 * turned a third of a turn apart about the vertical, so they cross like an
 * atom's orbits. Each carries a ring of the brand's square particles,
 * spaced evenly and moving along it, the second against the other two,
 * each a whole number of spacings a loop so the loop has no seam; the
 * camera sways a little. Near particles are larger and brighter, and the
 * depth buffer draws far to near, so where two rings cross, the nearer
 * ring's color passes over the farther's: the colors weave by depth. The
 * accent particle sits at the center, breathing once a loop.
 *
 * Color: the rings and their particles are `c1`, `c2`
 * and `c3`; each ring's hairline is a faint tint of its color. */

const R = 31
const TILT = 1.12
const RINGS: { turn: number; dir: number; tone: ExtraTone }[] = [
  { turn: 0, dir: 1, tone: 'c1' },
  { turn: TAU / 3, dir: -1, tone: 'c2' },
  { turn: (2 * TAU) / 3, dir: 1, tone: 'c3' },
]
const DETAIL = [
  { below: 32, n: 6, segments: 32 },
  { below: 80, n: 9, segments: 48 },
  { below: Infinity, n: 12, segments: 72 },
]

const depth = new Depth()
const p = point()
const q = point()
const ct = Math.cos(TILT)
const st = Math.sin(TILT)

/** A point on ring `turn` at angle `a`: a circle in the floor, tipped about x, then turned about the vertical. */
function onRing(turn: number, a: number): [number, number, number] {
  const x = R * Math.cos(a)
  const z0 = R * Math.sin(a)
  const y = -z0 * st
  const z = z0 * ct
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  return [x * c + z * s, y, -x * s + z * c]
}

export const scene: Scene = {
  beats: 5,
  still: 0.3,
  draw(pen, t, view) {
    const { n, segments } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: 0.35 + 0.2 * Math.sin(TAU * t), pitch: -0.55, distance: 230, cx: view.w / 2, cy: view.h / 2 })
    const side = clamp(view.size * 0.04, 1.4, 3) / view.px
    const hair = 1 / view.px
    const near = (z: number) => clamp((z + R) / (2 * R))

    for (const ring of RINGS) {
      // The ring's hairline, faintly in its color, drawn in pieces so it sorts with the particles.
      const tint = blend('ink', ring.tone, 0.6)
      for (let i = 0; i < segments; i++) {
        project(...onRing(ring.turn, (TAU * i) / segments), p)
        project(...onRing(ring.turn, (TAU * (i + 1)) / segments), q)
        depth.line(p, q, hair, 0.08 + 0.14 * near((p.z + q.z) / 2), tint)
      }
      // Its particles: two spacings a loop, the second ring the other way.
      for (let j = 0; j < n; j++) {
        const a = (TAU * (j + 2 * ring.dir * t)) / n
        project(...onRing(ring.turn, a), p)
        const k = near(p.z)
        depth.square(p, side * (0.7 + 0.55 * k), 0.35 + 0.65 * k, ring.tone)
      }
    }

    project(0, 0, 0, p)
    depth.square(p, side * (2 + 0.25 * Math.cos(TAU * t)), 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Three tilted rings of colored particles turn around the accent, weaving through each other in depth. */
export function LoaderGyre(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
