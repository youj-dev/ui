'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, roundedRect, span, Depth, point, type Project, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { brightness, pens } from './matter'

export const meta = {
  id: 'chamber', title: 'Chamber', category: 'science', technique: 'paths',
  tags: ['bubble chamber', 'collision', 'charged track', 'magnetic field', 'particle physics', '3d'],
  description: 'A beam track of bubbles crosses a framed bubble chamber and strikes a target. Charged tracks curl away from the vertex in opposite senses, spiralling tighter as they lose energy, a tight delta-ray curl and a neutral decay’s V follow, and the whole event drains away as the next beam particle enters.',
  order: 6,
  colors: [{ part: 'Tracks', mono: 'ink' }],
} satisfies LoaderMeta

/* A bubble chamber seen through its window, a lit frame with a field mark
 * in its corner and fiducial crosses on the far glass. A beam particle runs
 * in from the left, leaving a line of bubbles, and stops at the vertex with
 * a brief accent flash; the products curl away in the magnetic field, each
 * track a trail of bubbles laid down behind its moving head (the main one
 * the accent), its radius shrinking as the particle loses energy, so it
 * spirals in. The bubbles stay where they formed (the dash pattern is fixed
 * along the track from the vertex), then the whole picture fades while the
 * next particle comes in. Tracks lie at different depths in the liquid, so
 * the slow sway of the view separates them.
 *
 * Color: the secondary tracks curling away from the vertex are `c1`; the beam and the main track stay the ink, its head the accent. */

const VERTEX = [-7, -4] as const
interface Track {
  x0: number
  y0: number
  /** Heading at the start, radians; which way the field turns it; starting radius; how fast the radius shrinks; length drawn. */
  angle: number
  sign: number
  r0: number
  decay: number
  length: number
  z: number
  /** When it starts, as loop progress, and how long it takes to lay down. */
  start: number
  run: number
  min: number
}
const TRACKS: Track[] = [
  { x0: VERTEX[0], y0: VERTEX[1], angle: 0.5, sign: 1, r0: 21, decay: 52, length: 118, z: 3, start: 0.19, run: 0.5, min: 0 },
  { x0: VERTEX[0], y0: VERTEX[1], angle: -0.3, sign: -1, r0: 15.5, decay: 36, length: 92, z: -3, start: 0.19, run: 0.44, min: 0 },
  { x0: VERTEX[0], y0: VERTEX[1], angle: 2.3, sign: -1, r0: 6.5, decay: 14, length: 34, z: 1, start: 0.2, run: 0.22, min: 40 },
  // A neutral's decay, away from the vertex: two nearly straight arms of a V.
  { x0: 15, y0: -15, angle: 0.08, sign: 1, r0: 70, decay: 400, length: 19, z: -1, start: 0.31, run: 0.18, min: 64 },
  { x0: 15, y0: -15, angle: -0.78, sign: -1, r0: 62, decay: 400, length: 15, z: -1, start: 0.31, run: 0.18, min: 64 },
]
const SAMPLES = 120
/** Each track as points along its arc, equally spaced, in the chamber's plane (x, y) with its depth: built once. */
const PATHS = TRACKS.map((tr) => {
  const out: [number, number, number][] = []
  let x = tr.x0
  let y = tr.y0
  let a = tr.angle
  const ds = tr.length / SAMPLES
  for (let i = 0; i <= SAMPLES; i++) {
    const s = i * ds
    out.push([x, y, tr.z + 1.2 * Math.sin(s / 25)])
    const r = tr.r0 * Math.exp(-s / tr.decay)
    a += (tr.sign * ds) / r
    x += Math.cos(a) * ds
    y += Math.sin(a) * ds
  }
  return out
})
/** The beam enters from under the frame's left border, so it emerges rather than appears. */
const BEAM: [number, number, number][] = [[-42, -0.8, 4], [VERTEX[0], VERTEX[1], 0]]
const OUTER = roundedRect(-44, -34, 88, 68, 9, 5)
const INNER = roundedRect(-38, -28, 76, 56, 5, 4)
const BOLTS: [number, number][] = [[-41, -31], [41, -31], [41, 31], [-41, 31], [0, -31], [0, 31], [-41, 0], [41, 0]]
const FRONT = 8
const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

/** The prefix of a track up to arc length fraction f, projected; the last point interpolated so it grows smoothly. */
function prefix(path: [number, number, number][], f: number, project: Project): { xy: number[]; z: number } {
  xy.length = 0
  const end = clamp(f) * (path.length - 1)
  const whole = Math.floor(end)
  let z = 0
  for (let i = 0; i <= whole; i++) {
    project(path[i]![0], path[i]![1], path[i]![2], p)
    xy.push(p.x, p.y)
    z += p.z
  }
  const frac = end - whole
  if (frac > 1e-4 && whole + 1 < path.length) {
    const a = path[whole]!
    const b = path[whole + 1]!
    project(mix(a[0], b[0], frac), mix(a[1], b[1], frac), mix(a[2], b[2], frac), p)
    xy.push(p.x, p.y)
    z += p.z
  }
  return { xy, z: z / Math.max(1, xy.length / 2) }
}

/**
 * A trail of bubbles along screen points: square grains spaced along the
 * path, fixed from its start. Butt-capped dashes, so the newest grain grows
 * out of the moving head instead of appearing whole.
 */
function bubbles(trail: { xy: number[]; z: number }, view: View, alpha: number, small: boolean, tone: 'ink' | 'c1' = 'ink') {
  if (trail.xy.length < 4 || alpha < 0.004) return
  const dot = (small ? 1.1 : view.size < 80 ? 1.35 : 1.6) / view.px
  depth.path(trail.xy, trail.z, small ? { width: dot * 0.85, alpha: alpha * 0.85, join: 'round', tone } : { width: dot, alpha, cap: 'butt', join: 'round', dash: [dot, dot * 1.3], tone })
}

export const scene: Scene = {
  beats: 5.25,
  still: 0.5,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { hair } = pens(view)
    const pose = { yaw: 0.2 + 0.07 * Math.sin(TAU * t), pitch: -0.16 + 0.04 * Math.cos(TAU * t) }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)

    // The window: a lit frame (one face with the opening cut out), its outer edge, and its bolts.
    const light = lambert(...turn(0, 0, 1))
    xy.length = 0
    for (const [x, y] of OUTER) {
      project(x, y, FRONT, p)
      xy.push(p.x, p.y)
    }
    const frameZ = 40
    const face = xy.slice()
    face.push(face[0]!, face[1]!)
    const hole: number[] = []
    for (const [x, y] of INNER) {
      project(x, y, FRONT, p)
      hole.push(p.x, p.y)
    }
    face.push(hole[0]!, hole[1]!)
    for (let i = hole.length - 2; i >= 0; i -= 2) face.push(hole[i]!, hole[i + 1]!)
    face.push(face[0]!, face[1]!)
    // The frame's thickness: its outer walls, where they face the viewer.
    for (let i = 0; i < OUTER.length; i++) {
      const [ax, ay] = OUTER[i]!
      const [bx, by] = OUTER[(i + 1) % OUTER.length]!
      const n = turn(by - ay, ax - bx, 0)
      if (n[2] <= 0) continue
      const wall: number[] = []
      for (const [x, y, z] of [[ax, ay, FRONT], [bx, by, FRONT], [bx, by, FRONT - 5], [ax, ay, FRONT - 5]] as const) {
        project(x, y, z, p)
        wall.push(p.x, p.y)
      }
      depth.face(wall, frameZ - 1, lambert(...n))
    }
    depth.face(face, frameZ, light)
    depth.path(xy, frameZ + 0.01, { width: hair, alpha: 0.8, closed: true, join: 'round' })
    depth.path(hole, frameZ + 0.01, { width: hair, alpha: 0.7, closed: true, join: 'round' })
    if (!small) {
      for (const [x, y] of BOLTS) {
        project(x, y, FRONT + 0.2, p)
        depth.dot({ ...p, z: frameZ + 0.02 }, Math.max(0.8, view.size * 0.0045) / view.px, 0.75)
      }
      // The far glass: a faint tint, fiducial crosses, and the field mark (out of the page) in the corner.
      xy.length = 0
      for (const [x, y] of INNER) {
        project(x, y, -8, p)
        xy.push(p.x, p.y)
      }
      depth.poly(xy, -60, 0.035)
      const arm = 1.7
      for (const x of [-24, 0, 24]) for (const y of [-16, 0, 16]) {
        project(x - arm, y, -8, p)
        project(x + arm, y, -8, q)
        depth.line(p, q, hair * 0.8, 0.32)
        project(x, y - arm, -8, p)
        project(x, y + arm, -8, q)
        depth.line(p, q, hair * 0.8, 0.32)
      }
      if (view.size >= 64) {
        xy.length = 0
        for (let i = 0; i < 20; i++) {
          project(31 + 2.6 * Math.cos((TAU * i) / 20), 21 + 2.6 * Math.sin((TAU * i) / 20), -8, p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, -50, { width: hair * 0.9, alpha: 0.55, closed: true })
        project(31, 21, -8, p)
        depth.dot({ ...p, z: -50 }, hair * 0.9, 0.6)
      }
    }

    // The event fades out as a whole while the next beam particle comes in.
    const event = 1 - view.ease.exit(span(t, 0.66, 0.97))
    const beam = span(t, 0, 0.19)
    const beamFade = event * (1 - view.ease.exit(span(t, 0.58, 0.9)))
    const trail = prefix(BEAM, beam, project)
    bubbles(trail, view, 0.85 * Math.max(beamFade, t < 0.19 ? 1 : 0), small)
    // The beam particle's head, until it stops at the vertex.
    if (beam < 1) {
      const head = span(t, 0, 0.05) * (1 - span(t, 0.16, 0.19))
      project(mix(BEAM[0]![0], VERTEX[0], beam), mix(BEAM[0]![1], VERTEX[1], beam), mix(BEAM[0]![2], 0, beam), p)
      depth.dot(p, (small ? 1.3 : 1.5) / view.px, head)
    }

    TRACKS.forEach((tr, i) => {
      if (view.size < tr.min || (small && i > 1)) return
      // Near constant speed, slowing as the particle ranges out.
      const run = span(t, tr.start, tr.start + tr.run)
      const grow = 0.6 * (1 - (1 - run) ** 2) + 0.4 * run
      if (grow <= 0) return
      const path = prefix(PATHS[i]!, grow, project)
      bubbles(path, view, event * (i < 2 ? 0.9 : 0.6) * brightness(path.z * 4), small, i === 0 ? 'ink' : 'c1')
      // The moving head: the main track's in the accent, each fading as its particle stops.
      const head = span(t, tr.start, tr.start + 0.02) * (1 - span(grow, 0.82, 1))
      if (head > 0.004 && path.xy.length >= 2) {
        p.x = path.xy[path.xy.length - 2]!
        p.y = path.xy[path.xy.length - 1]!
        p.z = path.z + 1
        p.k = 1
        if (i === 0) depth.square(p, clamp(view.size * 0.03, 2.2, 5.5) / view.px, head, 'accent')
        else depth.dot(p, (small ? 1.2 : 1.4) / view.px, head * 0.9, 'c1')
      }
    })

    // The collision: a small accent ring opening and fading at the vertex.
    const flash = span(t, 0.18, 0.34)
    if (flash > 0 && flash < 1) {
      xy.length = 0
      const r = mix(0.8, 6, view.ease.enter(flash))
      for (let i = 0; i < 24; i++) {
        project(VERTEX[0] + r * Math.cos((TAU * i) / 24), VERTEX[1] + r * Math.sin((TAU * i) / 24), 0, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, 30, { width: hair * 1.2, alpha: (1 - flash) * span(flash, 0, 0.1), tone: 'accent', closed: true })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A common collision vertex emits charged tracks with opposed curvature. */
export function LoaderChamber(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
