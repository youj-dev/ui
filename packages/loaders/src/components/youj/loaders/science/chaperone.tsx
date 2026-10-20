'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, brightness, partial, pens, set, type V3 } from './matter'

export const meta = {
  id: 'chaperone', title: 'Chaperone', category: 'science', technique: 'planes',
  tags: ['protein', 'folding', 'ribbon', 'torsion', 'hydrogen bond', '3d'],
  description: 'A loose protein coil zips into an alpha helix from one end, its thin backbone widening into a lit ribbon as each turn forms and hydrogen bonds bridging neighbouring turns. The accent marks the folding front; after a turn of the view the helix unzips back into the coil from the other end.',
  order: 4,
  colors: [{ part: 'Bonds', mono: 'ink' }],
} satisfies LoaderMeta

/* A chain of residues between two shapes: a loose random coil (drawn thin,
 * as a cartoon draws loops) and an alpha helix, 3.6 residues a turn (drawn
 * as a wide ribbon facing out, as a cartoon draws helices). A zipper runs
 * along it: each residue moves from its place in the coil to its place in
 * the helix in turn, from the first to the last, the ribbon widening as it
 * goes, and hydrogen bonds (dashed) bridge each residue to the one four
 * along once both are in place. The accent square rides the folding front.
 * The helix holds for a moment while the view turns, then unzips from the
 * last residue back. Both shapes take about the same room, so the view
 * never has to jump to follow.
 *
 * Color: the hydrogen bonds bridging neighbouring turns are `c1`, appearing as each turn forms; the ribbon stays the ink. */

const LEVELS = [10, 14, 18].map((count) => {
  // The coil: a smooth meander through the same room the helix takes, its steps about the helix's.
  const coil: V3[] = []
  for (let i = 0; i < count; i++) {
    const s = (i / (count - 1)) * Math.PI
    coil.push([25 * Math.sin(2.5 * s + 0.4) + 7 * Math.sin(6.2 * s), 29 * Math.cos(1.15 * s) + 6 * Math.sin(4.8 * s + 1), 14 * Math.sin(3.4 * s + 1.1) + 5 * Math.cos(7.1 * s)])
  }
  const helix: V3[] = []
  const rise = 62 / (count - 1)
  for (let i = 0; i < count; i++) {
    const a = (i * 100 * Math.PI) / 180
    helix.push([10 * Math.cos(a), -31 + i * rise, 10 * Math.sin(a)])
  }
  return { count, coil, helix, at: Array.from({ length: count }, (): V3 => [0, 0, 0]), k: Array.from({ length: count }, () => 0) }
})
/** Pieces per residue step, interpolated (Catmull–Rom), so the ribbon curves rather than kinks. */
const SUB = 3
const curve: V3[] = Array.from({ length: 18 * SUB + 1 }, () => [0, 0, 0])
const widths: number[] = []
const radial: V3[] = Array.from({ length: 18 * SUB + 1 }, () => [0, 0, 0])
const edges: [V3, V3][] = Array.from({ length: 18 * SUB + 1 }, () => [[0, 0, 0], [0, 0, 0]])
const front: V3 = [0, 0, 0]
const depth = new Depth()
const p = point()
const xy: number[] = []

const catmull = (a: number, b: number, c: number, d: number, s: number) =>
  0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s * s * s)

export const scene: Scene = {
  beats: 6,
  still: 0.36,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const { hair } = pens(view)
    const { count, coil, helix, at, k } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const pose = { yaw: -0.4 + 0.32 * Math.sin(TAU * t), pitch: -0.22, roll: -0.42 }
    const project = camera({ ...pose, distance: 260, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)

    // The zipper: residue i folds in its turn from the first, and unfolds from the last.
    let folded = 0
    for (let i = 0; i < count; i++) {
      const rank = i / (count - 1)
      k[i] = view.ease.standard(span(t, 0.03 + rank * 0.26, 0.19 + rank * 0.26)) - view.ease.standard(span(t, 0.58 + (1 - rank) * 0.24, 0.72 + (1 - rank) * 0.24))
      folded += k[i]!
      const c = coil[i]!
      const h = helix[i]!
      set(at[i]!, mix(c[0], h[0], k[i]!), mix(c[1], h[1], k[i]!), mix(c[2], h[2], k[i]!))
    }

    // The backbone as a smooth curve, its width and its outward direction blended from coil to helix.
    const n = (count - 1) * SUB
    for (let j = 0; j <= n; j++) {
      const i = Math.min(count - 2, Math.floor(j / SUB))
      const s = j / SUB - i
      const a = at[Math.max(0, i - 1)]!
      const b = at[i]!
      const c = at[i + 1]!
      const d = at[Math.min(count - 1, i + 2)]!
      const v = curve[j]!
      set(v, catmull(a[0], b[0], c[0], d[0], s), catmull(a[1], b[1], c[1], d[1], s), catmull(a[2], b[2], c[2], d[2], s))
      const fold = mix(k[i]!, k[i + 1]!, s)
      // At least a pixel wide as a coil, two as a helix, at any size.
      widths[j] = mix(Math.max(0.8, 1.15 / view.px), Math.max(3.4, 2.3 / view.px), fold)
      // The face points away from the helix axis (y); the coil's thin tube takes the same rule.
      const r = Math.hypot(v[0], v[2]) || 1
      set(radial[j]!, v[0] / r, 0, v[2] / r)
    }
    for (let j = 0; j <= n; j++) {
      const a = curve[Math.max(0, j - 1)]!
      const b = curve[Math.min(n, j + 1)]!
      const tx = b[0] - a[0]
      const ty = b[1] - a[1]
      const tz = b[2] - a[2]
      const r = radial[j]!
      // Across the ribbon: the tangent crossed with the outward direction.
      let wx = ty * r[2] - tz * r[1]
      let wy = tz * r[0] - tx * r[2]
      let wz = tx * r[1] - ty * r[0]
      const wl = Math.hypot(wx, wy, wz) || 1
      wx /= wl
      wy /= wl
      wz /= wl
      const v = curve[j]!
      const w = widths[j]! / 2
      set(edges[j]![0], v[0] + wx * w, v[1] + wy * w, v[2] + wz * w)
      set(edges[j]![1], v[0] - wx * w, v[1] - wy * w, v[2] - wz * w)
    }
    for (let j = 0; j < n; j++) {
      const quad = [edges[j]![0], edges[j + 1]![0], edges[j + 1]![1], edges[j]![1]]
      xy.length = 0
      let z = 0
      for (const v of quad) {
        project(...v, p)
        xy.push(p.x, p.y)
        z += p.z / 4
      }
      // Lit by its face normal, whichever side is toward the viewer.
      const e0 = quad[0]!
      const e1 = quad[1]!
      const e3 = quad[3]!
      const ux = e1[0] - e0[0]
      const uy = e1[1] - e0[1]
      const uz = e1[2] - e0[2]
      const vx = e3[0] - e0[0]
      const vy = e3[1] - e0[1]
      const vz = e3[2] - e0[2]
      const nn = turn(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
      const side = nn[2] >= 0 ? 1 : -1
      // The inside of a turn, seen through the helix, a shade darker than its outside.
      depth.face(xy, z, lambert(nn[0] * side, nn[1] * side, nn[2] * side) * (0.84 + 0.16 * brightness(z)) * (side > 0 ? 1 : 0.74))
      if (!small) {
        // The ribbon's two long edges, a hairline each, at the piece's own depth.
        project(...edges[j]![0], p)
        const ax = p.x
        const ay = p.y
        project(...edges[j + 1]![0], p)
        depth.path([ax, ay, p.x, p.y], z + 0.01, { width: hair * 0.7, alpha: 0.6 * brightness(z), cap: 'round' })
        project(...edges[j]![1], p)
        const bx = p.x
        const by = p.y
        project(...edges[j + 1]![1], p)
        depth.path([bx, by, p.x, p.y], z + 0.01, { width: hair * 0.7, alpha: 0.6 * brightness(z), cap: 'round' })
      }
    }

    // Hydrogen bonds, i to i + 4, once both residues are in the helix.
    if (!small) for (let i = 0; i + 4 < count; i += large ? 1 : 2) {
      const both = span(Math.min(k[i]!, k[i + 4]!), 0.8, 1)
      partial(depth, project, at[i]!, at[i + 4]!, hair * 0.8, 0.5 * both, view, 'c1')
    }
    // The two ends, and the folding front: the accent square riding the zipper.
    atom(depth, project, at[0]!, small ? 2.6 : 2.3, view)
    atom(depth, project, at[count - 1]!, small ? 2.6 : 2.3, view)
    const along = clamp(folded - 0.5, 0, count - 1)
    const i = Math.min(count - 2, Math.floor(along))
    const s = along - i
    set(front, mix(at[i]![0], at[i + 1]![0], s), mix(at[i]![1], at[i + 1]![1], s), mix(at[i]![2], at[i + 1]![2], s))
    project(...front, p)
    p.z += 6
    depth.square(p, clamp(view.size * 0.034, 2.4, 6.5) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Backbone torsions fold a fixed-length ribbon into a hydrogen-bonded helix. */
export function LoaderChaperone(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
