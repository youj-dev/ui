'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'extrude',
  title: 'Extrude',
  category: 'geometry',
  technique: 'planes',
  tags: ['isometric', 'columns', 'grid', 'ziggurat', 'build', 'blocks', 'bar chart'],
  description:
    'Tiles on an isometric floor extrude into columns in square rings from an accent seed, stepping up into a ziggurat, then settle back flat in the same order.',
  order: 4,
  colors: [{ part: 'Columns', mono: 'ink' }],
} satisfies LoaderMeta

/* The illustrations' boxes on their floor: a square grid of tiles, each an
 * IsoBox with the kit's three face tones and hairline edges, its two lit
 * edges brighter. The middle tile is the seed, its top in the accent. It
 * rises first, then each square ring around it, a ring lower than the one
 * inside, so the grid builds a stepped pyramid (`emphasized`, landing
 * precisely), holds, and lowers back in the same order: flat at both ends
 * of the loop. Near columns cover far ones in the painter's order.
 *
 * Color: a column’s edges warm toward `c1` while it stands raised,
 * the inner rings most, and cool as it lowers; the seed’s top stays the
 * accent. */

interface Column {
  x: number
  z: number
  ring: number
}

function grid(n: number, cell: number, gap: number): { cols: Column[]; side: number; rings: number; half: number } {
  const cols: Column[] = []
  const mid = (n - 1) / 2
  const pitch = cell + gap
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) cols.push({ x: (i - mid) * pitch, z: (j - mid) * pitch, ring: Math.max(Math.abs(i - mid), Math.abs(j - mid)) })
  }
  // Far to near: the eye looks from +x, +z.
  cols.sort((a, b) => a.x + a.z - (b.x + b.z))
  return { cols, side: cell / 2, rings: mid, half: mid * pitch + cell / 2 + gap * 1.4 }
}

const DETAIL = [
  { below: 32, ...grid(3, 15, 3.5) },
  { below: 80, ...grid(5, 9.6, 2.4) },
  { below: Infinity, ...grid(5, 9.6, 2.4) },
]

const LOW = 0.8
const PEAK = 24
const STEP = 0.075
const YAW = -Math.PI / 4
const PITCH = -0.6
const PLATE = 2.4

const depth = new Depth()
const corner = Array.from({ length: 7 }, () => point())
const mid = point()
const ring = (p: Projected[]) => p.flatMap((q) => [q.x, q.y])

export const scene: Scene = {
  beats: 5,
  still: 0.36,
  draw(pen, t, view) {
    const { cols, side, rings, half } = DETAIL.find((d) => view.size < d.below)!
    // A slow sway about the diagonal keeps the view alive through the holds; the eye stays on the +x, +z side.
    const yaw = YAW + 0.07 * Math.sin(TAU * t)
    const project = camera({ yaw, pitch: PITCH, distance: 420, cx: view.w / 2, cy: view.h * 0.58 })
    const turn = orient({ yaw, pitch: PITCH })
    const TOP = lambert(...turn(0, 1, 0))
    const LEFT = lambert(...turn(0, 0, 1))
    const RIGHT = lambert(...turn(1, 0, 0))
    const small = view.size < 32
    const hair = (small ? 1.1 : 1) / view.px

    // The floor: a thin plate under the grid, its corners marked.
    const [T, UR, LR, B, LL, UL, C] = corner as [Projected, Projected, Projected, Projected, Projected, Projected, Projected]
    project(-half, 0, -half, T)
    project(half, 0, -half, UR)
    project(half, -PLATE, -half, LR)
    project(half, -PLATE, half, B)
    project(-half, -PLATE, half, LL)
    project(-half, 0, half, UL)
    project(half, 0, half, C)
    depth.face(ring([UL, C, B, LL]), -1000, LEFT)
    depth.face(ring([C, UR, LR, B]), -1000, RIGHT)
    depth.face(ring([T, UR, C, UL]), -999, TOP)
    if (!small) {
      depth.path(ring([T, UR, LR, B, LL, UL]), -998, { width: hair, alpha: 0.55, closed: true, join: 'bevel' })
      depth.path([UL.x, UL.y, C.x, C.y, UR.x, UR.y], -998, { width: hair, alpha: 0.85, join: 'bevel' })
      depth.path([C.x, C.y, B.x, B.y], -998, { width: hair, alpha: 0.4 })
    }

    for (const c of cols) {
      // Each ring rises a beat after the one inside it, to a step lower; and lowers again in the same order.
      const delay = c.ring * STEP
      const up = view.ease.emphasized(span(t, 0.04 + delay, 0.3 + delay))
      const down = view.ease.emphasized(span(t, 0.54 + delay, 0.8 + delay))
      const peak = rings ? mix(PEAK, PEAK * 0.36, c.ring / rings) : PEAK
      const hgt = LOW + (peak - LOW) * (up - down)
      const x0 = c.x - side
      const x1 = c.x + side
      const z0 = c.z - side
      const z1 = c.z + side
      // T, UR, LR, B, LL, UL around the outline, then C, the near top corner.
      project(x0, hgt, z0, T)
      project(x1, hgt, z0, UR)
      project(x1, 0, z0, LR)
      project(x1, 0, z1, B)
      project(x0, 0, z1, LL)
      project(x0, hgt, z1, UL)
      project(x1, hgt, z1, C)
      // Each column at its own depth, so the order holds as the view sways.
      project(c.x, hgt / 2, c.z, mid)
      const z = mid.z
      const seed = c.ring === 0
      depth.face(ring([UL, C, B, LL]), z, LEFT)
      depth.face(ring([C, UR, LR, B]), z, RIGHT)
      depth.face(ring([T, UR, C, UL]), z, TOP, seed ? 'accent' : 'ink')
      // Hairline edges, the two lit ones brighter; below 32px the tones alone carry the boxes, and up to 80px
      // the edges stay light, so a grid of small tiles doesn't turn into a mesh of lines.
      if (small) continue
      const ink = view.size < 80 ? 0.6 : 1
      // A column's edges warm while it stands raised, the inner rings most.
      const warm = blend('ink', 'c1', 0.8 * (up - down) * (rings ? 1 - c.ring / (rings + 1) : 1))
      depth.path(ring([T, UR, LR, B, LL, UL]), z, { width: hair, alpha: 0.55 * ink, closed: true, join: 'miter', tone: warm })
      depth.path([C.x, C.y, B.x, B.y], z, { width: hair, alpha: 0.4 * ink })
      if (!seed) depth.path([UL.x, UL.y, C.x, C.y, UR.x, UR.y], z, { width: hair, alpha: 0.85 * ink, join: 'miter', tone: warm })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Isometric tiles extrude in square rings from an accent seed into a stepped pyramid, and settle flat. */
export function LoaderExtrude(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
