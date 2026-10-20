'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, hump, orient, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, face, grids, hairline, lod, near, surface, type V3 } from './sphere'

export const meta = {
  id: 'cincture', title: 'Cincture', category: 'orbs', technique: 'planes',
  tags: ['sphere', 'planet', 'rings', 'orbit', 'moon'],
  description: 'A lit planet carries a broad inclined annulus through a slow nod. Gaps between the ring bands breathe, an inset arc counterturns, and a small moon passes behind the planet and back across the foreground.',
  order: 8,
  colors: [{ part: 'Ring', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point(), corners: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const centre: V3 = [0, 0, 0]

export const scene: Scene = {
  beats: 5.5, still: 0.24,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view), grid = grids[Math.min(level, 1)]!, circle = circles[level]!, hair = hairline(view)
    const pose = { yaw: -0.24, pitch: -0.35, roll: 0.1 }, project = camera({ ...pose, distance: 380, cx: view.w / 2, cy: view.h / 2 }), turn = orient(pose)
    const tilt = -0.2 - 0.16 * Math.cos(TAU * t), cs = Math.cos(tilt), sn = Math.sin(tilt)
    const put = (r: number, a: number, v: V3) => { v[0] = r * Math.cos(a); v[1] = r * Math.sin(a) * sn; v[2] = r * Math.sin(a) * cs }
    // Ring bands are real annular faces, not ellipses painted over a disc.
    // Their individual depths put the rear arc behind the opaque planet.
    for (let band = 0;band < 3;band++) {
      const gap = 0.65 + 0.8 * view.ease.standard(hump((t + band * 0.08) % 1))
      const inner = 27 + band * 4.5 + gap, outer = inner + 2.8
      for (let i = 0;i < circle.length - 1;i++) {
        const a = TAU * i / (circle.length - 1), b = TAU * (i + 1) / (circle.length - 1)
        put(inner, a, corners[0]!); put(outer, a, corners[1]!); put(outer, b, corners[2]!); put(inner, b, corners[3]!)
        face(depth, project, turn, corners, 0, 'ink', 0, true)
        if (band === 2 || (band === 0 && level > 0)) {
          const r = band === 2 ? outer : inner
          put(r, a, centre); project(...centre, p)
          put(r, b, centre); project(...centre, q)
          depth.line(p, q, hair * 0.65, 0.68 * near((p.z + q.z) / 2), blend('ink', 'c1', 0.6))
        }
        if (band === 1) {
          const phase = ((i / (circle.length - 1) + t) % 1), wake = Math.max(0, 1 - phase / 0.09)
          put((inner + outer) / 2, a, centre); project(...centre, p)
          put((inner + outer) / 2, b, centre); project(...centre, q)
          depth.line(p, q, hair * 1.1, 0.95 * wake, 'accent')
        }
      }
    }
    grid.unit.forEach((v, i) => { const w = grid.world[i]!; w[0] = 20 * v[0]; w[1] = 20 * v[1]; w[2] = 20 * v[2] })
    surface(depth, project, turn, grid)
    // A few inclined surface belts show the planet turning independently.
    for (const lat of view.size < 32 ? [0.2] : [-0.4, 0.2, 0.6]) {
      for (let i = 0;i < circle.length - 1;i++) {
        const a = TAU * (i / (circle.length - 1) + t), b = TAU * ((i + 1) / (circle.length - 1) + t)
        const la = lat + 0.08 * Math.sin(a), lb = lat + 0.08 * Math.sin(b)
        project(20.12 * Math.cos(la) * Math.cos(a), 20.12 * Math.sin(la), 20.12 * Math.cos(la) * Math.sin(a), p)
        project(20.12 * Math.cos(lb) * Math.cos(b), 20.12 * Math.sin(lb), 20.12 * Math.cos(lb) * Math.sin(b), q)
        if ((p.z + q.z) / 2 > 3) depth.line(p, q, hair * 0.65, 0.32 * near((p.z + q.z) / 2, 20))
      }
    }
    // The moon's orbit takes it cleanly behind the planet (hidden, not grazing its limb) and back across the front.
    const orbit = TAU * t + 0.8
    centre[0] = 42 * Math.cos(orbit); centre[1] = -6 * Math.sin(orbit); centre[2] = 27 * Math.sin(orbit)
    const moon = grids[Math.min(level, 1)]!
    moon.unit.forEach((v, i) => { const w = moon.world[i]!; w[0] = centre[0] + 3.4 * v[0]; w[1] = centre[1] + 3.4 * v[1]; w[2] = centre[2] + 3.4 * v[2] })
    surface(depth, project, turn, moon)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A lit planet carries a broad inclined annulus through a slow nod. Gaps between the ring bands breathe, an inset arc counterturns, and a small moon passes behind the planet and back across the foreground.
 *
 * Color: the ring’s band edges lean toward `c1`; the planet stays the ink and the counterturning arc the accent. */
export function LoaderCincture(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
