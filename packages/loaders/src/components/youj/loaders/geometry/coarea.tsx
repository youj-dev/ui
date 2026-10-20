'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'coarea', title: 'Coarea', category: 'geometry', technique: 'mixed',
  tags: ['volume', 'isosurface', 'marching tetrahedra', 'meshing', 'samples', 'reconstruction'],
  description: 'Eight volume cells extract a common level surface from sampled scalar values. Interpolated tetrahedral sections register into one lit faceted body, the active cell exposes its crossing edges, and the surface releases in reverse cell order.',
  order: 51,
  colors: [{ part: 'Crossing', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
interface Patch { corners: V3[]; normal: V3; center: V3; cell: number }
const TETRAHEDRA = [[0, 1, 3, 7], [0, 3, 2, 7], [0, 2, 6, 7], [0, 6, 4, 7], [0, 4, 5, 7], [0, 5, 1, 7]] as const
const TET_EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as const
const CELLS: V3[][] = []
const PATCHES: Patch[] = []
// Visit opposing octants in pairs so lit and hidden sections develop
// together; no long wait for the whole rear hemisphere to finish first.
const CELL_ORDER = [0, 7, 1, 6, 2, 5, 3, 4] as const
const CELL_RANK = Array.from({ length: 8 }, (_, cell) => CELL_ORDER.findIndex((id) => id === cell))
const CAGE: [V3, V3][] = []
const AXES: [V3, V3][] = [[[-28, 0, 0], [28, 0, 0]], [[0, -28, 0], [0, 28, 0]], [[0, 0, -28], [0, 0, 28]]]
for (let axis = 0; axis < 3; axis++) for (const a of [-28, 28]) for (const b of [-28, 28]) {
  CAGE.push(axis === 0 ? [[-28, a, b], [28, a, b]] : axis === 1 ? [[a, -28, b], [a, 28, b]] : [[a, b, -28], [a, b, 28]])
}
const field = ([x, y, z]: V3) => (x / 26) ** 2 + (y / 24) ** 2 + (z / 22) ** 2

// Conforming tetrahedra share the same body diagonal in all eight cells.
// Extract once: shared sample edges produce identical surface vertices.
for (let cell = 0; cell < 8; cell++) {
  const corners: V3[] = []
  const x0 = cell & 1 ? 0 : -28, y0 = cell & 2 ? 0 : -28, z0 = cell & 4 ? 0 : -28
  for (let i = 0; i < 8; i++) corners.push([x0 + (i & 1 ? 28 : 0), y0 + (i & 2 ? 28 : 0), z0 + (i & 4 ? 28 : 0)])
  CELLS.push(corners)
  const values = corners.map(field)
  for (const tetra of TETRAHEDRA) {
    const cut: V3[] = []
    for (const [a, b] of TET_EDGES) {
      const ia = tetra[a], ib = tetra[b]
      const va = values[ia]!, vb = values[ib]!
      if ((va - 1) * (vb - 1) >= 0) continue
      const A = corners[ia]!, B = corners[ib]!
      const u = (1 - va) / (vb - va)
      cut.push([mix(A[0], B[0], u), mix(A[1], B[1], u), mix(A[2], B[2], u)])
    }
    if (cut.length < 3) continue
    const center: V3 = [0, 0, 0]
    for (const c of cut) for (let j = 0; j < 3; j++) center[j]! += c[j]! / cut.length
    const A = cut[0]!, B = cut[1]!, C = cut[2]!
    const u: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
    const v: V3 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]
    const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const sign = n[0] * center[0] + n[1] * center[1] + n[2] * center[2] < 0 ? -1 : 1
    const length = Math.hypot(...n)
    for (let j = 0; j < 3; j++) n[j] = n[j]! * sign / length
    const ul = Math.hypot(...u)
    for (let j = 0; j < 3; j++) u[j] = u[j]! / ul
    const axis: V3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]]
    const angle = (c: V3) => Math.atan2(
      (c[0] - center[0]) * axis[0] + (c[1] - center[1]) * axis[1] + (c[2] - center[2]) * axis[2],
      (c[0] - center[0]) * u[0] + (c[1] - center[1]) * u[1] + (c[2] - center[2]) * u[2],
    )
    cut.sort((a, b) => angle(a) - angle(b))
    PATCHES.push({ corners: cut, normal: n, center, cell })
  }
}
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.52,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1 : 1.05) / view.px
    const pose = { yaw: -0.47, pitch: -0.4 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 50 })
    const turn = orient(pose)
    const ready = (cell: number) => {
      const rank = CELL_RANK[cell]!
      return clamp(view.ease.emphasized(span(t, 0.035 + rank * 0.065, 0.15 + rank * 0.065))) *
        (1 - clamp(view.ease.standard(span(t, 0.73 + (7 - rank) * 0.025, 0.825 + (7 - rank) * 0.025))))
    }

    // The permanent volume cage has its true depth, so the reconstructed
    // body's near facets hide the rear sample lines in both renderers.
    for (const [A, B] of CAGE) {
      project(...A, p); project(...B, q)
      depth.line(p, q, hair * 0.7, clamp(0.25 + (p.z + q.z) / 380, 0.12, 0.45))
    }
    if (!small) for (const [A, B] of AXES) {
      project(...A, p); project(...B, q)
      depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.65, alpha: 0.18, dash: [2 * hair, 3 * hair] })
    }

    for (const patch of PATCHES) {
      const k = ready(patch.cell)
      if (k < 0.003) continue
      const n = turn(...patch.normal)
      xy.length = 0
      let z = 0
      // A cut arrives along its normal and closes its shared edges exactly.
      for (const v of patch.corners) {
        project(
          mix(patch.center[0], v[0], k) + patch.normal[0] * (1 - k) * 6,
          mix(patch.center[1], v[1], k) + patch.normal[1] * (1 - k) * 6,
          mix(patch.center[2], v[2], k) + patch.normal[2] * (1 - k) * 6, p,
        )
        xy.push(p.x, p.y); z += p.z / patch.corners.length
      }
      if (n[2] > 0) depth.face(xy, z, lambert(...n))
      if (!small || n[2] <= 0 || k < 0.98) depth.path(xy, z + 0.025, { width: hair * (small ? 0.7 : 0.55), alpha: (n[2] > 0 ? 0.52 : 0.2) * k, closed: true })
    }

    // An L-shaped read bracket singles out the current cell, rather than
    // sweeping a flat plane through the whole volume.
    const scan = span(t, 0.035, 0.555) * 8
    const rank = Math.min(7, Math.floor(scan))
    const cell = CELL_ORDER[rank]!
    const pulse = Math.sin(Math.PI * clamp(scan - rank)) ** 2
    if (pulse > 0.003) {
      const box = CELLS[cell]!
      const A = box[7]!, B = box[6]!, C = box[5]!
      project(...A, p); project(...B, q)
      depth.line(p, q, hair * 1.25, pulse * 0.95, 'accent')
      project(...C, q)
      depth.line(p, q, hair * 0.8, pulse * 0.65, 'c1')
    }
    depth.flush(pen)
  },
}

/* Color: the active cell’s second crossing edge flashes in `c1`
 * beside the accent one as each cell is sampled. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Interpolated tetrahedral sections assemble a level surface inside a volume cage. */
export function LoaderCoarea(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
