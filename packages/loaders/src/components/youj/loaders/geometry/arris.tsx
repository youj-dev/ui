'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'arris', title: 'Arris', category: 'geometry', technique: 'planes',
  tags: ['fabrication', 'bevel', 'chamfer', 'finishing', 'solid', 'edges'],
  description: 'Three finishing passes chamfer the three edge families of a solid blank. Every new bevel is the exact intersection of its cutting plane with the remaining stock; short witness strokes inspect the fresh facets before the edge families restore in reverse order.',
  order: 55,
  colors: [{ part: 'Witness', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const H = 22
const corners: V3[] = Array.from({ length: 8 }, (_, i) => [i & 1 ? H : -H, i & 2 ? H : -H, i & 4 ? H : -H])
const BASE = [
  { ids: [2, 3, 7, 6], n: [0, 1, 0] }, { ids: [0, 4, 5, 1], n: [0, -1, 0] },
  { ids: [4, 5, 7, 6], n: [0, 0, 1] }, { ids: [0, 2, 3, 1], n: [0, 0, -1] },
  { ids: [1, 3, 7, 5], n: [1, 0, 0] }, { ids: [0, 4, 6, 2], n: [-1, 0, 0] },
] as const
const CUTS = [0, 1, 2].flatMap((group) => [-1, 1].flatMap((s) => [-1, 1].map((r) => ({
  group, n: (group === 0 ? [s, r, 0] : group === 1 ? [s, 0, r] : [0, s, r]) as V3,
}))))
// Convex clipping uses fixed scratch storage. No mesh objects are allocated
// per frame; each plane contributes at most one new convex cap.
const faces = Array.from({ length: 18 }, () => ({ xyz: [] as number[], n: [0, 0, 0] as V3, group: -1 }))
const scratch: number[] = []
const cap: V3[] = Array.from({ length: 32 }, () => [0, 0, 0])
const order: number[] = []
const xy: number[] = []
const cuts = new Float64Array(3)
const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 6, still: 0.52,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.57, pitch: -0.48 }
    const project = camera({ ...pose, distance: 380, cx: 50, cy: 52 })
    const turn = orient(pose)
    for (let group = 0; group < 3; group++) cuts[group] = 6.5 * view.ease.standard(span(t, 0.05 + group * 0.16, 0.21 + group * 0.16)) * (1 - view.ease.standard(span(t, 0.72 + (2 - group) * 0.07, 0.85 + (2 - group) * 0.07)))
    for (let i = 0; i < BASE.length; i++) {
      const base = BASE[i]!, face = faces[i]!
      face.xyz.length = 0; face.group = -1
      for (let k = 0; k < 3; k++) face.n[k] = base.n[k]!
      for (const id of base.ids) face.xyz.push(...corners[id]!)
    }
    let count = 6
    for (const cut of CUTS) {
      const bevel = cuts[cut.group]!
      if (bevel < 0.001) continue
      const n = cut.n, limit = 2 * H - bevel
      let capCount = 0
      for (let f = 0; f < count; f++) {
        const face = faces[f]!, v = face.xyz
        scratch.length = 0
        for (let i = 0; i < v.length; i += 3) {
          const j = (i + 3) % v.length
          const da = n[0] * v[i]! + n[1] * v[i + 1]! + n[2] * v[i + 2]! - limit
          const db = n[0] * v[j]! + n[1] * v[j + 1]! + n[2] * v[j + 2]! - limit
          if (da <= 0) scratch.push(v[i]!, v[i + 1]!, v[i + 2]!)
          if ((da <= 0) === (db <= 0)) continue
          const u = da / (da - db), x = mix(v[i]!, v[j]!, u), y = mix(v[i + 1]!, v[j + 1]!, u), z = mix(v[i + 2]!, v[j + 2]!, u)
          scratch.push(x, y, z)
          let duplicate = false
          for (let k = 0; k < capCount; k++) { const c = cap[k]!; if (Math.hypot(c[0] - x, c[1] - y, c[2] - z) < 0.00001) { duplicate = true; break } }
          if (!duplicate) { const c = cap[capCount++]!; c[0] = x; c[1] = y; c[2] = z }
        }
        v.length = 0
        if (scratch.length >= 9) for (const value of scratch) v.push(value)
      }
      if (capCount < 3) continue
      let cx = 0, cy = 0, cz = 0
      order.length = 0
      for (let i = 0; i < capCount; i++) { const c = cap[i]!; cx += c[0] / capCount; cy += c[1] / capCount; cz += c[2] / capCount; order.push(i) }
      const ux = n[0] === 0 ? 1 : 0, uy = n[1] === 0 ? 1 : 0, uz = n[2] === 0 ? 1 : 0
      const vx = n[1] * uz - n[2] * uy, vy = n[2] * ux - n[0] * uz, vz = n[0] * uy - n[1] * ux
      const angle = (i: number) => { const c = cap[i]!, x = c[0] - cx, y = c[1] - cy, z = c[2] - cz; return Math.atan2(x * vx + y * vy + z * vz, x * ux + y * uy + z * uz) }
      order.sort((a, b) => angle(a) - angle(b))
      const face = faces[count++]!
      face.xyz.length = 0; face.group = cut.group
      face.n[0] = n[0]; face.n[1] = n[1]; face.n[2] = n[2]
      for (const i of order) face.xyz.push(...cap[i]!)
    }
    for (let i = 0; i < count; i++) {
      const face = faces[i]!, normal = turn(...face.n)
      if (normal[2] <= 0 || face.xyz.length < 9) continue
      xy.length = 0; let z = 0
      for (let j = 0; j < face.xyz.length; j += 3) { project(face.xyz[j]!, face.xyz[j + 1]!, face.xyz[j + 2]!, p); xy.push(p.x, p.y); z += p.z / (face.xyz.length / 3) }
      depth.face(xy, z, lambert(...normal))
      const inspect = span(t, 0.15 + face.group * 0.16, 0.31 + face.group * 0.16)
      const alpha = Math.sin(Math.PI * inspect)
      // A fresh bevel's outline warms toward the witness color while it's inspected.
      const fresh = face.group >= 0 && face.group < 2 ? blend('ink', 'c1', 0.9 * alpha) : 'ink'
      depth.path(xy, z + 0.03, { width: hair * (small ? 0.7 : 0.85), alpha: clamp(0.58 + z / 180, 0.35, 0.8), closed: true, tone: fresh })
      if (face.group < 0 || small) continue
      if (alpha < 0.002) continue
      // A short witness advances along one fresh facet edge, not over
      // unrelated stock. Only the nearest edge family carries the accent.
      const v = face.xyz, at = view.ease.standard(inspect)
      project(mix(v[0]!, v[3]!, clamp(at - 0.18)), mix(v[1]!, v[4]!, clamp(at - 0.18)), mix(v[2]!, v[5]!, clamp(at - 0.18)), p)
      project(mix(v[0]!, v[3]!, at), mix(v[1]!, v[4]!, at), mix(v[2]!, v[5]!, at), q)
      depth.path([p.x, p.y, q.x, q.y], z + 0.05, { width: hair * 1.4, alpha: alpha * 0.85, tone: face.group === 2 ? 'accent' : 'c1' })
    }
    depth.flush(pen)
  },
}
/* Color: while the first two bevels are inspected, their outlines warm
 * toward `c1` and their witness strokes are drawn in it; the last
 * stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three families of cutting planes finish a blank's edges. */
export function LoaderArris(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
