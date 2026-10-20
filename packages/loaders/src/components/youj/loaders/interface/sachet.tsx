'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'sachet', title: 'Sachet', category: 'interface', technique: 'lines',
  tags: ['membership', 'filter', 'hash', 'bits', 'lookup', 'dataset'],
  description: 'Two keys set three independent hash banks, sharing one previously written bit. A membership probe finds all three of its addresses occupied, while a second reaches an empty bit and is rejected; the compact filter then releases its writes for another batch.',
  order: 19,
  colors: [{ part: 'Set bits', mono: 'ink' }],
} satisfies LoaderMeta

const HASHES = [[0, 2, 4], [1, 2, 5]] as const
const QUERIES = [[0, 2, 4], [1, 2, 3]] as const
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.65,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.12, pitch: -0.32, distance: 400, cx: 50, cy: 50 })
    const clear = 1 - view.ease.exit(span(t, 0.91, 0.99))
    for (let bank = 0; bank < 3; bank++) {
      const y = 20 - bank * 20, z = bank * 4
      if (small) rule(depth, project, -38.5, y - 7, z, 38.5, y - 7, z, hair * 0.7, 0.32)
      else window(depth, project, 0, y, z, 77, 14, hair * 0.8, 0.46, -1)
      for (let bit = 0; bit < 6; bit++) {
        const x = -30 + bit * 12
        let set = 0
        for (let key = 0; key < 2; key++) if (HASHES[key]![bank] === bit) set = Math.max(set, view.ease.standard(span(t, 0.05 + key * 0.23 + bank * 0.04, 0.14 + key * 0.23 + bank * 0.04)) * clear)
        window(depth, project, x, y, z + 0.2 + set * 2, 7.5, 7.5, hair * 0.8, 0.24 + 0.66 * set, 0.045 + set * 0.52, blend('ink', 'c1', set))
      }
    }
    for (let key = 0; key < 2; key++) {
      const read = span(t, 0.035 + key * 0.23, 0.23 + key * 0.23)
      const light = Math.sin(Math.PI * read) * clear
      if (light <= 0.002) continue
      const x = -12 + key * 24
      const keyCard = window(depth, project, x, 39, 1, 14, 7, hair, 0.7 * light, 0.07)
      for (let i = 0; i <= key; i++) rule(depth, project, x - 2 + i * 4, 37.5, 1.2, x - 2 + i * 4, 40.5, 1.2, hair, light, 'ink', keyCard + 0.1)
      for (let bank = 0; bank < 3; bank++) {
        const to = -30 + HASHES[key]![bank]! * 12
        rule(depth, project, x, 35, 1, to, 20 - bank * 20, bank * 4 + 5, hair * 0.75, 0.42 * light, 'c1')
      }
    }
    for (let query = 0; query < 2; query++) {
      const start = 0.51 + query * 0.2
      const life = view.ease.enter(span(t, start, start + 0.03)) * (1 - view.ease.exit(span(t, start + 0.16, start + 0.2)))
      if (life <= 0.002) continue
      let matches = 0
      for (let bank = 0; bank < 3; bank++) {
        const bit = QUERIES[query]![bank]!, x = -30 + bit * 12, y = 20 - bank * 20, z = bank * 4 + 3
        const read = view.ease.standard(span(t, start + bank * 0.035, start + 0.045 + bank * 0.035))
        const hit = HASHES.some((hash) => hash[bank] === bit)
        if (hit) matches += read
        window(depth, project, x, y, z, 10, 10, hair * 1.3, life * read, -1, bank === 2 || !hit ? 'accent' : 'ink')
        if (!small && read > 0) rule(depth, project, x, y - 5, z, x, -33, 14, hair * 0.7, 0.32 * life * read)
      }
      const verdict = window(depth, project, 0, -38, 15, 30, 9, hair, life * 0.8, 0.05)
      for (let i = 0; i < 3; i++) {
        const passed = span(matches, i, i + 1)
        rule(depth, project, -11 + i * 8, -38, 15.3, -6 + i * 8, -38, 15.3, hair * 1.8, life * (0.2 + 0.7 * passed), i === 2 ? 'accent' : 'ink', verdict + 0.1)
      }
      if (query === 1) {
        const reject = view.ease.standard(span(t, start + 0.11, start + 0.16)) * life
        rule(depth, project, 6, -41, 15.5, 10, -35, 15.5, hair * 1.3, reject, 'accent', verdict + 0.2)
        rule(depth, project, 6, -35, 15.5, 10, -41, 15.5, hair * 1.3, reject, 'accent', verdict + 0.2)
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Three hash banks distinguish a possible member from a definite miss.
 *
 * Color: a key’s hashes run to their bits in `c1`, and each bit’s rim warms to it as it’s set; the filter keeps the ink, the queries’ deciding reads and the reject the accent. */
export function LoaderSachet(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
