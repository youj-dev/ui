'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'escrow', title: 'Escrow', category: 'interface', technique: 'lines',
  tags: ['transaction', 'journal', 'snapshot', 'commit', 'publish', 'stages'],
  description: 'A stable snapshot remains readable while three edits enter a separate bank and its write-ahead journal. Only after every journal entry closes does one publication bracket transfer ownership to the prepared snapshot; the transaction then unwinds to its original version.',
  order: 18,
  colors: [{ part: 'New version', mono: 'ink' }],
} satisfies LoaderMeta

const VALUES = [[10, 21], [20, 13], [14, 25]] as const
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.53,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.25, pitch: -0.29, distance: 400, cx: 50, cy: 52 })
    const unwind = 1 - view.ease.standard(span(t, 0.8, 0.98))
    const publish = clamp(view.ease.emphasized(span(t, 0.59, 0.74))) * unwind
    for (let row = 0; row < 3; row++) {
      const y = 23 - row * 20
      const write = view.ease.standard(span(t, 0.05 + row * 0.145, 0.18 + row * 0.145)) * unwind
      const logged = view.ease.standard(span(t, 0.16 + row * 0.145, 0.25 + row * 0.145)) * unwind
      const oldZ = 6 * (1 - publish), newZ = 6 * publish
      const oldCard = window(depth, project, -24, y, oldZ, 31, 14, hair, 0.85 - 0.35 * publish, 0.045)
      const newCard = window(depth, project, 24, y, newZ, 31, 14, hair, 0.45 + 0.4 * publish, 0.045)
      rule(depth, project, -36, y, oldZ + 0.2, -36 + VALUES[row]![0], y, oldZ + 0.2, hair * 1.65, 0.9 - 0.3 * publish, 'ink', oldCard + 0.1)
      rule(depth, project, 12, y, newZ + 0.2, 12 + mix(VALUES[row]![0], VALUES[row]![1], write), y, newZ + 0.2, hair * 1.65, 0.38 + 0.52 * write, 'c1', newCard + 0.1)
      if (write > 0 && write < 1) rule(depth, project, -8, y, 2, mix(-8, 8, write), y, 2, hair, Math.sin(Math.PI * write), 'accent')
      const x = -22 + row * 22
      const journal = window(depth, project, x, -37, 1, 18, 8, small ? hair * 0.7 : hair, small ? 0.15 : 0.3 + 0.5 * logged, small ? -1 : 0.04)
      rule(depth, project, x - 5, -37, 1.2, x - 5 + 10 * logged, -37, 1.2, hair * 1.35, 0.9 * logged, 'ink', journal + 0.1)
      if (!small && logged > 0) rule(depth, project, 24, y - 7, newZ, 24, -30, 0, hair * 0.6, 0.15 * logged)
    }
    // Both banks have version rails; there is only one ownership bracket.
    rule(depth, project, -40, 34, 0, -8, 34, 0, hair, 0.25)
    rule(depth, project, 8, 34, 0, 40, 34, 0, hair, 0.25)
    const owner = mix(-24, 24, publish)
    rule(depth, project, owner - 16, 36, 9, owner + 16, 36, 9, hair * 1.5, 0.9)
    for (const side of [-1, 1]) rule(depth, project, owner + side * 16, 36, 9, owner + side * 16, 31, 9, hair * 1.5, 0.9)
    const seal = view.ease.standard(span(t, 0.51, 0.59)) * unwind
    if (seal > 0) {
      rule(depth, project, -33, -44, 1, mix(-33, 33, seal), -44, 1, hair * 1.35, seal, 'accent')
      if (!small) for (const x of [-33, 33]) rule(depth, project, x, -44, 1, x, -41, 1, hair, seal, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A journal certifies a prepared snapshot before its publication.
 *
 * Color: the new version’s values are `c1` as they’re written and published; the old version, the journal and the bracket keep the ink, each write and the seal the accent. */
export function LoaderEscrow(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
