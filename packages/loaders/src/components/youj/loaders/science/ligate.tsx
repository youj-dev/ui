'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { bond, brightness, pens, set, stick, type V3 } from './matter'

export const meta = {
  id: 'ligate', title: 'Ligate', category: 'science', technique: 'lines',
  tags: ['dna', 'double helix', 'base pair', 'unzipping', 'molecular', '3d'],
  description: 'A double helix opens from its upper end as paired bases separate into two half-rungs. The opening fork descends through the turning backbones, pauses, and climbs back as complementary bases meet again.',
  order: 1,
  colors: [{ part: 'Bases', mono: 'ink' }],
} satisfies LoaderMeta

const LEVELS = [24, 36, 56].map((samples) => ({
  samples,
  strands: [0, 1].map(() => Array.from({ length: samples + 1 }, (): V3 => [0, 0, 0])),
}))
const depth = new Depth()
const p = point()
const q = point()
const left: V3 = [0, 0, 0]
const right: V3 = [0, 0, 0]

export const scene: Scene = {
  beats: 5.75,
  still: 0.23,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { samples, strands } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const { hair, line } = pens(view)
    const open = view.ease.standard(span(t, 0.04, 0.42)) - view.ease.standard(span(t, 0.55, 0.95))
    const front = mix(42, -9, open)
    const project = camera({ yaw: 0.3 + 0.24 * Math.sin(TAU * t), pitch: -0.08, distance: 250, cx: view.w / 2, cy: view.h / 2 })
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1
      const strand = strands[side]!
      for (let i = 0; i <= samples; i++) {
        const y = -33 + 66 * i / samples
        const a = y / 45 * TAU + 0.65 + 0.35 * Math.sin(TAU * t)
        const separate = view.ease.standard(span(y - front, -5, 7))
        set(strand[i]!, sign * mix(12 * Math.cos(a), 25, separate), y, sign * 12 * Math.sin(a) * (1 - 0.72 * separate))
        if (i) {
          project(...strand[i - 1]!, p)
          project(...strand[i]!, q)
          depth.line(p, q, line * (view.size >= 80 ? 1.5 : 1.15) * (p.k + q.k) / 2, brightness((p.z + q.z) / 2))
          // The sugar-phosphate repeat: a bead every few samples along the backbone.
          if (view.size >= 64 && i % 4 === 0) depth.dot({ ...q, z: q.z + 0.01 }, line * 0.95 * q.k, brightness(q.z))
        }
      }
    }
    // Bases remain attached to their own backbone. Only their shared junction opens.
    const count = small ? 5 : view.size < 80 ? 8 : 11
    for (let i = 0; i < count; i++) {
      const sample = Math.round((i + 0.5) / count * samples)
      const a = strands[0]![sample]!
      const b = strands[1]![sample]!
      const split = view.ease.standard(span(a[1] - front, -5, 7))
      const remain = 0.5 - 0.34 * split
      set(left, mix(a[0], b[0], remain), a[1], mix(a[2], b[2], remain))
      set(right, mix(b[0], a[0], remain), b[1], mix(b[2], a[2], remain))
      // The pair at the fork glows in the accent as it parts or meets, blending in and out (never switched).
      const active = Math.max(0, 1 - Math.abs(split - 0.5) / 0.42) ** 1.5
      if (view.size >= 64) {
        stick(depth, project, a, left, 0.48, view, 'c1')
        stick(depth, project, b, right, 0.48, view, 'c1')
      } else {
        bond(depth, project, a, left, hair, 0.88, 'c1')
        bond(depth, project, b, right, hair, 0.88, 'c1')
      }
      if (active > 0.004) {
        // As wide as the rung it lights, so the pair at the fork reads in the accent.
        const glow = view.size >= 64 ? 1 : hair * 1.3
        bond(depth, project, a, left, glow, 0.95 * active, 'accent')
        bond(depth, project, b, right, glow, 0.95 * active, 'accent')
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A travelling DNA fork separates and reunites complementary bases.
 *
 * Color: the paired bases (the rungs) are `c1` between the ink backbones; the pair at the fork glows in the accent. */
export function LoaderLigate(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
