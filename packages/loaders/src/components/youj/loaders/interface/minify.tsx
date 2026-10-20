'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'minify', title: 'Minify', category: 'interface', technique: 'planes',
  tags: ['image', 'pyramid', 'mipmap', 'downsample', 'filter', 'generation'],
  description: 'An image builds two reduced resolution levels above its source. A raised read window averages each two-by-two block into one destination texel; the next level waits for the first, and the image pyramid unwrites from its smallest plate downward.',
  order: 43,
  colors: [{ part: 'Reader', mono: 'ink' }],
} satisfies LoaderMeta

interface Level { n: number; side: number; x: number; y: number; z: number; values: number[] }
function pyramid(n: number): Level[] {
  const levels: Level[] = [{ n, side: 56, x: -7, y: -19, z: 7, values: Array.from({ length: n * n }, (_, i) => {
    const x = (i % n + 0.5) / n, z = (Math.floor(i / n) + 0.5) / n
    return 0.13 + 0.52 * Math.exp(-((x - 0.65) ** 2 + (z - 0.36) ** 2) * 22) + 0.21 * Math.exp(-((z - x * 0.55 - 0.12) ** 2) * 150)
  }) }]
  for (let l = 1; l < 3; l++) {
    const prev = levels[l - 1]!, count = prev.n / 2
    const values = Array.from({ length: count * count }, (_, i) => {
      const x = i % count * 2, z = Math.floor(i / count) * 2
      return (prev.values[z * prev.n + x]! + prev.values[z * prev.n + x + 1]! + prev.values[(z + 1) * prev.n + x]! + prev.values[(z + 1) * prev.n + x + 1]!) / 4
    })
    levels.push({ n: count, side: l === 1 ? 34 : 19, x: l === 1 ? 6 : 15, y: l === 1 ? 5 : 25, z: l === 1 ? -1 : -8, values })
  }
  return levels
}
const PYRAMIDS = [pyramid(4), pyramid(8)]
const p = point(), q = point(), xy: number[] = []
const depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.5,
  draw(pen, t, view) {
    const small = view.size < 32, hair = (small ? 1.05 : 1) / view.px
    const levels = PYRAMIDS[view.size < 80 ? 0 : 1]!
    const project = camera({ yaw: -0.35, pitch: -0.68, distance: 380, cx: view.w / 2, cy: 50 })
    const write = [1, span(t, 0.07, 0.42), span(t, 0.47, 0.67)]
    const release = [0, view.ease.exit(span(t, 0.83, 0.97)), view.ease.exit(span(t, 0.72, 0.84))]
    const quad = (x0: number, z0: number, x1: number, z1: number, y: number) => {
      xy.length = 0
      let z = 0
      for (let j = 0; j < 4; j++) { project(j === 0 || j === 3 ? x0 : x1, y, j < 2 ? z0 : z1, p); xy.push(p.x, p.y); z += p.z / 4 }
      return z
    }
    levels.forEach((level, l) => {
      const { n, side, x, y, z } = level, cell = side / n, x0 = x - side / 2, z0 = z - side / 2
      const key = quad(x0, z0, x0 + side, z0 + side, y)
      depth.poly(xy, -200 + l * 0.01, 0.025)
      depth.path(xy, key + 0.01, { width: hair, alpha: 0.55, closed: true })
      for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
        const i = row * n + col
        const on = l === 0 ? 1 : view.ease.standard(span(write[l]! * n * n - i, 0.25, 1)) * (1 - release[l]!)
        const lift = l === 0 ? 0 : 3 * (1 - on)
        const k = quad(x0 + col * cell + 0.35, z0 + row * cell + 0.35, x0 + (col + 1) * cell - 0.35, z0 + (row + 1) * cell - 0.35, y + lift)
        if (on > 0.004) depth.poly(xy, k, level.values[i]! * on, 'ink', true)
        if (l > 0 || !small) depth.path(xy, k + 0.01, { width: hair * 0.5, alpha: 0.12 + 0.26 * on, closed: true })
      }
    })
    for (let l = 1; l < 3; l++) {
      const dest = levels[l]!, source = levels[l - 1]!
      const phase = write[l]! * dest.n ** 2, i = Math.min(dest.n ** 2 - 1, Math.floor(phase))
      const show = view.ease.enter(span(t, l === 1 ? 0.04 : 0.44, l === 1 ? 0.08 : 0.48)) * (1 - view.ease.exit(span(t, l === 1 ? 0.42 : 0.67, l === 1 ? 0.46 : 0.71)))
      if (show <= 0.004) continue
      const col = i % dest.n, row = Math.floor(i / dest.n), srcCell = source.side / source.n
      const previous = Math.max(0, i - 1), local = clamp(phase - i)
      const move = view.ease.emphasized(span(local, 0, 0.25))
      const sx = source.x - source.side / 2 + mix(previous % dest.n, col, move) * srcCell * 2
      const sz = source.z - source.side / 2 + mix(Math.floor(previous / dest.n), row, move) * srcCell * 2
      const readY = source.y + 3 + 2 * Math.sin(Math.PI * move)
      const dx = dest.x - dest.side / 2 + (col + 0.5) * dest.side / dest.n, dz = dest.z - dest.side / 2 + (row + 0.5) * dest.side / dest.n
      const key = quad(sx, sz, sx + srcCell * 2, sz + srcCell * 2, readY)
      depth.path(xy, key + 0.05, { width: hair * 1.15, alpha: show, tone: 'c1', closed: true })
      // The converging supports connect exactly the four read texels to
      // their averaged output; only the output's witness takes the accent.
      if (!small) for (let j = 0; j < 4; j++) {
        project(sx + (j & 1 ? 1.5 : 0.5) * srcCell, readY, sz + (j & 2 ? 1.5 : 0.5) * srcCell, p)
        project(dx, dest.y - 1, dz, q)
        depth.line(p, q, hair * 0.65, 0.28 * show * span(local, 0.2, 0.4), 'c1')
      }
      const half = dest.side / dest.n * 0.37
      project(dx - half, dest.y + 0.2, dz + half, p); project(dx + half, dest.y + 0.2, dz + half, q)
      depth.line(p, q, hair * 1.45, show, 'accent')
      if (!small) {
        const scan = view.ease.standard(span(local, 0.25, 1))
        project(sx, readY, mix(sz, sz + srcCell * 2, scan), p); project(sx + srcCell * 2, readY, mix(sz, sz + srcCell * 2, scan), q)
        depth.line(p, q, hair * 0.8, 0.72 * show, 'c1')
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two-by-two averages build a suspended image pyramid in dependency order.
 *
 * Color: the reader, the window over four source cells, its scan and its lines down to the cell it writes, is `c1`; the pyramid keeps the ink, the written cell’s mark the accent. */
export function LoaderMinify(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
