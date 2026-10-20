'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { dataPlane } from './data-plane'

export const meta = {
  id: 'radix', title: 'Radix', category: 'interface', technique: 'planes',
  tags: ['radix sort', 'buckets', 'stable', 'records', 'indexing', 'dataset'],
  description: 'Keyed records distribute into digit buckets and gather in stable order. A second pass reads the next digit from the opposite bank, retaining the first pass within each bucket; the fully ordered records return through separate depth lanes for the next dataset.',
  order: 35,
  colors: [{ part: 'Digits', mono: 'ink' }],
} satisfies LoaderMeta

function dataset(keys: number[], base: number) {
  let order = keys.map((_, i) => i)
  const passes = [0, 1].map(digit => {
    const before = [...order]
    const buckets = Array.from({ length: base }, () => [] as number[])
    for (const id of before) buckets[Math.floor(keys[id]! / base ** digit) % base]!.push(id)
    order = buckets.flat()
    return { before, after: [...order], buckets }
  })
  return { keys, base, passes, sorted: order }
}
const LEVELS = [dataset([2, 1, 3, 0], 2), dataset([5, 1, 3, 0, 4, 2], 3)]
const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 6, still: 0.29,
  draw(pen, t, view) {
    const small = view.size < 32
    const { keys, base, passes, sorted } = LEVELS[small ? 0 : 1]!
    const hair = (small ? 0.95 : 0.9) / view.px
    const pose = { yaw: -0.18, pitch: -0.16 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 50 })
    const light = lambert(...orient(pose)(0, 0, 1))
    const slot = (i: number) => (keys.length - 1) * 5 - i * 10
    const binY = (i: number) => (base - 1) * 11 - i * 22

    for (let bin = 0; bin < base; bin++) {
      const y = binY(bin)
      // Open trays, rather than dots, make the distribution legible.
      project(-10, y + 9, -3, p); project(-10, y - 9, -3, q); depth.line(p, q, hair, 0.38)
      project(10, y + 9, -3, p); project(10, y - 9, -3, q); depth.line(p, q, hair, 0.38)
      project(-10, y - 9, -3, p); project(10, y - 9, -3, q); depth.line(p, q, hair, 0.55)
    }
    for (const bank of [-27, 27]) {
      project(bank - 8, 32, -4, p); project(bank + 8, 32, -4, q); depth.line(p, q, hair, 0.34)
      project(bank - 8, -32, -4, p); project(bank + 8, -32, -4, q); depth.line(p, q, hair, 0.34)
    }

    keys.forEach((key, id) => {
      let x = -27, y = slot(id), z = 0
      let digit = 0, reading = 0
      for (let pass = 0; pass < 2; pass++) {
        const plan = passes[pass]!
        const rank = plan.before.indexOf(id)
        const bucket = Math.floor(key / base ** pass) % base
        const inBucket = plan.buckets[bucket]!.indexOf(id)
        const by = binY(bucket) + (plan.buckets[bucket]!.length - 1) * 2.7 - inBucket * 5.4
        const start = 0.015 + pass * 0.43 + rank * 0.018
        const enter = clamp(view.ease.emphasized(span(t, start, start + 0.11)))
        const leave = clamp(view.ease.emphasized(span(t, 0.2 + pass * 0.43 + plan.after.indexOf(id) * 0.018, 0.31 + pass * 0.43 + plan.after.indexOf(id) * 0.018)))
        x = mix(x, 0, enter); y = mix(y, by, enter)
        x = mix(x, pass === 0 ? 27 : -27, leave); y = mix(y, slot(plan.after.indexOf(id)), leave)
        z += (5 + id) * Math.sin(Math.PI * enter) + (7 + id) * Math.sin(Math.PI * leave)
        if (t >= start && t < start + 0.15) { digit = pass; reading = Math.sin(Math.PI * span(t, start, start + 0.15)) ** 2 }
      }
      const reset = clamp(view.ease.emphasized(span(t, 0.88, 1)))
      y = mix(y, slot(id), reset)
      z += (8 + id * 2) * Math.sin(Math.PI * reset)
      const order = dataPlane(depth, project, x, y, z, small ? 15 : 14, 5.8, hair * 0.65, light, 0.76)
      // Both digits travel with the record. Only the digit being read is
      // accented, so stability remains visible during the second pass.
      for (let d = 0; d < 2; d++) {
        const value = Math.floor(key / base ** d) % base
        project(x - 5 + d * 6, y, z + 0.15, p)
        project(x - 3 + d * 6 + value, y, z + 0.15, q)
        depth.path([p.x, p.y, q.x, q.y], order + 0.04, { width: hair * 0.9, alpha: 0.7, tone: d === digit && reading > 0.15 ? 'accent' : 'c1' })
      }
      if (!small && t > 0.82 && t < 0.88 && sorted.indexOf(id) === 0) {
        project(x - 8, y - 2, z, p); project(x - 8, y + 2, z, q)
        depth.line(p, q, hair * 1.4, 0.9, 'accent')
      }
    })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two stable digit passes index a small dataset through open buckets.
 *
 * Color: each record’s digits are `c1`, the one being read the accent, so a key keeps its color through both passes; the trays and records keep the ink. */
export function LoaderRadix(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
