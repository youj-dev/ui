'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'
import { dataPlane } from './data-plane'

export const meta = {
  id: 'collate', title: 'Collate', category: 'interface', technique: 'planes',
  tags: ['merge', 'sorted runs', 'records', 'dataset', 'stream', 'comparison'],
  description: 'Two ordered runs merge into one output. Independent read brackets compare the remaining heads; the smaller keyed record crosses a raised transfer lane and appends to the result, then the merge returns each record to its original run.',
  order: 25,
  colors: [{ part: 'Keys', mono: 'ink' }],
} satisfies LoaderMeta

// A real stable two-way merge, retaining each record's source and rank.
const RUNS = [[1, 4, 6], [2, 3, 5]] as const
const reads = [0, 0]
const RECORDS: { key: number; bank: number; slot: number; rank: number }[] = []
while (reads[0]! < RUNS[0].length || reads[1]! < RUNS[1].length) {
  const a = RUNS[0][reads[0]!] ?? Infinity
  const b = RUNS[1][reads[1]!] ?? Infinity
  const bank = a <= b ? 0 : 1
  const slot = reads[bank]!
  RECORDS.push({ key: RUNS[bank]![slot]!, bank, slot, rank: RECORDS.length })
  reads[bank] = slot + 1
}
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.43,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.28, pitch: -0.3 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 50 })
    const light = lambert(...orient(pose)(0, 0, 1))
    const taken = [0, 0]
    const fit = (rank: number) => {
      const into = clamp(view.ease.emphasized(span(t, 0.035 + rank * 0.09, 0.135 + rank * 0.09)))
      const back = clamp(view.ease.standard(span(t, 0.72 + (5 - rank) * 0.035, 0.82 + (5 - rank) * 0.035)))
      return into * (1 - back)
    }

    // The output is a persistent ruled register, not an accumulating fade.
    rule(depth, project, -11, 35, -3, -11, -35, -3, hair * 0.75, 0.28)
    rule(depth, project, 11, 35, -3, 11, -35, -3, hair * 0.75, 0.28)
    for (let i = 0; i < 6; i++) {
      const y = 30 - 12 * i
      rule(depth, project, -10, y, -3, -7, y, -3, hair * 0.7, 0.2)
      if (!small) rule(depth, project, 7, y, -3, 10, y, -3, hair * 0.7, 0.2)
    }

    for (const record of RECORDS) {
      const k = fit(record.rank)
      const sx = record.bank ? 27 : -27
      const sy = 23 - 20 * record.slot
      const dy = 30 - 12 * record.rank
      const x = mix(sx, 0, k), y = mix(sy, dy, k)
      // Incoming streams have separate depth lanes; contents never change.
      const z = 2 + Math.sin(Math.PI * k) * (record.bank ? 19 : 10)
      const moving = Math.sin(Math.PI * k) ** 2
      taken[record.bank]! += k
      if (!small) window(depth, project, sx, sy, -4, 17, 9, hair * 0.65, 0.16, -1)
      const order = dataPlane(depth, project, x, y, z, 17, 9, hair * 0.85, light, 0.75)
      // Marks printed on a card sort with its face, so a short rule near
      // its far edge cannot slip behind the whole opaque card.
      rule(depth, project, x - 5.8, y, z + 0.12, x - 5.8 + 1.6 * record.key, y, z + 0.12, hair * 1.2, 0.9, 'c1', order + 0.05)
      rule(depth, project, x - 8.5, y + 4.5, z + 0.14, x + 8.5, y + 4.5, z + 0.14, hair * 1.35, moving * 0.95, 'accent', order + 0.06)
      if (!small) rule(depth, project, x - 5.8, y - 2.4, z + 0.12, x - 2, y - 2.4, z + 0.12, hair * 0.65, 0.35, 'ink', order + 0.05)
    }

    // Each read bracket advances only when its own head has been consumed.
    for (let bank = 0; bank < 2; bank++) {
      const count = taken[bank]!
      const shown = 1 - span(count, 2.85, 3)
      const y = 23 - 20 * Math.min(count, 2)
      const x = bank ? 38 : -38
      const inward = bank ? -1 : 1
      rule(depth, project, x, y - 5, 5, x, y + 5, 5, hair, shown * 0.8)
      for (const sign of [-1, 1]) rule(depth, project, x, y + sign * 5, 5, x + inward * 3, y + sign * 5, 5, hair, shown * 0.8)
      if (!small) {
        rule(depth, project, bank ? 18 : -18, y, -5, bank ? 13 : -13, y, -5, hair * 0.7, shown * 0.3)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Keyed records pass through two independent merge heads into one sorted run.
 *
 * Color: each card’s key, the rule whose length is its sort order, is `c1`, so the order reads as the cards fall into place; the cards and the register keep the ink. */
export function LoaderCollate(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
