'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'newel', title: 'Newel', category: 'geometry', technique: 'planes',
  tags: ['stair', 'spiral', 'architecture', 'helix', 'treads', 'balustrade'],
  description: 'Cantilevered treads swing out around a slender central newel, ascending into a spiral stair. Each lit wedge seats before its outer handrail grows to meet the next; a brief accent nosing reaches the landing and the stair folds back into its core.',
  order: 36,
  colors: [{ part: 'Handrail', mono: 'ink' }],
} satisfies LoaderMeta

/* A spiral stair as an architect draws it: the newel on its plinth, capped,
 * standing on the stair's dashed plan (the circle it turns in and a line
 * for every tread). The treads, wedges lit by where they face, slide out
 * of the newel one after another from the bottom (`emphasized`), each
 * landing before its baluster rises and its length of handrail runs on to
 * meet the one below; an accent nosing climbs to the landing at the top.
 * Then they fold back into the newel from the top down. The plan stays, so
 * the stair is never just a post; the view sways throughout.
 *
 * Color: the handrail is `c1`, each length running back to the one
 * below; treads and newel stay ink, and the tread nosing the accent. */

const R0 = 3 // the newel's radius
const R1 = 26 // the treads' outer radius
const LOW = -25
const HIGH = 22
const TURN = 0.84
const START = -0.9
const RISE = 7.5 // baluster height

/** A box's faces as corner indices (bit 0 outward, bit 1 forward, bit 2 down) and their normals in the tread's own frame (radial, up, tangential). */
const FACES: [number[], number, number, number][] = [
  [[0, 1, 3, 2], 0, 1, 0],
  [[4, 6, 7, 5], 0, -1, 0],
  [[0, 4, 5, 1], 0, 0, -1],
  [[2, 3, 7, 6], 0, 0, 1],
  [[1, 5, 7, 3], 1, 0, 0],
]
/** The post's faces: the tread's five and its inner end. */
const POST: [number[], number, number, number][] = [...FACES, [[0, 2, 6, 4], -1, 0, 0]]

const depth = new Depth()
const C = Array.from({ length: 8 }, () => point())
const p = point()
const q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.47,
  draw(pen, t, view) {
    const small = view.size < 32
    const count = small ? 7 : 11
    const hair = (small ? 1.1 : 1) / view.px
    const line = 1.3 / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const yaw = -0.35 + 0.09 * Math.sin(TAU * t)
    const pose = { yaw, pitch: -0.36 }
    const lens = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h / 2 + 1 })
    const zoom = small ? 1.16 : 1.1
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y + 1) * zoom, z * zoom, out)
    const turn = orient(pose)
    const step = (HIGH - LOW) / (count - 1)

    // The plan on the floor: the circle the stair turns in and a dashed line under every tread.
    const floor = LOW - 4
    if (!small) {
      xy.length = 0
      for (let i = 0; i <= 48; i++) {
        const a = (TAU * i) / 48
        project(R1 * Math.cos(a), floor, R1 * Math.sin(a), p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -500, { width: hair, alpha: 0.22, dash: [dash, dash * 0.9] })
      for (let i = 0; i < count; i++) {
        const angle = START + TAU * TURN * (i / (count - 1))
        project(R0 * Math.cos(angle), floor, R0 * Math.sin(angle), p)
        project(R1 * Math.cos(angle), floor, R1 * Math.sin(angle), q)
        depth.path([p.x, p.y, q.x, q.y], -500, { width: hair, alpha: 0.22, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash * 0.8) })
      }
    }

    // The newel: a square post on a plinth, with a cap; lit like the treads.
    const post = (half: number, y0: number, y1: number, key = 0) => {
      for (let i = 0; i < 8; i++) project(i & 1 ? half : -half, i & 4 ? y0 : y1, i & 2 ? half : -half, C[i]!)
      for (const [ids, nx, ny, nz] of POST) {
        // In the post's frame: radial is x, tangential is z.
        const v = turn(nx, ny, nz)
        if (v[2] <= 0.001) continue
        xy.length = 0
        let z = 0
        for (const i of ids) {
          xy.push(C[i]!.x, C[i]!.y)
          z += C[i]!.z / 4
        }
        depth.face(xy, z + key, lambert(v[0], v[1], v[2]))
        depth.path(xy, z + key + 0.001, { width: hair, alpha: 0.45, closed: true, join: 'miter' })
      }
    }
    post(1.5, LOW - 4, HIGH + 7.5)
    post(3.2, LOW - 4, LOW - 2.2, 0.01)
    post(2.2, HIGH + 7.5, HIGH + 8.9, 0.01)

    // The landing at the top: a plate past the last tread, the accent nosing's goal.
    const landing = START + TAU * TURN + 0.42
    let previousRail: [number, number, number] | null = null
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1)
      const deploy = view.ease.emphasized(span(t, 0.02 + 0.34 * u, 0.2 + 0.34 * u))
      const retract = view.ease.emphasized(span(t, 0.62 + 0.18 * (1 - u), 0.8 + 0.18 * (1 - u)))
      const k = deploy * (1 - retract)
      const angle = START + TAU * TURN * u
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      const y = LOW + step * i
      if (k < 0.002) {
        previousRail = null
        continue
      }
      // A wedge: narrow at the newel, wide at its outer end, sliding out of the post.
      const r1 = R0 + (R1 - R0) * k
      const wIn = 1.4
      const wOut = mix(wIn, small ? 5.6 : 4.8, k)
      for (let j = 0; j < 8; j++) {
        const r = j & 1 ? r1 : R0
        const w = (j & 1 ? wOut : wIn) * (j & 2 ? 1 : -1)
        project(r * c - w * s, y - (j & 4 ? 1.6 : 0), r * s + w * c, C[j]!)
      }
      for (const [ids, nr, ny, nt] of FACES) {
        // The faces' normals carried from the tread's frame (radial, up, tangential) into the world.
        const n = turn(nr * c - nt * s, ny, nr * s + nt * c)
        if (n[2] <= 0) continue
        xy.length = 0
        let z = 0
        for (const j of ids) {
          xy.push(C[j]!.x, C[j]!.y)
          z += C[j]!.z / 4
        }
        depth.face(xy, z, lambert(n[0], n[1], n[2]))
      }
      const grown = clamp(k / 0.1)
      // The nosing (the leading edge) heavier, the outer end and the back edge in hairlines.
      depth.line(C[0]!, C[1]!, line, 0.85 * grown)
      depth.line(C[1]!, C[3]!, hair, 0.6 * grown)
      depth.line(C[3]!, C[2]!, hair, 0.45 * grown)
      // The accent nosing, climbing the stair as it builds.
      const pulse = Math.sin(Math.PI * span(t, 0.19 + 0.34 * u, 0.27 + 0.34 * u)) ** 2
      if (pulse > 0.005) depth.line(C[0]!, C[1]!, line * 1.15, pulse * k, 'accent')

      // The baluster rises once the tread has landed; then its length of handrail runs back to the one below.
      const rail = view.ease.enter(span(k, 0.5, 1))
      if (rail > 0.002) {
        project(r1 * c, y, r1 * s, p)
        project(r1 * c, y + RISE * rail, r1 * s, q)
        depth.line(p, q, hair, 0.7 * rail)
        if (previousRail) {
          const [pa, py, pr] = previousRail
          xy.length = 0
          let z = 0
          const steps = small ? 4 : 8
          const top = y + RISE * rail
          for (let j = 0; j <= steps; j++) {
            const f = (j / steps) * rail
            const a = angle + (pa - angle) * f
            const rr = mix(r1, pr, f)
            project(rr * Math.cos(a), mix(top, py, f), rr * Math.sin(a), p)
            xy.push(p.x, p.y)
            z += p.z / (steps + 1)
          }
          depth.path(xy, z, { width: line, alpha: 0.75 * rail, join: 'round', cap: 'round', tone: 'c1' })
        }
        previousRail = [angle, y + RISE * rail, r1]
      } else previousRail = null
    }

    // The landing: a square plate fixed to the newel's head, always there; it catches the accent last.
    if (!small) {
      const c = Math.cos(landing)
      const s = Math.sin(landing)
      const y = HIGH + step
      for (let j = 0; j < 8; j++) {
        const r = j & 1 ? R1 * 0.62 : R0
        const w = (j & 2 ? 1 : -1) * 5.4
        project(r * c - w * s, y - (j & 4 ? 1.6 : 0), r * s + w * c, C[j]!)
      }
      for (const [ids, nr, ny, nt] of FACES) {
        const n = turn(nr * c - nt * s, ny, nr * s + nt * c)
        if (n[2] <= 0) continue
        xy.length = 0
        let z = 0
        for (const j of ids) {
          xy.push(C[j]!.x, C[j]!.y)
          z += C[j]!.z / 4
        }
        depth.face(xy, z, lambert(n[0], n[1], n[2]))
        depth.path(xy, z + 0.001, { width: hair, alpha: 0.5, closed: true, join: 'miter' })
      }
      const glint = Math.sin(Math.PI * span(t, 0.56, 0.66)) ** 2
      if (glint > 0.005) depth.line(C[0]!, C[1]!, line * 1.15, glint, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Radial stair treads seat in height order and grow an outer spiral handrail. */
export function LoaderNewel(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
