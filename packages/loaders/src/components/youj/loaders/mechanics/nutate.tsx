'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, point, projectPath, Depth, type Project, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'nutate', title: 'Nutate', category: 'mechanics', technique: 'planes',
  tags: ['gyroscope', 'precession', 'nutation', 'flywheel', 'angular momentum', 'pivot'],
  description: 'A spoked flywheel spins on a leaning axle that precesses round a pivot on its pedestal. Two nods a turn modulate the cone, the axle tip traces its looping path, and a short accent on the rim follows the independent spin.',
  order: 32,
  colors: [{ part: 'Trace', mono: 'ink' }],
} satisfies LoaderMeta

/* A gyroscope on a turned pedestal: the axle's foot sits in a cup on a
 * slim post, the flywheel (rim, hub, three spokes) spins three times a
 * loop, and the axle precesses once round the pivot while nodding twice,
 * so its tip traces a looping curve: drawn faintly, the tip riding it.
 * On the pedestal's base, the axle's shadow turns with the precession.
 *
 * Color: the axle tip’s looping trace is `c1` where the tip has just passed, settling to the ink behind it; the rim mark stays the accent. */

const PIVOT = -25
const RIM = 18
const INNER = 14.8
const HUB = 2.6
const TIP = 44
const quad = Array.from({ length: 4 }, () => [0, 0, 0] as V3)
const trace: V3[] = []
const xy: number[] = []
const p = point()
const q = point()
const depth = new Depth()

interface Pose { axis: V3; u: V3; v: V3; spin: number }

/** The gyroscope's frame at loop progress t: its axis, two directions across it, and the spin. */
function pose(t: number, view: View, out: Pose) {
  const phi = TAU * t + 0.55
  const nod = view.ease.standard(0.5 + 0.5 * Math.cos(2 * TAU * t))
  const tilt = 0.42 + 0.16 * nod
  const c = Math.cos(tilt)
  const s = Math.sin(tilt)
  const cp = Math.cos(phi)
  const sp = Math.sin(phi)
  out.axis[0] = s * cp
  out.axis[1] = c
  out.axis[2] = s * sp
  out.u[0] = c * cp
  out.u[1] = -s
  out.u[2] = c * sp
  out.v[0] = -sp
  out.v[1] = 0
  out.v[2] = cp
  out.spin = 3 * TAU * t
  return out
}
const frame: Pose = { axis: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], spin: 0 }
const other: Pose = { axis: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], spin: 0 }

/** A point on the gyroscope: radius r at angle a about the axis, `height` along it from the pivot. */
function at(f: Pose, out: V3, r: number, a: number, height: number) {
  const x = r * Math.cos(a)
  const z = r * Math.sin(a)
  out[0] = f.axis[0] * height + f.u[0] * x + f.v[0] * z
  out[1] = PIVOT + f.axis[1] * height + f.u[1] * x + f.v[1] * z
  out[2] = f.axis[2] * height + f.u[2] * x + f.v[2] * z
}

/** An upright turned cylinder: the side strips toward the viewer and the top, lit, outlined. */
function column(project: Project, turn: Turn, r: number, y0: number, y1: number, sides: number, hair: number) {
  for (let i = 0; i < sides; i++) {
    const a = (TAU * i) / sides
    const b = (TAU * (i + 1)) / sides
    const m = (a + b) / 2
    const n = turn(Math.cos(m), 0, Math.sin(m))
    if (n[2] <= 0) continue
    const f = projectPath([[r * Math.cos(a), y0, r * Math.sin(a)], [r * Math.cos(b), y0, r * Math.sin(b)], [r * Math.cos(b), y1, r * Math.sin(b)], [r * Math.cos(a), y1, r * Math.sin(a)]], project, xy)
    depth.face(f.xy, f.z, lambert(...n))
  }
  xy.length = 0
  let z = 0
  for (let i = 0; i < sides; i++) {
    project(r * Math.cos((TAU * i) / sides), y1, r * Math.sin((TAU * i) / sides), p)
    xy.push(p.x, p.y)
    z += p.z / sides
  }
  depth.face(xy, z + 0.5, lambert(...turn(0, 1, 0)))
  depth.path(xy, z + 0.51, { width: hair, alpha: 0.7, closed: true, join: 'round' })
}

export const scene: Scene = {
  beats: 5.2, still: 0.19,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.1 : 1.05) / view.px
    const cam = { yaw: -0.3, pitch: -0.4 }
    const lens = camera({ ...cam, distance: 245, cx: view.w / 2 - 3, cy: small ? 47 : 44 })
    // Below 32px the gyroscope fills more of the frame: the base is a line there, so there's room.
    const zoom = small ? 1.18 : 1
    const project: Project = (x, y, z, out) => lens(x * zoom, y * zoom, z * zoom, out)
    const turn = orient(cam)
    const f = pose(t, view, frame)
    const { axis, u, v, spin } = f
    const count = small ? 24 : 40

    // The pedestal: a turned base, a slim post, the cup the axle's foot sits in.
    if (!small) column(project, turn, 12, PIVOT - 9, PIVOT - 6, 28, hair * 0.9)
    else {
      project(-12, PIVOT - 6, 0, p)
      project(12, PIVOT - 6, 0, q)
      depth.line(p, q, hair * 1.2, 0.7)
    }
    column(project, turn, 1.5, PIVOT - 6, PIVOT - 1.2, small ? 8 : 12, hair * 0.8)
    column(project, turn, 2.6, PIVOT - 1.2, PIVOT, small ? 10 : 16, hair * 0.8)
    if (!small) {
      // The axle's shadow on the base, turning with the precession.
      project(0, PIVOT - 5.98, 0, p)
      project(10.5 * Math.cos(TAU * t + 0.55), PIVOT - 5.98, 10.5 * Math.sin(TAU * t + 0.55), q)
      p.z = q.z = -500
      depth.line(p, q, hair * 2.4, 0.16)
    }

    // The tip's path over the whole loop: precession with two nutation loops, in short dashes sorted by depth.
    if (!small) {
      trace.length = 0
      for (let i = 0; i <= 96; i++) {
        const g = pose(i / 96, view, other)
        trace.push([g.axis[0] * TIP, PIVOT + g.axis[1] * TIP, g.axis[2] * TIP])
      }
      for (let i = 0; i < 96; i += 2) {
        project(...trace[i]!, p)
        project(...trace[i + 1]!, q)
        // The path the tip has just traced is in its color, settling to the ink behind it.
        const age = (((t - i / 96) % 1) + 1) % 1
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.75, alpha: 0.32, tone: blend('c1', 'ink', age / 0.45) })
      }
    }

    // The axle, from the cup through the hub to its tip ball.
    at(f, quad[0]!, 0, 0, 0)
    at(f, quad[1]!, 0, 0, TIP)
    const axle = projectPath([quad[0]!, quad[1]!], project, xy)
    depth.path(axle.xy, axle.z, { width: hair * (small ? 1.6 : 2.2), alpha: 0.9, cap: 'round' })
    pin(depth, project, turn, quad[1]![0], quad[1]![1], quad[1]![2], small ? 1.6 : 1.3, hair * 0.8, 'ink', axle.z + 25)

    // The flywheel: rim faces (top, underside, outer and inner walls), lit by their normals.
    for (let i = 0; i < count; i++) {
      const a = (TAU * i) / count
      const b = (TAU * (i + 1)) / count
      for (const h of [27, 30]) {
        const sgn = h === 30 ? 1 : -1
        const n = turn(axis[0] * sgn, axis[1] * sgn, axis[2] * sgn)
        if (n[2] <= 0) continue
        at(f, quad[0]!, INNER, a, h)
        at(f, quad[1]!, RIM, a, h)
        at(f, quad[2]!, RIM, b, h)
        at(f, quad[3]!, INNER, b, h)
        const path = projectPath(quad, project, xy)
        depth.face(path.xy, path.z, lambert(...n))
      }
      const mid = (a + b) / 2
      const normal: V3 = [u[0] * Math.cos(mid) + v[0] * Math.sin(mid), u[1] * Math.cos(mid) + v[1] * Math.sin(mid), u[2] * Math.cos(mid) + v[2] * Math.sin(mid)]
      for (const r of [INNER, RIM]) {
        const sgn = r === RIM ? 1 : -1
        const n = turn(normal[0] * sgn, normal[1] * sgn, normal[2] * sgn)
        if (n[2] <= 0) continue
        at(f, quad[0]!, r, a, 27)
        at(f, quad[1]!, r, b, 27)
        at(f, quad[2]!, r, b, 30)
        at(f, quad[3]!, r, a, 30)
        const path = projectPath(quad, project, xy)
        depth.face(path.xy, path.z, lambert(...n))
      }
      // The rim's top edge, split so its far half passes behind the axle; a groove inside it.
      at(f, quad[0]!, RIM, a, 30)
      at(f, quad[1]!, RIM, b, 30)
      project(...quad[0]!, p)
      project(...quad[1]!, q)
      depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.03, { width: hair * 0.9, alpha: clamp(0.65 + p.z / 110, 0.38, 0.95) })
      if (large && (i & 1) === 0) {
        at(f, quad[0]!, RIM - 1.6, a, 30.02)
        at(f, quad[1]!, RIM - 1.6, a + (TAU * 2) / count, 30.02)
        project(...quad[0]!, p)
        project(...quad[1]!, q)
        const n = turn(axis[0], axis[1], axis[2])
        if (n[2] > 0) depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 + 0.04, { width: hair * 0.6, alpha: 0.3 })
      }
    }
    // Three flat spokes from the hub to the rim, turning with the spin.
    for (let k = 0; k < 3; k++) {
      const a = spin + (TAU * k) / 3
      const w = 0.8
      at(f, quad[0]!, HUB, a - w / HUB, 28.5)
      at(f, quad[1]!, INNER + 0.2, a - w / INNER, 28.5)
      at(f, quad[2]!, INNER + 0.2, a + w / INNER, 28.5)
      at(f, quad[3]!, HUB, a + w / HUB, 28.5)
      const path = projectPath(quad, project, xy)
      const n = turn(...axis)
      const sgn = n[2] < 0 ? -1 : 1
      depth.face(path.xy, path.z, lambert(n[0] * sgn, n[1] * sgn, n[2] * sgn) * 0.9)
      if (!small) depth.path(path.xy, path.z + 0.01, { width: hair * 0.6, alpha: 0.5, closed: true })
    }
    // The hub: a short drum on the axle.
    for (let i = 0; i < 12; i++) {
      const a = spin + (TAU * i) / 12
      const b = spin + (TAU * (i + 1)) / 12
      const m = (a + b) / 2
      const n = turn(u[0] * Math.cos(m) + v[0] * Math.sin(m), u[1] * Math.cos(m) + v[1] * Math.sin(m), u[2] * Math.cos(m) + v[2] * Math.sin(m))
      if (n[2] <= 0) continue
      at(f, quad[0]!, HUB, a, 25.5)
      at(f, quad[1]!, HUB, b, 25.5)
      at(f, quad[2]!, HUB, b, 31.5)
      at(f, quad[3]!, HUB, a, 31.5)
      const path = projectPath(quad, project, xy)
      depth.face(path.xy, path.z, lambert(...n))
    }
    // A short rim inlay shows the spin without colouring the whole wheel.
    for (let i = 0; i < 5; i++) {
      const a = spin + (0.22 * i) / 5
      const b = spin + (0.22 * (i + 1)) / 5
      at(f, quad[0]!, RIM + 0.12, a, 30.1)
      at(f, quad[1]!, RIM + 0.12, b, 30.1)
      const path = projectPath([quad[0]!, quad[1]!], project, xy)
      depth.path(path.xy, path.z, { width: hair * 1.7, alpha: 1, tone: 'accent', cap: 'round' })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An independently spinning open flywheel nods while its axle precesses around a fixed foot. */
export function LoaderNutate(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
