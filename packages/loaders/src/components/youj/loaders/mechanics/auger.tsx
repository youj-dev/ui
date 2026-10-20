'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { type V3 } from './machine'

export const meta = {
  id: 'auger', title: 'Auger', category: 'mechanics', technique: 'mixed',
  tags: ['screw', 'conveyor', 'helix', 'transport', 'trough', 'flight'],
  description: 'A helical flight turns steadily on its shaft inside an inclined, cut-away trough, carrying pockets of granules uphill by exactly one pitch a turn; one grain rides in the accent, and the lit flight passes behind the shaft and back over it.',
  order: 15,
  colors: [{ part: 'Granules', mono: 'ink' }],
} satisfies LoaderMeta

/* A screw conveyor on a real incline. The flight is a lit helicoid round a
 * lit shaft (cut into short sections so each sorts at its own depth and the
 * flight passes behind it and back over it), in a U trough whose near wall
 * is cut away so the eye can see in; end plates carry the shaft's bearings.
 * The screw turns steadily, as a motor drives it, once a loop; the granules
 * in each pocket between turns of the flight ride uphill one pitch a turn,
 * so the pockets have each taken the next one's place at the seam, fading
 * in at the foot and out at the head.
 *
 * Color: the granules the flight carries are `c1`; the lit flight and trough keep the ink, and one grain still rides in the accent. */

const PITCH = 13.2
const HALF = 33
const SLOPE = 0.34
const R_FLIGHT = 10.5
const R_SHAFT = 2.6
const R_TROUGH = 12.6
const len = Math.hypot(1, SLOPE)
const A: V3 = [1 / len, SLOPE / len, 0] // along the axis
const B: V3 = [-SLOPE / len, 1 / len, 0] // up, square to it
const C: V3 = [0, 0, 1] // toward the viewer
const depth = new Depth()
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const edge: V3[] = []
const grain: V3 = [0, 0, 0]
const xy: number[] = []
const p = point()
/** Grains in a pocket: offset along the axis, round the trough from its floor, and size. */
const GRAINS = [[-0.8, 0.05, 1.15], [-2.9, -0.32, 1], [1.5, -0.24, 1.05], [2.7, 0.3, 0.95], [-1.9, 0.42, 0.9]] as const

/** A point at distance s along the axis, radius r, angle a round it (0 up, π/2 toward the viewer). */
function at(out: V3, s: number, r: number, a: number) {
  const cb = r * Math.cos(a)
  const sc = r * Math.sin(a)
  out[0] = A[0] * s + B[0] * cb + C[0] * sc
  out[1] = A[1] * s + B[1] * cb + C[1] * sc
  out[2] = A[2] * s + B[2] * cb + C[2] * sc
  return out
}
/** A direction round the axis at angle a. */
const radial = (a: number): V3 => [B[0] * Math.cos(a), B[1] * Math.cos(a), Math.sin(a)]

export const scene: Scene = {
  beats: 5, still: 0.27,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.22 + (small ? 0 : 0.04) * Math.sin(TAU * t), pitch: -0.36 }
    const project = camera({ ...pose, distance: 310, cx: view.w / 2 + 1, cy: 52 })
    const turn = orient(pose)
    // Steady, as a motor drives it: one turn a loop, the flight's thread advancing one pitch.
    const spin = TAU * t

    // The trough: its floor and far wall, seen from inside where the near wall is cut away.
    const arcs = small ? 4 : 6
    const lo = 0.8 * Math.PI
    const hi = 1.52 * Math.PI
    for (let j = 0; j < arcs; j++) {
      const a0 = lo + ((hi - lo) * j) / arcs
      const a1 = lo + ((hi - lo) * (j + 1)) / arcs
      at(quad[0]!, -HALF, R_TROUGH, a0)
      at(quad[1]!, HALF, R_TROUGH, a0)
      at(quad[2]!, HALF, R_TROUGH, a1)
      at(quad[3]!, -HALF, R_TROUGH, a1)
      const d = radial((a0 + a1) / 2)
      const n = turn(-d[0], -d[1], -d[2])
      if (n[2] <= 0) continue
      const f = projectPath(quad, project, xy)
      depth.face(f.xy, -60 + j * 0.01, lambert(...n) * 0.42)
    }
    // The cut edge and the far lip, as lines.
    for (const a of [lo, hi]) {
      edge.length = 0
      for (const s of [-HALF, HALF]) edge.push(at([0, 0, 0], s, R_TROUGH, a))
      const f = projectPath(edge, project, xy)
      depth.path(f.xy, a === lo ? 40 : f.z - 29, { width: hair * (a === lo ? 1.1 : 0.9), alpha: a === lo ? 0.85 : 0.6 })
    }

    // The flight: a lit helicoid, its outer edge one line, sorted piece by piece against the shaft.
    const segments = small ? 48 : view.size < 80 ? 72 : 108
    for (let i = 0; i < segments; i++) {
      const s0 = -HALF + (2 * HALF * i) / segments
      const s1 = -HALF + (2 * HALF * (i + 1)) / segments
      const a0 = (TAU * s0) / PITCH - spin
      const a1 = (TAU * s1) / PITCH - spin
      at(quad[0]!, s0, R_SHAFT, a0)
      at(quad[1]!, s1, R_SHAFT, a1)
      at(quad[2]!, s1, R_FLIGHT, a1)
      at(quad[3]!, s0, R_FLIGHT, a0)
      // The helicoid's normal: across its radius and along its pitch.
      const m = (a0 + a1) / 2
      const d = radial(m)
      const tangent: V3 = [-B[0] * Math.sin(m), -B[1] * Math.sin(m), Math.cos(m)]
      const k = (TAU * 6.5) / PITCH
      const along: V3 = [A[0] + tangent[0] * k, A[1] + tangent[1] * k, A[2] + tangent[2] * k]
      const nx = d[1] * along[2] - d[2] * along[1]
      const ny = d[2] * along[0] - d[0] * along[2]
      const nz = d[0] * along[1] - d[1] * along[0]
      const n = turn(nx, ny, nz)
      const sign = n[2] < 0 ? -1 : 1
      const f = projectPath(quad, project, xy)
      depth.face(f.xy, f.z, lambert(n[0] * sign, n[1] * sign, n[2] * sign) * (sign > 0 ? 1 : 0.84))
      const e = projectPath([quad[3]!, quad[2]!], project, xy)
      depth.path(e.xy, e.z + 0.05, { width: hair * 1.1, alpha: clamp(0.66 + e.z / 70, 0.36, 0.95), cap: 'round' })
    }

    // The shaft: a lit eight-sided bar in short sections.
    const sections = small ? 6 : 14
    for (let i = 0; i < sections; i++) {
      const s0 = -HALF - 3 + ((2 * HALF + 6) * i) / sections
      const s1 = -HALF - 3 + ((2 * HALF + 6) * (i + 1)) / sections
      for (let j = 0; j < 8; j++) {
        const a0 = (TAU * j) / 8
        const a1 = (TAU * (j + 1)) / 8
        const d = radial((a0 + a1) / 2)
        const n = turn(...d)
        if (n[2] <= 0) continue
        at(quad[0]!, s0, R_SHAFT, a0)
        at(quad[1]!, s1, R_SHAFT, a0)
        at(quad[2]!, s1, R_SHAFT, a1)
        at(quad[3]!, s0, R_SHAFT, a1)
        const f = projectPath(quad, project, xy)
        depth.face(f.xy, f.z, lambert(...n))
      }
    }

    // End plates, U-shaped to the trough, each with the shaft's bearing.
    for (const s of [-HALF - 0.5, HALF + 0.5]) {
      edge.length = 0
      const steps = small ? 8 : 16
      for (let j = 0; j <= steps; j++) edge.push(at([0, 0, 0], s, R_TROUGH + 1.6, 0.5 * Math.PI + (Math.PI * j) / steps))
      edge.push(at([0, 0, 0], s, R_TROUGH + 1.6, 0.5 * Math.PI))
      const n = turn(s > 0 ? A[0] : -A[0], s > 0 ? A[1] : -A[1], 0)
      const f = projectPath(edge, project, xy)
      if (n[2] > 0) depth.face(f.xy, f.z - 10, lambert(...n))
      depth.path(f.xy, f.z - 9.9, { width: hair, alpha: 0.78, closed: true, join: 'round' })
      // The bearing housing on the plate's outside.
      edge.length = 0
      for (let j = 0; j < 12; j++) edge.push(at([0, 0, 0], s + Math.sign(s) * 1.2, 4.2, (TAU * j) / 12))
      const h = projectPath(edge, project, xy)
      depth.face(h.xy, h.z + 5, lambert(...turn(s > 0 ? A[0] : -A[0], s > 0 ? A[1] : -A[1], 0.6)))
      depth.path(h.xy, h.z + 5.01, { width: hair * 0.9, alpha: 0.85, closed: true, join: 'round' })
      // Its foot, down to the ground.
      const foot = projectPath([at([0, 0, 0], s, R_TROUGH + 1.6, Math.PI), [A[0] * s, -36, 0]], project, xy)
      depth.path(foot.xy, foot.z - 9.8, { width: hair * 1.3, alpha: 0.7 })
    }
    const ground = projectPath([[-HALF - 8, -36, 0], [HALF + 6, -36, 0]], project, xy)
    depth.path(ground.xy, -60, { width: hair, alpha: 0.4 })

    // The granules: a little heap in each pocket, riding up one pitch a turn; one in the accent.
    const advance = (PITCH * spin) / TAU
    for (let k = -3; k <= 3; k++) {
      const centre = PITCH * k + advance - PITCH / 2
      for (let g = 0; g < (small ? 3 : GRAINS.length); g++) {
        const [ds, da, size] = GRAINS[g]!
        const s = centre + ds
        const show = span(s, -HALF + 1, -HALF + 7) * (1 - span(s, HALF - 7, HALF - 1))
        if (show <= 0) continue
        project(...at(grain, s, R_TROUGH - 1.4 - (g > 3 ? 1.6 : 0), Math.PI + da), p)
        const side = (size * clamp(view.size * 0.036, 1.8, 5)) / view.px
        // One grain lights as it rides through the middle of the run, ink again by the seam.
        const lit = k === 0 && g === 1 ? 0.5 - 0.5 * Math.cos(TAU * t) : 0
        depth.square(p, side, show * 0.85 * (1 - lit), 'c1')
        if (lit > 0) depth.square(p, side, show * lit, 'accent')
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An exposed screw flight carries pockets of granules uphill through a cutaway trough. */
export function LoaderAuger(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
