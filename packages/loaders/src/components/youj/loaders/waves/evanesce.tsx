'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, orient, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { block, detail, edge, hairline, ruler, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'evanesce',
  title: 'Evanesce',
  category: 'waves',
  technique: 'lines',
  tags: ['near-field', 'evanescent', 'coupling', 'waveguide', 'decay', '3d'],
  description: 'A guided wave leaves a rapidly decaying field above its lower rail. A receiving guide, carried on two posts, eases into that field and acquires a stronger travelling trace; as the gap opens, the upper wave weakens while the source keeps propagating.',
  order: 8,
  colors: [{ part: 'Field', mono: 'ink' }],
} satisfies LoaderMeta

/* Two waveguides, each a slab with a raised core along it, the lower one
 * fixed and the upper one carried by sliding blocks on two posts. The
 * guided wave runs along the lower core without stopping; above it the
 * field decays with height (e^(−y/8)), drawn as sections that thin out
 * toward the upper guide. The carriage lowers the upper guide on a plain
 * cosine (no dwell at either end) and its wave grows as the gap closes,
 * the accent riding its crest; a scale on the right post reads the gap.
 *
 * Color: the decaying field above the lower rail is `c1`, fading with its strength; the guided wave stays the ink and the coupled wave the accent. */

const LEVELS = [3, 4, 6].map((rows) => ({ rows, line: Array.from({ length: 65 }, () => [0, 0, 0] as V3), accent: Array.from({ length: 17 }, () => [0, 0, 0] as V3) }))
const LENGTH = 29
const SLAB: V3 = [LENGTH, 1.2, 9]
const CORE: V3 = [LENGTH, 0.55, 1.6]
const POST = 33.5
const depth = new Depth()

export const scene: Scene = {
  beats: 5.5,
  still: 0.18,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { rows, line, accent } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = -0.3 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.44
    const project = camera({ yaw, pitch, distance: 280, cx: view.w / 2 - 1, cy: 56 })
    const turn = orient({ yaw, pitch })
    // A plain cosine approach: the guide never parks at either end.
    const approach = 0.5 - 0.5 * Math.cos(TAU * u)
    const gap = 20 - 14 * approach
    const transmission = Math.exp(-gap / 8)
    const wave = (x: number) => Math.sin(TAU * (x / 23 - 2 * u))

    // Both guides: a slab with its core along the top; the lower one's core at y = 0, the upper slab's underside at the gap.
    // A little darker than full light, so the traces riding on them read in both schemes.
    const guide = { bevel: lod === 2 ? 0.8 : 0, lift: 0.78 }
    block(depth, project, turn, [0, -SLAB[1] - CORE[1] * 2, 0], SLAB, hair * 0.8, 'ink', guide)
    block(depth, project, turn, [0, -CORE[1], 0], CORE, hair * 0.7, 'ink', { lift: 0.85 })
    block(depth, project, turn, [0, gap + SLAB[1], 0], SLAB, hair * 0.8, 'ink', guide)
    block(depth, project, turn, [0, gap + SLAB[1] * 2 + CORE[1], 0], CORE, hair * 0.7, 'ink', { lift: 0.85 })
    const upper = gap + SLAB[1] * 2 + CORE[1] * 2

    // The posts and the carriage blocks that slide on them, with arms to the upper guide.
    const top = gap + SLAB[1]
    for (const x of [-POST, POST]) {
      block(depth, project, turn, [x, 10, -6], [1.1, 16.5, 1.1], hair * 0.75)
      block(depth, project, turn, [x, top, -6], [2, 2.4, 2], hair * 0.8, 'ink', { bevel: lod === 2 ? 0.5 : 0 })
      edge(depth, project, [x - Math.sign(x) * 2, top, -6], [Math.sign(x) * LENGTH, top, -6], hair * 1.2, 0.8)
    }
    block(depth, project, turn, [0, -SLAB[1] * 2 - CORE[1] * 2 - 1.2, -6], [POST + 1.6, 1.2, 2.4], hair * 0.8)

    // The field's sections above the source core, decaying with height.
    for (let row = 0; row <= rows; row++) {
      const y = (gap * row) / rows
      const strength = Math.exp(-y / 8)
      for (let i = 0; i < line.length; i++) {
        const x = -LENGTH + 1 + ((2 * LENGTH - 2) * i) / (line.length - 1)
        const v = line[i]!
        v[0] = x
        v[1] = Math.min(y + 0.1, gap - 0.1)
        v[2] = 7 * strength * wave(x)
      }
      wire(depth, project, line, hair * (row === 0 ? 1.5 : 0.85), row === 0 ? 1 : 0.55 * strength, row === 0 ? 'ink' : 'c1', 16)
    }
    if (lod > 0) {
      const columns = lod === 1 ? 6 : 10
      for (let j = 0; j < columns; j++) {
        const x = -LENGTH + 4 + ((2 * LENGTH - 8) * j) / (columns - 1)
        for (let i = 0; i < line.length; i++) {
          const y = (gap * i) / (line.length - 1)
          const v = line[i]!
          v[0] = x
          v[1] = y + 0.1
          v[2] = 7 * Math.exp(-y / 8) * wave(x)
        }
        wire(depth, project, line, hair * 0.7, 0.24, 'ink', 32)
      }
    }
    // The acquired wave, riding the upper core, and its crest in the accent.
    for (let i = 0; i < line.length; i++) {
      const x = -LENGTH + 1 + ((2 * LENGTH - 2) * i) / (line.length - 1)
      const v = line[i]!
      v[0] = x
      v[1] = upper + 0.1
      v[2] = 7 * transmission * wave(x)
    }
    wire(depth, project, line, hair * 1.4, 0.3 + 0.7 * transmission)
    for (let i = 0; i < accent.length; i++) {
      const x = -4 + (8 * i) / (accent.length - 1)
      const v = accent[i]!
      v[0] = x
      v[1] = upper + 0.15
      v[2] = 7 * transmission * wave(x)
    }
    wire(depth, project, accent, hair * 1.8, 0.35 + 0.65 * transmission * 2.2, 'accent', 16)

    // The gap, read on a scale up the right post.
    if (lod > 0) ruler(depth, project, [POST + 1.15, 0, -4.85], [POST + 1.15, 24, -4.85], 12, 4, [1, 0, 0], 0.9, hair * 0.7, 0.55)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A receiving waveguide enters an exponentially decaying field and gains a travelling wave. */
export function LoaderEvanesce(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
