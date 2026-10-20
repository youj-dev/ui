'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, mix, orient, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { disc, part, pin, type V3 } from './machine'

export const meta = {
  id: 'iris', title: 'Iris', category: 'mechanics', technique: 'mixed',
  tags: ['diaphragm', 'aperture', 'blades', 'camera', 'linkage'],
  description: 'Shingled diaphragm blades sweep round a polygonal opening inside a deep bezel, closing and opening as an accent lever travels its slot. Each blade lies over the next, edge-shadowed, and the aperture breathes without stopping.',
  order: 5,
  colors: [{ part: 'Aperture', mono: 'ink' }],
} satisfies LoaderMeta

/* A lens diaphragm in a thick engraved bezel. Each blade's straight edge is
 * a tangent to the opening, carried past the corner to the bezel; drawing
 * only what shows of each blade (from its edge to the next blade's edge)
 * shingles them all the way round, each over the next, with the edge
 * casting a hairline shadow on the blade beneath. As the opening narrows
 * the tangents swing, so the blades sweep round as real ones do. The
 * actuator lever, in the accent, travels a slot cut in the bezel; the
 * aperture breathes on one cosine, no dwell at either end.
 *
 * Color: the aperture’s outline is `c1`, the opening the blades breathe; the blades and bezel keep the ink and the lever the accent. */

const BEZEL = 36
const BORE = 29.5
const FRONT = 4
const ring: V3[] = []
const hole: V3[] = []
const slot: V3[] = []
const blade: V3[] = []
const xy: number[] = []
const depth = new Depth()
const p = point()
const q = point()

export const scene: Scene = {
  beats: 5, still: 0.28,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const n = small ? 6 : 7
    const hair = (small ? 1.1 : 1.05) / view.px
    // A slow sway shows the depth; below 32px it would only walk long edges across the pixel grid.
    const pose = { yaw: -0.3 + (small ? 0 : 0.06 * Math.sin(TAU * t)), pitch: -0.36 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    // One breath: open at the seam, narrowest halfway.
    const open = 0.5 + 0.5 * Math.cos(TAU * t)
    const r = mix(5.5, 20, open)
    const swirl = 0.35 + 0.9 * (1 - open)
    const reach = Math.acos(r / BORE)
    const corner = r / Math.cos(Math.PI / n)

    // The bezel: a deep ring whose bore shows its far wall.
    part(depth, project, turn, disc(0, 0, FRONT, BEZEL, small ? 32 : 72, ring), [disc(0, 0, FRONT, BORE, small ? 32 : 72, hole)], FRONT, hair, large ? 0.9 : 0)

    // The blades: what shows of each, from its edge (a tangent to the opening) to the next blade's edge.
    const vertex = (i: number) => {
      const a = swirl + (TAU * (i + 0.5)) / n
      return [corner * Math.cos(a), corner * Math.sin(a)] as const
    }
    for (let i = 0; i < n; i++) {
      const th = swirl + (TAU * i) / n
      const [ax, ay] = vertex(i - 1)
      const [bx, by] = vertex(i)
      blade.length = 0
      blade.push([ax, ay, 0.4], [bx, by, 0.4])
      const steps = small ? 6 : 12
      for (let k = 0; k <= steps; k++) {
        const a = th + reach - ((TAU / n) * k) / steps
        blade.push([BORE * Math.cos(a), BORE * Math.sin(a), 0.4])
      }
      const f = projectPath(blade, project, xy)
      // Each blade tips a little toward its own edge, so neighbours take the light differently.
      const tilt = turn(0.09 * Math.cos(th + 1.2), 0.09 * Math.sin(th + 1.2), 1)
      depth.face(f.xy, f.z, lambert(...tilt))
      // The blade's edge over the next one, and its hairline shadow on it.
      const s0 = r * Math.tan(Math.PI / n)
      const s1 = Math.sqrt(BORE * BORE - r * r)
      const nx = Math.cos(th)
      const ny = Math.sin(th)
      const dx = -Math.sin(th)
      const dy = Math.cos(th)
      project(r * nx + s0 * dx, r * ny + s0 * dy, 0.45, p)
      project(r * nx + s1 * dx, r * ny + s1 * dy, 0.45, q)
      depth.path([p.x, p.y, q.x, q.y], f.z + 0.02, { width: hair, alpha: 0.85, cap: 'round' })
      if (!small) {
        project(r * nx + (s0 + 1.4) * dx - 0.7 * nx, r * ny + (s0 + 1.4) * dy - 0.7 * ny, 0.42, p)
        project(r * nx + (s1 - 0.8) * dx - 0.7 * nx, r * ny + (s1 - 0.8) * dy - 0.7 * ny, 0.42, q)
        depth.path([p.x, p.y, q.x, q.y], f.z + 0.01, { width: hair * 1.6, alpha: 0.16, cap: 'butt' })
        // The blade's drive pin, riding with it near the bore.
        const pa = th + reach - (0.7 * TAU) / n
        pin(depth, project, turn, 26.6 * Math.cos(pa), 26.6 * Math.sin(pa), 0.5, large ? 0.95 : 0.8, hair * 0.7, 'ink', f.z + 0.03)
      }
    }

    // The aperture's own outline, crisp where the blades meet the opening.
    xy.length = 0
    for (let i = 0; i < n; i++) {
      const [x, y] = vertex(i)
      project(x, y, 0.5, p)
      xy.push(p.x, p.y)
    }
    depth.path(xy, 2, { width: hair, alpha: 0.9, closed: true, join: 'miter', tone: 'c1' })

    // The bezel's engraving and the actuator lever in its slot, in the accent.
    const face = project(0, 0, FRONT, point()).z + 3
    if (large) {
      for (let k = 0; k < 24; k++) {
        const a = Math.PI / 2 + (TAU * k) / 24
        if (Math.abs(Math.sin((a - Math.PI / 2) / 2)) < 0.2) continue
        const long = k % 4 === 0
        project((BEZEL - 1) * Math.cos(a), (BEZEL - 1) * Math.sin(a), FRONT + 0.02, p)
        project((BEZEL - (long ? 3.4 : 2.2)) * Math.cos(a), (BEZEL - (long ? 3.4 : 2.2)) * Math.sin(a), FRONT + 0.02, q)
        p.z = q.z = face
        depth.line(p, q, hair * 0.7, long ? 0.55 : 0.32)
      }
    }
    if (!small) {
      slot.length = 0
      for (let k = 0; k <= 12; k++) {
        const a = Math.PI / 2 + 0.42 - (0.84 * k) / 12
        slot.push([(BEZEL - 3.3) * Math.cos(a), (BEZEL - 3.3) * Math.sin(a), FRONT + 0.02])
      }
      const s = projectPath(slot, project, xy)
      depth.path(s.xy, face, { width: hair * 2.6, alpha: 0.35, cap: 'round', join: 'round' })
    }
    const lever = Math.PI / 2 + mix(-0.38, 0.38, open)
    pin(depth, project, turn, (BEZEL - 3.3) * Math.cos(lever), (BEZEL - 3.3) * Math.sin(lever), FRONT + 0.6, small ? 1.9 : 1.6, hair * 0.8, 'accent', face + 0.1)
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A linked diaphragm breathes within an inclined, double-lipped housing. */
export function LoaderIris(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
