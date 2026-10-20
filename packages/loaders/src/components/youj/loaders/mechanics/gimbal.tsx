'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, hump, lambert, orient, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { type V3 } from './machine'

export const meta = {
  id: 'gimbal', title: 'Gimbal', category: 'mechanics', technique: 'lines',
  tags: ['gyroscope', 'bearings', 'rings', 'precession', 'orientation', '3d'],
  description: 'Three nested bearing rings on a pedestal exchange a measured tilt around perpendicular axes. Pivot stubs carry each inner ring, and a rimmed flywheel spins on its own axle inside the moving cradle, its accent mark sweeping the rim.',
  order: 8,
  colors: [{ part: 'Inner ring', mono: 'ink' }],
} satisfies LoaderMeta

/* A gimbal on a pedestal. Each ring is a lit band, its inside darker,
 * carried by the ring outside it on a pair of pivot stubs, so every hinge
 * stays attached as the rings tilt: the middle ring turns about the
 * vertical, the inner one about the horizontal, both on eased swings a
 * quarter loop apart. The flywheel, a rimmed disc on its own axle, spins
 * three times a loop whatever its cradle does.
 *
 * Color: the inner ring’s edges are `c1`, so the three rings read apart as they trade the tilt; the flywheel’s mark stays the accent. */

const RINGS = [31, 24, 17]
const BAND = [3.2, 2.8, 2.4]
const depth = new Depth()
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
const rotor: V3[] = []
const edges: [V3[], V3[]] = [[], []]
let edgeZ = 0
const a = point()
const b = point()

export const scene: Scene = {
  beats: 5.5,
  still: 0.29,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const samples = small ? 28 : view.size < 80 ? 40 : 56
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.42 + (small ? 0 : 0.04) * Math.sin(TAU * t), pitch: -0.26 }
    const project = camera({ ...pose, distance: 250, cx: view.w / 2, cy: view.h / 2 - 2 })
    const turn = orient(pose)
    const tilt = 1.22 * (2 * view.ease.standard(hump(t)) - 1)
    const nod = 0.95 * (2 * view.ease.standard(hump((t + 0.25) % 1)) - 1)
    const spin = 3 * TAU * t
    // A vector carried by the rings out to `level`: the inner ring nods about x, the middle ring tilts about y.
    const carry = (v: V3, level: number, out: V3 = [0, 0, 0]): V3 => {
      let [x, y, z] = v
      if (level >= 2) {
        const yy = y * Math.cos(nod) - z * Math.sin(nod)
        z = y * Math.sin(nod) + z * Math.cos(nod)
        y = yy
      }
      if (level >= 1) {
        const xx = x * Math.cos(tilt) + z * Math.sin(tilt)
        z = -x * Math.sin(tilt) + z * Math.cos(tilt)
        x = xx
      }
      out[0] = x
      out[1] = y
      out[2] = z
      return out
    }

    // The pedestal: a column from the outer ring down to a lit foot.
    const foot = projectPath([[0, -RINGS[0]! - BAND[0]! / 2, 0], [0, -43, 0]], project, xy)
    depth.path(foot.xy, foot.z - 40, { width: hair * 3.4, alpha: 0.5, cap: 'butt' })
    depth.path(foot.xy, foot.z - 39.9, { width: hair, alpha: 0.85, cap: 'butt' })
    const base: V3[] = []
    for (let i = 0; i < 24; i++) base.push([13 * Math.cos((TAU * i) / 24), -43, 9 * Math.sin((TAU * i) / 24)])
    const plinth = projectPath(base, project, xy)
    depth.face(plinth.xy, -80, lambert(...turn(0, 1, 0)))
    depth.path(plinth.xy, -79.9, { width: hair, alpha: 0.7, closed: true, join: 'round' })

    for (let level = 0; level < 3; level++) {
      const r = RINGS[level]!
      const h = BAND[level]! / 2
      // The band: a short cylinder round the ring's own axis (z in its frame), lit outside, darker inside.
      // Its two edges are hairlines, a few segments to a stroke, each at its faces' depth.
      const chunk = 4
      for (let i = 0; i < samples; i++) {
        const u = (TAU * i) / samples
        const v = (TAU * (i + 1)) / samples
        carry([r * Math.cos(u), r * Math.sin(u), -h], level, quad[0])
        carry([r * Math.cos(v), r * Math.sin(v), -h], level, quad[1])
        carry([r * Math.cos(v), r * Math.sin(v), h], level, quad[2])
        carry([r * Math.cos(u), r * Math.sin(u), h], level, quad[3])
        const m = (u + v) / 2
        const n = turn(...carry([Math.cos(m), Math.sin(m), 0], level))
        const outside = n[2] > 0
        const s = outside ? 1 : -1
        const f = projectPath(quad, project, xy)
        depth.face(f.xy, f.z, lambert(n[0] * s, n[1] * s, n[2] * s) * (outside ? 1 : 0.72))
        if (i % chunk === 0) {
          edges[0].length = 0
          edges[1].length = 0
          edgeZ = 0
        }
        for (const [e, k] of [[edges[0], 0], [edges[1], 3]] as const) {
          if (!e.length) e.push([...quad[k]!] as V3)
          e.push([...quad[k === 0 ? 1 : 2]!] as V3)
        }
        edgeZ += f.z / chunk
        if (i % chunk === chunk - 1 || i === samples - 1) {
          for (const e of edges) {
            const path = projectPath(e, project, xy)
            depth.path(path.xy, edgeZ + 0.01, { width: hair * 0.8, alpha: clamp(0.62 + path.z / 90, 0.3, 0.92), join: 'round', tone: level === 2 ? 'c1' : 'ink' })
          }
        }
      }
      // The pivot stubs joining this ring to the next one in.
      if (level < 2) for (const sign of [-1, 1]) {
        const axis: V3 = level === 0 ? [0, sign, 0] : [sign, 0, 0]
        const from = carry([axis[0] * (r - 0.4), axis[1] * (r - 0.4), 0], level)
        const to = carry([axis[0] * (RINGS[level + 1]! + 0.4), axis[1] * (RINGS[level + 1]! + 0.4), 0], level + 1)
        project(...from, a)
        project(...to, b)
        depth.line(a, b, hair * (small ? 2.4 : 2.8), 0.62)
        depth.line(a, b, hair, 0.95)
        depth.dot(b, (small ? 0.9 : 1.15) / view.px, 0.95)
      }
    }
    // The flywheel: a rimmed disc on its axle in the inner ring's frame, spinning on its own.
    const R = 11
    rotor.length = 0
    for (let i = 0; i < 28; i++) {
      const u = (TAU * i) / 28
      rotor.push(carry([R * Math.cos(u), 0, R * Math.sin(u)], 2))
    }
    const normal = turn(...carry([0, 1, 0], 2))
    const s = normal[2] < 0 ? -1 : 1
    const disc = projectPath(rotor, project, xy)
    depth.face(disc.xy, disc.z, lambert(normal[0] * s, normal[1] * s, normal[2] * s))
    depth.path(disc.xy, disc.z + 0.02, { width: hair * 1.1, alpha: 0.9, closed: true, join: 'round' })
    rotor.length = 0
    for (let i = 0; i < 28; i++) {
      const u = (TAU * i) / 28
      rotor.push(carry([(R - 2.4) * Math.cos(u), 0, (R - 2.4) * Math.sin(u)], 2))
    }
    const inner = projectPath(rotor, project, xy)
    depth.path(inner.xy, disc.z + 0.03, { width: hair * 0.7, alpha: 0.4, closed: true, join: 'round' })
    // Its axle through the inner ring, and three spokes and an accent mark turning with the spin.
    project(...carry([0, -RINGS[2]!, 0], 2), a)
    project(...carry([0, RINGS[2]!, 0], 2), b)
    depth.line(a, b, hair * 1.2, 0.75)
    for (let k = 0; k < 3; k++) {
      const u = spin + (TAU * k) / 3
      project(...carry([1.6 * Math.cos(u), 0.05 * s, 1.6 * Math.sin(u)], 2), a)
      project(...carry([(R - 2.6) * Math.cos(u), 0.05 * s, (R - 2.6) * Math.sin(u)], 2), b)
      depth.path([a.x, a.y, b.x, b.y], disc.z + 0.04, { width: hair * 0.9, alpha: 0.6, cap: 'round' })
    }
    project(...carry([(R - 1.2) * Math.cos(spin), 0.06 * s, (R - 1.2) * Math.sin(spin)], 2), a)
    project(...carry([(R - 1.2) * Math.cos(spin + 0.5), 0.06 * s, (R - 1.2) * Math.sin(spin + 0.5)], 2), b)
    depth.path([a.x, a.y, b.x, b.y], disc.z + 0.05, { width: hair * 1.8, alpha: 1, tone: 'accent', cap: 'round' })
    project(...carry([0, 0.1 * s, 0], 2), a)
    depth.dot(a, (small ? 1.1 : 1.4) / view.px, 0.95)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Nested bearing rings carry an independently spinning flywheel through two coupled tilts. */
export function LoaderGimbal(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
