'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, hump, lambert, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'flux', title: 'Flux', category: 'signal', technique: 'lines',
  tags: ['magnetic', 'field', 'dipole', 'poles', 'force', '3d'],
  description: 'A cage of field lines connects two opposed pole pieces. As the poles separate, the returning arches expand in six depth planes; short travelling strokes follow the field while one near arc briefly takes the accent.',
  order: 17,
  colors: [{ part: 'Field strokes', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const corners = Array.from({ length: 8 }, () => point())
const faces = [
  { ids: [0, 2, 3, 1], normal: [0, 0, -1] },
  { ids: [4, 5, 7, 6], normal: [0, 0, 1] },
  { ids: [0, 1, 5, 4], normal: [0, -1, 0] },
  { ids: [2, 6, 7, 3], normal: [0, 1, 0] },
  { ids: [0, 4, 6, 2], normal: [-1, 0, 0] },
  { ids: [1, 3, 7, 5], normal: [1, 0, 0] },
]

/* Color: the short strokes travelling the field lines are `c1`;
 * the cage of lines and the poles stay the ink, one stroke the accent. */

export const scene: Scene = {
  beats: 5,
  still: 0.38,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1 : 0.95) / view.px
    const planes = small ? 4 : 6
    const shells = view.size < 80 ? 1 : 2
    const samples = small ? 22 : 28
    const breathe = view.ease.standard(hump(t))
    const gap = 16 + 7 * breathe
    const pose = { yaw: -0.24, pitch: -0.3 }
    const lens = camera({ ...pose, distance: 280, cx: view.w / 2, cy: view.h / 2 })
    // A fifth larger than its construction, so the cage fills the frame.
    const project = (x: number, y: number, z: number, out: typeof p) => lens(x * 1.2, y * 1.2, z * 1.2, out)
    const turn = orient(pose)
    const field = (u: number, angle: number, shell: number, out = p) => {
      const bulge = (19 + 7 * breathe + 7 * shell) * Math.sin(Math.PI * u)
      return project(-gap + 2 * gap * u, bulge * Math.cos(angle), bulge * Math.sin(angle), out)
    }
    for (let shell = 0; shell < shells; shell++) for (let plane = 0; plane < planes; plane++) {
      const angle = TAU * plane / planes + 0.3
      for (let j = 0; j < samples; j++) {
        field(j / samples, angle, shell, p)
        field((j + 1) / samples, angle, shell, q)
        depth.line(p, q, hair * (p.k + q.k) / 2, clamp(0.55 + (p.z + q.z) / 120, 0.18, 0.86))
      }
      const phase = (t * 2 + plane / planes + shell * 0.5) % 1
      const travel = view.ease.standard(phase)
      const show = span(phase, 0, 0.12) * (1 - span(phase, 0.86, 1))
      xy.length = 0
      let z = 0
      for (let j = 0; j <= 6; j++) {
        const u = clamp(travel - 0.07 + j * 0.07 / 6)
        field(u, angle, shell, p)
        xy.push(p.x, p.y)
        z += p.z / 7
      }
      depth.path(xy, z + 0.02, { width: hair * 1.35, alpha: show * 0.92, tone: plane === 0 && shell === 0 ? 'accent' : 'c1', cap: 'round', join: 'round' })
    }
    // Flat-lit pole pieces occlude the converging lines at their mouths.
    for (const sign of [-1, 1]) {
      const x = sign * (gap + 3)
      for (let j = 0; j < 8; j++) project(x + (j & 1 ? 3 : -3), j & 2 ? 5 : -5, j & 4 ? 5 : -5, corners[j]!)
      for (const face of faces) {
        const normal = turn(face.normal[0]!, face.normal[1]!, face.normal[2]!)
        if (normal[2] <= 0) continue
        xy.length = 0
        let z = 0
        for (const j of face.ids) {
          xy.push(corners[j]!.x, corners[j]!.y)
          z += corners[j]!.z / 4
        }
        depth.face(xy, z, lambert(...normal))
        depth.path(xy, z + 0.01, { width: hair * 0.75, alpha: 0.68, closed: true })
      }
      if (!small) {
        project(x - 1.5, 0, 5.1, p)
        project(x + 1.5, 0, 5.1, q)
        depth.line(p, q, hair * 0.8, 0.75)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Opposed poles breathe apart inside a depth-sorted cage of travelling magnetic field lines. */
export function LoaderFlux(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
