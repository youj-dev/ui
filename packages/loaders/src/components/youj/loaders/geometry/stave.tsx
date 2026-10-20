'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, hump, lambert, mix, orient, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'stave', title: 'Stave', category: 'geometry', technique: 'lines',
  tags: ['tensegrity', 'cables', 'prism', 'struts', 'tension', 'structure'],
  description: 'Three floating compression struts open a tensegrity prism. Triangular cable crowns countertwist as the structure lengthens, the diagonal stays remain taut, and a brief accent travels between the tensioned upper joints.',
  order: 26,
  colors: [{ part: 'Stays', mono: 'ink' }],
} satisfies LoaderMeta

/* A tensegrity prism: three struts that never touch one another, held
 * apart by cables alone. Each strut is a lit bar with a collar at either
 * end where its cables meet, in a ring; the cables are hairlines, the
 * crowns' triangles and the stays from one crown to the other. The crowns
 * countertwist as the prism lengthens and shortens (`standard`, once a
 * loop), every strut keeping its length, so the height follows from the
 * twist. A dashed plan on the ground marks where the bottom joints stand;
 * an accent runs round the top crown from joint to joint. The view sways.
 *
 * Color: the diagonal tension stays lean toward `c1`, set apart
 * from the ink crowns and struts; the travelling load stays the accent. */

const STRUT = 62
const RADIUS = 20

type V3 = [number, number, number]

const depth = new Depth()
const top: V3[] = Array.from({ length: 3 }, () => [0, 0, 0])
const bottom: V3[] = Array.from({ length: 3 }, () => [0, 0, 0])
const p = point()
const q = point()
const xy: number[] = []
const corners = Array.from({ length: 8 }, () => point())
/** A bar's faces in its own frame (u across, d along, v across): corner indices (bit 0 u, bit 1 d, bit 2 v) and normals. */
const FACES: [number[], number, number, number][] = [
  [[0, 1, 3, 2], 0, 0, -1],
  [[4, 6, 7, 5], 0, 0, 1],
  [[0, 4, 5, 1], 0, -1, 0],
  [[2, 3, 7, 6], 0, 1, 0],
  [[0, 2, 6, 4], -1, 0, 0],
  [[1, 5, 7, 3], 1, 0, 0],
]

export const scene: Scene = {
  beats: 5.75,
  still: 0.24,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const fine = view.size >= 64
    const hair = (small ? 1.1 : 1) / view.px
    const line = 1.3 / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const unfold = view.ease.standard(hump(t))
    const twist = 1.5 + 0.72 * unfold
    // Every strut keeps its length: its ends lie on opposite crowns, so the twist decides the height.
    const height = Math.sqrt(STRUT ** 2 - 2 * RADIUS ** 2 * (1 - Math.cos(twist + TAU / 3)))
    const pose = { yaw: -0.32 + 0.16 * Math.sin(TAU * t), pitch: -0.26 }
    const lens = camera({ ...pose, distance: 310, cx: view.w / 2, cy: view.h / 2 + 3 })
    const zoom = small ? 1.12 : 1.06
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient(pose)
    const shade = (z: number) => clamp(0.55 + z / 70, 0.3, 1)
    for (let i = 0; i < 3; i++) {
      const a = (TAU * i) / 3 - 0.4 - twist / 2
      const b = a + twist
      bottom[i]![0] = RADIUS * Math.cos(a)
      bottom[i]![1] = -height / 2
      bottom[i]![2] = RADIUS * Math.sin(a)
      top[i]![0] = RADIUS * Math.cos(b)
      top[i]![1] = height / 2
      top[i]![2] = RADIUS * Math.sin(b)
    }

    // The plan: the circle the bottom joints stand on, dashed, with a tick under each.
    if (!small) {
      const floor = -height / 2 - 5
      xy.length = 0
      for (let i = 0; i <= 40; i++) {
        project(RADIUS * Math.cos((TAU * i) / 40), floor, RADIUS * Math.sin((TAU * i) / 40), p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -500, { width: hair, alpha: 0.22, dash: [dash, dash * 0.9] })
      for (const v of bottom) {
        project(v[0], floor, v[2], p)
        project(v[0], v[1], v[2], q)
        depth.path([p.x, p.y, q.x, q.y], -499, { width: hair, alpha: 0.18, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash * 0.7) })
      }
    }

    // The cables: the crowns' triangles and the stays, hairlines fading with depth.
    for (let i = 0; i < 3; i++) {
      for (const crown of [top, bottom]) {
        project(...crown[i]!, p)
        project(...crown[(i + 1) % 3]!, q)
        depth.line(p, q, hair, 0.85 * shade((p.z + q.z) / 2))
      }
      project(...bottom[i]!, p)
      project(...top[i]!, q)
      depth.line(p, q, hair, 0.75 * shade((p.z + q.z) / 2), blend('ink', 'c1', 0.75))
    }

    // The struts: lit bars with a collar at either end; thick lines when small.
    for (let i = 0; i < 3; i++) {
      const a = bottom[i]!
      const b = top[(i + 1) % 3]!
      if (small) {
        project(...a, p)
        project(...b, q)
        depth.line(p, q, 2.2 / view.px, 0.95 * shade((p.z + q.z) / 2))
        continue
      }
      const d: V3 = [(b[0] - a[0]) / STRUT, (b[1] - a[1]) / STRUT, (b[2] - a[2]) / STRUT]
      const len = Math.hypot(d[0], d[2])
      const u: V3 = [d[2] / len, 0, -d[0] / len]
      const v: V3 = [d[1] * u[2], d[2] * u[0] - d[0] * u[2], -d[1] * u[0]]
      const bar = (from: number, to: number, w: number, edge: number) => {
        for (let j = 0; j < 8; j++) {
          const f = j & 2 ? to : from
          const su = j & 1 ? w : -w
          const sv = j & 4 ? w : -w
          project(a[0] + d[0] * f + su * u[0] + sv * v[0], a[1] + d[1] * f + su * u[1] + sv * v[1], a[2] + d[2] * f + su * u[2] + sv * v[2], corners[j]!)
        }
        for (const [ids, nu, nd, nv] of FACES) {
          const n = turn(u[0] * nu + d[0] * nd + v[0] * nv, u[1] * nu + d[1] * nd + v[1] * nv, u[2] * nu + d[2] * nd + v[2] * nv)
          if (n[2] <= 0) continue
          xy.length = 0
          let z = 0
          for (const j of ids) {
            xy.push(corners[j]!.x, corners[j]!.y)
            z += corners[j]!.z / 4
          }
          depth.face(xy, z, lambert(...n))
          if (edge > 0) depth.path(xy, z + 0.001, { width: hair, alpha: edge, closed: true, join: 'miter' })
        }
      }
      bar(2.6, STRUT - 2.6, 1.1, 0)
      bar(0, 3, 1.9, 0.45)
      bar(STRUT - 3, STRUT, 1.9, 0.45)
    }

    // The joints: a ring where each strut's end takes its cables.
    if (!small) {
      for (const crown of [top, bottom]) {
        for (const v of crown) {
          project(...v, p)
          const r = (fine ? 2.3 : 1.7) / view.px
          xy.length = 0
          for (let k = 0; k < 12; k++) xy.push(p.x + r * Math.cos((TAU * k) / 12), p.y + r * Math.sin((TAU * k) / 12))
          depth.path(xy, p.z + 3, { width: hair, alpha: 0.8 * shade(p.z), closed: true })
        }
      }
    }

    // The accent: a short run of light hopping round the top crown from joint to joint, a joint a third of the loop.
    const leg = Math.min(2, Math.floor(t * 3))
    const local = t * 3 - leg
    const at = view.ease.standard(local)
    const from = top[leg]!
    const to = top[(leg + 1) % 3]!
    const lo = clamp(at - 0.18)
    const hi = clamp(at + 0.18)
    project(mix(from[0], to[0], lo), mix(from[1], to[1], lo), mix(from[2], to[2], lo), p)
    project(mix(from[0], to[0], hi), mix(from[1], to[1], hi), mix(from[2], to[2], hi), q)
    depth.line(p, q, line * 1.1, Math.sin(Math.PI * local) ** 0.7, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Floating struts and taut triangular cable crowns open a tensegrity prism. */
export function LoaderStave(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
