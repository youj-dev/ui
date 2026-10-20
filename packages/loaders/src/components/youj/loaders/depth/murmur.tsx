'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, hump, mix, span, seeded, Depth, point, polylineLength, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'murmur',
  title: 'Murmur',
  category: 'depth',
  technique: 'particles',
  tags: ['flock', 'swarm', 'gather', 'form', 'square', 'tittle', 'organize'],
  description: 'A flock of dots wheels and folds through space as one body, then gathers into the brand’s square, the tittle, in the accent, holds it a moment, and lets go again.',
  order: 7,
  colors: [{ part: 'Flock', mono: 'ink' }],
} satisfies LoaderMeta

/* The flock is the square, crumpled: every dot has a place on one sheet
 * (its place in the square, a little loosened), and in flight the sheet is
 * a ribbon that bends, twists about its length and wheels a full turn a
 * loop, so the dots move as one body, thickening into dark bands wherever
 * the ribbon turns edge-on, as a murmuration does. Every motion is a whole
 * number of cycles a loop, so the loop has no seam. Midway the sheet is
 * drawn flat into the square, facing the viewer, from its middle outward
 * (`emphasized`), and the tittle's outline is ruled round it in the
 * accent; a slow ripple keeps the held square breathing, and then the dots
 * let go from the edges inward and the outline is taken back.
 *
 * Color: a wave of `c1` runs once a loop through the flock, head to tail, and gives way to the ink as it gathers, so the accent square is the one color then. */

interface Bird {
  /** Its place on the sheet, -1 to 1 each way, loosened a little for flight. */
  u: number
  v: number
  /** Its own drift off the sheet, and the moment in its own small wander. */
  w: number
  own: number
  /** Its place in the square. */
  hx: number
  hy: number
  /** When it arrives and leaves: by its distance from the middle. */
  inAt: number
  outAt: number
}

const HALF = 25

function flock(side: number): Bird[] {
  const random = seeded(11)
  const birds: Bird[] = []
  for (let j = 0; j < side; j++) {
    for (let i = 0; i < side; i++) {
      const u = (i / (side - 1)) * 2 - 1
      const v = (j / (side - 1)) * 2 - 1
      const loose = 1.7 / (side - 1)
      const radial = Math.max(Math.abs(u), Math.abs(v))
      birds.push({
        u: u + (random() - 0.5) * loose,
        v: v + (random() - 0.5) * loose,
        w: random() * 2 - 1,
        own: random() * TAU,
        hx: u * HALF,
        hy: -v * HALF,
        inAt: 0.075 * radial + random() * 0.012,
        outAt: 0.075 * (1 - radial) + random() * 0.012,
      })
    }
  }
  return birds
}

const DETAIL = [
  { below: 32, birds: flock(6) },
  { below: 80, birds: flock(8) },
  { below: Infinity, birds: flock(10) },
]

/** The tittle's outline round the square, from its top-left corner. */
const FRAME = HALF + 6
const OUTLINE: [number, number][] = [
  [-FRAME, FRAME],
  [FRAME, FRAME],
  [FRAME, -FRAME],
  [-FRAME, -FRAME],
  [-FRAME, FRAME],
]

const depth = new Depth()
const p = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.52,
  draw(pen, t, view) {
    const { birds } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const phase = TAU * t
    const yaw = 0.14 * Math.sin(phase + 0.6)
    const project = camera({ yaw, pitch: -0.2, distance: 240, cx: view.w / 2, cy: view.h / 2 })
    const r = clamp(view.size * 0.012, 0.8, 2.6) / view.px
    const hair = (small ? 1.15 : 1) / view.px
    const wheel = phase
    const cw = Math.cos(wheel)
    const sw = Math.sin(wheel)
    const breathe = 1 + 0.1 * Math.sin(phase)

    for (const b of birds) {
      // In flight: the sheet as a ribbon, bent and twisted along its length, wheeling as one body.
      const along = b.u
      const twist = 1.7 * Math.sin(phase + 1.9 * along)
      const bendZ = 15 * Math.sin(phase + 2.2 * along + 0.5)
      const bendY = 9 * Math.sin(2 * phase + 1.4 * along)
      const across = 15 * b.v
      // Each bird also wanders a little off the sheet, on its own clock (whole cycles), so the body is never a grid.
      const wander = 3.2 * b.w + 1.6 * Math.sin(2 * phase + b.own)
      const fx = (small ? 25 : 30) * along * breathe + 1.4 * Math.sin(phase + b.own)
      const fy = bendY + across * Math.cos(twist) - wander * Math.sin(twist)
      const fz = bendZ + across * Math.sin(twist) + wander * Math.cos(twist)
      const x = fx * cw + fz * sw
      const z = -fx * sw + fz * cw

      // Drawn into the square from the middle outward, then let go from the edges inward.
      const g =
        view.ease.emphasized(span(t, 0.27 + b.inAt, 0.47 + b.inAt)) * (1 - view.ease.emphasized(span(t, 0.65 + b.outAt, 0.87 + b.outAt)))
      // Held, the square still breathes: a slow ripple runs across it corner to corner.
      const ripple = 2.4 * Math.sin(2 * phase - 0.08 * (b.hx - b.hy))
      project(mix(x, b.hx, g), mix(fy, b.hy, g), mix(z, ripple, g), p)
      const near = clamp((p.z + 34) / 68)
      // A wave of color runs once through the flock, head to tail, and gives way to the ink as it gathers.
      const wave = hump(((t - 0.35 * along) % 1 + 1) % 1)
      depth.dot(p, r * mix(0.85 + 0.3 * near, 1.05 + 0.08 * Math.sin(2 * phase - 0.08 * (b.hx - b.hy)), g), mix(0.28 + 0.72 * near, 0.95, g), blend('ink', 'c1', 0.7 * wave * (1 - g)))
    }

    // The tittle's outline, ruled round the square as it forms and taken back as it lets go.
    const on = view.ease.emphasized(span(t, 0.42, 0.58))
    const off = view.ease.emphasized(span(t, 0.6, 0.73))
    if (on - off > 0.002) {
      xy.length = 0
      let zs = 0
      for (const [x, y] of OUTLINE) {
        project(x, y, 0, p)
        xy.push(p.x, p.y)
        zs += p.z
      }
      const length = polylineLength(xy)
      depth.path(xy, zs / OUTLINE.length + 40, {
        width: hair * (small ? 1.15 : 1.3),
        alpha: clamp((on - off) / 0.05),
        tone: 'accent',
        dash: [(on - off) * length, length + 1],
        offset: -off * length,
        join: 'miter',
        cap: 'square',
      })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A flock of dots wheels as one body, gathers into the brand's square in the accent, then lets go again. */
export function LoaderMurmur(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
