'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'vortex',
  title: 'Vortex',
  category: 'depth',
  technique: 'mixed',
  tags: ['funnel', 'spiral', 'drain', 'gather', 'sync', 'download', 'particle'],
  description: 'Particles stream down a funnel in three spiral arms, quickening and drawing streaks as they near the bottom, where the accent particle takes them in.',
  order: 6,
  colors: [{ part: 'Arms', mono: 'ink' }],
} satisfies LoaderMeta

/* Three arms of particles, evenly spaced along each, enter at the funnel's
 * rim and wind two and a half turns down to its throat, falling faster the
 * further in they get; each trails a short streak along its path, so the
 * flow reads even in a still frame, and grows nearer and brighter as the
 * funnel brings it toward the viewer. Particles fade in at the rim and out
 * at the throat, and every one is where it was a loop ago, so the turnover
 * never shows. Two faint rings mark the mouth and throat.
 *
 * Color: the particles warm toward `c1` as they spiral in to the drain, the accent waiting there. */

const R = 38
const DROP = 30
const TURNS = 2.5
const ARMS = 3

const DETAIL = [
  { below: 32, perArm: 9 },
  { below: 80, perArm: 14 },
  { below: Infinity, perArm: 20 },
]

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const CIRCLE = Array.from({ length: 41 }, (_, i) => [Math.cos((i / 40) * TAU), Math.sin((i / 40) * TAU)] as const)
const RINGS = [
  [R + 4, 0, 0.16],
  [5, -DROP, 0.3],
] as const
const MERIDIANS = 8

/** A point on an arm at progress f (0 the rim, 1 the throat). */
function along(arm: number, f: number): [number, number, number] {
  const r = R * (1 - f) ** 0.8 + 3
  const a = (arm / ARMS) * TAU + TAU * TURNS * f ** 1.25
  return [Math.cos(a) * r, -DROP * f ** 1.7, Math.sin(a) * r]
}

export const scene: Scene = {
  beats: 4,
  still: 0.3,
  draw(pen, t, view) {
    const { perArm } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: 0.3 + 0.05 * Math.sin(TAU * t), pitch: -0.64, distance: 220, cx: view.w / 2, cy: view.h / 2 - 4 })
    const side = clamp(view.size * 0.034, 1.2, 2.4) / view.px
    const stroke = clamp(view.size * 0.016, 0.8, 1.4) / view.px
    const hair = 1 / view.px

    for (let arm = 0; arm < ARMS; arm++) {
      for (let j = 0; j < perArm; j++) {
        // One step of the arm a loop, so every particle is where the next one was.
        const f = (j + t) / perArm
        const fade = clamp(f / 0.1) * clamp((1 - f) / 0.12)
        if (fade <= 0) continue
        project(...along(arm, f), p)
        const near = 0.3 + 0.7 * clamp((p.z + 40) / 80)
        // Each particle warms toward the vortex's color as it nears the drain.
        const tone = blend('ink', 'c1', 0.8 * span(f, 0.35, 1))
        depth.square(p, side * (0.8 + 0.5 * f), fade * near, tone)
        const tail = projectPath([along(arm, Math.max(0, f - 0.05)), along(arm, Math.max(0, f - 0.025)), along(arm, f)], project, xy)
        depth.path(tail.xy, tail.z - 0.01, { width: stroke, alpha: 0.4 * fade * near, cap: 'round', join: 'round', tone })
      }
    }

    // The funnel's mouth and throat, faint, and (from 40px) a few meridians down its wall, so it reads as a surface.
    for (const [radius, y, alpha] of RINGS) {
      xy.length = 0
      for (const [c, s] of CIRCLE) {
        project(c * radius, y, s * radius, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, -999, { width: hair, alpha })
    }
    if (view.size >= 40) {
      for (let m = 0; m < MERIDIANS; m++) {
        const a = (m / MERIDIANS) * TAU
        for (let i = 0; i < 8; i++) {
          const f0 = i / 8
          const f1 = (i + 1) / 8
          const r0 = R * (1 - f0) ** 0.8 + 3
          const r1 = R * (1 - f1) ** 0.8 + 3
          project(Math.cos(a) * r0, -DROP * f0 ** 1.7, Math.sin(a) * r0, p)
          project(Math.cos(a) * r1, -DROP * f1 ** 1.7, Math.sin(a) * r1, q)
          depth.line(p, q, hair, 0.05 + 0.08 * clamp((p.z + q.z + 80) / 160))
        }
      }
    }

    // The accent particle at the bottom, taking them in.
    project(0, -DROP, 0, p)
    depth.square(p, side * 2.4, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Particles stream down a funnel in spiral arms into the accent particle at its bottom. */
export function LoaderVortex(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
