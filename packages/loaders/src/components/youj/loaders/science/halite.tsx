'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, bond, brightness, partial, pens, type V3 } from './matter'

export const meta = {
  id: 'halite', title: 'Halite', category: 'science', technique: 'lines',
  tags: ['crystal', 'ionic', 'unit cell', 'lattice growth', 'nucleation', '3d'],
  description: 'An ionic crystal grows from an accent seed into connected cubic cells. Large and small ions seat by turns along a diagonal growth front, each lattice line reaching out to a neighbour as it arrives, the unit cell ruled in dashes once whole; then the outer layers dissolve back toward the seed.',
  order: 3,
  colors: [{ part: 'Small ions', mono: 'ink' }],
} satisfies LoaderMeta

/* A rock-salt crystal: large and small ions alternating on a cube grid.
 * From a seed at one corner (the accent) the ions arrive front by front
 * along the diagonal, each one growing into its site (`enter`) as the
 * lattice lines from its seated neighbours reach out to it; empty sites
 * wait as faint points. When the cube is whole its outline is ruled in
 * dashes; then it dissolves, the far corner first (`exit`), back to the
 * seed. The crystal sways the whole time, so even a whole cube is moving.
 *
 * Color: the small ions are `c1` and the large ones the ink, so the two kinds of ion read apart; the seed stays the accent. */

const LEVELS = [2, 3, 3].map((side) => {
  const step = 38 / (side - 1)
  const sites: { v: V3; rank: number; large: boolean }[] = []
  for (let y = 0; y < side; y++) for (let z = 0; z < side; z++) for (let x = 0; x < side; x++) {
    sites.push({ v: [(x - (side - 1) / 2) * step, (y - (side - 1) / 2) * step, (z - (side - 1) / 2) * step], rank: (x + y + z) / (3 * (side - 1)), large: (x + y + z) % 2 === 0 })
  }
  const edges: [number, number][] = []
  for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
    const a = sites[i]!.v
    const b = sites[j]!.v
    if (Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - step) < 0.01) edges.push(sites[i]!.rank <= sites[j]!.rank ? [i, j] : [j, i])
  }
  const h = 24.5
  const corners: V3[] = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]]
  return { sites, edges, corners, seated: sites.map(() => 0) }
})
const BOX = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]] as const
const depth = new Depth()
const p = point()

export const scene: Scene = {
  beats: 5.5,
  still: 0.4,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { sites, edges, corners, seated } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const { hair } = pens(view)
    const project = camera({ yaw: -0.66 + 0.22 * Math.sin(TAU * t), pitch: -0.5 + 0.05 * Math.cos(TAU * t), distance: 280, cx: view.w / 2, cy: view.h / 2 + 1 })
    sites.forEach(({ v, rank, large }, i) => {
      const grow = view.ease.enter(span(t, rank * 0.32, 0.14 + rank * 0.32))
      const dissolve = view.ease.exit(span(t, 0.6 + (1 - rank) * 0.28, 0.74 + (1 - rank) * 0.28))
      // The seed stays, breathing a little, so the crystal is never quite still.
      seated[i] = i === 0 ? 1 + 0.06 * Math.sin(TAU * 2 * t) : grow * (1 - dissolve)
      // The empty site, a faint point until its ion arrives.
      if (!small) {
        project(...v, p)
        depth.dot(p, 0.6 / view.px, 0.3 * (1 - seated[i]!) * brightness(p.z))
      }
      atom(depth, project, v, (large ? 3.9 : 2.5) * seated[i]!, view, i === 0 ? 'accent' : large ? 'ink' : 'c1', small)
    })
    // Each lattice line reaches out from the earlier ion to the later one as it arrives.
    for (const [i, j] of edges) bond(depth, project, sites[i]!.v, sites[j]!.v, hair * 1.05, Math.min(1, seated[i]! * 1.5), 'ink', seated[j]!, 3)
    // The cell, ruled in dashes, once the cube is whole.
    if (!small) {
      const whole = span(Math.min(...seated), 0.6, 0.94)
      for (const [a, b] of BOX) partial(depth, project, corners[a]!, corners[b]!, hair * 0.8, 0.4 * whole, view)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Alternating crystal sites grow along a diagonal front and dissolve toward their seed. */
export function LoaderHalite(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
