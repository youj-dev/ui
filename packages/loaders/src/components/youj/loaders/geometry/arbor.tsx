'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'arbor', title: 'Arbor', category: 'geometry', technique: 'lines',
  tags: ['tree', 'branching', 'recursion', 'growth', 'structure'],
  description: 'A branching structure grows from its trunk to its finest forks, each generation waiting for the one below. It holds its canopy, then retracts from the tips back to the root while the view reveals the branches in depth.',
  order: 20,
  colors: [{ part: 'Growth', mono: 'ink' }],
} satisfies LoaderMeta

/* A binary tree in space, drawn the way a structure is drafted: its full
 * canopy is always there as a faint construction drawing, with a dashed plan
 * of its spread on the ground, and the tree grows over it generation by
 * generation (`standard`), each fork waiting for the branch below. Where a
 * branch forks, a square node sets as its children leave it, so every
 * branch springs from a joint rather than from a bare line end; branches
 * taper from trunk to twig and meet with round ends. The leading tip buds
 * in the accent. It holds its canopy, then draws back from the tips to a
 * stub of trunk, while the view swings so the forks separate in
 * depth.
 *
 * Color: a branch grows (and draws back) in `c1`, settling to the
 * ink once it’s whole, and the buds open in it; the leader’s bud stays the
 * accent. */

type V3 = [number, number, number]
interface Branch { a: V3; b: V3; level: number; key: number; parent: number }
const branches: Branch[] = [{ a: [0, -30, 0], b: [0, -10, 0], level: 0, key: 0, parent: -1 }]
function fork(parent: number, length: number, level: number, heading: number) {
  if (level > 4) return
  const from = branches[parent]!
  for (const sign of [-1, 1]) {
    const angle = heading + sign * 0.5 * 0.88 ** (level - 1)
    const a = from.b
    const b: V3 = [a[0] + length * Math.sin(angle), a[1] + length * Math.cos(angle), a[2] + sign * length * 0.32 * (level % 2 ? 1 : -1)]
    branches.push({ a, b, level, key: from.key * 2 + (sign > 0 ? 1 : 0), parent })
    fork(branches.length - 1, length * 0.7, level + 1, angle)
  }
}
fork(0, 16.5, 1, 0)
const WIDTH = [2.6, 1.8, 1.35, 1.05, 0.9]
/** When the finest generation has landed, and when the tips start to draw back: the canopy holds between. */
const GROWN = 0.5
const BARE = 0.64

const depth = new Depth()
const p = point()
const q = point()
const grown = new Float32Array(branches.length)
const ring: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.62,
  draw(pen, t, view) {
    const small = view.size < 32
    const last = small ? 2 : view.size < 80 ? 3 : 4
    const hair = (small ? 1.1 : 1) / view.px
    const dash = clamp(view.size * 0.014, 2, 3.5) / view.px
    const lens = camera({ yaw: -0.3 + 0.24 * Math.sin(TAU * t), pitch: -0.16, distance: 280, cx: view.w / 2, cy: 52 })
    const project = (x: number, y: number, z: number, out: typeof p) => lens(x * 1.16, (y + 2) * 1.16, z * 1.16, out)
    const leader = 2 ** last - 1

    // However many generations this size draws, the finest lands by GROWN and the canopy holds until BARE,
    // then the tips draw back first and the trunk last, just before the seam.
    const grow = (GROWN - 0.04 - 0.12) / last
    const back = (0.97 - 0.08 - BARE) / last
    branches.forEach((branch, i) => {
      if (branch.level > last) return
      const L = branch.level
      const up = view.ease.standard(span(t, 0.04 + L * grow, 0.16 + L * grow))
      const down = view.ease.standard(span(t, BARE + (last - L) * back, BARE + 0.08 + (last - L) * back))
      // The trunk keeps a stub through the seam: the tree draws back to its root, not to nothing.
      grown[i] = L === 0 ? mix(0.34, 1, up * (1 - down)) : up * (1 - down)
    })

    // The ground: the canopy's spread as a dashed plan, and a registration tick under the trunk.
    if (!small) {
      ring.length = 0
      for (let i = 0; i <= 48; i++) {
        const a = (TAU * i) / 48
        project(25 * Math.cos(a), -30, 13 * Math.sin(a), p)
        ring.push(p.x, p.y)
      }
      depth.path(ring, -300, { width: hair, alpha: 0.24, dash: [dash, dash * 0.8], closed: true })
    }
    project(-7, -30, 0, p)
    project(7, -30, 0, q)
    depth.line(p, q, hair, small ? 0.45 : 0.4)
    if (!small) {
      project(0, -30, -5, p)
      project(0, -30, 5, q)
      depth.line(p, q, hair, 0.3)
    }

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i]!
      if (branch.level > last) continue
      const { a, b, level } = branch
      project(...a, p)
      project(...b, q)
      // The construction drawing: every branch, faint, so the canopy is always there to be filled.
      const len = Math.hypot(q.x - p.x, q.y - p.y)
      depth.path([p.x, p.y, q.x, q.y], -200, { width: hair, alpha: small ? 0.2 : 0.14, dash: view.size < 80 ? undefined : fitDash(len, dash) })
      const g = grown[i]!
      if (g <= 0.001) continue
      project(mix(a[0], b[0], g), mix(a[1], b[1], g), mix(a[2], b[2], g), q)
      const z = (p.z + q.z) / 2
      const alpha = (0.62 + 0.36 * clamp((z + 20) / 40)) * clamp(g / 0.08)
      const width = WIDTH[level]! * (small && level ? 1.2 : 1) * hair
      // Growth arrives in the tree's color and settles to the ink as the branch completes.
      depth.path([p.x, p.y, q.x, q.y], z, { width: width * (p.k + q.k) / 2, alpha, cap: 'round', tone: blend('ink', 'c1', 0.85 * (1 - g)) })

      // A node where it forks, setting as its children leave it.
      if (level < last && !small) {
        const child = grown[i + 1] ?? 0
        const set = clamp(child / 0.12)
        if (set > 0.01) {
          project(...b, q)
          q.z += 0.5
          depth.square(q, (level === 0 ? 3 : level === 1 ? 2.5 : 2) * hair, set * 0.95)
        }
      }
      // Buds on the finest tips, the leader's in the accent.
      if (level === last && (view.size >= 40 || branch.key === leader)) {
        // Each bud opens once its twig is out and closes before the twig draws back.
        const bud = view.ease.standard(span(t, GROWN - 0.03, GROWN + 0.05)) * (1 - view.ease.standard(span(t, BARE - 0.08, BARE)))
        if (bud > 0.01) {
          q.z += 0.6
          const lead = branch.key === leader
          depth.square(q, (lead ? 3.4 : 2) * hair * (0.5 + 0.5 * bud), (lead ? 1 : 0.8) * bud, lead ? 'accent' : 'c1')
        }
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A tree of lines grows generation by generation and retracts from its tips. */
export function LoaderArbor(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
