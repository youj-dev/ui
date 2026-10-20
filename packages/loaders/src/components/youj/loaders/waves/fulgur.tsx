'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, orient, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { around, cylinder, detail, frame, hairline, packet, ruler, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'fulgur',
  title: 'Fulgur',
  category: 'waves',
  technique: 'lines',
  tags: ['pulse', 'emp', 'shockwave', 'grid', 'distortion', 'propagation', '3d'],
  description: 'An electromagnetic pulse leaves a small emitter post. Its expanding front strains a wire grid clamped in a lit frame, lifting a narrow annular ridge; a weaker afterfront follows, and the next pulse leaves as the last one reaches the frame.',
  order: 1,
  colors: [{ part: 'Echoes', mono: 'ink' }],
} satisfies LoaderMeta

/* A wire grid held in a lit frame, with an emitter post at its centre. A
 * pulse leaves the post once a loop and runs outward at a constant speed,
 * weakening as it spreads (1/(1 + r/16)): its front lifts the grid into a
 * narrow ridge and pulls the wires outward, an afterfront dips behind it,
 * and the frame holds the edges still. The field is the sum of this pulse
 * and the one before it, which is just reaching the frame as this one
 * leaves the post, so the loop has no seam and no dead time. The front's
 * ring wears the accent; the post's cap brightens as it fires.
 *
 * Color: the echoing rings behind the front are `c1`; the leading front stays the accent and the grid the ink. */

const LEVELS = [5, 8, 12].map((rows) => ({
  rows,
  mesh: Array.from({ length: (rows + 1) * 2 }, () => Array.from({ length: 41 }, () => [0, 0, 0] as V3)),
  ring: Array.from({ length: 65 }, () => [0, 0, 0] as V3),
}))
const HALF = 28
const SPEED = 52
const START = -6
const depth = new Depth()

/** The grid's lift at radius r: every pulse in flight, each a ridge with its afterfront dip, weakening as it spreads. */
function field(r: number, u: number) {
  let h = 0
  for (let k = 0; k < 2; k++) {
    const front = START + SPEED * (u + k)
    h += (packet(r - front, 6) - 0.45 * packet(r - front + 9, 5)) / (1 + Math.max(r, 0) / 16)
  }
  return h
}

export const scene: Scene = {
  beats: 5,
  still: 0.4,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { rows, mesh, ring } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = 0.32 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.66
    const project = camera({ yaw, pitch, distance: 240, cx: view.w / 2, cy: 52 })
    const turn = orient({ yaw, pitch })

    // The grid: wires in both directions, lifted and pulled outward by the fields, held still at the frame.
    for (let axis = 0; axis < 2; axis++) {
      for (let row = 0; row <= rows; row++) {
        const line = mesh[axis * (rows + 1) + row]!
        const fixed = -HALF + (2 * HALF * row) / rows
        for (let i = 0; i < line.length; i++) {
          const along = -HALF + (2 * HALF * i) / (line.length - 1)
          const x = axis ? fixed : along
          const z = axis ? along : fixed
          const r = Math.hypot(x, z)
          const hold = 1 - (Math.max(Math.abs(x), Math.abs(z)) / HALF) ** 8
          const hit = field(r, u) * hold
          const strain = 1 + 0.15 * hit
          const v = line[i]!
          v[0] = x * strain
          v[1] = 7 * hit
          v[2] = z * strain
        }
        wire(depth, project, line, hair, row === 0 || row === rows ? 0.3 : 0.72, 'ink', 10)
      }
    }

    // The frame that clamps the grid, and (larger sizes) a scale along its near edge.
    frame(depth, project, turn, HALF + 0.4, 4, 2.6, 0.2, hair * 0.85, { bevel: lod === 2 ? 0.7 : 0 })
    if (lod === 2) ruler(depth, project, [-HALF, 0.25, HALF + 2.4], [HALF, 0.25, HALF + 2.4], 14, 7, [0, 0, 1], 0.9, hair * 0.7, 0.5)

    // The fronts: each pulse's ridge ring (the accent) and its afterfront, faint as they near the frame.
    for (let k = 0; k < 2; k++) {
      const front = START + SPEED * (u + k)
      for (let echo = 0; echo < 2; echo++) {
        const radius = front - echo * 9
        const show = span(radius, 0, 4) * (1 - span(radius, HALF - 4, HALF + 2))
        if (show <= 0) continue
        for (let i = 0; i < ring.length; i++) {
          const a = (TAU * i) / (ring.length - 1)
          const v = ring[i]!
          v[0] = radius * Math.cos(a)
          v[1] = echo ? 0.6 : 7.4 / (1 + radius / 16) + 0.4
          v[2] = radius * Math.sin(a)
        }
        wire(depth, project, ring, hair * (echo ? 0.85 : 1.35), show * (echo ? 0.42 : 0.95), echo ? 'c1' : 'accent')
      }
    }

    // The emitter post, its cap brightening and lifting a touch as it fires.
    const fire = packet(around(u, 0.07), 0.12)
    cylinder(depth, project, turn, [0, -1.2, 0], 'y', 2.6, 3 + 1.2 * fire, lod === 0 ? 8 : 14, hair * 0.85, { lift: 1 + 0.3 * fire })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An expanding impulse strains a wire grid and leaves a smaller afterfront. */
export function LoaderFulgur(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
