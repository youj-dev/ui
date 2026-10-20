'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'stencil', title: 'Stencil', category: 'interface', technique: 'lines',
  tags: ['convolution', 'kernel', 'filter', 'image', 'samples', 'processing'],
  description: 'A lifted three-tap kernel reads a field of samples along a serpentine path. Its selected samples rise into the window, weighted results accumulate on a separate output rail, and the filter retraces its route to release the results.',
  order: 27,
  colors: [{ part: 'Output', mono: 'ink' }],
} satisfies LoaderMeta

// Real separable convolution: each output is the weighted sum of three
// horizontal neighbours. The little rules encode values, not decoration.
const LEVELS = [3, 4, 5].map((n) => {
  const values = Array.from({ length: n * n }, (_, i) => 0.18 + 0.72 * (0.5 + 0.5 * Math.sin(i * 1.7 + Math.floor(i / n) * 0.8)))
  const route = Array.from({ length: n * (n - 2) }, (_, i) => {
    const row = Math.floor(i / (n - 2))
    const col = 1 + (row % 2 ? n - 3 - i % (n - 2) : i % (n - 2))
    return { row, col, value: (values[row * n + col - 1]! + 2 * values[row * n + col]! + values[row * n + col + 1]!) / 4 }
  })
  return { n, values, route }
})
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.39,
  draw(pen, t, view) {
    const small = view.size < 32
    const { n, values, route } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.05 : 1.1) / view.px
    const project = camera({ yaw: -0.24, pitch: -0.43, distance: 310, cx: 50, cy: 44 })
    const spacing = 48 / (n - 1)
    const at = (span(t, 0.04, 0.57) - span(t, 0.72, 0.96)) * route.length
    const index = Math.min(route.length - 1, Math.floor(Math.max(0, at)))
    const current = route[index]!
    const previous = route[Math.max(0, index - 1)]!
    const seat = view.ease.emphasized(span(at - index, 0, 0.3))
    const x = mix(-24 + previous.col * spacing, -24 + current.col * spacing, seat)
    const y = mix(24 - previous.row * spacing, 24 - current.row * spacing, seat)
    const show = view.ease.enter(span(t, 0.01, 0.07)) * (1 - view.ease.exit(span(t, 0.93, 0.99)))

    window(depth, project, 0, 0, -1, 58, 58, hair * 0.7, 0.27, -1)
    values.forEach((value, i) => {
      const row = Math.floor(i / n), col = i % n
      const selected = row === current.row && Math.abs(col - current.col) <= 1 ? show * Math.sin(Math.PI * span(at - index, 0.3, 1)) ** 2 : 0
      const xx = -24 + col * spacing, yy = 24 - row * spacing
      const z = 6 * selected
      const order = window(depth, project, xx, yy, z, spacing * 0.65, spacing * 0.65, hair * 0.75, 0.28 + selected * 0.4, 0.025)
      const length = spacing * 0.46 * value
      rule(depth, project, xx - length / 2, yy, z + 0.2, xx + length / 2, yy, z + 0.2, hair * 1.25, 0.84, 'ink', order + 0.04)
      if (!small && selected > 0.01) rule(depth, project, xx, yy, z, xx, yy, 10, hair * 0.6, selected * 0.3)
    })
    // The three compartments travel as a single read window. Its bottom
    // edge is the only accent; values and the completed output remain ink.
    if (show > 0.004) {
      const width = spacing * 2.75
      window(depth, project, x, y, 10, width, spacing * 0.85, hair, show * 0.8, -1)
      for (const offset of [-0.5, 0.5]) rule(depth, project, x + offset * spacing, y - spacing * 0.42, 10.1, x + offset * spacing, y + spacing * 0.42, 10.1, hair * 0.75, show * 0.55)
      rule(depth, project, x - width / 2, y - spacing * 0.43, 10.2, x - width / 2 + spacing * 0.7, y - spacing * 0.43, 10.2, hair * 1.4, show, 'accent')
    }
    const step = 52 / route.length
    rule(depth, project, -28, -39, 0, 28, -39, 0, hair, 0.35)
    route.forEach((sample, i) => {
      const written = clamp(at - i)
      const xx = -26 + (i + 0.5) * step
      // An output sample arrives in its color and settles to the ink over the next three.
      rule(depth, project, xx, -39, 0, xx, -39 + sample.value * 10 * written, 0, hair * (small ? 1.5 : 1.25), written * 0.95, blend('c1', 'ink', clamp((at - i - 1) / 3)))
      if (!small) rule(depth, project, xx, -40.5, 0, xx, -42, 0, hair * 0.7, 0.25)
    })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A travelling convolution window reads samples and writes their weighted response.
 *
 * Color: each output sample arrives in `c1` and settles to the ink over the next three; the grid and the window keep the ink, the window’s edge the accent. */
export function LoaderStencil(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
