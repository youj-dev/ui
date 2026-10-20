'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, point, span, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { brightness, detail, edge, hairline, panel, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'fletch',
  title: 'Fletch',
  category: 'waves',
  technique: 'lines',
  tags: ['mach', 'shock-cone', 'supersonic', 'wavefront', 'envelope', '3d'],
  description: 'A finned dart outruns the spherical fronts it emits. Each front drifts back and swells, its ring of contact sliding along the trailing Mach cone; bright tangent rails reveal the common envelope while the ground scale streams past beneath.',
  order: 6,
  colors: [{ part: 'Contact rings', mono: 'ink' }],
} satisfies LoaderMeta

/* The view rides with the dart, so it never leaves: what moves is the air
 * and the ground. The dart emits a spherical front six times a loop; each
 * one drifts back at the dart's speed and grows at the speed of sound (a
 * Mach number of 2.4), so all of them stay tangent to one cone, and the
 * circle where each touches it slides back along the cone as the front
 * ages and fades. The cone's tangent rails stay put, the accent one on top.
 * Beneath, a graduated ground rule streams back at the same speed, one
 * tick spacing per emission, and the dart rolls a quarter turn a loop on
 * its four fins.
 *
 * Color: each front’s ring of contact sliding along the Mach cone is `c1`; the fronts and the dart stay the ink, one cone line the accent. */

const MACH = 2.4
const SIN = 1 / MACH
const COS = Math.sqrt(1 - SIN * SIN)
const TAN = SIN / COS
const TIP = 27
/** How far a front drifts behind the tip in its one-loop life. */
const TRAIL = 55
const FRONTS = 6
const ring = Array.from({ length: 41 }, () => [0, 0, 0] as V3)
const cone = Array.from({ length: 33 }, () => [0, 0, 0] as V3)
const facet = Array.from({ length: 4 }, () => [0, 0, 0] as V3)
const fin = Array.from({ length: 3 }, () => [0, 0, 0] as V3)
const p = point()
const xy: number[] = []
const depth = new Depth()

/** The dart along +x: nose cone to the shoulder, the body back to the tail, its radius. */
const NOSE = 8.5
const BODY = 9
const R = 1.9

export const scene: Scene = {
  beats: 5,
  still: 0.52,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const hair = hairline(view)
    const yaw = -0.4 + 0.07 * Math.sin(TAU * u)
    const pitch = -0.3
    const cam = camera({ yaw, pitch, distance: 280, cx: view.w / 2 + 1, cy: 50 })
    const project: Project = (x, y, z, out) => cam(x * 0.92, y * 0.92, z * 0.92, out)
    const turn = orient({ yaw, pitch })

    // The ground rule streaming back beneath: one tick spacing per emission, so the loop has no seam.
    const spacing = TRAIL / FRONTS
    const shift = (TRAIL * u) % spacing
    edge(depth, project, [-32, -22, -10], [32, -22, -10], hair * 0.8, 0.42)
    for (let i = -6; i <= 6; i++) {
      const x = i * spacing - shift
      const show = clamp((32 - Math.abs(x)) / 5)
      if (show <= 0) continue
      edge(depth, project, [x, -22, -10], [x, -22 + (i % 2 ? 1.6 : 3), -10], hair * 0.85, 0.55 * show)
      if (lod === 2) edge(depth, project, [x + spacing / 2, -22, -10], [x + spacing / 2, -21.1, -10], hair * 0.7, 0.35 * clamp((32 - Math.abs(x + spacing / 2)) / 5))
    }

    // The cone: its tangent rails from the tip, and a section ring at its open end.
    const rails = lod === 0 ? 4 : 6
    for (let j = 0; j < rails; j++) {
      const a = (TAU * j) / rails + Math.PI / rails
      edge(depth, project, [TIP, 0, 0], [TIP - TRAIL, TRAIL * TAN * Math.cos(a), TRAIL * TAN * Math.sin(a)], hair * (j === 0 ? 1.35 : 0.9), j === 0 ? 0.95 : 0.6, j === 0 ? 'accent' : 'ink')
    }
    if (lod > 0) {
      for (let i = 0; i <= 32; i++) {
        const a = (TAU * i) / 32
        const v = cone[i]!
        v[0] = TIP - TRAIL
        v[1] = TRAIL * TAN * Math.cos(a)
        v[2] = TRAIL * TAN * Math.sin(a)
      }
      wire(depth, project, cone, hair * 0.75, 0.32, 'ink', 4, [2.5 * hair, 2 * hair])
    }

    // The fronts: each born at the tip, drifting back as it swells, its contact ring sliding down the cone.
    for (let k = 0; k < FRONTS; k++) {
      const age = wrap(u - k / FRONTS)
      const d = TRAIL * age
      const radius = d * SIN
      const fade = span(age, 0, 0.06) * (1 - age) ** 1.3
      if (fade <= 0.004 || radius < 0.4) continue
      const cx = TIP - d
      // The front itself, in the plane of the page and (larger sizes) across it.
      for (let plane = 0; plane < (lod === 2 ? 2 : 1); plane++) {
        for (let i = 0; i <= 40; i++) {
          const a = (TAU * i) / 40
          const v = ring[i]!
          v[0] = cx + radius * Math.cos(a)
          v[1] = plane ? 0 : radius * Math.sin(a)
          v[2] = plane ? radius * Math.sin(a) : 0
        }
        wire(depth, project, ring, hair * 0.8, fade * (plane ? 0.22 : 0.38), 'ink', 10)
      }
      // Where it touches the cone: a ring d·cos²μ behind the tip, of radius d·cosμ·sinμ.
      const at = TIP - d * COS * COS
      const r = d * COS * SIN
      for (let i = 0; i <= 32; i++) {
        const a = (TAU * i) / 32
        const v = cone[i]!
        v[0] = at
        v[1] = r * Math.cos(a)
        v[2] = r * Math.sin(a)
      }
      wire(depth, project, cone, hair * 1.1, fade * 0.95, 'c1', 4)
    }

    // The dart: a faceted nose cone and body, lit, rolling a quarter turn a loop on four fins.
    const roll = (TAU / 4) * u
    const sides = lod === 0 ? 6 : 10
    const around = (x: number, rad: number, a: number, out: V3) => {
      out[0] = x
      out[1] = rad * Math.cos(a + roll)
      out[2] = rad * Math.sin(a + roll)
      return out
    }
    for (let i = 0; i < sides; i++) {
      const a0 = (TAU * i) / sides
      const a1 = (TAU * (i + 1)) / sides
      const mid = (a0 + a1) / 2 + roll
      // The nose: a triangle from the tip to the shoulder.
      const nn = turn(R / NOSE, Math.cos(mid), Math.sin(mid))
      if (nn[2] > 0) {
        project(TIP, 0, 0, p)
        xy.length = 0
        xy.push(p.x, p.y)
        let z = p.z
        for (const a of [a0, a1]) {
          project(...around(TIP - NOSE, R, a, facet[0]!), p)
          xy.push(p.x, p.y)
          z += p.z
        }
        depth.face(xy, z / 3 + 0.5, lambert(...nn))
      }
      const nb = turn(0, Math.cos(mid), Math.sin(mid))
      if (nb[2] > 0) {
        around(TIP - NOSE, R, a0, facet[0]!)
        around(TIP - NOSE, R, a1, facet[1]!)
        around(TIP - NOSE - BODY, R, a1, facet[2]!)
        around(TIP - NOSE - BODY, R, a0, facet[3]!)
        xy.length = 0
        let z = 0
        for (const c of facet) {
          project(...c, p)
          xy.push(p.x, p.y)
          z += p.z / 4
        }
        depth.face(xy, z + 0.5, lambert(...nb))
      }
    }
    // The shoulder line where nose meets body, and the base.
    for (const x of [TIP - NOSE, TIP - NOSE - BODY]) {
      for (let i = 0; i <= sides; i++) around(x, R, (TAU * i) / sides, cone[i]!)
      wire(depth, project, cone.slice(0, sides + 1), hair * 0.8, 0.7, 'ink', sides)
    }
    for (let f = 0; f < 4; f++) {
      const a = (TAU * f) / 4 + Math.PI / 4
      around(TIP - NOSE - BODY + 4.5, R, a, fin[0]!)
      around(TIP - NOSE - BODY, R + 3.4, a, fin[1]!)
      around(TIP - NOSE - BODY, R, a, fin[2]!)
      panel(depth, project, turn, fin, hair * 0.8, 'ink', { edge: 0.85 })
    }
    // The tip, where every front is born.
    project(TIP, 0, 0, p)
    p.z += 1
    depth.dot(p, clamp(view.size * 0.01, 0.8, 2) / view.px, 0.9 * brightness(p.z))
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A moving wedge outruns nested spherical fronts and exposes their conical envelope. */
export function LoaderFletch(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
