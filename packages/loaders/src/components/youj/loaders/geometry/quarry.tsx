'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, point, span, Depth, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'quarry', title: 'Quarry', category: 'geometry', technique: 'lines',
  tags: ['geology', 'fault', 'strata', 'cutaway', 'terrain', '3d'],
  description: 'A cutaway terrain block opens along a fault and one bank slips upward. Five continuous strata become offset across the exposed rock walls; the short accent fault trace climbs through the section before the banks settle back into register.',
  order: 35,
  colors: [{ part: 'Marker bed', mono: 'ink' }],
} satisfies LoaderMeta

/* A block of ground cut away like a geological model: five strata, flat
 * beds in alternating tones, truncated by a gently rolling surface on top.
 * It opens along a fault and the right bank slips up (`emphasized`), so
 * every bed steps across the gap: the throw is measured by a dimension
 * line between the offset marker bed, half-arrows on the section show
 * which way each bank moved, striations score the exposed fault wall, and
 * the accent trace climbs the fault while it slips. Then the bank settles
 * back and the block closes into register. The view sways throughout.
 *
 * Color: the marker stratum is `c1`, so the offset across the
 * fault reads at a glance; the slip gauge stays the accent. */

const HALF = 26 // each bank's width
const DEEP = 15 // half the block's depth
const BOTTOM = -18
const BEDS = [-12.6, -7.4, -2.2, 3] // the boundaries between the five strata
const MARKER = 2 // the marker bed's boundary: its offset is measured
const THROW = 10

const surface = (x: number, z: number) => 8.5 + 2.6 * Math.sin(x * 0.075 + z * 0.04) + 1.2 * Math.cos(z * 0.12)

const depth = new Depth()
const p = point()
const q = point()
const r = point()
const s = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.42,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 64
    const hair = clamp(view.size * 0.006, 0.85, 1.25) / view.px
    const line = (small ? 1.25 : 1.3) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const yaw = -0.5 + 0.08 * Math.sin(TAU * t)
    const pose = { yaw, pitch: -0.44 }
    const zoom = small ? 1.3 : 1.24
    const lens = camera({ ...pose, distance: 340, cx: view.w / 2, cy: view.h / 2 + 1 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y + 1) * zoom, z * zoom, out)
    const turn = orient(pose)
    const opening = view.ease.emphasized(span(t, 0.04, 0.25)) - view.ease.standard(span(t, 0.72, 0.94))
    const slip = view.ease.emphasized(span(t, 0.2, 0.47)) - view.ease.standard(span(t, 0.58, 0.84))
    const pieces = small ? 3 : 6
    const frontLight = lambert(...turn(0, 0, 1))
    const gapX = 1 + opening * 2

    for (const side of [-1, 1]) {
      const x0 = side < 0 ? -HALF - 1 - opening * 2 : gapX
      const x1 = side < 0 ? -1 - opening * 2 : HALF + 1 + opening * 2
      const lift = side > 0 ? slip * THROW : -slip * 2
      const bottom = BOTTOM + lift
      const top = (x: number, z: number) => surface(x - side * opening * 2, z) + lift
      const bed = (k: number) => BEDS[k]! + lift
      // The camera is on the right bank's side, so the left bank is all drawn first: the two never interleave.
      const o = side < 0 ? 0 : 100

      // The section: each stratum a lit band, alternating in tone, the top one cut by the surface.
      for (let k = 0; k <= BEDS.length; k++) {
        const y0 = k === 0 ? bottom : bed(k - 1)
        const tone = k % 2 ? 0.7 : 1
        if (k < BEDS.length) {
          project(x0, y0, DEEP, p)
          project(x1, y0, DEEP, q)
          project(x1, bed(k), DEEP, r)
          project(x0, bed(k), DEEP, s)
          depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], o + 60, frontLight * tone)
        } else {
          xy.length = 0
          for (let i = 0; i <= pieces; i++) {
            const x = mix(x0, x1, i / pieces)
            project(x, y0, DEEP, p)
            xy.push(p.x, p.y)
          }
          for (let i = pieces; i >= 0; i--) {
            const x = mix(x0, x1, i / pieces)
            project(x, top(x, DEEP), DEEP, p)
            xy.push(p.x, p.y)
          }
          depth.face(xy, o + 60, frontLight * tone)
        }
        // The bedding plane's trace across the section; the marker bed heavier.
        if (k > 0) {
          project(x0, y0, DEEP + 0.1, p)
          project(x1, y0, DEEP + 0.1, q)
          depth.path([p.x, p.y, q.x, q.y], o + 61, { width: k - 1 === MARKER ? line : hair, alpha: k - 1 === MARKER ? 0.85 : 0.5, tone: k - 1 === MARKER ? 'c1' : 'ink' })
        }
      }
      // The top: the rolling surface, faceted and lit by its slope, edged along the section.
      for (let i = 0; i < pieces; i++) {
        const a = mix(x0, x1, i / pieces)
        const b = mix(x0, x1, (i + 1) / pieces)
        project(a, top(a, DEEP), DEEP, p)
        project(b, top(b, DEEP), DEEP, q)
        project(b, top(b, -DEEP), -DEEP, r)
        project(a, top(a, -DEEP), -DEEP, s)
        const n = turn(-(top(b, 0) - top(a, 0)) / (b - a), 1, 0)
        depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], o + 20, lambert(...n))
        depth.path([p.x, p.y, q.x, q.y], o + 62, { width: line, alpha: 0.9 })
      }
      // Survey profiles across the top, so its roll reads.
      if (!small) {
        for (const z of [-DEEP / 2, 0, DEEP / 2]) {
          xy.length = 0
          for (let i = 0; i <= pieces; i++) {
            const x = mix(x0, x1, i / pieces)
            project(x, top(x, z) + 0.05, z, p)
            xy.push(p.x, p.y)
          }
          depth.path(xy, o + 21, { width: hair, alpha: 0.28, join: 'round' })
        }
      }
      // The end walls: the outer one, and the fault wall the opening exposes, banded like the section.
      for (const x of [x0, x1]) {
        const outward = x === x0 ? -1 : 1
        const n = turn(outward, 0, 0)
        if (n[2] <= 0) continue
        const light = lambert(...n)
        for (let k = 0; k <= BEDS.length; k++) {
          const y0 = k === 0 ? bottom : bed(k - 1)
          project(x, y0, -DEEP, p)
          project(x, y0, DEEP, q)
          if (k < BEDS.length) {
            project(x, bed(k), DEEP, r)
            project(x, bed(k), -DEEP, s)
          } else {
            project(x, top(x, DEEP), DEEP, r)
            project(x, top(x, -DEEP), -DEEP, s)
          }
          depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], o + 40, light * (k % 2 ? 0.7 : 1))
          if (k > 0) depth.path([p.x, p.y, q.x, q.y], o + 41, { width: hair, alpha: 0.45 })
        }
        project(x, bottom, DEEP, p)
        project(x, top(x, DEEP), DEEP, q)
        depth.path([p.x, p.y, q.x, q.y], o + 63, { width: line, alpha: 0.9 })
        // Striations on the fault wall, scored along the slip.
        const fault = (side < 0 && x === x1) || (side > 0 && x === x0)
        if (fault && fine) {
          for (let k = 0; k < 4; k++) {
            const z = mix(-DEEP + 3, DEEP - 3, k / 3)
            project(x, bottom + 4 + k * 1.5, z, p)
            project(x, bottom + 4 + k * 1.5 + 12, z - 3, q)
            depth.path([p.x, p.y, q.x, q.y], o + 42, { width: hair, alpha: 0.3 * clamp(opening * 2) })
          }
        }
      }
      // Half-arrows on the section beside the fault: which way each bank moved.
      if (fine) {
        const ax = side < 0 ? x1 - 4 : x0 + 4
        const y = bed(1) + 2.6
        const dir = side
        const len = 5 * slip
        if (len > 0.2) {
          project(ax, y - (dir * len) / 2, DEEP + 0.2, p)
          project(ax, y + (dir * len) / 2, DEEP + 0.2, q)
          depth.path([p.x, p.y, q.x, q.y], o + 64, { width: hair, alpha: 0.75 * clamp(slip * 3) })
          project(ax - side * 1.6, y + (dir * len) / 2 - dir * 1.6, DEEP + 0.2, r)
          depth.path([q.x, q.y, r.x, r.y], o + 64, { width: hair, alpha: 0.75 * clamp(slip * 3) })
        }
      }
    }

    // The throw: a dimension line across the fault between the two ends of the marker bed.
    if (!small) {
      const shown = clamp(slip * 4)
      const yl = BEDS[MARKER]! - slip * 2
      const yr = BEDS[MARKER]! + slip * THROW
      const x = 0
      project(x, yl, DEEP + 0.4, p)
      project(x, yr, DEEP + 0.4, q)
      depth.path([p.x, p.y, q.x, q.y], 270, { width: hair, alpha: 0.7 * shown })
      for (const y of [yl, yr]) {
        project(x - 1.4, y, DEEP + 0.4, p)
        project(x + 1.4, y, DEEP + 0.4, q)
        depth.path([p.x, p.y, q.x, q.y], 270, { width: hair, alpha: 0.7 * shown })
      }
    }

    // The accent trace, climbing the fault on the section while it slips.
    const climb = span(t, 0.2, 0.72)
    const shown = Math.sin(Math.PI * climb) ** 2
    if (shown > 0.005) {
      const y = mix(BOTTOM + 2, 9, view.ease.standard(climb)) + slip * THROW * 0.5
      project(gapX, y, DEEP + 0.5, p)
      project(gapX, y + 5, DEEP + 0.5, q)
      depth.path([p.x, p.y, q.x, q.y], 280, { width: line * 1.2, alpha: shown, tone: 'accent', cap: 'square' })
    }

    // The plan of the block on the ground below, dashed.
    if (!small) {
      const corners: [number, number][] = [[-HALF - 3, -DEEP - 2], [HALF + 3, -DEEP - 2], [HALF + 3, DEEP + 2], [-HALF - 3, DEEP + 2]]
      corners.forEach(([x0, z0], i) => {
        const [x1, z1] = corners[(i + 1) % 4]!
        project(x0, BOTTOM - 3, z0, p)
        project(x1, BOTTOM - 3, z1, q)
        depth.path([p.x, p.y, q.x, q.y], -100, { width: hair, alpha: 0.25, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash) })
      })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Geological layers offset across a three-dimensional fault section. */
export function LoaderQuarry(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
