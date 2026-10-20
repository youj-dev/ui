'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, orient, point, span, Depth, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'
import { stock } from './fabric'

export const meta = {
  id: 'atrium', title: 'Atrium', category: 'geometry', technique: 'planes',
  tags: ['architecture', 'courtyard', 'plan', 'walls', 'lintel', 'construction'],
  description: 'A courtyard plan becomes an open architectural shell. Paired piers rise along each side, their lintels seat only after the supports, and four gallery ledges register around the central opening before the building returns to its measured footprint.',
  order: 38,
  colors: [{ part: 'Piers', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const a = point(), b = point()

export const scene: Scene = {
  beats: 6.2, still: 0.57,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.64, pitch: -0.65 }
    const project = camera({ ...pose, distance: 380, cx: 50, cy: 54 })
    const light = orient(pose)
    const stage = (from: number, to: number, clear: number) => clamp(view.ease.emphasized(span(t, from, to)) - view.ease.emphasized(span(t, clear, clear + 0.1)))
    const line = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, alpha: number, accent = false, tone: Tone = 'ink') => {
      project(x0, y0, z0, a); project(x1, y1, z1, b)
      depth.line(a, b, hair * (a.k + b.k) / 2, alpha * clamp(0.82 + (a.z + b.z) / 300, 0.45, 1), accent ? 'accent' : tone)
    }
    // The square well is physically empty all the way through the model.
    // Four narrow foundation strips, rather than a plate across the void.
    for (let side = 0; side < 4; side++) {
      const horizontal = side % 2 === 0
      const sign = side < 2 ? -1 : 1
      stock(depth, project, light, horizontal ? 0 : sign * 24, -15, horizontal ? sign * 24 : 0, horizontal ? 51 : 5, 2, horizontal ? 5 : 51, hair * 0.7)
      const from = 0.035 + side * 0.085
      const wall = stage(from, from + 0.16, 0.82 + (3 - side) * 0.02)
      // A pier rises outlined in the courtyard's color and settles to the ink once it stands.
      const rising = blend('c1', 'ink', wall)
      const lintel = stage(from + 0.11, from + 0.23, 0.75 + (3 - side) * 0.025)
      for (const offset of [-16, 16]) {
        const x = horizontal ? offset : sign * 24
        const z = horizontal ? sign * 24 : offset
        // Each pier extrudes from its own plan; the doorway never closes.
        if (wall > 0.003) stock(depth, project, light, x, -14 + 13 * wall, z, horizontal ? 17 : 3.5, 26 * wall, horizontal ? 3.5 : 17, hair * 0.8, 'ink', true, rising)
        if (!small) {
          line(x - (horizontal ? 8.5 : 1.75), -13.8, z - (horizontal ? 1.75 : 8.5), x + (horizontal ? 8.5 : 1.75), -13.8, z - (horizontal ? 1.75 : 8.5), 0.28)
        }
      }
      if (lintel > 0.003) stock(depth, project, light, horizontal ? 0 : sign * 24, 8.5 + 12 * (1 - lintel), horizontal ? sign * 24 : 0, horizontal ? 15 : 3.5, 7 * lintel, horizontal ? 3.5 : 15, hair * 0.8)
      const deck = stage(0.4 + side * 0.045, 0.54 + side * 0.045, 0.67 + (3 - side) * 0.028)
      if (deck > 0.003) {
        const x = horizontal ? 0 : sign * 20.5
        const z = horizontal ? sign * 20.5 : 0
        stock(depth, project, light, x, 13 + 10 * (1 - deck), z, horizontal ? 45 : 7, 2 * deck, horizontal ? 7 : 45, hair * 0.75)
        if (side === 2) line(-8, 14.1 + 10 * (1 - deck), z - 3.5, 8, 14.1 + 10 * (1 - deck), z - 3.5, deck * 0.95, true)
      }
    }
    if (!small) {
      // Dimension witnesses are outside the shell and never span its well.
      line(-29, -16, 31, 29, -16, 31, 0.28)
      for (const x of [-29, 29]) line(x, -16, 28, x, -16, 34, 0.42)
      for (const x of [-24, 24]) for (const z of [-24, 24]) line(x, -14, z, x, 16, z, 0.12)
    }
    depth.flush(pen)
  },
}
/* Color: each pier rises outlined in `c1` and settles to the ink
 * once it stands; lintels and ledges stay ink, and the ledge mark the
 * accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Piers, lintels and gallery ledges build an open courtyard around a measured void. */
export function LoaderAtrium(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
