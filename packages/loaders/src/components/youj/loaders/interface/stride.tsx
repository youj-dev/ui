'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'stride', title: 'Stride', category: 'interface', technique: 'lines',
  tags: ['butterfly', 'transform', 'stride', 'parallel', 'compute', 'signal processing'],
  description: 'A butterfly transform doubles its pairing distance at each stage. Crossed sum-and-difference routes write the next bank of signed amplitudes only after their inputs arrive; each crossing separates in depth, and the transform unwrites from the final bank back to the source.',
  order: 37,
  colors: [{ part: 'Butterflies', mono: 'ink' }],
} satisfies LoaderMeta

function transform(input: number[]) {
  const banks = [input]
  for (let stride = 1; stride < input.length; stride *= 2) {
    const before = banks[banks.length - 1]!, next = [...before]
    for (let row = 0; row < input.length; row++) if (!(row & stride)) {
      next[row] = (before[row]! + before[row + stride]!) / Math.SQRT2
      next[row + stride] = (before[row]! - before[row + stride]!) / Math.SQRT2
    }
    banks.push(next)
  }
  return banks
}
const LEVELS = [transform([0.6, 0.2, -0.3, 0.7]), transform([0.6, 0.2, -0.3, 0.7, 0.1, -0.4, 0.5, 0.3])]
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const visible: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32
    const banks = LEVELS[small ? 0 : 1]!
    const rows = banks[0]!.length, stages = banks.length - 1
    const hair = (small ? 1.05 : 0.9) / view.px
    const project = camera({ yaw: -0.12, pitch: -0.18, distance: 400, cx: view.w / 2, cy: 50 })
    const xAt = (bank: number) => -34 + 68 * bank / stages
    const yAt = (row: number) => 29 - 58 * row / (rows - 1)
    const state = (stage: number) => clamp(view.ease.standard(span(t, 0.06 + stage * 0.17, 0.22 + stage * 0.17))) * (1 - view.ease.exit(span(t, 0.74 + (stages - 1 - stage) * 0.07, 0.82 + (stages - 1 - stage) * 0.07)))

    for (let stage = 0; stage < stages; stage++) {
      const stride = 2 ** stage, on = state(stage)
      for (let row = 0; row < rows; row++) if (!(row & stride)) {
        const pair = row + stride
        for (const [from, to, lane] of [[row, row, 0], [pair, pair, 0], [row, pair, 5], [pair, row, -5]]) {
          // Two short entry segments and a central crossover put the sum
          // and difference on separate depth lanes, with no flat tangle.
          const a = xAt(stage) + 4, b = xAt(stage + 1) - 4
          xy.length = 0
          for (let j = 0; j <= 12; j++) {
            const u = j / 12
            const travel = span(u, 0.16, 0.84)
            project(mix(a, b, u), mix(yAt(from!), yAt(to!), travel), lane! * Math.sin(Math.PI * u), p)
            xy.push(p.x, p.y)
          }
          const z = lane! > 0 ? 4 : lane! < 0 ? -4 : 0
          // A short opaque under-stroke isolates the front crossover.
          if (lane! > 0 && !small) {
            const ax = xy[8]!, ay = xy[9]!, bx = xy[16]!, by = xy[17]!
            const length = Math.hypot(bx - ax, by - ay)
            const nx = -(by - ay) * hair / length, ny = (bx - ax) * hair / length
            depth.poly([ax + nx, ay + ny, bx + nx, by + ny, bx - nx, by - ny, ax - nx, ay - ny], z - 0.01, 0, 'ink', true)
          }
          depth.path(xy, z, { width: hair * (small ? 0.7 : 0.6), alpha: 0.13, join: 'round' })
          if (on > 0.004) {
            const at = on * 12, whole = Math.floor(at)
            visible.length = 0
            for (let j = 0; j <= whole; j++) visible.push(xy[j * 2]!, xy[j * 2 + 1]!)
            if (whole < 12) visible.push(mix(xy[whole * 2]!, xy[whole * 2 + 2]!, at - whole), mix(xy[whole * 2 + 1]!, xy[whole * 2 + 3]!, at - whole))
            // A stage's butterflies run in their color and settle to the ink as the next stage starts.
            depth.path(visible, z + 0.02, { width: hair * 0.95, alpha: on * (lane! < 0 ? 0.5 : 0.83), join: 'round', tone: blend('c1', 'ink', span(t, 0.22 + stage * 0.17, 0.4 + stage * 0.17)) })
          }
        }
      }
    }

    for (let bank = 0; bank <= stages; bank++) {
      const ready = bank === 0 ? 1 : state(bank - 1)
      for (let row = 0; row < rows; row++) {
        const x = xAt(bank), y = yAt(row), value = banks[bank]![row]!
        project(x, y - 2.7, 7, p); project(x, y + 2.7, 7, q)
        depth.line(p, q, hair * 0.75, 0.3)
        project(x, y, 7, p); project(x + value * 5 * ready, y, 7, q)
        depth.line(p, q, hair * 1.5, 0.22 + ready * 0.68, bank === stages && row === 0 ? 'accent' : 'ink')
      }
      if (!small) {
        project(xAt(bank) - 3, -34, 0, p); project(xAt(bank) + 3, -34, 0, q)
        depth.line(p, q, hair, 0.36)
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Strided butterfly pairs write signed transform coefficients bank by bank.
 *
 * Color: each stage’s butterflies run in `c1` and settle to the ink as the next stage starts; the banks keep the ink, the final output the accent. */
export function LoaderStride(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
