'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, lambert, mix, orient, point, polylineLength, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'quantile', title: 'Quantile', category: 'signal', technique: 'lines',
  tags: ['distribution', 'quantiles', 'dataset', 'cdf', 'statistics', 'thresholds'],
  description: 'A cumulative distribution is integrated from unequal sample intervals. Three probability readers travel to the curve and drop their value fences; four unequal-width strips then seat below it, each enclosing the same data mass, before the readers retrace.',
  order: 32,
  colors: [{ part: 'Curve', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const WEIGHTS = [1, 2, 4, 3, 1, 2, 5, 4, 2, 1, 3]
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0)
const curve: V3[] = [[-32, -18, 0]]
let sum = 0
WEIGHTS.forEach((weight, i) => { sum += weight; curve.push([-32 + 64 * (i + 1) / WEIGHTS.length, -18 + 48 * sum / TOTAL, 0]) })
function inverse(mass: number) {
  let below = 0
  for (let i = 0; i < WEIGHTS.length; i++) {
    const next = below + WEIGHTS[i]!
    if (mass * TOTAL <= next) return -32 + 64 * (i + (mass * TOTAL - below) / WEIGHTS[i]!) / WEIGHTS.length
    below = next
  }
  return 32
}
const cuts = [-32, inverse(0.25), inverse(0.5), inverse(0.75), 32]
const readers: V3[][] = [1, 2, 3].map((k) => [[-34, -18 + 12 * k, 1.2], [cuts[k]!, -18 + 12 * k, 1.2], [cuts[k]!, -25, 1.2]])
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const fragment: V3[] = []
const tip: V3 = [0, 0, 0]

/* Color: the distribution curve being integrated is `c1`; the
 * readers, fences and strips stay the ink, one reader the accent. */

export const scene: Scene = {
  beats: 5.8, still: 0.61,
  draw(pen, t, view) {
    const small = view.size < 32
    const pose = { yaw: -0.3, pitch: -0.3 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2 + 1, cy: 48 })
    const turn = orient(pose)
    const hair = (small ? 1.1 : 1) / view.px
    const clear = 1 - view.ease.exit(span(t, 0.82, 0.98))
    const integrated = view.ease.standard(span(t, 0.025, 0.31)) * clear
    project(-34, -18, 0, p); project(35, -18, 0, q); depth.line(p, q, hair * 0.9, 0.58)
    project(-34, -20, 0, p); project(-34, 33, 0, q); depth.line(p, q, hair * 0.9, 0.58)
    if (!small) for (let i = 0; i < curve.length; i++) {
      project(curve[i]![0], -18, 0, p); project(curve[i]![0], -21, 0, q); depth.line(p, q, hair * 0.7, 0.3)
    }
    const ghost = projectPath(curve, project, xy)
    depth.path(ghost.xy, ghost.z, { width: hair * 0.85, alpha: 0.18, join: 'round' })
    if (integrated > 0.004) {
      // Integration is revealed interval by interval in input order.
      const at = integrated * (curve.length - 1), whole = Math.floor(at)
      fragment.length = 0
      for (let i = 0; i <= whole; i++) fragment.push(curve[i]!)
      if (whole < curve.length - 1) {
        const a = curve[whole]!, b = curve[whole + 1]!, u = at - whole
        tip[0] = mix(a[0], b[0], u); tip[1] = mix(a[1], b[1], u)
        fragment.push(tip)
      }
      const active = projectPath(fragment, project, xy)
      depth.path(active.xy, active.z + 0.02, { width: hair * 1.5, alpha: 0.92 * clear, join: 'round', tone: 'c1' })
    }

    for (let k = 1; k <= 3; k++) {
      const from = 0.3 + (k - 1) * 0.055
      const u = view.ease.standard(span(t, from, from + 0.15))
      const off = view.ease.exit(span(t, 0.77 + (3 - k) * 0.025, 0.91 + (3 - k) * 0.025))
      const read = u * (1 - off)
      const x = cuts[k]!, y = -18 + 12 * k
      const f = projectPath(readers[k - 1]!, project, xy)
      if (!small) depth.path(f.xy, f.z, { width: hair * 0.65, alpha: 0.13, dash: [2 * hair, 2 * hair] })
      if (read <= 0.004) continue
      const length = polylineLength(f.xy)
      depth.path(f.xy, f.z + 0.02, { width: hair, alpha: 0.82 * (1 - off), tone: k === 2 ? 'accent' : 'ink', dash: [length * read, length + 1] })
      // A raised crosshair seats on the CDF once the horizontal reader arrives.
      const onCurve = view.ease.standard(span(t, from + 0.04, from + 0.1)) * (1 - off)
      project(x - 2.2, y, 2.5, p); project(x + 2.2, y, 2.5, q); depth.line(p, q, hair * 1.3, onCurve, k === 2 ? 'accent' : 'ink')
      if (!small) {
        project(x, y - 2.2, 2.5, p); project(x, y + 2.2, 2.5, q); depth.line(p, q, hair, onCurve)
        project(-36, y, 0, p); project(-32, y, 0, q); depth.line(p, q, hair, 0.48)
      }
    }

    // Equal probability gives unequal widths on the value axis. Each
    // strip uses the computed inverse, not a decorative quartering.
    for (let k = 0; k < 4; k++) {
      const ready = view.ease.emphasized(span(t, 0.47 + k * 0.04, 0.59 + k * 0.04)) * (1 - view.ease.exit(span(t, 0.74 + (3 - k) * 0.025, 0.85 + (3 - k) * 0.025)))
      const a = cuts[k]! + 0.65, b = cuts[k + 1]! - 0.65
      project(a, -28, 0, p); project(b, -28, 0, q); depth.line(p, q, hair * 0.75, 0.22)
      if (ready <= 0.004) continue
      const y = -28 + 2.5 * ready, z = 7 * (1 - ready) + 1
      for (let j = 0; j < 4; j++) { quad[j]![0] = j === 0 || j === 3 ? a : b; quad[j]![1] = y + (j < 2 ? -2.5 : 2.5); quad[j]![2] = z }
      const strip = projectPath(quad, project, xy)
      depth.face(strip.xy, strip.z, lambert(...turn(0, 0, 1)) * (0.7 + k * 0.06))
      depth.path(strip.xy, strip.z + 0.02, { width: hair * 0.8, alpha: 0.8 * ready, closed: true })
      if (!small) {
        // One mass witness in each strip makes their equality explicit.
        project((a + b) / 2, y - 1.25, z + 0.1, p); project((a + b) / 2, y + 1.25, z + 0.1, q)
        depth.line(p, q, hair, 0.85 * ready)
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Probability readers invert a cumulative curve into four equal-mass value intervals. */
export function LoaderQuantile(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
