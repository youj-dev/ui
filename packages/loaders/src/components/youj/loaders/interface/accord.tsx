'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'accord', title: 'Accord', category: 'interface', technique: 'lines',
  tags: ['solver', 'relaxation', 'constraints', 'red black', 'mesh', 'convergence'],
  description: 'A warped net solves toward its fixed boundary through alternating constraint sweeps. Each bank moves to the average of its neighbours, residual witnesses contract and an energy gauge steps down; the sweeps unwind to the original unsolved field.',
  order: 31,
  colors: [{ part: 'Correction', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const PASSES = 6
function net(n: number) {
  const states: V3[][] = [Array.from({ length: n * n }, (_, i) => {
    const x = i % n, y = Math.floor(i / n)
    const interior = x > 0 && y > 0 && x < n - 1 && y < n - 1
    return [-28 + 56 * x / (n - 1) + (interior ? 6 * Math.sin(i * 2.3) : 0),
      -28 + 56 * y / (n - 1) + (interior ? 6 * Math.cos(i * 1.9) : 0),
      interior ? 13 + 9 * Math.sin(i * 1.7) : 0]
  })]
  // Red-black Gauss-Seidel: every moved point takes the mean of four
  // neighbours. Boundary vertices remain pinned in every stored state.
  for (let pass = 0; pass < PASSES; pass++) {
    const old = states[pass]!
    const next = old.map((p) => [...p] as V3)
    for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
      if ((x + y) % 2 !== pass % 2) continue
      const i = y * n + x
      const p = next[i]!
      for (let axis = 0; axis < 3; axis++) p[axis] = (old[i - 1]![axis]! + old[i + 1]![axis]! + old[i - n]![axis]! + old[i + n]![axis]!) / 4
    }
    states.push(next)
  }
  const edges: [number, number][] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x
    if (x + 1 < n) edges.push([i, i + 1])
    if (y + 1 < n) edges.push([i, i + n])
  }
  const energies = states.map((state) => edges.reduce((energy, [a, b]) => {
    const A = state[a]!, B = state[b]!
    return energy + (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2
  }, 0))
  return { n, states, edges, energies, points: states[0]!.map(() => [0, 0, 0] as V3) }
}
const NETS = [net(4), net(5)]
const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 5.6, still: 0.15,
  draw(pen, t, view) {
    const small = view.size < 32
    const model = NETS[view.size < 80 ? 0 : 1]!
    const hair = (small ? 1.05 : 1.1) / view.px
    const project = camera({ yaw: -0.3, pitch: -0.38, distance: 330, cx: view.w / 2 - (small ? 0 : 3), cy: 50 })
    const forward = span(t, 0.035, 0.65) * PASSES
    const reverse = span(t, 0.74, 0.985) * PASSES
    const now = reverse > 0 ? PASSES - reverse : forward
    const pass = Math.min(PASSES - 1, Math.floor(now))
    const fraction = clamp(view.ease.standard(clamp(now - pass)))
    const A = model.states[pass]!, B = model.states[pass + 1]!
    model.points.forEach((p, i) => {
      for (let axis = 0; axis < 3; axis++) p[axis] = mix(A[i]![axis]!, B[i]![axis]!, fraction)
    })

    for (const [a, b] of model.edges) {
      project(...model.points[a]!, p); project(...model.points[b]!, q)
      const near = clamp(0.76 + (p.z + q.z) / 180, 0.5, 0.95)
      const boundary = (a % model.n === 0 && b % model.n === 0) ||
        (a % model.n === model.n - 1 && b % model.n === model.n - 1) ||
        (a < model.n && b < model.n) || (a >= model.n * (model.n - 1) && b >= model.n * (model.n - 1))
      depth.line(p, q, hair * (boundary ? 1.1 : 0.8) * (p.k + q.k) / 2, near * (boundary ? 0.9 : 0.75))
    }

    model.points.forEach((v, i) => {
      const x = i % model.n, y = Math.floor(i / model.n)
      if (x === 0 || y === 0 || x === model.n - 1 || y === model.n - 1) return
      const active = (x + y) % 2 === pass % 2
      project(...v, p)
      // The remaining correction is a line, not a travelling particle.
      project(...B[i]!, q)
      const busy = active ? Math.sin(Math.PI * fraction) ** 2 * (t < 0.65 || t > 0.74 ? 1 : 0) : 0
      depth.line(p, q, hair * 0.75, 0.65 * busy, 'c1')
      const accent = active && x === 1 && y === (pass % 2 ? 2 : 1)
      project(v[0] - 2.2, v[1], v[2] + 0.15, p)
      project(v[0] + 2.2, v[1], v[2] + 0.15, q)
      depth.line(p, q, hair, 0.25)
      depth.line(p, q, hair * (accent ? 1.4 : 1), 0.7 * busy, accent ? 'accent' : 'c1')
      if (!small) {
        project(v[0], v[1] - 1.5, v[2] + 0.15, p)
        project(v[0], v[1] + 1.5, v[2] + 0.15, q)
        depth.line(p, q, hair * 0.75, 0.25 + 0.4 * busy)
      }
    })

    // Four corner clamps are fixed; the net's interior carries the solve.
    for (const [x, y] of [[-28, -28], [28, -28], [28, 28], [-28, 28]] as const) {
      project(x - Math.sign(x) * 4, y, 0, p)
      project(x, y, 0, q); depth.line(p, q, hair * 1.45, 0.9)
      project(x, y - Math.sign(y) * 4, 0, p); depth.line(p, q, hair * 1.45, 0.9)
    }
    if (!small) {
      const energy = mix(model.energies[pass]!, model.energies[pass + 1]!, fraction)
      const base = model.energies[PASSES]!
      const residual = clamp((energy - base) / (model.energies[0]! - base))
      for (let row = 0; row < 4; row++) {
        const y = 17 - row * 11
        project(36, y, -4, p); project(44, y, -4, q)
        depth.line(p, q, hair * 0.65, 0.18)
        project(36 + 8 * clamp(residual * 4 - row), y, -4, q)
        depth.line(p, q, hair, 0.7, 'c1')
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Alternating constraint sweeps relax a warped net toward its pinned boundary.
 *
 * Color: each sweep’s corrections, the lines toward where a node is going and its busy witness, draw in `c1` while they work, and so does the energy gauge they step down; the net and its clamps keep the ink. */
export function LoaderAccord(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
