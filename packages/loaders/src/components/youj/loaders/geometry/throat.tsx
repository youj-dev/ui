'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'throat', title: 'Throat', category: 'geometry', technique: 'lines',
  tags: ['catenoid', 'minimal surface', 'soap film', 'membrane', 'neck', 'rings'],
  description: 'A soap-film throat stretches between two wire hoops. Their separation increases as the catenoid neck narrows; sparse meridians follow the minimal surface, the hoops return, and a short accent arc travels around the waist.',
  order: 29,
  colors: [{ part: 'Film', mono: 'ink' }],
} satisfies LoaderMeta

/* A soap film between two wire hoops, held on a stand: an upright rod on a
 * foot, each hoop on an arm whose collar slides along the rod. The hoops
 * draw apart (`emphasized`) and the film's neck narrows exactly as a
 * catenoid's must, r = a·cosh(y / a), with both hoops kept at their radius;
 * then they come back together (`standard`). The film is a faint lit skin
 * (it hides what's behind it), ruled with a few meridians that drift a
 * meridian's spacing round each loop, so the film is never still; its
 * waist ring carries a short accent arc that travels once round, drawn to
 * the exact point, and the hoops are heavy wire, their back halves going
 * behind the film.
 *
 * Color: the film’s meridians lean toward `c1`, set apart from the
 * ink hoops; the neck’s ring stays the accent. */

const HOOP = 27
const ROD = -35
const YAW = 0.22
const PITCH = -0.42
const ZOOM = 1.18

const depth = new Depth()
const P = [point(), point(), point(), point()]
const a = point()
const b = point()
const xy: number[] = []
const ringX: number[] = []
const ringY: number[] = []
const ringZ: number[] = []
const keys: number[] = []

export const scene: Scene = {
  beats: 5.5,
  still: 0.36,
  draw(pen, t, view) {
    const small = view.size < 32
    const rows = small ? 6 : view.size < 80 ? 10 : 12
    const sides = small ? 16 : 24
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const pose = { yaw: YAW + 0.05 * Math.sin(TAU * t), pitch: PITCH }
    // Centered on the whole apparatus: with its stand above 32px, on the film and hoops alone below.
    const lens = camera({ ...pose, distance: 330, cx: view.w / 2 + (small ? 0 : 7), cy: view.h / 2 - 1 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    const turn = orient(pose)
    const stretch = clamp(view.ease.emphasized(span(t, 0.04, 0.4)) - view.ease.standard(span(t, 0.56, 0.96)))
    const neck = 23 - 9 * stretch
    // r(y) = a·cosh(y/a); solving for y keeps both hoops at exactly their radius while the neck changes.
    const half = neck * Math.acosh(HOOP / neck)
    const surface = (y: number, theta: number, out: Projected) => {
      const r = neck * Math.cosh(y / neck)
      return project(r * Math.cos(theta), y, r * Math.sin(theta), out)
    }
    // The meridians drift one spacing a loop.
    const every = 4
    const drift = (TAU * every * t) / sides

    // The film: a faint lit skin, front facets only (each facet's depth kept, NaN where it faces away).
    const rowY = (i: number) => -half + (2 * half * i) / rows
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < sides; j++) {
        const q0 = (TAU * j) / sides
        const q1 = (TAU * (j + 1)) / sides
        const n = turn(Math.cos((q0 + q1) / 2), -Math.sinh((rowY(i) + rowY(i + 1)) / 2 / neck), Math.sin((q0 + q1) / 2))
        keys[i * sides + j] = NaN
        if (n[2] <= 0) continue
        // Each facet overlaps its neighbours a little, so the film is whole: nothing behind it shows through the seams.
        const qa = q0 - 0.12 / sides
        const qb = q1 + 0.12 / sides
        const ya = Math.max(-half, rowY(i) - (0.15 * half) / rows)
        const yb = Math.min(half, rowY(i + 1) + (0.15 * half) / rows)
        surface(ya, qa, P[0]!)
        surface(ya, qb, P[1]!)
        surface(yb, qb, P[2]!)
        surface(yb, qa, P[3]!)
        xy.length = 0
        let z = 0
        for (const p of P) {
          xy.push(p.x, p.y)
          z += p.z / 4
        }
        keys[i * sides + j] = z
        depth.poly(xy, z, 0.035 + 0.07 * lambert(...n), 'ink', true)
      }
    }
    /** Just over the facets a line lies on (rows i0..i1, columns j0..j1, wrapping round); NaN if none of them faces us. */
    const over = (i0: number, i1: number, j0: number, j1: number) => {
      let k = NaN
      for (let i = Math.max(0, i0); i <= Math.min(rows - 1, i1); i++)
        for (let j = j0; j <= j1; j++) {
          const v = keys[i * sides + (((j % sides) + sides) % sides)]!
          if (!Number.isNaN(v)) k = Number.isNaN(k) ? v : Math.max(k, v)
        }
      return k + 0.02
    }
    // A few parallels on the film, each piece over the facets either side of it, fading where the film turns edge-on.
    for (let i = small ? 2 : 3; i < rows; i += small ? 2 : 3) {
      for (let j = 0; j < sides; j++) {
        const key = over(i - 1, i, j - 1, j + 1)
        if (Number.isNaN(key)) continue
        const q0 = (TAU * j) / sides
        const q1 = (TAU * (j + 1)) / sides
        const n = turn(Math.cos((q0 + q1) / 2), -Math.sinh(rowY(i) / neck), Math.sin((q0 + q1) / 2))
        surface(rowY(i), q0, a)
        surface(rowY(i), q1, b)
        depth.path([a.x, a.y, b.x, b.y], key, { width: hair * 0.8, alpha: 0.24 * clamp(n[2] * 3), cap: 'round' })
      }
    }
    // Meridians, drifting: each a line down the film at its own angle, piece by piece over the facet it crosses.
    for (let m = 0; m < sides / every; m++) {
      const theta = (TAU * m * every) / sides + drift
      const col = Math.floor((theta / TAU) * sides)
      for (let i = 0; i < rows; i++) {
        const key = over(i - 1, i + 1, col - 1, col + 1)
        if (Number.isNaN(key)) continue
        const n = turn(Math.cos(theta), -Math.sinh((rowY(i) + rowY(i + 1)) / 2 / neck), Math.sin(theta))
        surface(rowY(i), theta, a)
        surface(rowY(i + 1), theta, b)
        depth.path([a.x, a.y, b.x, b.y], key, { width: hair, alpha: 0.62 * clamp(n[2] * 4), cap: 'round', tone: blend('ink', 'c1', 0.7) })
      }
    }

    // The hoops and the waist: each drawn as its near arc and its far arc, one stroke apiece (no beads where pieces
    // overlap). The film lies inside the rings, so a near arc is over all of it and a far arc under all of it.
    const ringSteps = view.size < 80 ? sides * 2 : 64
    const NEAR = 600
    const FAR = -1000
    const ring = (y: number, width: number, alpha: number) => {
      let zc = 0
      for (let k = 0; k < ringSteps; k++) {
        surface(y, (TAU * k) / ringSteps, a)
        ringX[k] = a.x
        ringY[k] = a.y
        ringZ[k] = a.z
        zc += a.z / ringSteps
      }
      // The near arc starts where the ring comes toward us (k0) and runs to its last near point (e); the far arc is the rest.
      let k0 = 0
      while (k0 < ringSteps - 1 && !(ringZ[k0]! >= zc && ringZ[(k0 - 1 + ringSteps) % ringSteps]! < zc)) k0++
      let e = 0
      while (e + 1 < ringSteps && ringZ[(k0 + e + 1) % ringSteps]! >= zc) e++
      const arc = (from: number, to: number, key: number) => {
        xy.length = 0
        for (let s = from; s <= to; s++) {
          const i = (k0 + s) % ringSteps
          xy.push(ringX[i]!, ringY[i]!)
        }
        depth.path(xy, key, { width, alpha, join: 'round', cap: 'round' })
      }
      arc(0, e + 1, NEAR + y / 100)
      arc(e + 1, ringSteps, FAR + y / 100)
      return zc
    }
    for (const y of [-half, half]) ring(y, line * 1.35, 0.92)
    const waist = ring(0, hair * 0.9, 0.36)
    // The accent arc round the waist: from its tail to its head, drawn to the exact angle, a full turn a loop; behind the film round the back.
    const head = TAU * t + 1.1
    const length = small ? 0.9 : 0.62
    const pieces = 10
    for (let k = 0; k < pieces; k++) {
      surface(0, head - length + (length * k) / pieces, a)
      surface(0, head - length + (length * (k + 1)) / pieces, b)
      const fade = Math.min(1, (k + 1) / 3)
      depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2 >= waist ? NEAR + 1 : FAR + 1, { width: line * 1.15, alpha: 0.95 * fade, tone: 'accent', cap: 'butt' })
    }

    // The stand: a rod on a foot, an arm out to each hoop with a collar where it grips the rod.
    if (!small) {
      project(ROD, -half - 9, 0, a)
      project(ROD, half + 6, 0, b)
      depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2 - 20, { width: line * 1.2, alpha: 0.8, cap: 'round' })
      project(ROD - 6, -half - 9, 0, a)
      project(ROD + 6, -half - 9, 0, b)
      depth.line(a, b, line, 0.6)
      for (const y of [-half, half]) {
        project(ROD, y, 0, a)
        project(-HOOP, y, 0, b)
        depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2, { width: line, alpha: 0.75, cap: 'round' })
        project(ROD, y, 0, a)
        a.z += 0.5
        depth.square(a, clamp(view.size * 0.022, 1.6, 4.6) / view.px, 0.9)
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two fixed-radius hoops draw out the neck of a real catenoid. */
export function LoaderThroat(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
