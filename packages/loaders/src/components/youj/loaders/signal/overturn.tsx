'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, hump, lambert, orient, point, projectPath, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'overturn', title: 'Overturn', category: 'signal', technique: 'lines',
  tags: ['convection', 'rolls', 'fluid', 'circulation', 'thermal', 'plume', 'flow'],
  description: 'Two counterrotating convection cells lift a central plume from a heated bed. Layered streamlines fan out beneath the upper boundary and descend along the outer walls; short travelling strokes show the circulation while one accent front rises through the shared updraft.',
  order: 41,
  colors: [{ part: 'Tracers', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const curve: V3[] = Array.from({ length: 65 }, () => [0, 0, 0])
const xy: number[] = []
const p = point()
const q = point()
const depth = new Depth()
const LANES = [[0], [-8, 8], [-10, 10]]
const BED = [[-26, 3], [26, 1]] as const
const SIDES = [-1, 1]
const PLUME = [[0], [-3.4, 0, 3.4]]

/* Color: the short tracers riding the rolls lead in `c1` and fade
 * to the ink behind; the plume stays the accent. */

export const scene: Scene = {
  beats: 5.4, still: 0.33,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.22, pitch: -0.36 }
    const project = camera({ ...pose, distance: 270, cx: view.w / 2, cy: 49 })
    const turn = orient(pose)
    const breathe = view.ease.standard(hump(t))
    const lanes = LANES[small ? 0 : view.size < 80 ? 1 : 2]!
    const shells = small ? 2 : 3
    const samples = small ? 32 : 56

    // A shallow bed and upper boundary give the circulation a real volume.
    for (const [y, thickness] of BED) {
      for (let i = 0; i < 4; i++) {
        quad[i]![0] = i === 1 || i === 2 ? 34 : -34
        quad[i]![1] = y
        quad[i]![2] = i < 2 ? -16 : 16
      }
      let path = projectPath(quad, project, xy)
      if (y < 0) depth.face(path.xy, path.z, lambert(...turn(0, 1, 0)) * 0.7)
      depth.path(path.xy, path.z + 0.01, { width: hair, alpha: y < 0 ? 0.65 : 0.3, closed: true })
      if (y < 0) {
        quad[0]![2] = quad[1]![2] = 16
        quad[2]![1] = quad[3]![1] = y - thickness
        quad[2]![0] = 34
        quad[3]![0] = -34
        path = projectPath(quad, project, xy)
        depth.face(path.xy, path.z, lambert(...turn(0, 0, 1)))
      }
    }

    // Elliptical roll families spread through depth. Their upper halves
    // flatten slightly against the boundary; both inner walls rise and
    // both outer walls descend. Every moving stroke closes its own circuit.
    lanes.forEach((z, lane) => {
      for (const side of SIDES) {
        for (let shell = 0; shell < shells; shell++) {
          const rx = 9 + shell * (small ? 5 : 2.8) + 0.65 * breathe
          const ry = 13 + shell * (small ? 7 : 3.7)
          const xCenter = side * 17
          const at = (out: V3, a: number) => {
            const sin = Math.sin(a)
            out[0] = xCenter + rx * Math.cos(a)
            out[1] = ry * sin * (1 - 0.06 * sin ** 2 * breathe)
            out[2] = z + 1.8 * Math.cos(a) * Math.sin(TAU * t)
          }
          for (let i = 0; i < samples; i++) at(curve[i]!, TAU * i / samples)
          const path = projectPath(curve.slice(0, samples), project, xy)
          const near = clamp((path.z + 34) / 68)
          depth.path(path.xy, path.z, { width: hair * (small ? 0.88 : 0.7), alpha: 0.13 + 0.15 * near, closed: true, join: 'round' })

          // Left roll advances counterclockwise, right clockwise. Its short
          // wake is segmented so front strokes stay in front of rear lanes.
          const phase = -side * (TAU * t + shell * 0.75 + lane * 1.4)
          for (let i = 0; i < 8; i++) {
            const a = phase + side * 0.72 * i / 8
            const b = phase + side * 0.72 * (i + 1) / 8
            at(curve[0]!, a)
            at(curve[1]!, b)
            project(...curve[0]!, p)
            project(...curve[1]!, q)
            depth.line(p, q, hair * (0.9 + 0.15 * near), (0.32 + 0.55 * near) * (1 - i / 11), blend('c1', 'ink', i / 11))
          }
          if (shell === shells - 1 && lane === lanes.length - 1) {
            // Two short wings follow the leading tangent. They make the
            // opposite circulation directions legible in a still frame.
            at(curve[0]!, phase)
            const dx = side * rx * Math.sin(phase)
            const dy = -side * ry * Math.cos(phase)
            const length = Math.hypot(dx, dy)
            const wing = small ? 4.4 : 3.2
            const ax = curve[0]![0]
            const ay = curve[0]![1]
            const az = curve[0]![2] + 0.1
            curve[1]![0] = ax - wing * dx / length - wing * 0.6 * dy / length
            curve[1]![1] = ay - wing * dy / length + wing * 0.6 * dx / length
            curve[1]![2] = az
            curve[2]![0] = ax - wing * dx / length + wing * 0.6 * dy / length
            curve[2]![1] = ay - wing * dy / length - wing * 0.6 * dx / length
            curve[2]![2] = az
            project(...curve[1]!, p)
            project(ax, ay, az, q)
            depth.line(p, q, hair, 0.76)
            project(...curve[2]!, p)
            depth.line(p, q, hair, 0.76)
          }
        }
      }
    })

    // The narrow central plume feeds both rolls. A gentle travelling bend
    // has zero displacement at the bed and cap, keeping the boundaries fixed.
    for (const x of PLUME[small ? 0 : 1]!) {
      for (let i = 0; i <= samples; i++) {
        const s = i / samples
        const envelope = Math.sin(Math.PI * s) ** 2
        curve[i]![0] = x * (0.72 + 0.55 * s) + 1.7 * envelope * Math.sin(TAU * (s - t))
        curve[i]![1] = -22 + 44 * s
        curve[i]![2] = 0
      }
      const path = projectPath(curve.slice(0, samples + 1), project, xy)
      depth.path(path.xy, path.z, { width: hair * 0.75, alpha: x ? 0.28 : 0.46, join: 'round' })
    }
    const front = t
    const shown = view.ease.standard(clamp(Math.min(front, 1 - front) / 0.1))
    if (shown > 0.004) {
      for (let i = 0; i < 9; i++) {
        const s = clamp(front - 0.08 + 0.16 * i / 8)
        curve[i]![0] = 1.7 * Math.sin(Math.PI * s) ** 2 * Math.sin(TAU * (s - t))
        curve[i]![1] = -22 + 44 * s
        curve[i]![2] = 0.2
      }
      const plume = projectPath(curve.slice(0, 9), project, xy)
      depth.path(plume.xy, plume.z + 0.1, { width: hair * 1.45, alpha: shown, tone: 'accent', cap: 'round', join: 'round' })
    }
    if (!small) {
      // Quiet thermal fins in the floor, two spaced ribs rather than dots.
      for (const x of [-17, 17]) {
        project(x - 6, -25.8, 0, p)
        project(x + 6, -25.8, 0, q)
        depth.line(p, q, hair * 0.8, 0.34 + 0.18 * breathe)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Counterrotating thermal rolls circulate around a shared rising plume in a shallow volume. */
export function LoaderOverturn(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
