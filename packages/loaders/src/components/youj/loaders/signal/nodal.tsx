'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'nodal', title: 'Nodal', category: 'signal', technique: 'mixed',
  tags: ['membrane', 'standing wave', 'resonance', 'drum', 'nodes', 'modes'],
  description: 'A circular membrane exchanges two standing-wave modes inside a fixed drum rim. Opposing lobes rise and fall around quiet nodal diameters, the wire skin follows the deformation, and a small rim exciter marks the exchange of energy.',
  order: 23,
  colors: [{ part: 'Rising lobes', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point()
const corners = Array.from({ length: 4 }, () => point())
const xy: number[] = []
const LEVELS = [{ radial: 4, angular: 12, spokes: 4 }, { radial: 5, angular: 16, spokes: 8 }, { radial: 7, angular: 24, spokes: 10 }]
const R = 33

/* Color: the wire rings warm toward `c1` where a lobe rises; the
 * falling lobes and the nodal lines keep the ink. */

export const scene: Scene = {
  beats: 5.5, still: 0.29,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1.05 : 0.9) / view.px
    const { radial, angular, spokes } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const pose = { yaw: -0.22, pitch: -0.67 }
    const project = camera({ ...pose, distance: 280, cx: view.w / 2, cy: 48 })
    const turn = orient(pose)
    const exchange = view.ease.standard(0.5 - 0.5 * Math.cos(TAU * t))
    const c1 = Math.cos(TAU * t), c2 = Math.sin(TAU * 2 * t)
    const height = (r: number, a: number) => 16 * Math.sin(Math.PI * r / R) * ((1 - exchange) * c1 * Math.cos(a) + exchange * c2 * Math.cos(2 * a))
    const projectAt = (r: number, a: number, out: typeof p) => project(r * Math.cos(a), height(r, a), r * Math.sin(a), out)

    // The membrane is occluding, with normals from its actual height field.
    // Only coarse radial bands are filled; dense detail is carried by fine wires.
    const bands = 3
    for (let r = 0; r < bands; r++) for (let a = 0; a < angular; a++) {
      const r0 = R * r / bands, r1 = R * (r + 1) / bands
      const a0 = TAU * a / angular, a1 = TAU * (a + 1) / angular
      projectAt(r0, a0, corners[0]!); projectAt(r1, a0, corners[1]!); projectAt(r1, a1, corners[2]!); projectAt(r0, a1, corners[3]!)
      const rr = (r0 + r1) / 2, aa = (a0 + a1) / 2
      const dr = (height(rr + 0.03, aa) - height(rr - 0.03, aa)) / 0.06
      const da = (height(rr, aa + 0.001) - height(rr, aa - 0.001)) / (0.002 * rr)
      const n = turn(-dr * Math.cos(aa) + da * Math.sin(aa), 1, -dr * Math.sin(aa) - da * Math.cos(aa))
      xy.length = 0
      let z = 0
      for (const p of corners) { xy.push(p.x, p.y); z += p.z / 4 }
      const s = n[2] < 0 ? -1 : 1
      // A restrained lit skin makes the wire lobes read as a continuous membrane.
      depth.face(xy, z, clamp(lambert(n[0] * s, n[1] * s, n[2] * s) * 0.6 + 0.18))
    }
    for (let j = 1; j <= radial; j++) {
      const r = R * j / radial
      for (let i = 0; i < angular; i++) {
        projectAt(r, TAU * i / angular, p); projectAt(r, TAU * (i + 1) / angular, q)
        // A rising lobe's wires warm toward the membrane's color; the falling ones and the nodes keep the ink.
        depth.line(p, q, hair * (j === radial ? 1.2 : 0.7), clamp(0.5 + (p.z + q.z) / 140, 0.23, 0.83), blend('ink', 'c1', 0.9 * clamp(height(r, TAU * (i + 0.5) / angular) / 12)))
      }
    }
    for (let a = 0; a < spokes; a++) for (let r = 0; r < radial; r++) {
      const angle = TAU * a / spokes
      projectAt(R * r / radial, angle, p); projectAt(R * (r + 1) / radial, angle, q)
      depth.line(p, q, hair * 0.7, clamp(0.44 + (p.z + q.z) / 150, 0.2, 0.7))
    }
    for (let i = 0; i < angular; i++) {
      const a = TAU * i / angular, b = TAU * (i + 1) / angular
      project(R * Math.cos(a), -5, R * Math.sin(a), p); project(R * Math.cos(b), -5, R * Math.sin(b), q)
      depth.line(p, q, hair, clamp(0.42 + (p.z + q.z) / 120, 0.18, 0.72))
      if (i % (angular / 4) === 0) { project(R * Math.cos(a), 0, R * Math.sin(a), q); depth.line(p, q, hair * 0.8, 0.58) }
    }
    // An exciter outside the fixed rim breathes with the two coupled modes.
    const a = 0.5
    project(35 * Math.cos(a), 2 + 3 * c1, 35 * Math.sin(a), p)
    project(38 * Math.cos(a), 2 + 3 * c1, 38 * Math.sin(a), q)
    depth.line(p, q, hair * 1.4, 0.95, 'accent')
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two resonant modes exchange their lobes inside a fixed circular drum. */
export function LoaderNodal(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
