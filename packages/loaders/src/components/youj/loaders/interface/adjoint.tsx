'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'adjoint', title: 'Adjoint', category: 'interface', technique: 'lines',
  tags: ['training', 'model', 'gradient', 'backpropagation', 'network', 'learning'],
  description: 'A small model carries activations forward through three depth-separated banks. The output sends its error backward along the same connections, their weight witnesses adjust by the computed gradients, and the training step unwinds for the next example.',
  order: 33,
  colors: [{ part: 'Activation', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const INPUT = [0.8, 0.35]
const W = [[0.55, 0.25], [0.35, 0.7], [0.65, 0.4]]
const V = [0.4, 0.55, 0.3]
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const HIDDEN = W.map((row) => sigmoid(row[0]! * INPUT[0]! + row[1]! * INPUT[1]! - 0.4))
const OUTPUT = sigmoid(HIDDEN.reduce((sum, h, j) => sum + h * V[j]!, -0.6))
const ERROR = (OUTPUT - 0.25) * OUTPUT * (1 - OUTPUT)
const DELTA = HIDDEN.map((h, j) => ERROR * V[j]! * h * (1 - h))
const UPDATED_HIDDEN = W.map((row, j) => sigmoid(row.reduce((sum, weight, i) => sum + (weight - 2.5 * DELTA[j]! * INPUT[i]!) * INPUT[i]!, -0.4)))
const UPDATED_OUTPUT = sigmoid(UPDATED_HIDDEN.reduce((sum, h, j) => sum + h * (V[j]! - 2.5 * ERROR * HIDDEN[j]!), -0.6))
const LOSS_RATIO = ((UPDATED_OUTPUT - 0.25) / (OUTPUT - 0.25)) ** 2
const NODES: { p: V3; layer: number; value: number }[] = [
  { p: [-29, 14, -8], layer: 0, value: INPUT[0]! }, { p: [-29, -14, -8], layer: 0, value: INPUT[1]! },
  ...HIDDEN.map((value, j) => ({ p: [0, 22 - j * 22, 5] as V3, layer: 1, value })),
  { p: [29, 0, -2], layer: 2, value: OUTPUT },
]
const EDGES = W.flatMap((row, j) => row.map((weight, i) => ({ a: i, b: j + 2, layer: 0, weight, gradient: DELTA[j]! * INPUT[i]! })))
for (let j = 0; j < 3; j++) EDGES.push({ a: j + 2, b: 5, layer: 1, weight: V[j]!, gradient: ERROR * HIDDEN[j]! })
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.53,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const project = camera({ yaw: -0.2, pitch: -0.26, distance: 310, cx: 50, cy: 48 })
    const release = 1 - view.ease.exit(span(t, 0.86, 0.98))
    const learn = view.ease.emphasized(span(t, 0.61, 0.75)) * release
    const included = (i: number) => !small || i !== 4
    for (const e of EDGES) {
      if (!included(e.a) || !included(e.b)) continue
      const a = NODES[e.a]!.p, b = NODES[e.b]!.p
      const ax = a[0] + 5, bx = b[0] - 5
      rule(depth, project, ax, a[1], a[2], bx, b[1], b[2], hair * 0.65, 0.22)
      const forward = view.ease.standard(span(t, 0.07 + e.layer * 0.18, 0.22 + e.layer * 0.18))
      const backward = view.ease.standard(span(t, 0.43 + (1 - e.layer) * 0.13, 0.55 + (1 - e.layer) * 0.13))
      // The fronts travel in opposite directions on the actual edge. They
      // have finite tails, and end at the station instead of wrapping there.
      for (const [progress, reverse] of [[forward, false], [backward, true]] as const) {
        if (progress <= 0 || progress >= 1) continue
        const lo = clamp(progress - 0.24), hi = progress
        const start = reverse ? 1 - hi : lo, end = reverse ? 1 - lo : hi
        const alpha = Math.sin(Math.PI * progress) ** 0.5
        rule(depth, project,
          mix(ax, bx, start), mix(a[1], b[1], start), mix(a[2], b[2], start),
          mix(ax, bx, end), mix(a[1], b[1], end), mix(a[2], b[2], end), hair * 1.45, alpha * release,
          reverse && e.b === 5 && e.a === 3 ? 'accent' : reverse ? 'ink' : 'c1')
      }
      if (!small) {
        const x = mix(a[0], b[0], 0.55), y = mix(a[1], b[1], 0.55), z = mix(a[2], b[2], 0.55) + 1
        const weight = e.weight - 2.5 * e.gradient * learn
        rule(depth, project, x, y - 3, z, x, y - 3 + 6 * weight, z, hair, 0.48 + learn * 0.35)
      }
    }
    NODES.forEach(({ p: [x, y, z], layer, value }, i) => {
      if (!included(i)) return
      const active = layer === 0 ? 1 : view.ease.enter(span(t, 0.18 + (layer - 1) * 0.18, 0.25 + (layer - 1) * 0.18)) * release
      const lift = 3 * active
      const order = window(depth, project, x, y, z + lift, 9, small ? 10 : 8, hair, 0.35 + 0.5 * active, 0.025)
      const response = mix(value, layer === 2 ? UPDATED_OUTPUT : layer === 1 ? UPDATED_HIDDEN[i - 2]! : value, learn)
      rule(depth, project, x - 2.8, y, z + lift + 0.2, x - 2.8 + 5.6 * response, y, z + lift + 0.2, hair * 1.3, 0.35 + active * 0.6, 'ink', order + 0.04)
    })
    // A paired loss witness makes the backward pass legible at small sizes.
    const loss = (OUTPUT - 0.25) ** 2
    rule(depth, project, 22, -31, -2, 37, -31, -2, hair, 0.3)
    rule(depth, project, 22, -31, -1, 22 + 15 * mix(1, LOSS_RATIO, learn), -31, -1, hair * 1.45, span(t, 0.38, 0.43) * release * clamp(loss * 12))
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Activations run forward, gradients return, and actual weight witnesses adjust.
 *
 * Color: the forward pass, the activations running out along the connections, travels in `c1`; the error coming back is the ink, its one edge the accent. */
export function LoaderAdjoint(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
