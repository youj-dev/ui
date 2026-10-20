'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { dataPlane } from './data-plane'
import { rule } from './computing'

export const meta = {
  id: 'condense', title: 'Condense', category: 'interface', technique: 'planes',
  tags: ['compression', 'run length', 'encoding', 'records', 'counts', 'dataset'],
  description: 'Repeated records collapse into three compact run tokens. Matching keys travel through raised transfer lanes, each consumed copy adds one notch to its token’s count, and the encoded strip binds only after every run is complete before expanding back into its source records.',
  order: 42,
  colors: [{ part: 'Count', mono: 'ink' }],
} satisfies LoaderMeta

const RUNS = [3, 2, 4]
const depth = new Depth()
const p = point(), q = point()
const progress = new Float32Array(4)

export const scene: Scene = {
  beats: 6, still: 0.26,
  draw(pen, t, view) {
    const small = view.size < 32
    const project = camera({ yaw: -0.2, pitch: -0.28, distance: 300, cx: view.w / 2, cy: 50 })
    const hair = (small ? 1.05 : 1) / view.px
    const output = 25
    const rowGap = 24
    let all = 0

    RUNS.forEach((count, row) => {
      const y = (1 - row) * rowGap
      const start = 0.045 + row * 0.14
      let copies = 0
      for (let i = 0; i < count; i++) {
        const forward = view.ease.emphasized(span(t, start + i * 0.035, start + 0.14 + i * 0.035))
        const back = view.ease.emphasized(span(t, 0.73 + (2 - row) * 0.045 + (count - i - 1) * 0.018, 0.87 + (2 - row) * 0.045 + (count - i - 1) * 0.018))
        progress[i] = forward - back
        copies += progress[i]!
      }
      all += copies / count / 3
      // A comparison bracket spans the entire equal-key run. It retracts
      // from the last record as the first encoded token becomes established.
      const read = clamp(copies / 1.6)
      const x0 = -34, x1 = -34 + (count - 1) * 10
      rule(depth, project, x0 - 4, y + 9, 0, mix(x1 + 4, x0 - 4, read), y + 9, 0, hair * 0.8, 0.45 * (1 - read))
      if (!small) {
        rule(depth, project, x0 - 4, y + 6, 0, x0 - 4, y + 9, 0, hair * 0.8, 0.45 * (1 - read))
        rule(depth, project, x1 + 4, y + 6, 0, x1 + 4, y + 9, 0, hair * 0.8, 0.45 * (1 - read))
        rule(depth, project, -1, y, -3, output - 10, y, -3, hair * 0.65, 0.2)
      }
      for (let i = count - 1; i >= 0; i--) {
        const g = progress[i]!
        const consumed = view.ease.exit(span(g, 0.82, 1))
        const scale = 1 - consumed
        const x = mix(-34 + i * 10, output, g)
        const z = 11 * Math.sin(Math.PI * g)
        // Source sockets survive the compression, making its saved space
        // visible. The record keeps its key while it travels and contracts.
        rule(depth, project, -38 + i * 10, y - 8, -1, -30 + i * 10, y - 8, -1, hair * 0.75, 0.2)
        if (scale <= 0.004) continue
        const order = dataPlane(depth, project, x, y, z, 8 * scale, 13 * scale, hair * 0.8, 0.52, 0.75 * scale)
        for (let line = 0; line <= (small ? 0 : row); line++) {
          const yy = y + (line - row / 2) * 2.7 * scale
          const half = (small ? 1.5 + row * 0.75 : 2.5) * scale
          rule(depth, project, x - half, small ? y : yy, z + 0.1, x + half, small ? y : yy, z + 0.1, hair, scale * 0.88, 'ink', order + 0.03)
        }
        if (g > 0.04 && g < 0.96) {
          project(x - 3 * scale, y - 6.5 * scale, z + 0.2, p)
          project(x + 3 * scale, y - 6.5 * scale, z + 0.2, q)
          depth.line(p, q, hair * 1.4, Math.sin(Math.PI * g) ** 2, 'accent')
        }
      }
      // The token's width and count both represent the actual number of
      // consumed records. Its key remains separate from the count notches.
      const shown = clamp(copies)
      const width = 12 + 3 * copies
      if (shown > 0.004) {
        const order = dataPlane(depth, project, output, y, 0.5, width * shown, 16 * shown, hair, 0.6, shown * 0.9)
        for (let line = 0; line <= (small ? 0 : row); line++) {
          const yy = y + 2.5 + (line - row / 2) * 2.3
          const half = small ? 2.5 + row : 4
          rule(depth, project, output - half, small ? y + 2.5 : yy, 0.7, output + half, small ? y + 2.5 : yy, 0.7, hair * 1.1, shown * 0.9, 'ink', order + 0.04)
        }
        rule(depth, project, output - count * 1.6, y - 4, 0.7, output + count * 1.6, y - 4, 0.7, hair * 0.7, shown * 0.45, 'ink', order + 0.05)
        if (small) rule(depth, project, output - 5, y - 4, 0.7, output - 5 + 10 * copies / 4, y - 4, 0.7, hair * 1.1, shown * 0.92, 'c1', order + 0.06)
        else for (let i = 0; i < count; i++) {
          const add = view.ease.enter(clamp(copies - i))
          const xx = output + (i - (count - 1) / 2) * 3.2
          rule(depth, project, xx, y - 4, 0.7, xx, y - 4 - 3 * add, 0.7, hair * (small ? 1.25 : 1.1), add * 0.92, 'c1', order + 0.06)
        }
      }
    })
    // A final binding spine makes a reusable encoded strip out of the runs.
    const bind = view.ease.standard(span(all, 0.9, 1))
    if (bind > 0.004) {
      rule(depth, project, 43, 24, 0, 43, mix(24, -24, bind), 0, hair, 0.72 * bind)
      for (const y of [24, 0, -24]) rule(depth, project, 39, y, 0, 43, y, 0, hair * 0.85, 0.6 * bind)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Repeated keys become compact run tokens with exact count witnesses.
 *
 * Color: each token’s count notches, one per record it took in, are `c1`; the records and tokens keep the ink, the record in flight the accent. */
export function LoaderCondense(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
