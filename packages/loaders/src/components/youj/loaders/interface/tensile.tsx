'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { dataPlane } from './data-plane'
import { rule, window } from './computing'

export const meta = {
  id: 'tensile', title: 'Tensile', category: 'interface', technique: 'planes',
  tags: ['matrix', 'multiply', 'outer product', 'compute', 'accumulate', 'dataset'],
  description: 'Paired operand vectors advance through three outer-product passes. A diagonal write front raises each result tile and lengthens its accumulated value, then the contributions unwind in reverse order through the same contracted axis.',
  order: 32,
  colors: [{ part: 'Products', mono: 'ink' }],
} satisfies LoaderMeta

const A = [[0.7, 0.3, 0.5], [0.25, 0.85, 0.45], [0.6, 0.4, 0.8]]
const B = [[0.35, 0.75, 0.55], [0.8, 0.25, 0.6], [0.4, 0.65, 0.3]]
const PRODUCTS = A.map((row) => B[0]!.map((_, col) => row.map((value, k) => value * B[k]![col]!)))
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32
    const n = small ? 2 : 3
    const spacing = 42 / n
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.32, pitch: -0.38, distance: 300, cx: 53, cy: 52 })
    window(depth, project, 0, 0, -3, 50, 50, hair * 0.75, 0.33, -1)
    const contract = (k: number, lag = 0) => clamp(view.ease.standard(span(t, 0.04 + k * 0.18 + lag, 0.15 + k * 0.18 + lag)) - view.ease.standard(span(t, 0.72 + (2 - k) * 0.07 - lag / 3, 0.81 + (2 - k) * 0.07 - lag / 3)))
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      const x = (col - (n - 1) / 2) * spacing
      const y = ((n - 1) / 2 - row) * spacing
      let value = 0, arrival = 0
      for (let k = 0; k < 3; k++) {
        const amount = contract(k, (row + col) * 0.018)
        value += PRODUCTS[row]![col]![k]! * amount
        arrival = Math.max(arrival, amount)
      }
      const z = 1 + 7 * arrival
      window(depth, project, x, y, -2, spacing - 2.5, spacing - 2.5, hair * 0.65, 0.19, -1)
      if (arrival > 0.004) {
        const order = dataPlane(depth, project, x, y, z, spacing - 3, spacing - 3, hair * 0.75, 0.62, 0.55 + 0.25 * arrival)
        const length = (spacing - 6) * clamp(value / 1.35)
        rule(depth, project, x - (spacing - 6) / 2, y, z + 0.2, x - (spacing - 6) / 2 + length, y, z + 0.2, hair * 1.3, 0.96, 'c1', order + 0.04)
        if (!small) rule(depth, project, x, y, -2, x, y, z, hair * 0.5, 0.18 * arrival)
      }
    }
    // The contracted index runs along the two operand banks together.
    // Each pass selects a COLUMN of A and the corresponding ROW of B.
    for (let k = 0; k < 3; k++) {
      const progress = contract(k)
      const next = k < 2 ? contract(k + 1) : 0
      const selected = progress * (1 - next)
      const bankZ = mix(-9, 3, selected)
      for (let i = 0; i < n; i++) {
        const v = (i - (n - 1) / 2) * spacing
        const bx = -34 - k * 3.2
        const by = 31 + k * 3.2
        rule(depth, project, bx, -v - 3.5, bankZ, bx, -v - 3.5 + A[i]![k]! * 7, bankZ, hair * 1.3, 0.24 + 0.67 * selected)
        rule(depth, project, v - 3.5, by, bankZ, v - 3.5 + B[k]![i]! * 7, by, bankZ, hair * 1.3, 0.24 + 0.67 * selected)
        if (selected > 0.01 && !small) {
          rule(depth, project, bx + 2, -v, bankZ, -27, -v, 0, hair * 0.65, selected * 0.32)
          rule(depth, project, v, by - 2, bankZ, v, 27, 0, hair * 0.65, selected * 0.32)
        }
      }
      // A short index witness, rather than tinting the whole active bank.
      rule(depth, project, -36 - k * 3.2, 25, bankZ, -31 - k * 3.2, 25, bankZ, hair * 1.35, selected, 'accent')
    }
    if (!small) {
      rule(depth, project, -27, -27, -2, 27, -27, -2, hair, 0.4)
      rule(depth, project, 27, -27, -2, 27, 27, -2, hair, 0.4)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three true outer products accumulate a matrix along a diagonal write front.
 *
 * Color: each output cell’s accumulating value is `c1` as the contractions add into it; the operands and the grid keep the ink, the index witness the accent. */
export function LoaderTensile(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
