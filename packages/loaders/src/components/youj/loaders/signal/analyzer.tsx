'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'analyzer', title: 'Analyzer', category: 'signal', technique: 'lines',
  tags: ['polarization', 'light', 'analyzer', 'malus', 'filter', 'wave'],
  description: 'A polarized wave crosses a fixed grid and a turning analyzer. Its transmitted oscillation follows the projection onto the moving axis, extinguishing at crossed alignment; the receiving screen brightens with the squared projection before the axes align again.',
  order: 24,
  colors: [{ part: 'Output', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const depth = new Depth()
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
const p = point(), q = point()

/* Color: the gated output wave warms toward `c1` as the grid lets
 * it through, and cools to the ink as it closes. */

export const scene: Scene = {
  beats: 5.5, still: 0.67,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.48, pitch: -0.35, distance: 310, cx: view.w / 2, cy: 51 })
    const angle = Math.PI / 2 * (view.ease.emphasized(clamp((t - 0.03) / 0.38)) + view.ease.emphasized(clamp((t - 0.53) / 0.42)))
    const cs = Math.cos(angle), sn = Math.sin(angle)
    const intensity = cs * cs
    // A chain-line optical axis remains visible through extinction.
    project(-42, 0, 0, p); project(42, 0, 0, q)
    depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 - 0.1, { width: hair * 0.65, alpha: 0.2, dash: small ? undefined : [3 * hair, 2 * hair] })
    for (const [x, a] of [[-13, 0], [13, angle]]) {
      const c = Math.cos(a!), s = Math.sin(a!)
      const at = (u: number, v: number, xx = x!): V3 => [xx, u * c - v * s, u * s + v * c]
      for (const dx of [-1.1, 1.1]) {
        const coordinates = [[-17, -17], [17, -17], [17, 17], [-17, 17]]
        coordinates.forEach(([u, v], j) => { const w = at(u!, v!, x! + dx); quad[j]![0] = w[0]; quad[j]![1] = w[1]; quad[j]![2] = w[2] })
        const f = projectPath(quad, project, xy)
        depth.path(f.xy, f.z, { width: hair, alpha: dx < 0 ? 0.28 : 0.8, closed: true })
      }
      for (const v of small ? [-8, 0, 8] : [-12, -6, 0, 6, 12]) {
        const f = projectPath([at(-15, v), at(15, v)], project, xy)
        depth.path(f.xy, f.z + 0.04, { width: hair * 0.8, alpha: v === 0 ? 0.64 : 0.36 })
      }
      project(x!, -23, 0, p); project(x!, -27, 0, q)
      depth.line(p, q, hair, 0.44)
      // Opposed trunnions reveal that the analyzer rotates about the beam.
      for (const u of [-1, 1]) {
        const f = projectPath([at(u * 17, 0), at(u * 21, 0)], project, xy)
        depth.path(f.xy, f.z, { width: hair * 1.3, alpha: 0.75 })
      }
      if (x === 13) for (const side of [-1, 1]) {
        // The analyzer has half-turn symmetry; its two opposed axis
        // notches share that symmetry, including their accent and depth.
        const f = projectPath([at(side * 10, side * 17, x + 1.2), at(side * 16, side * 17, x + 1.2)], project, xy)
        depth.path(f.xy, f.z + 0.04, { width: hair * 1.25, alpha: 0.95, tone: 'accent' })
      }
    }
    const samples = small ? 24 : 48
    // Project the electric field onto the analyzer; sign and axis both
    // reverse after a half turn, leaving the same physical field at the seam.
    for (const [lo, hi, output] of [[-40, 12.8, false], [13.2, 40, true]] as const) {
      for (let i = 0; i < samples; i++) {
        const at = (u: number, out: typeof p) => {
          const x = lo + (hi - lo) * u
          const wave = 9 * Math.sin(x * Math.PI / 12 - TAU * 2 * t)
          return project(x, output ? wave * cs * cs : wave, output ? wave * cs * sn : 0, out)
        }
        at(i / samples, p); at((i + 1) / samples, q)
        depth.line(p, q, hair * 1.15, output ? 0.18 + 0.72 * intensity : 0.84, output ? blend('ink', 'c1', 0.8 * intensity) : 'ink')
      }
    }
    // The receiver's ruled plane measures intensity separately from amplitude.
    const screen = projectPath([[42, -13, -12], [42, 13, -12], [42, 13, 12], [42, -13, 12]], project, xy)
    depth.path(screen.xy, screen.z, { width: hair * 0.8, alpha: 0.35, closed: true })
    for (const z of small ? [0] : [-6, 0, 6]) {
      project(42, -9, z, p); project(42, 9, z, q)
      depth.line(p, q, hair * (small ? 1.7 : 1.3), clamp(intensity * 0.92))
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A rotating polarization grid gates a travelling wave and its measured intensity. */
export function LoaderAnalyzer(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
