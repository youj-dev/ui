'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, orient, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'lacuna', title: 'Lacuna', category: 'geometry', technique: 'lines',
  tags: ['fractal', 'carpet', 'recursive', 'void', 'courtyard', 'negative space'],
  description: 'A recursive carpet of square wells opens from its central void into successively smaller courtyards. Lit inner walls descend beneath the fine rims; each generation waits for its parent, then the apertures contract from the outside inward.',
  order: 25,
  colors: [{ part: 'Generations', mono: 'ink' }],
} satisfies LoaderMeta

/* A square slab, cut as a Sierpinski carpet: a well at the middle of the
 * slab, a smaller one at the middle of each of the eight squares round it,
 * and (on a large drawing) smaller again round those. Every well is a real
 * opening in the slab's top (one face with every aperture cut out of it), so
 * its far walls, lit by where they face, and its shaded floor are seen only
 * through the opening. The wells open a generation at a time, each waiting
 * for its parent (`emphasized`), deepening as they widen; then they close
 * from the smallest inward, never quite shut. The accent marks the central
 * void's corner. The view sways a little throughout.
 *
 * Color: each generation’s rims lean further toward `c1` the
 * deeper it is, the first well’s staying ink, so the recursion reads as a
 * gradient; the central opening stays the accent. */

type V3 = [number, number, number]
interface Well { x: number; z: number; half: number; generation: number }
const wells: Well[] = []
function subdivide(x: number, z: number, side: number, generation: number) {
  wells.push({ x, z, half: side / 6, generation })
  if (generation === 2) return
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    if (i || j) subdivide(x + i * side / 3, z + j * side / 3, side / 3, generation + 1)
  }
}
const SIDE = 66
const HALF = SIDE / 2 + 1
const SLAB = 5
subdivide(0, 0, SIDE, 0)
const depth = new Depth()
const P = Array.from({ length: 4 }, () => point())
const a = point()
const b = point()
const xy: number[] = []
const top: number[] = []
const corners: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 5.5, still: 0.37,
  draw(pen, t, view) {
    const small = view.size < 32
    const generations = view.size < 160 ? 1 : 2
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.2 : 1.35) / view.px
    const yaw = -0.38 + 0.08 * Math.sin(TAU * t)
    const pitch = -0.86
    const project = camera({ yaw, pitch, distance: 330, cx: view.w / 2, cy: 49 })
    const turn = orient({ yaw, pitch })
    let edgeOn = 1
    const lit = (n: V3) => {
      const v = turn(n[0], n[1], n[2])
      edgeOn = Math.min(1, v[2] / (0.15 * Math.hypot(n[0], n[1], n[2])))
      return v[2] > 0.001 ? lambert(v[0], v[1], v[2]) : -1
    }
    const put = (x: number, y: number, z: number, out: Projected) => project(x, y, z, out)

    // The slab's sides, toward us.
    const rimSquare: [number, number][] = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]]
    rimSquare.forEach(([x0, z0], i) => {
      const [x1, z1] = rimSquare[(i + 1) % 4]!
      const light = lit([z1 - z0, 0, x0 - x1])
      if (light < 0) return
      put(x0, 0, z0, P[0]!)
      put(x1, 0, z1, P[1]!)
      put(x1, -SLAB, z1, P[2]!)
      put(x0, -SLAB, z0, P[3]!)
      xy.length = 0
      for (const p of P) xy.push(p.x, p.y)
      depth.face(xy, -300, light)
      // A side seen nearly edge-on keeps its outline faint, so it doesn't show as a stray line.
      depth.path(xy, -299, { width: hair, alpha: 0.5 * edgeOn, closed: true, join: 'bevel' })
    })

    // Each well: its far walls and its floor, seen through its opening. Then the top, every opening cut out of it.
    top.length = 0
    for (const [x, z] of rimSquare) {
      put(x, 0, z, a)
      top.push(a.x, a.y)
    }
    const [sx, sy] = [top[0]!, top[1]!]
    const rims: { xy: number[]; g: number; shown: number }[] = []
    for (const well of wells) {
      if (well.generation > generations) continue
      const g = well.generation
      const open = view.ease.emphasized(span(t, 0.03 + g * 0.12, 0.28 + g * 0.12))
        - view.ease.emphasized(span(t, 0.65 + (2 - g) * 0.045, 0.86 + (2 - g) * 0.045))
      // The smallest wells close right up, so a closed carpet isn't peppered with specks.
      const least = g === 0 ? 0.28 : g === 1 ? 0.18 : 0
      const r = well.half * (least + (1 - least) * open)
      const drop = (g === 0 ? 12 : g === 1 ? 5.5 : 2.2) * (0.3 + 0.7 * open)
      corners.forEach((c, k) => {
        c[0] = well.x + (k === 1 || k === 2 ? r : -r)
        c[2] = well.z + (k < 2 ? -r : r)
      })
      for (let j = 0; j < 4; j++) {
        const c0 = corners[j]!
        const c1 = corners[(j + 1) % 4]!
        // Facing into the well, the inverse of an extruded solid's outward normal.
        const light = lit([c0[2] - c1[2], 0, c1[0] - c0[0]])
        if (light < 0) continue
        put(c0[0], 0, c0[2], P[0]!)
        put(c1[0], 0, c1[2], P[1]!)
        put(c1[0], -drop, c1[2], P[2]!)
        put(c0[0], -drop, c0[2], P[3]!)
        xy.length = 0
        for (const p of P) xy.push(p.x, p.y)
        depth.face(xy, -200 + g, light * 0.78)
      }
      xy.length = 0
      for (const c of corners) {
        put(c[0], -drop, c[2], a)
        xy.push(a.x, a.y)
      }
      depth.face(xy, -201 + g, lit([0, 1, 0]) * 0.5)
      // The opening: a bridge from the slab's corner, round the opening the other way, and back.
      const ring: number[] = []
      for (const k of [0, 3, 2, 1]) {
        put(corners[k]![0], 0, corners[k]![2], a)
        ring.push(a.x, a.y)
      }
      top.push(sx, sy, ...ring, ring[0]!, ring[1]!, sx, sy)
      rims.push({ xy: ring, g, shown: Math.min(1, r / 0.8) })
    }
    depth.face(top, -100, lit([0, 1, 0]))
    xy.length = 0
    for (const [x, z] of rimSquare) {
      put(x, 0, z, a)
      xy.push(a.x, a.y)
    }
    // Bevelled: seen this flat, the slab's far corner is sharp enough for a mitre to spike past it.
    depth.path(xy, -99, { width: line, alpha: 0.85, closed: true, join: 'bevel' })
    for (const { xy: ring, g, shown } of rims) {
      // The deeper a generation, the more its rim leans toward the carpet's color.
      depth.path(ring, -98, { width: g === 0 ? line : hair, alpha: (g === 0 ? 0.9 : g === 1 ? 0.62 : 0.4) * shown, closed: true, join: 'miter', tone: blend('ink', 'c1', 0.45 * g) })
    }

    // The accent: a corner mark on the central void's rim.
    const centre = wells[0]!
    const open = view.ease.emphasized(span(t, 0.03, 0.28)) - view.ease.emphasized(span(t, 0.74, 0.95))
    const r = centre.half * (0.28 + 0.72 * open)
    const arm = Math.min(r * 0.7, 4.5)
    put(-r, 0.05, r - arm, a)
    put(-r, 0.05, r, b)
    xy.length = 0
    xy.push(a.x, a.y, b.x, b.y)
    put(-r + arm, 0.05, r, a)
    xy.push(a.x, a.y)
    depth.path(xy, -97, { width: line * 1.2, alpha: 1, tone: 'accent', join: 'miter', cap: 'square' })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Recursive negative spaces open in generations over an inclined carpet. */
export function LoaderLacuna(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
