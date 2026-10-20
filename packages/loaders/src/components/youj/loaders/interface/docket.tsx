'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'docket', title: 'Docket', category: 'interface', technique: 'planes',
  tags: ['report', 'pagination', 'document', 'layout', 'typesetting', 'assembly'],
  description: 'A report paginates into three leaves. Empty sheets fan out from a common spine, ruled sections flow onto each page in reading order, and a binding line closes only after the final page is set; the leaves then clear and collate again.',
  order: 26,
  colors: [{ part: 'Writing', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const corners: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])
const binding: [number, number, number][] = [[-34, -30, -8], [-11, -30, 1], [12, -30, 10], [32, -30, 10]]

export const scene: Scene = {
  beats: 6, still: 0.57,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.34, pitch: -0.28 }
    const project = camera({ ...pose, distance: 330, cx: view.w / 2 - 3, cy: 50 })
    const turn = orient(pose)
    for (let i = 0; i < 3; i++) {
      const open = clamp(view.ease.emphasized(span(t, 0.03 + i * 0.06, 0.22 + i * 0.06)) - view.ease.emphasized(span(t, 0.78 + (2 - i) * 0.035, 0.9 + (2 - i) * 0.035)))
      const x = mix(-9, -24 + i * 23, open)
      const z = mix(-7 + i * 3, -8 + i * 9, open)
      const angle = (-0.35 + i * 0.25) * open
      const cs = Math.cos(angle), sn = Math.sin(angle)
      const at = (u: number, v: number, out: typeof p) => project(x + u * cs, v, z - u * sn, out)
      for (let j = 0; j < 4; j++) {
        const u = j === 1 || j === 2 ? 10 : -10
        corners[j]![0] = x + u * cs; corners[j]![1] = j < 2 ? -27 : 27; corners[j]![2] = z - u * sn
      }
      const f = projectPath(corners, project, xy)
      depth.face(f.xy, f.z, lambert(...turn(sn, 0, cs)))
      depth.path(f.xy, f.z + 0.03, { width: hair * 0.8, alpha: 0.7, closed: true })
      const lines = small ? 3 : view.size < 80 ? 5 : 8
      for (let row = 0; row < lines; row++) {
        const from = 0.15 + i * 0.15 + row * 0.015
        const ink = clamp(view.ease.standard(span(t, from, from + 0.08)) * (1 - view.ease.exit(span(t, 0.73 + (2 - i) * 0.035, 0.81 + (2 - i) * 0.035))))
        if (ink <= 0.004) continue
        const yy = 17 - row * 34 / (lines - 1)
        const length = row === lines - 1 ? 7 : row % 3 === 1 ? 11 : 14
        at(-7, yy, p); at(-7 + length * ink, yy, q)
        // A line is written in its color and settles to the ink once it's whole.
        depth.path([p.x, p.y, q.x, q.y], f.z + 0.07, { width: hair * (row === 0 ? 1.5 : 0.8), alpha: row === 0 ? 0.8 : 0.54, tone: blend('c1', 'ink', span(t, from + 0.08, from + 0.2)) })
      }
      const seal = Math.sin(Math.PI * span(t, 0.25 + i * 0.15, 0.42 + i * 0.15)) ** 2
      // The header rule is ink at rest and takes the accent as the page is set: a crossfade, never a switch.
      at(-7, 22, p); at(7, 22, q)
      depth.path([p.x, p.y, q.x, q.y], f.z + 0.08, { width: hair, alpha: 0.2 * (1 - seal) })
      if (seal > 0.004) depth.path([p.x, p.y, q.x, q.y], f.z + 0.09, { width: hair, alpha: seal, tone: 'accent' })
      // Page gutters remain legible when the body simplifies to three rules.
      at(-7, -22, p); at(-3, -22, q)
      depth.path([p.x, p.y, q.x, q.y], f.z + 0.08, { width: hair * 0.6, alpha: 0.28 })
    }
    const bind = view.ease.standard(span(t, 0.6, 0.69)) * (1 - view.ease.exit(span(t, 0.72, 0.8)))
    const f = projectPath(binding, project, xy)
    depth.path(f.xy, f.z, { width: hair * 0.9, alpha: 0.7 * bind, join: 'miter' })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three leaves receive consecutive report sections and collate at a shared spine.
 *
 * Color: each line is written in `c1` and settles to the ink once it’s whole; the pages keep the ink, each header the accent as its page is set. */
export function LoaderDocket(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
