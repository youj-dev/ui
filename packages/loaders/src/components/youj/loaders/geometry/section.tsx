'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, facing, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'section',
  title: 'Section',
  category: 'geometry',
  technique: 'mixed',
  tags: ['cube', 'slice', 'cross-section', 'hexagon', 'scan', 'print', 'hidden line', 'wireframe'],
  description:
    'A wireframe cube stands on its corner, turning; a plane rises through it and leaves it solid, its cut face in the accent going from triangle to hexagon to triangle, and a second plane follows and returns it to lines.',
  order: 5,
  colors: [{ part: 'Hidden edges', mono: 'ink' }],
} satisfies LoaderMeta

/* A cube balanced on a corner, its long diagonal upright, turning a third
 * of a turn a loop (its own symmetry, so the loop has no seam). It's drawn
 * in hidden-line convention: edges toward the viewer solid, the rest dashed.
 * A section plane rises through it, marked by crop marks at its corners;
 * below it the cube is printed solid, its faces lit by their normals and the
 * cut face in the accent, a triangle widening to a hexagon at the middle
 * and narrowing to a triangle again. It pauses on the hexagon. Half a loop
 * behind, a second plane rises and clears the solid back to lines, so the
 * cube is all lines at both ends of the loop.
 *
 * Color: the hidden edges behind the cut are dashed in `c1`; the
 * visible solid stays ink and the section face the accent. */

type V3 = [number, number, number]

const H = 16.5
const SPAN = Math.sqrt(3) * H

/** The cube's corners turned so its long diagonal stands upright. */
const CORNERS: V3[] = (() => {
  const raw: V3[] = []
  for (let i = 0; i < 8; i++) raw.push([i & 1 ? H : -H, i & 2 ? H : -H, i & 4 ? H : -H])
  // Turn (1, 1, 1) onto +y: about the axis (1, 0, -1) by the angle between them.
  const a = Math.acos(1 / Math.sqrt(3))
  const k = [1 / Math.SQRT2, 0, -1 / Math.SQRT2]
  const c = Math.cos(a)
  const s = Math.sin(a)
  return raw.map(([x, y, z]) => {
    const dot = k[0]! * x + k[2]! * z
    const cx = k[1]! * z - k[2]! * y
    const cy = k[2]! * x - k[0]! * z
    const cz = k[0]! * y - k[1]! * x
    return [x * c + cx * s + k[0]! * dot * (1 - c), y * c + cy * s, z * c + cz * s + k[2]! * dot * (1 - c)]
  })
})()

/** Faces as corner indices, counter-clockwise seen from outside, with their outward normals; edges with the faces either side. */
const FACES = [
  [0, 4, 6, 2],
  [1, 3, 7, 5],
  [0, 1, 5, 4],
  [2, 6, 7, 3],
  [0, 2, 3, 1],
  [4, 5, 7, 6],
].map((quad) => {
  const [a, b, c] = quad.map((i) => CORNERS[i]!) as [V3, V3, V3]
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: V3 = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!]
  // Outward (the cube is centered on the origin): if not, the corners run the other way round.
  const out = n[0] * (a[0] + c[0]) + n[1] * (a[1] + c[1]) + n[2] * (a[2] + c[2]) > 0
  return out ? { q: quad, n } : { q: [...quad].reverse(), n: n.map((x) => -x) as V3 }
})
const EDGES: { a: number; b: number; faces: number[] }[] = []
FACES.forEach(({ q }, f) =>
  q.forEach((a, i) => {
    const b = q[(i + 1) % 4]!
    const found = EDGES.find((e) => (e.a === b && e.b === a) || (e.a === a && e.b === b))
    if (found) found.faces.push(f)
    else EDGES.push({ a, b, faces: [f] })
  }),
)

const YAW = 0
const PITCH = -0.8
const depth = new Depth()
const world: V3[] = CORNERS.map(() => [0, 0, 0])
const P = CORNERS.map(() => point())
const p = point()
const q = point()
const front: boolean[] = FACES.map(() => false)

/** A convex polygon clipped to the slab lo ≤ y ≤ hi (Sutherland–Hodgman, both sides). */
function clip(poly: V3[], lo: number, hi: number): V3[] {
  let out = poly
  for (const [limit, keepBelow] of [
    [hi, true],
    [lo, false],
  ] as const) {
    const input = out
    out = []
    for (let i = 0; i < input.length; i++) {
      const a = input[i]!
      const b = input[(i + 1) % input.length]!
      const ina = keepBelow ? a[1] <= limit : a[1] >= limit
      const inb = keepBelow ? b[1] <= limit : b[1] >= limit
      if (ina) out.push(a)
      if (ina !== inb) {
        const s = (limit - a[1]) / (b[1] - a[1])
        out.push([mix(a[0], b[0], s), limit, mix(a[2], b[2], s)])
      }
    }
    if (out.length < 3) return []
  }
  return out
}

/** Where the plane at height y cuts the cube: the section's corners, in order round it. */
function section(y: number): V3[] {
  const pts: V3[] = []
  for (const { a, b } of EDGES) {
    const A = world[a]!
    const B = world[b]!
    if ((A[1] - y) * (B[1] - y) < 0) {
      const s = (y - A[1]) / (B[1] - A[1])
      pts.push([mix(A[0], B[0], s), y, mix(A[2], B[2], s)])
    }
  }
  const cx = pts.reduce((v, r) => v + r[0], 0) / (pts.length || 1)
  const cz = pts.reduce((v, r) => v + r[2], 0) / (pts.length || 1)
  return pts.sort((m, n) => Math.atan2(m[2] - cz, m[0] - cx) - Math.atan2(n[2] - cz, n[0] - cx))
}

export const scene: Scene = {
  beats: 6.5,
  still: 0.24,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.15 : 1) / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.25 : 1.4) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const project = camera({ yaw: YAW, pitch: PITCH, distance: 320, cx: view.w / 2, cy: view.h / 2 + 2 })
    const turn = orient({ yaw: YAW, pitch: PITCH })

    // A third of a turn a loop: the cube on its corner looks the same every third.
    const spin = (TAU / 3) * t + 0.35
    const cs = Math.cos(spin)
    const sn = Math.sin(spin)
    CORNERS.forEach(([x, y, z], i) => {
      const w = world[i]!
      w[0] = x * cs + z * sn
      w[1] = y
      w[2] = -x * sn + z * cs
      project(w[0], w[1], w[2], P[i]!)
    })
    FACES.forEach(({ q: f }, i) => (front[i] = facing(P[f[0]!]!, P[f[1]!]!, P[f[2]!]!) < 0))

    // The planes: the printer rises to the middle, holds on the hexagon, and on to the top; the clearing plane follows.
    const rise = (from: number) => (view.ease.emphasized(span(t, from, from + 0.2)) + view.ease.emphasized(span(t, from + 0.26, from + 0.46))) / 2
    const print = mix(-SPAN - 1, SPAN + 1, rise(0.02))
    const clear = mix(-SPAN - 1, SPAN + 1, rise(0.5))

    // The solid between the two planes: front faces clipped to it and lit, the cut face on top in the accent.
    const solid = print > clear + 0.01
    if (solid) {
      FACES.forEach(({ q: f, n }, i) => {
        if (!front[i]) return
        const part = clip(f.map((c) => world[c]!), clear, print)
        if (!part.length) return
        const xy: number[] = []
        for (const [x, y, zz] of part) {
          project(x, y, zz, p)
          xy.push(p.x, p.y)
        }
        const nx = n[0] * cs + n[2] * sn
        const nz = -n[0] * sn + n[2] * cs
        depth.face(xy, -20, lambert(...turn(nx, n[1], nz)))
      })
      // The cut face: the solid's top, lit like one, edged and tinted in the accent.
      const cut = section(print)
      if (cut.length >= 3) {
        const xy = cut.flatMap(([x, y, z]) => (project(x, y, z, p), [p.x, p.y]))
        depth.face(xy, -18, lambert(...turn(0, 1, 0)))
        depth.poly(xy, -18, 0.2, 'accent')
        depth.path(xy, -17, { width: line, alpha: 1, closed: true, tone: 'accent', join: 'miter' })
      }
    }

    // The wire: edges toward the viewer solid, the hidden ones dashed, and hidden behind the solid where it stands.
    for (const edge of EDGES) {
      // Each edge runs left to right and sorts by its own depth (then across the screen), so a turn by the cube's symmetry draws the very same frame.
      const [a, b] = P[edge.a]!.x <= P[edge.b]!.x ? [edge.a, edge.b] : [edge.b, edge.a]
      const A = world[a]!
      const B = world[b]!
      const order = (P[a]!.z + P[b]!.z) / 1000 + (P[a]!.x + P[b]!.x) / 1e6
      if (edge.faces.some((f) => front[f])) {
        depth.path([P[a]!.x, P[a]!.y, P[b]!.x, P[b]!.y], 10 + order, { width: line, alpha: 0.9, cap: 'round' })
        continue
      }
      // The hidden edge's stretches outside the slab [clear, print], as fractions along it.
      const ya = A[1]
      const yb = B[1]
      const at = (y: number) => clamp((y - ya) / (yb - ya || 1e-6))
      const cuts = solid ? [at(clear), at(print)].sort((m, n) => m - n) : [0, 0]
      const pieces: [number, number][] = solid ? [[0, cuts[0]!], [cuts[1]!, 1]] : [[0, 1]]
      for (const [s0, s1] of pieces) {
        if (s1 - s0 < 0.002) continue
        project(mix(A[0], B[0], s0), mix(ya, yb, s0), mix(A[2], B[2], s0), p)
        project(mix(A[0], B[0], s1), mix(ya, yb, s1), mix(A[2], B[2], s1), q)
        // Above the printing plane nothing of the solid is in front of it (the eye is above the plane): draw it over the cut.
        const z = (solid && mix(ya, yb, (s0 + s1) / 2) > print ? -15 : -30) + order
        if (small) depth.path([p.x, p.y, q.x, q.y], z, { width: hair, alpha: 0.28, tone: 'c1' })
        else depth.path([p.x, p.y, q.x, q.y], z, { width: hair, alpha: 0.42, tone: 'c1', dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash) })
      }
    }

    // Crop marks at the printing plane's corners while it's inside the cube, and a registration mark under the corner it stands on.
    if (!small) {
      const arm = H * 0.26
      project(-arm, -SPAN, 0, p)
      project(arm, -SPAN, 0, q)
      depth.line(p, q, hair, 0.45)
      project(0, -SPAN, -arm, p)
      project(0, -SPAN, arm, q)
      depth.line(p, q, hair, 0.45)
      const inside = span(print, -SPAN - 1, -SPAN + 4) * (1 - span(print, SPAN - 4, SPAN + 1))
      if (inside > 0) {
        const R = H * 1.75
        const arm = H * 0.32
        for (const [sx, sz] of [
          [1, 1],
          [1, -1],
          [-1, -1],
          [-1, 1],
        ] as const) {
          project(sx * R, print, sz * R, p)
          project(sx * (R - arm), print, sz * R, q)
          depth.line(p, q, hair, 0.5 * inside)
          project(sx * R, print, sz * (R - arm), q)
          depth.line(p, q, hair, 0.5 * inside)
        }
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A cube on its corner is printed solid by a rising section plane, its cut face in the accent, and cleared again. */
export function LoaderSection(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
