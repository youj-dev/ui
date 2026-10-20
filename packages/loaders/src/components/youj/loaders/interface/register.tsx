'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, span, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'register',
  title: 'Register',
  category: 'interface',
  technique: 'lines',
  tags: ['registration', 'print', 'align', 'plates', 'crosshair', 'blueprint', 'calibrate'],
  description: 'Two printing plates in perspective, one in ink and one in the accent, each with registration marks: the accent plate settles down onto the other until every mark sits in register, then lifts and drifts out again.',
  order: 6,
  colors: [{ part: 'Content', mono: 'ink' }],
} satisfies LoaderMeta

/* Each plate is a hairline sheet with a registration target at each corner
 * and in the middle (a circle with a cross through it) and a few lines of
 * content between. The accent plate floats above, shifted and turned; it
 * comes down and into register on the `emphasized` curve, holds there a
 * moment while its marks lie exactly on the ink's, then lifts away and
 * drifts back out to where it started. Out of register at both ends.
 *
 * Color: the printed content on the base plate is a tint of `c1`; its sheet and targets keep the ink, the second plate coming into register the accent. */

const W = 30
const D = 21
const TARGETS = [
  [-W, -D],
  [W, -D],
  [W, D],
  [-W, D],
  [0, 0],
] as const
const CONTENT = [
  [-20, -10, 22],
  [-20, -5, 30],
  [-20, 5, 14],
  [-20, 10, 26],
] as const

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

type Place = (x: number, z: number) => [number, number, number]

function plate(project: Project, place: Place, tone: 'ink' | 'accent', alpha: number, hair: number, stroke: number) {
  const sheet = projectPath(
    [
      [-W - 6, -D - 6],
      [W + 6, -D - 6],
      [W + 6, D + 6],
      [-W - 6, D + 6],
    ].map(([x, z]) => place(x!, z!)),
    project,
    xy,
  )
  // The ink plate is paper, the accent plate a film over it: only its marks show.
  if (tone === 'ink') depth.poly(sheet.xy, sheet.z - 2, 0.04, 'ink', true)
  depth.path(sheet.xy, sheet.z - 1, { width: hair, alpha: 0.3 * alpha, closed: true, tone })
  for (const [x, z] of TARGETS) {
    const circle = projectPath(
      Array.from({ length: 33 }, (_, i) => place(x + Math.cos((i / 32) * TAU) * 3.4, z + Math.sin((i / 32) * TAU) * 3.4)),
      project,
      xy,
    )
    depth.path(circle.xy, circle.z, { width: stroke, alpha, tone })
    for (const [dx, dz] of [
      [6, 0],
      [0, 6],
    ] as const) {
      project(...place(x - dx, z - dz), p)
      project(...place(x + dx, z + dz), q)
      depth.line(p, q, hair, alpha, tone)
    }
  }
  if (tone === 'ink') {
    for (const [x, z, w] of CONTENT) {
      const bar = projectPath([place(x, z), place(x + w, z)], project, xy)
      depth.path(bar.xy, bar.z, { width: stroke * 1.6, alpha: 0.28 * alpha, tone: 'c1' })
    }
  }
}

export const scene: Scene = {
  beats: 4.5,
  still: 0.24,
  draw(pen, t, view) {
    const project = camera({ yaw: -0.5 + 0.08 * Math.sin(TAU * t), pitch: -0.7, distance: 260, cx: view.w / 2 - 3, cy: view.h / 2 + 6 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.02, 1, 1.6) / view.px
    const into = view.ease.emphasized(span(t, 0.08, 0.42)) * (1 - view.ease.emphasized(span(t, 0.62, 0.94)))
    const off = 1 - into
    const turn = 0.09 * off
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    const lift = mix(0.4, 15, off)
    const dx = 3 * off
    const dz = -8 * off

    plate(project, (x, z) => [x, 0, z], 'ink', 0.75, hair, stroke)
    plate(project, (x, z) => [x * cos - z * sin + dx, lift, x * sin + z * cos + dz], 'accent', 0.95, hair, stroke)

    // In register, a moment's emphasis: every target answers with a ring going out from its circle.
    const ping = span(t, 0.4, 0.58)
    const lock = (1 - ping) * clamp(ping / 0.1)
    if (lock > 0.004) {
      for (const [x, z] of TARGETS) {
        const r = mix(3.4, 6.5, view.ease.enter(ping))
        const ring = projectPath(
          Array.from({ length: 33 }, (_, i) => [x + Math.cos((i / 32) * TAU) * r, 0.5, z + Math.sin((i / 32) * TAU) * r] as const),
          project,
          xy,
        )
        depth.path(ring.xy, ring.z + 50, { width: hair, alpha: 0.6 * lock, tone: 'accent' })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An accent plate settles into register over an ink plate, every registration mark aligning, then lifts away. */
export function LoaderRegister(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
