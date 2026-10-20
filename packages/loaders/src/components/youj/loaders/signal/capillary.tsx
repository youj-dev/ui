'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'capillary', title: 'Capillary', category: 'signal', technique: 'lines',
  tags: ['wetting', 'tubes', 'meniscus', 'surface tension', 'liquid', '3d'],
  description: 'Three narrow tubes wet from a shared shallow bath. Their concave fronts climb to progressively greater heights as the bore narrows, pause at equilibrium, and retreat; fine level guides and the nearest wet rim follow each rise.',
  order: 19,
  colors: [{ part: 'Liquid', mono: 'ink' }],
} satisfies LoaderMeta

/* Three glass tubes stand in a shallow tray, each ringed by the small
 * meniscus the bath climbs into where it meets the glass. The liquid rises
 * in each (`standard`, the narrowest highest), settles at equilibrium with a
 * small damped bob, and drains back. The glass has a highlight down its lit
 * side, and a glint travels up each tube in turn, so the empty and the full
 * moments still move; the tallest is graduated, a small pointer reading its
 * level off the scale. Empty at both ends of the loop, so there's no seam.
 *
 * Color: the liquid climbing each tube is tinted `c1`; the glass and the guides stay the ink. */

const depth = new Depth()
const p = point(), q = point(), r = point(), s = point()
const xy: number[] = []
const TUBES = [{ x: -22, r: 6.5, h: 24 }, { x: 0, r: 4.6, h: 34 }, { x: 21, r: 3.2, h: 45 }]
const BATH = -23
const TOP = 27
const TRAY = [
  { ids: [[-33, 12], [33, 12]], n: [0, 0, 1] },
  { ids: [[33, 12], [33, -12]], n: [1, 0, 0] },
  { ids: [[-33, -12], [-33, 12]], n: [-1, 0, 0] },
] as const

export const scene: Scene = {
  beats: 6, still: 0.4,
  draw(pen, t, view) {
    const small = view.size < 32
    const lod = small ? 0 : view.size < 80 ? 1 : 2
    const sides = small ? 12 : 24
    const hair = clamp(view.size * 0.006, 0.9, 1.3) / view.px
    const pose = { yaw: -0.22, pitch: -0.24 }
    const project = camera({ ...pose, distance: 310, cx: view.w / 2, cy: 51.5 })
    const turn = orient(pose)
    // A shallow tray: the bath's surface, and the lit walls that hold it.
    xy.length = 0
    let z = 0
    for (const [x, zz] of [[-33, -12], [33, -12], [33, 12], [-33, 12]]) {
      project(x!, BATH, zz!, p); xy.push(p.x, p.y); z += p.z / 4
    }
    depth.poly(xy, z, 0.08, 'ink', true)
    depth.path(xy, z + 0.1, { width: hair, alpha: 0.5, closed: true })
    for (const wall of TRAY) {
      const n = turn(wall.n[0], wall.n[1], wall.n[2])
      if (n[2] <= 0.02) continue
      const [[ax, az], [bx, bz]] = wall.ids
      project(ax, BATH + 0.6, az, p); project(bx, BATH + 0.6, bz, q); project(bx, BATH - 3.2, bz, r); project(ax, BATH - 3.2, az, s)
      const fz = (p.z + q.z + r.z + s.z) / 4
      depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], fz, lambert(...n) * 0.8)
      depth.path([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], fz + 0.01, { width: hair * 0.8, alpha: 0.45, closed: true })
    }
    for (let tube = 0; tube < TUBES.length; tube++) {
      const { x, r: radius, h } = TUBES[tube]!
      const delay = tube * 0.035
      const rise = view.ease.standard(span(t, 0.06 + delay, 0.4 + delay))
      const fall = view.ease.standard(span(t, 0.65 + delay, 0.91 + delay))
      // Arriving at equilibrium it bobs once or twice and settles (a smooth start, a decaying swing).
      const since = clamp((t - 0.3 - delay) / 0.35)
      const bob = 0.05 * Math.exp(-5 * since) * (1 - Math.cos(TAU * 2.2 * since)) * (1 - fall)
      const wet = Math.max(0, rise - fall + bob)
      const level = BATH + h * wet
      const bore = radius * 0.78
      // The liquid volume is a visible near half-cylinder, with a concave top.
      if (wet > 0.001) for (let i = 0; i < sides; i++) {
        const a = TAU * i / sides, b = TAU * (i + 1) / sides
        const n = turn(Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2))
        project(x + bore * Math.cos(a), BATH, bore * Math.sin(a), p)
        project(x + bore * Math.cos(b), BATH, bore * Math.sin(b), q)
        project(x + bore * Math.cos(b), level, bore * Math.sin(b), r)
        project(x + bore * Math.cos(a), level, bore * Math.sin(a), s)
        if (n[2] > 0) depth.poly([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], (p.z + q.z + r.z + s.z) / 4, 0.12 + 0.12 * lambert(...n), 'c1', true)
        project(x, level - bore * 0.28 * clamp(wet * 8), 0, p)
        const topNormal = turn(-0.28 * Math.cos((a + b) / 2), 1, -0.28 * Math.sin((a + b) / 2))
        if (topNormal[2] > 0) depth.face([p.x, p.y, r.x, r.y, s.x, s.y], (p.z + r.z + s.z) / 3, lambert(...topNormal) * 0.85)
      }
      // Segmented circular rims retain correct near/far brightness.
      for (const y of [BATH, TOP, level]) for (let i = 0; i < sides; i++) {
        const a = TAU * i / sides, b = TAU * (i + 1) / sides
        const rr = y === level ? bore : radius
        project(x + rr * Math.cos(a), y, rr * Math.sin(a), p)
        project(x + rr * Math.cos(b), y, rr * Math.sin(b), q)
        const near = clamp(0.55 + p.z / 25, 0.25, 0.95)
        const active = y === level && tube === 2 && Math.sin(a) > 0.4
        depth.line(p, q, hair * (y === level ? 1.15 : 0.85) * p.k, near, active ? 'accent' : 'ink')
      }
      // The bath climbs the glass a little where it meets it: a small meniscus collar.
      if (lod > 0) {
        xy.length = 0
        let cz = 0
        for (let i = 0; i <= sides; i++) {
          project(x + (radius + 1.2) * Math.cos(TAU * i / sides), BATH + 0.35, (radius + 1.2) * Math.sin(TAU * i / sides), p)
          xy.push(p.x, p.y); cz += p.z / (sides + 1)
        }
        depth.path(xy, cz + 0.2, { width: hair * 0.7, alpha: 0.36, join: 'round' })
      }
      for (const edge of [-1, 1]) {
        project(x + edge * radius, BATH - 2, 0, p); project(x + edge * radius, TOP, 0, q)
        depth.line(p, q, hair * 0.9 * p.k, 0.65)
      }
      if (lod > 0) {
        // The glass's highlight down its lit side, and a glint travelling up it, a tube at a time.
        const gx = x - radius * 0.72, gz = radius * 0.69
        project(gx, BATH + 2, gz, p); project(gx, TOP - 2, gz, q)
        depth.line(p, q, hair * 0.75, 0.28)
        const phase = (t + tube / 3) % 1
        const y = BATH + 2 + (TOP - BATH - 10) * view.ease.standard(phase)
        project(gx, y, gz + 0.05, p); project(gx, y + 6, gz + 0.05, q)
        depth.line(p, q, hair * 1.1, 0.8 * Math.sin(Math.PI * phase) ** 2)
      }
      if (lod === 2 && tube === 2) {
        // The tallest is graduated, and a pointer reads its level off the scale.
        for (let k = 1; k <= 9; k++) {
          project(x + radius + 0.6, BATH + 5 * k, 0, p); project(x + radius + (k % 2 ? 1.8 : 3), BATH + 5 * k, 0, q)
          depth.line(p, q, hair * 0.8, k % 2 ? 0.34 : 0.5)
        }
        project(x + radius + 3.6, level, 0, p); project(x + radius + 5.8, level - 1.3, 0, q); project(x + radius + 5.8, level + 1.3, 0, r)
        depth.poly([p.x, p.y, q.x, q.y, r.x, r.y], p.z + 0.2, 0.75)
      } else if (!small) {
        project(x + radius + 1.7, level, 0, p); project(x + radius + 5, level, 0, q)
        depth.line(p, q, hair * 0.8, 0.45)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three wetting fronts rise to different capillary equilibria. */
export function LoaderCapillary(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
