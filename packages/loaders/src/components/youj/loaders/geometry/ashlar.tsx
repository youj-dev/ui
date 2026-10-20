'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { stock } from './fabric'

export const meta = {
  id: 'ashlar', title: 'Ashlar', category: 'geometry', technique: 'planes',
  tags: ['masonry', 'bond', 'wall', 'courses', 'construction', 'assembly'],
  description: 'A bonded masonry wall seats from its footing upward. Alternate courses bridge the joints below, paired stones enter from opposite sides, and a short accent bed joint certifies the last course before the wall releases from the top down.',
  order: 43,
  colors: [{ part: 'Stones', mono: 'ink' }],
} satisfies LoaderMeta

const COURSES = [
  [[-20, 19], [0, 19], [20, 19]],
  [[-25, 9], [-10, 19], [10, 19], [25, 9]],
  [[-20, 19], [0, 19], [20, 19]],
] as const
const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 6, still: 0.5,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 0.85 : 0.95) / view.px
    const pose = { yaw: -0.55, pitch: -0.32 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 51 })
    const turn = orient(pose)
    stock(depth, project, turn, 0, -20, 0, 65, 3, 17, hair, 'ink', !small)

    COURSES.forEach((course, row) => course.forEach(([x, width], i) => {
      const pair = Math.min(i, course.length - 1 - i)
      const start = 0.035 + row * 0.16 + pair * 0.045
      const on = clamp(view.ease.emphasized(span(t, start, start + 0.15)))
      const off = view.ease.exit(span(t, 0.73 + (2 - row) * 0.07 + pair * 0.018, 0.82 + (2 - row) * 0.07 + pair * 0.018))
      const seated = on * (1 - off)
      if (seated <= 0.003) return
      // The alternating half stones make a real bond: no vertical joint
      // continues through the next course. Stock retains its aspect ratio.
      const sign = x < 0 ? -1 : 1
      stock(depth, project, turn, x + sign * 13 * (1 - seated), -13 + row * 11 + 6 * (1 - seated), 0,
        width * seated, 10 * seated, 11 * seated, hair * (small ? 0.75 : 0.8), 'ink', true, blend('c1', 'ink', on))
      if (!small) {
        project(x - width / 2, -18.3 + row * 11, 7, p)
        project(x + width / 2, -18.3 + row * 11, 7, q)
        depth.line(p, q, hair * 0.65, 0.12 + 0.24 * seated, blend('c1', 'ink', on))
      }
    }))

    const seal = view.ease.enter(span(t, 0.55, 0.66)) * (1 - view.ease.exit(span(t, 0.71, 0.78)))
    project(-10, 3, 5.7, p); project(-10 + 20 * seal, 3, 5.7, q)
    depth.line(p, q, hair * 1.5, seal, 'accent')
    // Foundation setting-out marks survive the seam.
    if (!small) for (const x of [-35, 35]) {
      project(x, -21.5, -10, p); project(x, -21.5, 10, q)
      depth.line(p, q, hair * 0.75, 0.3)
    }
    depth.flush(pen)
  },
}
/* Color: each stone comes in outlined in `c1`, its edges and bed
 * joint settling to the ink as it seats; the certifying joint stays the
 * accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three interlocked masonry courses seat onto a common footing. */
export function LoaderAshlar(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
