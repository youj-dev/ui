'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'corridor',
  title: 'Corridor',
  category: 'depth',
  technique: 'mixed',
  tags: ['tunnel', 'frames', 'registration', 'crop marks', 'blueprint', 'fly-through', 'perspective'],
  description: 'The docs’ construction frame, repeated into the distance and flown through: dotted frames with registration marks twist past, the accent particle waiting at the vanishing point.',
  order: 4,
  colors: [{ part: 'Corridor', mono: 'ink' }],
} satisfies LoaderMeta

/* Each frame is a square of particles with registration marks at its
 * corners, turned a little more than the one before, so the corridor
 * twists as it comes. Frames arrive out of the far dark, grow and brighten
 * as they near, and dissolve as they pass; the accent particle waits at the
 * vanishing point. Every loop moves the frames exactly one spacing, so the
 * next loop starts where this one ends.
 *
 * Color: the dotted frames lean toward `c1` with distance, the near ones the ink. */

const HALF = 30
const GAP = 26
const COUNT = 6
const ARM = 3.4

const DETAIL = [
  { below: 32, perSide: 5 },
  { below: 80, perSide: 7 },
  { below: Infinity, perSide: 10 },
]

const CORNERS = [
  [HALF, HALF],
  [HALF, -HALF],
  [-HALF, -HALF],
  [-HALF, HALF],
] as const

const depth = new Depth()
const p = point()
const q = point()

export const scene: Scene = {
  beats: 2.25,
  still: 0.4,
  draw(pen, t, view) {
    const { perSide } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: 0.16, pitch: -0.1, distance: 74, cx: view.w / 2, cy: view.h / 2 })
    const side = clamp(view.size * 0.03, 1.1, 2.2) / view.px
    const hair = 1 / view.px

    for (let f = 0; f < COUNT; f++) {
      const z = -(f - t) * GAP
      // In from the dark at the far end, out as it passes the eye.
      const fade = span(z, -GAP * (COUNT - 1), -GAP * (COUNT - 2.4)) * (1 - span(z, -14, 8))
      if (fade <= 0) continue
      const turn = (z / GAP) * 0.09
      const cos = Math.cos(turn)
      const sin = Math.sin(turn)
      const near = clamp((z + GAP * COUNT) / (GAP * COUNT))
      const alpha = fade * (0.25 + 0.75 * near ** 1.5)
      // The far frames lean toward the corridor's color, the near ones the ink: a gradient through depth.
      const tint = blend('ink', 'c1', 0.85 * (1 - near) ** 0.7)
      const at = (u: number, v: number, out = p) => project(u * cos - v * sin, u * sin + v * cos, z, out)
      for (let s = 0; s < 4; s++) {
        for (let i = 1; i < perSide; i++) {
          const a = -HALF + (2 * HALF * i) / perSide
          const [u, v] = s === 0 ? [a, HALF] : s === 1 ? [HALF, -a] : s === 2 ? [-a, -HALF] : [-HALF, a]
          depth.square(at(u, v), side, alpha * 0.8, tint)
        }
      }
      // Registration marks: a cross at each corner, in hairlines.
      for (const [u, v] of CORNERS) {
        depth.line(at(u - ARM, v), at(u + ARM, v, q), hair, alpha)
        depth.line(at(u, v - ARM), at(u, v + ARM, q), hair, alpha)
      }
    }

    // The corridor's rails: each corner joined to the same corner of the frame beyond, so the twist reads as four
    // lines winding to the vanishing point. A rail is as faint as the fainter frame it joins.
    if (view.size >= 40) {
      const frame = (f: number) => {
        const z = -(f - t) * GAP
        const fade = span(z, -GAP * (COUNT - 1), -GAP * (COUNT - 2.4)) * (1 - span(z, -14, 8))
        const near = clamp((z + GAP * COUNT) / (GAP * COUNT))
        return { z, turn: (z / GAP) * 0.09, alpha: fade * (0.25 + 0.75 * near ** 1.5) }
      }
      for (let f = 0; f < COUNT - 1; f++) {
        const a = frame(f)
        const b = frame(f + 1)
        const alpha = Math.min(a.alpha, b.alpha) * 0.3
        if (alpha <= 0.005) continue
        for (const [u, v] of CORNERS) {
          project(u * Math.cos(a.turn) - v * Math.sin(a.turn), u * Math.sin(a.turn) + v * Math.cos(a.turn), a.z, p)
          project(u * Math.cos(b.turn) - v * Math.sin(b.turn), u * Math.sin(b.turn) + v * Math.cos(b.turn), b.z, q)
          depth.line(p, q, hair, alpha)
        }
      }
    }

    // The accent particle at the vanishing point.
    project(0, 0, -GAP * (COUNT + 1), p)
    depth.square(p, side * 1.9 / p.k, 0.75 + 0.25 * Math.cos(TAU * t), 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Construction frames with registration marks fly past down a twisting corridor, the accent particle at its end. */
export function LoaderCorridor(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
