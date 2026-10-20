'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, hump, lambert, mix, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'suture', title: 'Suture', category: 'geometry', technique: 'lines',
  tags: ['stitch', 'seam', 'lacing', 'thread', 'textile', 'tension'],
  description: 'Paired cross-stitches lace two separate strips together. Each upper thread passes over its partner in depth, loose arches tighten as the seam closes, and the stitches withdraw in reverse order while the strips ease apart.',
  order: 27,
  colors: [{ part: 'Thread', mono: 'ink' }],
} satisfies LoaderMeta

/* Two strips of stock, each a slab with a lit top and lit cut edges, a row
 * of square holes punched along the edges that face each other, and a
 * running stitch along the far edges. A needle, in the accent, leads the
 * thread from hole to hole across the gap: each stitch is a cross, its
 * second thread arching higher than its first so it passes over it, and
 * each run of thread is exactly as long as the needle has taken it. As the
 * laces go in the strips are drawn together and the loose arches pull taut
 * (`emphasized`); then the stitches come out in reverse order and the strips
 * ease apart. The view sways a little throughout.
 *
 * Color: the thread is `c1`, lacing through the ink strips; the
 * needle’s lead stays the accent. */

const LONG = 32
const OUTER = 29
const SLAB = 2.2
const INSET = 2.4
const YAW = -0.28
const PITCH = -0.68
const ZOOM = 1.12

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6.25,
  still: 0.3,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const fine = view.size >= 64
    const count = small ? 3 : 5
    const samples = small ? 12 : 24
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const thread = (small ? 1.25 : fine ? 1.5 : 1.3) / view.px
    const tension = view.ease.emphasized(hump(t))
    const gap = 10 - 6.2 * tension
    const yaw = YAW + 0.06 * Math.sin(TAU * t)
    const lens = camera({ yaw, pitch: PITCH, distance: 320, cx: view.w / 2 + 2.4, cy: view.h / 2 - 3 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    const turn = orient({ yaw, pitch: PITCH })
    const quad = (pts: readonly (readonly [number, number, number])[], key: number, light: number, outline: number) => {
      xy.length = 0
      for (const [x, y, z] of pts) {
        project(x, y, z, p)
        xy.push(p.x, p.y)
      }
      depth.face(xy, key, light)
      if (outline > 0) depth.path(xy, key + 0.01, { width: hair, alpha: outline, closed: true, join: 'miter' })
    }

    // The strips: slabs with a lit top, lit cut edges, square holes punched along the seam and a running stitch along the far edge.
    for (const sign of [-1, 1]) {
      const x0 = sign * gap
      const x1 = sign * OUTER
      quad([[x0, 0, -LONG], [x1, 0, -LONG], [x1, 0, LONG], [x0, 0, LONG]], -100, lambert(...turn(0, 1, 0)), 0.55)
      // The edge toward the seam, and the near end.
      const inner = turn(-sign, 0, 0)
      if (inner[2] > 0.001) quad([[x0, 0, -LONG], [x0, 0, LONG], [x0, -SLAB, LONG], [x0, -SLAB, -LONG]], -101, lambert(...inner), 0.4)
      const outer = turn(sign, 0, 0)
      if (outer[2] > 0.001) quad([[x1, 0, -LONG], [x1, 0, LONG], [x1, -SLAB, LONG], [x1, -SLAB, -LONG]], -101, lambert(...outer), 0.4)
      quad([[x0, 0, LONG], [x1, 0, LONG], [x1, -SLAB, LONG], [x0, -SLAB, LONG]], -101, lambert(...turn(0, 0, 1)), 0.4)
      // The seam-side edge, brightest: it's the line the lacing closes.
      project(x0, 0.02, -LONG, p)
      project(x0, 0.02, LONG, q)
      depth.line(p, q, line, 0.85)
      if (fine) {
        project(sign * (OUTER - 2.6), 0.03, -LONG + 2, p)
        project(sign * (OUTER - 2.6), 0.03, LONG - 2, q)
        depth.path([p.x, p.y, q.x, q.y], -99, { width: hair, alpha: 0.4, dash: [2.2 / view.px, 1.8 / view.px] })
      }
    }

    // The stitches: each a cross of two threads, hole to hole across the gap, the second higher so it passes over the first.
    const n = count * 2
    for (let stitch = 0; stitch < count; stitch++) {
      const center = -LONG + 8 + (stitch * (2 * LONG - 16)) / (count - 1)
      // The holes, punched through the stock: square, showing what's beneath.
      if (!small) {
        for (const sign of [-1, 1]) {
          for (const dz of [-4, 4]) {
            const hx = sign * (gap + INSET)
            const s = fine ? 0.9 : 1.2
            xy.length = 0
            for (const [ux, uz] of [[-s, -s], [s, -s], [s, s], [-s, s]] as const) {
              project(hx + ux, 0.04, center + dz + uz, p)
              xy.push(p.x, p.y)
            }
            depth.poly(xy, -98, 0, 'ink', true)
            if (fine) depth.path(xy, -97.9, { width: hair, alpha: 0.45, closed: true, join: 'miter' })
          }
        }
      }
      for (let crossing = 0; crossing < 2; crossing++) {
        const index = stitch * 2 + crossing
        const start = 0.035 + (index * 0.32) / n
        const undo = 0.64 + ((n - 1 - index) * 0.27) / n
        const shown = view.ease.emphasized(span(t, start, start + 0.09)) * (1 - view.ease.standard(span(t, undo, undo + 0.08)))
        if (shown <= 0.0005) continue
        const sign = crossing === 0 ? 1 : -1
        const lift = 1.2 + 8 * (1 - tension) + crossing * 2
        const reach = gap + INSET
        const at = (u: number, out: Projected) => project(-reach + 2 * reach * u, lift * Math.sin(Math.PI * u) + 0.1, center + sign * (-4 + 8 * u), out)
        // As much thread as the needle has taken: whole pieces, then the part piece to the needle.
        // Opaque, round-capped pieces, each sorted at its own depth: they join without beading, and the upper thread hides the lower where they cross.
        const pieces = Math.ceil(shown * samples)
        for (let j = 0; j < pieces; j++) {
          at(j / samples, p)
          at(Math.min(shown, (j + 1) / samples), q)
          depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: (thread * (p.k + q.k)) / 2, alpha: clamp(shown / 0.08), cap: 'round', tone: 'c1' })
        }
        // The needle leads it: a short straight steel along the thread's last heading, in the accent.
        const lead = shown < 1 ? Math.sin(Math.PI * clamp(shown)) ** 0.6 : 0
        if (lead > 0.01 && !small) {
          const u = Math.min(shown, 0.999)
          at(u, p)
          at(Math.min(1, u + 0.02), q)
          const dx = q.x - p.x
          const dy = q.y - p.y
          const len = Math.hypot(dx, dy) || 1
          const needle = (fine ? 7 : 6) / ZOOM
          const back = mix(0.35, 0.15, u)
          xy.length = 0
          xy.push(p.x - (dx / len) * needle * back, p.y - (dy / len) * needle * back, p.x + (dx / len) * needle * (1 - back), p.y + (dy / len) * needle * (1 - back))
          depth.path(xy, p.z + 2, { width: line, alpha: lead, tone: 'accent', cap: 'round' })
        }
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Depth-sorted crossing threads draw on, tighten a seam, and withdraw in reverse. */
export function LoaderSuture(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
