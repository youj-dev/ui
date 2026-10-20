'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, point, span, TAU, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'blossom', title: 'Blossom', category: 'signal', technique: 'lines',
  tags: ['bezier', 'interpolation', 'curve', 'generation', 'control', 'construction'],
  description: 'Three successive interpolation levels evaluate a spatial cubic curve. Sliding construction bars converge on its writing point, a tangent follows the generated stroke, and the evaluation retraces to release the curve without a reset.',
  order: 80,
  colors: [{ part: 'Stroke', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const CONTROL: V3[] = [[-33, -19, -4], [-22, 36, -15], [19, -35, 14], [33, 19, 0]]
const levels: V3[][] = [CONTROL, Array.from({ length: 3 }, () => [0, 0, 0]), Array.from({ length: 2 }, () => [0, 0, 0]), [[0, 0, 0]]]
const curve: V3[] = Array.from({ length: 65 }, (_, i) => {
  const u = i / 64, v = 1 - u
  return [0, 1, 2].map(k => v ** 3 * CONTROL[0]![k]! + 3 * v * v * u * CONTROL[1]![k]! + 3 * v * u * u * CONTROL[2]![k]! + u ** 3 * CONTROL[3]![k]!) as V3
})
const xy: number[] = [], ring: number[] = []
const p = point(), q = point(), tip = point()
const depth = new Depth()

/* Color: the stroke being written is `c1`; the construction bars
 * stay the ink and the writing point the accent. */

export const scene: Scene = {
  beats: 5.5, still: 0.38,
  draw(pen, t, view) {
    const small = view.size < 32, hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.24, pitch: -0.2, distance: 320, cx: view.w / 2, cy: 50 })
    const u = view.ease.standard(span(t, 0.06, 0.61)) * (1 - view.ease.standard(span(t, 0.69, 0.96)))
    const show = view.ease.enter(span(t, 0.015, 0.1)) * (1 - view.ease.exit(span(t, 0.9, 0.98)))
    for (let l = 1; l < 4; l++) for (let j = 0; j < 4 - l; j++) for (let k = 0; k < 3; k++) levels[l]![j]![k] = mix(levels[l - 1]![j]![k]!, levels[l - 1]![j + 1]![k]!, u)

    // Every level is the actual affine interpolation of the level above.
    // The fixed handles anchor the moving construction, even at the seam.
    for (let l = 0; l < 3; l++) {
      if (small && l === 1) continue
      const row = levels[l]!, alpha = l === 0 ? 0.27 : (l === 1 ? 0.46 : 0.85) * show
      for (let j = 0; j < row.length - 1; j++) {
        project(...row[j]!, p); project(...row[j + 1]!, q)
        depth.line(p, q, hair * (l === 2 ? 1.15 : 0.75), alpha * clamp(0.8 + (p.z + q.z) / 180, 0.55, 1))
      }
      if (!small || l === 0) for (const v of row) {
        project(...v, p)
        ring.length = 0
        const radius = (l === 0 ? 1.7 : 1.2) * hair * p.k
        for (let j = 0; j <= 12; j++) ring.push(p.x + radius * Math.cos(TAU * j / 12), p.y + radius * Math.sin(TAU * j / 12))
        depth.poly(ring, p.z + 0.04, 0.02, 'ink', true)
        depth.path(ring, p.z + 0.05, { width: hair * 0.8, alpha: l === 0 ? 0.72 : 0.72 * show, closed: true })
      }
    }
    // A faint full curve makes the output legible while its generated
    // prefix is being written, rather than replacing one picture by another.
    xy.length = 0
    for (const v of curve) { project(...v, p); xy.push(p.x, p.y) }
    depth.path(xy, 80, { width: hair * 0.8, alpha: 0.15, join: 'round' })
    if (u > 0.001) {
      xy.length = 0
      for (let i = 0; i <= Math.floor(u * 64); i++) { project(...curve[i]!, p); xy.push(p.x, p.y) }
      project(...levels[3]![0]!, tip); xy.push(tip.x, tip.y)
      depth.path(xy, 81, { width: hair * 1.5, alpha: 0.92, join: 'round', cap: 'round', tone: 'c1' })
    }
    if (show > 0.004) {
      const a = levels[2]![0]!, b = levels[2]![1]!, c = levels[3]![0]!
      const length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1
      const tangent = small ? 5 : 8
      project(c[0] - (b[0] - a[0]) * tangent / length, c[1] - (b[1] - a[1]) * tangent / length, c[2] - (b[2] - a[2]) * tangent / length, p)
      project(c[0] + (b[0] - a[0]) * tangent / length, c[1] + (b[1] - a[1]) * tangent / length, c[2] + (b[2] - a[2]) * tangent / length, q)
      depth.path([p.x, p.y, q.x, q.y], 82, { width: hair, alpha: 0.9 * show, tone: 'accent' })
      project(...c, tip)
      ring.length = 0
      const radius = (small ? 1.8 : 2.2) * hair
      for (let j = 0; j <= 16; j++) ring.push(tip.x + radius * Math.cos(TAU * j / 16), tip.y + radius * Math.sin(TAU * j / 16))
      depth.poly(ring, 83, 0.02, 'ink', true)
      depth.path(ring, 84, { width: hair, alpha: show, tone: 'accent', closed: true })
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Affine construction bars converge on a cubic curve's moving evaluation. */
export function LoaderBlossom(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
