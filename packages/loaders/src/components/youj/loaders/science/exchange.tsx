'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, brightness, partial, pens, set, stick, type V3 } from './matter'

export const meta = {
  id: 'exchange', title: 'Exchange', category: 'science', technique: 'mixed',
  tags: ['covalent', 'substitution', 'bond exchange', 'inversion', 'transition state', '3d'],
  description: 'An approaching atom takes a covalent bond as the opposite atom departs. Both bonds are partial through the shared transition, the three spectator bonds flatten and invert like an umbrella, and the exchange runs back to restore the starting molecule.',
  order: 8,
  colors: [{ part: 'Leaving group', mono: 'ink' }],
} satisfies LoaderMeta

/* A backside substitution on a tetrahedral centre, along one axis drawn
 * diagonally across the frame. The reaction coordinate swings forward and
 * back once a loop (a cosine: quick through the transition state, slow at
 * the two molecules, never parked). The newcomer's bond (the accent) shows
 * first as a dashed partial bond, then grows solid out of the centre while
 * the leaving group's bond retracts into it and turns partial; at the
 * transition both are dashed and the three spectators lie flat, then fold
 * through like an umbrella in a gust. At larger sizes each free atom
 * carries its lone pair, a curved arrow takes that pair to the centre as it
 * attacks, and the reaction axis is ruled through all three.
 *
 * Color: the leaving group, its bond and its partial bond are `c1`, the incoming atom the accent: the two that trade places read apart. */

const L = 17
const center: V3 = [0, 0, 0]
const nucleophile: V3 = [0, 0, 0]
const leaving: V3 = [0, 0, 0]
const spectators: V3[] = Array.from({ length: 3 }, () => [0, 0, 0])
const depth = new Depth()
const p = point()
const q = point()
const r = point()
const xy: number[] = []

/** A lone pair on the atom at `at` (radius `size`), on the side facing `toward`: two dots a little off its surface. */
function lonePair(project: ReturnType<typeof camera>, at: V3, toward: V3, size: number, alpha: number, dot: number) {
  if (alpha < 0.01) return
  project(...at, p)
  project(...toward, q)
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const out = size * p.k + dot * 3
  for (const side of [-1, 1]) {
    r.x = p.x + ux * out - uy * side * dot * 1.9
    r.y = p.y + uy * out + ux * side * dot * 1.9
    r.z = p.z + size + 0.5
    r.k = 1
    depth.dot(r, dot, alpha * 0.9)
  }
}

/** A curved mechanism arrow from a lone pair to the centre: a bowed hairline with a small open head. */
function arrow(project: ReturnType<typeof camera>, from: V3, to: V3, size: number, alpha: number, hair: number) {
  if (alpha < 0.01) return
  project(...from, p)
  project(...to, q)
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy) || 1
  // Start just off the attacking atom, end just short of the centre, bowed to one side.
  const ax = p.x + (dx / len) * size * p.k * 0.6
  const ay = p.y + (dy / len) * size * p.k * 0.6 - size * 0.9
  const bx = q.x - (dx / len) * size * 1.25
  const by = q.y - (dy / len) * size * 1.25 - size * 0.7
  const cx = (ax + bx) / 2
  const cy = Math.min(ay, by) - len * 0.32
  xy.length = 0
  for (let i = 0; i <= 14; i++) {
    const s = i / 14
    xy.push((1 - s) ** 2 * ax + 2 * s * (1 - s) * cx + s * s * bx, (1 - s) ** 2 * ay + 2 * s * (1 - s) * cy + s * s * by)
  }
  const z = Math.max(p.z, q.z) + 12
  depth.path(xy, z, { width: hair * 1.1, alpha: alpha * 0.75, cap: 'round', join: 'round' })
  // The head: two short barbs back along the curve's last direction.
  const tx = xy[28]! - xy[26]!
  const ty = xy[29]! - xy[27]!
  const tl = Math.hypot(tx, ty) || 1
  const head = Math.max(2.2, size * 0.32)
  for (const side of [-1, 1]) {
    const c = Math.cos(0.5 * side)
    const s = Math.sin(0.5 * side)
    const hx = -(tx / tl) * c + (ty / tl) * s
    const hy = -(ty / tl) * c - (tx / tl) * s
    depth.path([xy[28]!, xy[29]!, xy[28]! + hx * head, xy[29]! + hy * head], z, { width: hair * 1.1, alpha: alpha * 0.75, cap: 'round' })
  }
}

export const scene: Scene = {
  beats: 5.5,
  still: 0.21,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const { hair } = pens(view)
    // Forward and back once a loop: fastest through the transition, slow (never still) at either molecule.
    const k = 0.5 - 0.5 * Math.cos(TAU * t)
    const forward = t < 0.5
    const project = camera({ yaw: 0.42 + 0.12 * Math.sin(TAU * t), pitch: -0.28, roll: -0.66, distance: 240, cx: view.w / 2, cy: view.h / 2 })

    set(nucleophile, -(19 + 19 * (1 - k) ** 1.5), 0, 0)
    set(leaving, 19 + 19 * k ** 1.5, 0, 0)
    // The umbrella: the spectators lean away from whichever group is bonded, flat at the transition.
    const lean = -0.334 * L * Math.cos(Math.PI * k)
    const radial = Math.sqrt(L * L - lean * lean)
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + (i * TAU) / 3
      const v = spectators[i]!
      set(v, lean, radial * Math.cos(a), radial * Math.sin(a))
      stick(depth, project, center, v, small ? 1.3 : 1.35, view)
      atom(depth, project, v, small ? 5.2 : 4.7, view)
    }

    // The bond being made: dashed while partial, then grown solid out of the centre (the accent).
    const made = view.ease.standard(span(k, 0.5, 0.86))
    const broken = view.ease.standard(span(k, 0.14, 0.5))
    if (!small) partial(depth, project, center, nucleophile, hair * 1.3, span(k, 0.06, 0.32) * (1 - span(k, 0.62, 0.9)), view, 'accent')
    stick(depth, project, center, nucleophile, small ? 1.4 : 1.6, view, 'accent', made)
    if (!small) partial(depth, project, center, leaving, hair * 1.3, span(k, 0.1, 0.38) * (1 - span(k, 0.68, 0.94)), view, 'c1')
    stick(depth, project, center, leaving, small ? 1.4 : 1.6, view, 'c1', 1 - broken)

    atom(depth, project, nucleophile, small ? 7.4 : 6.9, view)
    atom(depth, project, leaving, small ? 7.4 : 6.9, view, 'c1')
    atom(depth, project, center, small ? 8.6 : 8, view)

    if (large) {
      // The reaction axis, ruled through all three.
      project(-46, 0, 0, p)
      project(46, 0, 0, q)
      depth.path([p.x, p.y, q.x, q.y], -60, { width: hair * 0.8, alpha: 0.28 * brightness(0), dash: [7 * hair, 2.5 * hair, 1.5 * hair, 2.5 * hair] })
      // Each free atom's lone pair, and the arrow that takes the attacker's to the centre.
      const dot = Math.max(0.9, view.size * 0.0042) / view.px
      lonePair(project, nucleophile, center, 6.9, 1 - span(k, 0.36, 0.62), dot)
      lonePair(project, leaving, center, 6.9, span(k, 0.38, 0.64), dot)
      const attack = (s: number) => span(s, 0.04, 0.16) * (1 - span(s, 0.34, 0.5))
      arrow(project, forward ? nucleophile : leaving, center, 6.9, attack(forward ? k : 1 - k), hair)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Reciprocal bond exchange turns a tetrahedral centre through its planar transition. */
export function LoaderExchange(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
