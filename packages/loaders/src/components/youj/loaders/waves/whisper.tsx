'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, point, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { brightness, detail, edge, hairline, wire, wrap, type Turn, type V3 } from './propagation'

export const meta = {
  id: 'whisper',
  title: 'Whisper',
  category: 'waves',
  technique: 'mixed',
  tags: ['resonator', 'whispering-gallery', 'annulus', 'guided-wave', 'cutaway', '3d'],
  description: 'A cutaway annular resonator confines a circulating three-lobed wave. Its lid and outer wall are cut back over the foreground, their hatched sections exposed, so the trace rises and falls along the open channel while short pressure bars on its floor answer the crests.',
  order: 10,
  colors: [{ part: 'Pressure', mono: 'ink' }],
} satisfies LoaderMeta

/* A closed annular channel: floor, inner and outer walls, and a lid. Over
 * the foreground the lid and the outer wall are cut back, as in a sectioned
 * drawing, so the channel lies open there: its floor, the inner wall's
 * face, and at each end of the cut the lid and wall in section, hatched.
 * A three-lobed mode circulates once a loop (it repeats every third of a
 * turn), its trace rising and falling along the channel and hidden under
 * the lid elsewhere; pressure bars stand on the floor and grow with the
 * pressure passing over them, and the crest nearest the viewer wears the
 * accent.
 *
 * Color: the wave’s fine filaments are `c1` round its ink crest; its leading lobe stays the accent. */

const R_IN = 18.5
const R_OUT = 29.5
const WALL = 2
const BOTTOM = -5.5
const TOP = 4.5
const FLOOR = 1.6
const LID = 1.6
/** The cut: from 0.32 rad to π − 0.32 rad (the arc toward the viewer). */
const CUT0 = 0.32
const CUT1 = Math.PI - 0.32
const LEVELS = [14, 22, 32].map((sectors) => ({ sectors, wave: Array.from({ length: 97 }, () => [0, 0, 0] as V3), accent: Array.from({ length: 17 }, () => [0, 0, 0] as V3) }))
const corners: V3[] = Array.from({ length: 4 }, () => [0, 0, 0] as V3)
const rim: V3[] = Array.from({ length: 49 }, () => [0, 0, 0] as V3)
const xy: number[] = []
const p = point()
const q = point()
const depth = new Depth()

const polar = (r: number, a: number, y: number, out: V3) => {
  out[0] = r * Math.cos(a)
  out[1] = y
  out[2] = r * Math.sin(a)
  return out
}

/** A ring band between angles a and b: radius r0→r1 at heights y0→y1 (a wall when r0 = r1, a flat band when y0 = y1), lit by `normal`, drawn if it faces the viewer. */
function band(project: Project, turn: Turn, a: number, b: number, r0: number, r1: number, y0: number, y1: number, normal: V3, lift = 1) {
  const n = turn(...normal)
  if (n[2] <= 0) return
  // Each band laps its neighbours by a hair, so the seams between them never let the ground show through.
  a -= 0.006
  b += 0.006
  polar(r0, a, y0, corners[0]!)
  polar(r0, b, y0, corners[1]!)
  polar(r1, b, y1, corners[2]!)
  polar(r1, a, y1, corners[3]!)
  xy.length = 0
  let z = 0
  for (const c of corners) {
    project(...c, p)
    xy.push(p.x, p.y)
    z += p.z / 4
  }
  depth.face(xy, z, lambert(...n) * lift)
}

/** An arc of the channel's edges, from a to b at radius r and height y. */
function arc(project: Project, a: number, b: number, r: number, y: number, n: number, width: number, alpha: number) {
  for (let i = 0; i <= n; i++) polar(r, a + ((b - a) * i) / n, y, rim[i]!)
  wire(depth, project, rim.slice(0, n + 1), width, alpha, 'ink', 6)
}

/** The section where the cut ends, at angle a: lid and outer wall as one ꓶ-shaped face, hatched at large sizes. */
function section(project: Project, turn: Turn, a: number, facing: number, hair: number, lod: number) {
  const ct = Math.cos(a)
  const st = Math.sin(a)
  const n = turn(-st * facing, 0, ct * facing)
  if (n[2] <= 0) return
  const shape: [number, number][] = [[R_IN + WALL, TOP], [R_OUT, TOP], [R_OUT, BOTTOM + FLOOR], [R_OUT - WALL, BOTTOM + FLOOR], [R_OUT - WALL, TOP - LID], [R_IN + WALL, TOP - LID]]
  xy.length = 0
  let z = 0
  for (const [r, y] of shape) {
    project(r * ct, y, r * st, p)
    xy.push(p.x, p.y)
    z += p.z / shape.length
  }
  depth.face(xy, z, lambert(...n))
  depth.path(xy, z + 0.01, { width: hair * 0.9, alpha: 0.8 * brightness(z), closed: true, join: 'miter' })
  // The covered channel beyond the cut, seen end on: in shadow.
  xy.length = 0
  for (const [r, y] of [[R_IN + WALL, BOTTOM + FLOOR], [R_OUT - WALL, BOTTOM + FLOOR], [R_OUT - WALL, TOP - LID], [R_IN + WALL, TOP - LID]] as const) {
    project(r * ct, y, r * st, p)
    xy.push(p.x, p.y)
  }
  depth.face(xy, z - 0.4, 0.06)
  if (lod < 2) return
  // Hatching at 45° through the solid: each line clipped to the lid and to the wall.
  const rects: [number, number, number, number][] = [[R_IN + WALL, TOP - LID, R_OUT, TOP], [R_OUT - WALL, BOTTOM + FLOOR, R_OUT, TOP - LID]]
  for (let c = -12; c <= 40; c += 1.6) {
    for (const [r0, y0, r1, y1] of rects) {
      // The line r − y = c, clipped to the rectangle.
      const lo = Math.max(r0, y0 + c)
      const hi = Math.min(r1, y1 + c)
      if (hi - lo < 0.15) continue
      project(lo * ct, lo - c, lo * st, p)
      project(hi * ct, hi - c, hi * st, q)
      p.z = q.z = z + 0.02
      depth.line(p, q, hair * 0.6, 0.45 * brightness(z))
    }
  }
}

export const scene: Scene = {
  beats: 5.5,
  still: 0.28,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { sectors, wave, accent } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = 0.24 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.62
    const project = camera({ yaw, pitch, distance: 230, cx: view.w / 2, cy: 52 })
    const turn = orient({ yaw, pitch })
    const pulse = 0.5 - 0.5 * Math.cos(TAU * u)
    const mid = (R_IN + R_OUT) / 2

    // The closed part of the ring: lid, outer wall and the inner wall's inner face, round from one end of the cut to the other.
    const span0 = CUT1
    const span1 = CUT0 + TAU
    for (let i = 0; i < sectors; i++) {
      const a = span0 + ((span1 - span0) * i) / sectors
      const b = span0 + ((span1 - span0) * (i + 1)) / sectors
      const m = (a + b) / 2
      band(project, turn, a, b, R_IN, R_OUT, TOP, TOP, [0, 1, 0])
      band(project, turn, a, b, R_OUT, R_OUT, BOTTOM, TOP, [Math.cos(m), 0, Math.sin(m)])
      band(project, turn, a, b, R_IN, R_IN, BOTTOM, TOP, [-Math.cos(m), 0, -Math.sin(m)])
    }
    // The open channel over the cut: its floor, the floor's outer lip, the inner wall's face and top.
    const open = Math.max(4, Math.round((sectors * (CUT1 - CUT0)) / (span1 - span0)))
    for (let i = 0; i < open; i++) {
      const a = CUT0 + ((CUT1 - CUT0) * i) / open
      const b = CUT0 + ((CUT1 - CUT0) * (i + 1)) / open
      const m = (a + b) / 2
      band(project, turn, a, b, R_IN + WALL, R_OUT, BOTTOM + FLOOR, BOTTOM + FLOOR, [0, 1, 0], 0.7)
      band(project, turn, a, b, R_OUT, R_OUT, BOTTOM, BOTTOM + FLOOR, [Math.cos(m), 0, Math.sin(m)])
      band(project, turn, a, b, R_IN + WALL, R_IN + WALL, BOTTOM + FLOOR, TOP, [Math.cos(m), 0, Math.sin(m)], 0.92)
      band(project, turn, a, b, R_IN, R_IN + WALL, TOP, TOP, [0, 1, 0])
    }
    // The edges: the lid's rims, the floor's lip, and the inner wall's top over the cut.
    const n = lod === 0 ? 24 : 48
    arc(project, span0, span1, R_OUT, TOP, n, hair * 0.9, 0.75)
    arc(project, span0, span1, R_IN, TOP, n, hair * 0.8, 0.6)
    arc(project, CUT0, CUT1, R_OUT, BOTTOM + FLOOR, 16, hair * 0.8, 0.6)
    arc(project, CUT0, CUT1, R_IN + WALL, TOP, 16, hair * 0.8, 0.6)
    section(project, turn, CUT0, 1, hair, lod)
    section(project, turn, CUT1, -1, hair, lod)

    // The mode: three lobes circulating once a loop along the channel's middle, rising and falling.
    const crest = (a: number) => Math.cos(3 * (a - TAU * u))
    for (let filament = 0; filament < (lod === 0 ? 1 : 2); filament++) {
      for (let i = 0; i < wave.length; i++) {
        const a = (TAU * i) / (wave.length - 1)
        const m = crest(a)
        polar(mid + 1.2 * m + filament * 1.8, a, -0.5 + (2.4 + 0.6 * pulse) * m - filament * 1.2, wave[i]!)
      }
      // Short chunks, so each sorts against the lid right above it.
      wire(depth, project, wave, hair * (filament ? 0.8 : 1.4), filament ? 0.4 : 0.95, filament ? 'c1' : 'ink', 3)
    }
    // Pressure bars on the floor, each as tall as the pressure over it.
    const bars = lod === 0 ? 3 : lod === 1 ? 4 : 6
    for (let j = 0; j < bars; j++) {
      const a = CUT0 + ((CUT1 - CUT0) * (j + 0.5)) / bars
      const pressure = 0.5 + 0.5 * crest(a)
      const h = BOTTOM + FLOOR + 0.2 + 5.5 * pressure
      edge(depth, project, polar(mid - 2.5, a, BOTTOM + FLOOR + 0.05, corners[0]!), polar(mid + 2.5, a, BOTTOM + FLOOR + 0.05, corners[1]!), hair * 0.8, 0.5)
      edge(depth, project, polar(mid, a, BOTTOM + FLOOR + 0.05, corners[0]!), polar(mid, a, h, corners[1]!), hair * 1.1, 0.25 + 0.6 * pressure)
    }
    // The crests, in the accent: the lid hides them as they pass under it, so one is always in the open.
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < accent.length; i++) {
        const a = TAU * u + (TAU * k) / 3 - 0.16 + (0.32 * i) / (accent.length - 1)
        const m = crest(a)
        polar(mid + 1.2 * m, a, -0.4 + (2.4 + 0.6 * pulse) * m, accent[i]!)
      }
      wire(depth, project, accent, hair * 1.65, 1, 'accent', 4)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A three-lobed wave circulates inside an annular cavity with its foreground cut away. */
export function LoaderWhisper(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
