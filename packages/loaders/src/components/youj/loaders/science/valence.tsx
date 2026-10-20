'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, partial, pens, set, stick, type V3 } from './matter'

export const meta = {
  id: 'valence', title: 'Valence', category: 'science', technique: 'mixed',
  tags: ['molecule', 'tetrahedral', 'ball and stick', 'assembly', 'bond', '3d'],
  description: 'Four atoms approach a central atom along its four dashed valence directions and seat bond by bond. The completed ball-and-stick molecule shows its tetrahedron as it turns through depth, then the bonds release and the atoms withdraw in the same measured sequence.',
  order: 2,
  colors: [{ part: 'Valences', mono: 'ink' }],
} satisfies LoaderMeta

/* A central atom with its four valence directions drawn as dashed stubs,
 * the tetrahedral ones. Each partner arrives along its own direction
 * (`emphasized`, one after another), its bond growing out of the centre as a
 * lit stick as it seats; when all four are home the tetrahedron they span
 * shows in dashed hairlines and the bonds breathe a little. Then they let go in the same order. The molecule turns
 * once a loop throughout, so the assembly is never still.
 *
 * Color: the dashed valence directions and the tetrahedron they describe are `c1`; the atoms and bonds stay the ink, one bond the accent. */

const DIRECTIONS: V3[] = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(([x, y, z]) => [x! / Math.sqrt(3), y! / Math.sqrt(3), z! / Math.sqrt(3)])
const EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as const
const center: V3 = [0, 0, 0]
const atoms: V3[] = DIRECTIONS.map(() => [0, 0, 0])
const stub: V3 = [0, 0, 0]
const seats = [0, 0, 0, 0]
const depth = new Depth()

export const scene: Scene = {
  beats: 5.5,
  still: 0.46,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { hair } = pens(view)
    const project = camera({ yaw: 0.35 + TAU * t, pitch: -0.3 + 0.08 * Math.sin(TAU * t), distance: 220, cx: view.w / 2, cy: view.h / 2 })
    const BOND = 27
    DIRECTIONS.forEach((v, i) => {
      const arrive = view.ease.emphasized(span(t, 0.04 + i * 0.075, 0.25 + i * 0.075))
      const leave = view.ease.emphasized(span(t, 0.64 + i * 0.045, 0.82 + i * 0.045))
      const seat = arrive * (1 - leave)
      seats[i] = seat
      // Seated bonds breathe: three small stretches a loop, out of step.
      const d = mix(35, BOND, seat) + 0.45 * seat * Math.sin(TAU * (3 * t + i / 4))
      set(atoms[i]!, v[0] * d, v[1] * d, v[2] * d)
      // The valence direction, dashed, until its bond is made.
      set(stub, v[0] * BOND * 0.78, v[1] * BOND * 0.78, v[2] * BOND * 0.78)
      if (!small) partial(depth, project, center, stub, hair, 0.7 * (1 - seat), view, 'c1')
      stick(depth, project, center, atoms[i]!, small ? 1.3 : 1.6, view, i === 3 ? 'accent' : 'ink', seat)
      atom(depth, project, atoms[i]!, small ? 6.8 : 6.2, view)
    })
    atom(depth, project, center, small ? 10 : 9.2, view)

    // The tetrahedron the four partners span, once they're all home.
    const whole = span(Math.min(...seats), 0.55, 1)
    if (!small && whole > 0) {
      for (const [i, j] of EDGES) partial(depth, project, atoms[i]!, atoms[j]!, hair * 0.85, 0.42 * whole, view, 'c1')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Tetrahedral coordination assembles one bond at a time while the molecule turns. */
export function LoaderValence(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
