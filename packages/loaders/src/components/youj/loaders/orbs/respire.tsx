'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, hump, orient, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, grids, hairline, lod, near, surface, type V3 } from './sphere'

export const meta = {
  id: 'respire', title: 'Respire', category: 'orbs', technique: 'lines',
  tags: ['orb', 'breathing', 'elastic', 'satellites', 'pressure'],
  description: 'A meridian skin, drawn in hidden-line style, breathes through two elastic modes while paired satellites orbit in opposed inclined planes, passing behind it and across it. Their approaches pull the poles outward, and a short equatorial pressure front circles the returning skin.',
  order: 9,
  colors: [{ part: 'Trails', mono: 'ink' }],
} satisfies LoaderMeta

/* The skin is a drawing of a solid: an opaque body (the convex outline of
 * its samples, laid on the paper) hides what's behind it, the meridians and
 * parallels on the near side are drawn solid, and those on the far side
 * dashed, as a draughtsman shows hidden edges. Its radius breathes through
 * two modes (a prolate–oblate swing and a slower four-lobed wobble), and the
 * two satellites, lit little spheres on inclined orbits, pass behind the
 * body (hidden) and in front of it. The polar axis runs through it,
 * dash-dot, and the accent pressure front circles the equator, dashed while
 * it's round the back.
 *
 * Color: each satellite’s trail leaves it in `c1` and settles to the ink along its length. */

const RADIUS = 25
const depth = new Depth()
const p = point()
const q = point()
const tmp: V3 = [0, 0, 0]
const centre: V3 = [0, 0, 0]
const hull: [number, number][] = []
const pts: [number, number][] = []
const xy: number[] = []

/** The convex hull of screen points (Andrew's monotone chain), as a flat closed outline. */
function convex(points: [number, number][], out: number[]) {
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  hull.length = 0
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  for (const pt of points) {
    while (hull.length >= 2 && cross(hull[hull.length - 2]!, hull[hull.length - 1]!, pt) <= 0) hull.pop()
    hull.push(pt)
  }
  const lower = hull.length + 1
  for (let i = points.length - 2; i >= 0; i--) {
    const pt = points[i]!
    while (hull.length >= lower && cross(hull[hull.length - 2]!, hull[hull.length - 1]!, pt) <= 0) hull.pop()
    hull.push(pt)
  }
  hull.pop()
  out.length = 0
  for (const [x, y] of hull) out.push(x, y)
  return out
}

export const scene: Scene = {
  beats: 5, still: 0.27,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view)
    const small = level === 0
    const circle = circles[Math.min(level, 1)]!
    const hair = hairline(view)
    const count = [4, 5, 6][level]!
    const pose = { yaw: 0.25 + 0.08 * Math.sin(TAU * t), pitch: -0.22 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const breath = 2 * view.ease.standard(hump(t)) - 1
    const mode = Math.sin(TAU * t)
    const radius = (lat: number, lon: number) => {
      const sy = Math.sin(lat)
      const c = Math.cos(lat)
      return RADIUS * (1 + 0.1 * breath * (1 - 3 * sy * sy) + 0.035 * mode * Math.cos(2 * lon) * c * c)
    }
    const place = (lat: number, lon: number, v: V3) => {
      const r = radius(lat, lon)
      v[0] = r * Math.cos(lat) * Math.cos(lon)
      v[1] = r * Math.sin(lat)
      v[2] = r * Math.cos(lat) * Math.sin(lon)
    }
    /** Whether the skin at (lat, lon) faces the eye: its outward direction, carried into view. */
    const facing = (lat: number, lon: number) => turn(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon))[2]

    // The body: an opaque outline on the paper, hiding what passes behind it.
    pts.length = 0
    for (let j = 1; j < 12; j++) {
      const lat = -Math.PI / 2 + (Math.PI * j) / 12
      for (let i = 0; i < 24; i++) {
        place(lat, (TAU * i) / 24, tmp)
        project(...tmp, p)
        pts.push([p.x, p.y])
      }
    }
    for (const lat of [-Math.PI / 2, Math.PI / 2]) {
      place(lat, 0, tmp)
      project(...tmp, p)
      pts.push([p.x, p.y])
    }
    depth.poly(convex(pts, xy), 0, 0, 'ink', true)

    /** A curve on the skin, solid where it faces the eye and dashed where it's round the back. */
    const stroke = (at: (u: number) => [number, number], steps: number, width: number, alpha: number, tone: 'ink' | 'accent' = 'ink', from = 0, to = 1) => {
      for (let i = 0; i < steps; i++) {
        const u0 = from + ((to - from) * i) / steps
        const u1 = from + ((to - from) * (i + 1)) / steps
        const [la, lo] = at(u0)
        const [lb, lob] = at(u1)
        place(la, lo, tmp)
        project(...tmp, p)
        place(lb, lob, tmp)
        project(...tmp, q)
        const front = facing((la + lb) / 2, (lo + lob) / 2) > 0
        if (front) depth.line(p, q, width, alpha * near((p.z + q.z) / 2, RADIUS), tone)
        else if (!small) depth.path([p.x, p.y, q.x, q.y], 0.01, { width: width * 0.8, alpha: alpha * 0.32, tone, dash: [2.2 * hair, 2.4 * hair] })
      }
    }
    const steps = circle.length - 1
    for (let g = 0; g < count; g++) {
      const lon = (Math.PI * g) / count
      stroke((u) => [TAU * u, lon], steps, hair * (small ? 1.1 : 0.95), 0.95)
    }
    for (const lat of small ? [0] : [-0.62, 0, 0.62]) stroke((u) => [lat, TAU * u], steps, hair * (lat === 0 ? 1.05 : 0.85), lat === 0 ? 0.9 : 0.7)

    // The polar axis, dash-dot, out past both poles.
    if (!small) {
      for (const sign of [-1, 1]) {
        place((sign * Math.PI) / 2, 0, tmp)
        project(...tmp, p)
        project(0, tmp[1] + sign * 7, 0, q)
        depth.path([p.x, p.y, q.x, q.y], 30, { width: hair * 0.8, alpha: 0.55, dash: [4 * hair, 1.6 * hair, 1.2 * hair, 1.6 * hair] })
        p.z = 30
        depth.dot(p, 0.9 / view.px + 0.25, 0.9)
      }
    }

    // The satellites: lit spheres on opposed inclined orbits, hidden by the body when they pass behind it, with short wakes.
    const grid = grids[Math.min(level, 1)]!
    for (let s = 0; s < 2; s++) {
      const a = TAU * (t + s * 0.5)
      const r = 36 + 2 * breath
      const sign = s ? -1 : 1
      const orbit = (u: number, out: V3) => {
        out[0] = r * Math.cos(u)
        out[1] = sign * r * 0.48 * Math.sin(u)
        out[2] = r * 0.82 * Math.sin(u)
        return out
      }
      orbit(a, centre)
      grid.unit.forEach((v, i) => {
        const w = grid.world[i]!
        w[0] = centre[0] + 3.4 * v[0]
        w[1] = centre[1] + 3.4 * v[1]
        w[2] = centre[2] + 3.4 * v[2]
      })
      surface(depth, project, turn, grid)
      if (!small) {
        for (let j = 0; j < 8; j++) {
          project(...orbit(a - 0.16 - j * 0.04, tmp), p)
          project(...orbit(a - 0.2 - j * 0.04, tmp), q)
          depth.line(p, q, hair * 0.75, (1 - j / 8) * 0.5 * near((p.z + q.z) / 2), blend('c1', 'ink', j / 8))
        }
      }
    }

    // The pressure front: a short accent arc circling the equator.
    stroke((u) => [0, u], 6, hair * (small ? 1.7 : 1.6), 1, 'accent', TAU * t, TAU * t + 0.42)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A breathing skin, drawn with its hidden lines dashed, orbited by two satellites that pass behind it. */
export function LoaderRespire(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
