'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'carve', title: 'Carve', category: 'geometry', technique: 'planes',
  tags: ['boolean', 'difference', 'solid', 'modeling', 'construction', 'cutaway'],
  description: 'A Boolean corner subtraction advances through a square stock in two measured cuts. The remaining L-shaped solid exposes two new lit inner walls, a wire operand marks the removed volume, and witness dimensions track the opening before the stock restores itself.',
  order: 40,
  colors: [{ part: 'Operand', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const outline: V3[] = Array.from({ length: 6 }, () => [0, 0, 0])
const wall: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const operand: V3[] = Array.from({ length: 4 }, () => [0, 15, 0])
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 5.5, still: 0.5,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const pose = { yaw: -0.64 + 0.07 * Math.sin(TAU * t), pitch: -0.5 }
    const zoom = small ? 1.16 : 1.1
    const lens = camera({ ...pose, distance: 380, cx: view.w / 2, cy: 49 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient(pose)
    // The bed under the stock: its plan dashed, with registration ticks at its corners.
    if (!small) {
      const plan: [number, number][] = [[-29, -29], [29, -29], [29, 29], [-29, 29]]
      plan.forEach(([x0, z0], i) => {
        const [x1, z1] = plan[(i + 1) % 4]!
        project(x0, -13, z0, p)
        project(x1, -13, z1, q)
        depth.path([p.x, p.y, q.x, q.y], -100, { width: hair * 0.8, alpha: 0.24, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash) })
      })
    }
    const advance = clamp((view.ease.emphasized(span(t, 0.06, 0.3)) * 0.58 + view.ease.emphasized(span(t, 0.35, 0.53)) * 0.42) * (1 - view.ease.emphasized(span(t, 0.72, 0.94))))
    const cut = mix(25, -7, advance)
    for (let i = 0; i < outline.length; i++) {
      outline[i]![0] = i === 0 || i === 5 ? -25 : i === 1 || i === 2 ? 25 : cut
      outline[i]![1] = 13
      outline[i]![2] = i < 2 ? -25 : i < 4 ? cut : 25
    }
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i]!, b = outline[(i + 1) % outline.length]!
      const dx = b[0] - a[0], dz = b[2] - a[2]
      if (Math.hypot(dx, dz) < 0.001) continue
      const normal = turn(dz, 0, -dx)
      if (normal[2] <= 0) continue
      for (let j = 0; j < 4; j++) {
        const v = j === 0 || j === 3 ? a : b
        wall[j]![0] = v[0]; wall[j]![1] = j < 2 ? -13 : 13; wall[j]![2] = v[2]
      }
      const f = projectPath(wall, project, xy)
      depth.face(f.xy, f.z, lambert(...normal))
      // The cut's own walls come in with their width, so a wall just begun is not a line out of nowhere.
      const width = i === 2 || i === 3 ? clamp((25 - cut) / 2) : 1
      depth.path(f.xy, f.z + 0.03, { width: hair * 0.85, alpha: 0.78 * width, closed: true })
    }
    const top = projectPath(outline, project, xy)
    depth.face(top.xy, top.z, lambert(...turn(0, 1, 0)))
    depth.path(top.xy, top.z + 0.05, { width: hair * 0.95, alpha: 0.9, closed: true, join: 'miter' })
    if (advance > 0.002) {
      project(cut, 13.1, cut, p); project(cut + Math.min(7, 25 - cut), 13.1, cut, q)
      depth.path([p.x, p.y, q.x, q.y], top.z + 0.07, { width: hair * 1.3, alpha: advance * 0.85, tone: 'accent' })
    }
    // The operand is a removed volume: only its outer edges remain as a
    // ghost, so the concave inner walls have no transparent solid over them.
    if (!small && advance > 0.003) {
      const alpha = 0.3 * Math.sin(Math.PI * span(advance, 0, 1.15))
      for (let i = 0; i < 4; i++) {
        operand[i]![0] = i === 1 || i === 2 ? 25 : cut
        operand[i]![2] = i < 2 ? cut : 25
      }
      // Each edge fits its own dashes, so they don't crawl as the operand grows.
      projectPath(operand, project, xy)
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4
        const e = [xy[2 * i]!, xy[2 * i + 1]!, xy[2 * j]!, xy[2 * j + 1]!]
        depth.path(e, 90, { width: hair * 0.7, alpha, tone: 'c1', dash: fitDash(Math.hypot(e[2]! - e[0]!, e[3]! - e[1]!), dash * 0.8) })
      }
      for (const [x, z] of [[25, 25], [25, cut], [cut, 25]]) {
        project(x!, -13, z!, p); project(x!, 15, z!, q)
        depth.path([p.x, p.y, q.x, q.y], 89, { width: hair * 0.65, alpha, tone: 'c1', dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash * 0.8) })
      }
      project(cut, -16, 29, p); project(25, -16, 29, q)
      depth.line(p, q, hair * 0.7, alpha)
      for (const x of [cut, 25]) {
        project(x, -18, 29, p); project(x, -14, 29, q); depth.line(p, q, hair * 0.7, alpha)
      }
    }
    depth.flush(pen)
  },
}
/* Color: the wire operand, the volume being removed, is `c1`; the
 * solid stays lit ink and the cut line the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A measured Boolean subtraction reveals a stock's concave inner walls. */
export function LoaderCarve(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
