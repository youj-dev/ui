'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, roundedRect, span, Depth, point, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'beacon',
  title: 'Beacon',
  category: 'color',
  technique: 'planes',
  tags: ['status', 'queue', 'steps', 'jobs', 'progress', 'checklist', 'state'],
  description: 'A column of status lights works through its jobs one by one: each waits as an outline, pulses while it runs, and settles into done, the accent pointing at the one at work, until the column clears for the next run.',
  order: 10,
  colors: [
    { part: 'Running', mono: 'ink' },
    { part: 'Done', mono: 'ink', role: 'success' },
  ],
} satisfies LoaderMeta

/* A card in slight perspective holds a column of rows, each a square
 * indicator and a label bar. In turn, each row's job runs: its indicator
 * fills, breathing, a ring going out from it, and a progress line runs
 * under its label; then it's done, the indicator settling solid and the
 * line staying. The accent pointer glides (`emphasized`) to each row as its
 * job starts. Once the last is done the column clears, top to bottom, each
 * light shrinking back to its outline, and the pointer returns to the top:
 * the frame the loop began on.
 *
 * Color: state. Running is `c1`, done is `c2` (the theme's success
 * color), the light passing from one to the other as the job finishes;
 * queued rows are ink outlines. Monochrome, running and done read as a
 * breathing light and a steady one. */

const DETAIL = [
  { below: 32, rows: 3, bars: false },
  { below: 80, rows: 4, bars: true },
  { below: Infinity, rows: 5, bars: true },
]
const BARS = [0.78, 0.55, 0.9, 0.64, 0.72]

const depth = new Depth()
const p = point()
const xy: number[] = []

/** A rectangle on the card (y down), projected and added to the depth buffer as a plane or an outline. */
function rect(project: Project, x: number, y: number, w: number, h: number, z: number) {
  xy.length = 0
  let depthZ = 0
  for (const [a, b] of [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ] as const) {
    project(a, -b, z, p)
    xy.push(p.x, p.y)
    depthZ += p.z
  }
  return depthZ / 4
}

export const scene: Scene = {
  beats: 6,
  still: 0.45,
  draw(pen, t, view) {
    t %= 1
    const { rows, bars } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: 0.32 + 0.05 * Math.sin(TAU * t), pitch: -0.18, distance: 280, cx: view.w / 2, cy: view.h / 2 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.02, 1, 1.6) / view.px
    const pitch = rows === 3 ? 18 : rows === 4 ? 14 : 11.5
    const box = pitch * (bars ? 0.5 : 0.74)
    const top = -((rows - 1) * pitch + box) / 2
    const left = bars ? -22 : -box / 2
    // Each job runs for `run` of the loop, one after another; the clear takes the last stretch.
    const run = 0.78 / rows
    const startOf = (k: number) => 0.05 + k * run
    const doneOf = (k: number) => startOf(k) + run * 0.86

    if (bars) {
      const card = roundedRect(-31, top - 7, 62, rows * pitch - pitch + box + 14, 3, 3)
      xy.length = 0
      for (const [a, b] of card) {
        project(a, -b, 0, p)
        xy.push(p.x, p.y)
      }
      depth.poly(xy, -20, 0.04)
      depth.path(xy, -19, { width: hair, alpha: 0.3, closed: true })
    }

    for (let k = 0; k < rows; k++) {
      const y = top + k * pitch
      const start = startOf(k)
      const done = doneOf(k)
      // The light: filling as the job starts, passing to done as it finishes, shrinking back to its outline as the column clears.
      const fill = view.ease.enter(span(t, start, start + 0.035))
      const finish = view.ease.standard(span(t, done, done + 0.04))
      const clear = view.ease.standard(span(t, 0.86 + k * 0.022, 0.9 + k * 0.022))
      const on = fill * (1 - clear)
      const running = fill * (1 - finish)
      const breathe = running * (0.5 - 0.5 * Math.cos(TAU * ((t - start) / (run * 0.43))))
      const tone: Tone = blend('c1', 'c2', finish)

      const z = rect(project, left, y, box, box, 1)
      depth.path(xy, z + 1, { width: stroke, alpha: 0.55 * (1 - on) + 0.15, closed: true, join: 'miter', tone: on > 0.5 ? tone : 'ink' })
      if (on > 0.01) {
        const s = box * (0.25 + 0.75 * on)
        rect(project, left + (box - s) / 2, y + (box - s) / 2, s, s, 1.2)
        depth.poly(xy, z + 2, (0.95 - 0.3 * breathe) * on, tone)
      }
      // A ring goes out from a running light, twice while it runs.
      if (bars && running > 0.05) {
        const w = ((t - start) / (run * 0.43)) % 1
        const grow = box * 0.6 * view.ease.enter(w)
        rect(project, left - grow / 2, y - grow / 2, box + grow, box + grow, 1.1)
        depth.path(xy, z + 3, { width: hair, alpha: 0.6 * (1 - w) * running, closed: true, tone: 'c1' })
      }

      if (bars) {
        const length = 44 * BARS[k]!
        const bx = left + box + 5
        const by = y + box / 2 - 1.1
        rect(project, bx, by, length, 2.2, 0.5)
        depth.poly(xy, z, 0.18, 'ink')
        // Progress under the label while it runs; it stays once done, until the column clears.
        const progress = view.ease.standard(span(t, start + 0.02, done)) * (1 - clear)
        if (progress > 0.01) {
          rect(project, bx, by + 3.6, length * progress, 0.9, 0.6)
          // The line is the running color while it runs, and settles to the ink once done: the light alone says done.
          depth.poly(xy, z + 0.5, 0.75 - 0.3 * finish, blend('c1', 'ink', finish))
        }
      }
    }

    // The accent pointer: beside the row at work, gliding to the next as it starts, and home to the top as the column clears.
    let at = 0
    for (let k = 1; k < rows; k++) at += view.ease.emphasized(span(t, startOf(k) - 0.04, startOf(k)))
    at -= (rows - 1) * view.ease.emphasized(span(t, 0.9, 0.98))
    const py = top + at * pitch + box / 2
    const side = clamp(view.size * 0.04, 2, 3.8) / view.px
    project(left - (bars ? 5.5 : 8), -py, 1.5, p)
    p.z = 200
    depth.square(p, side, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A column of status lights runs its jobs in turn, each pulsing while it works and settling done. */
export function LoaderBeacon(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
