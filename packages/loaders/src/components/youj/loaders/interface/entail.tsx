'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'entail', title: 'Entail', category: 'interface', technique: 'planes',
  tags: ['constraints', 'propagation', 'tiles', 'generation', 'assembly', 'wave function collapse'],
  description: 'Candidate conduit tiles hover in shallow stacks above their sockets. Matching edge constraints remove unsupported choices from neighbouring stacks; surviving tiles seat into one connected layout, a proof stroke crosses each newly agreed seam, and the alternatives reopen in reverse.',
  order: 41,
  colors: [{ part: 'Collapse', mono: 'ink' }],
} satisfies LoaderMeta

const BITS = [1, 2, 4, 8]
const DX = [0, 1, 0, -1], DZ = [-1, 0, 1, 0]
const TILES = [3, 6, 12, 9, 5, 10]
interface Frame { domains: number[][]; cell: number; cause: number }
// Arc consistency is evaluated at module load. Observations choose a tile
// from a known satisfying layout; every subsequent removal still requires
// an actual unsupported edge, rather than a choreographed pretend solve.
const LEVELS = [
  { n: 2, path: [[0, 0], [1, 0], [1, 1], [0, 1]], out: 8 },
  { n: 3, path: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]], out: 1 },
].map(({ n, path, out }) => {
  const target = new Array<number>(n * n).fill(0)
  for (let j = 0; j < path.length; j++) {
    const [x = 0, z = 0] = path[j]!
    let mask = j === 0 ? 8 : j === path.length - 1 ? out : 0
    for (const k of [j - 1, j + 1]) if (path[k]) {
      const [xx = 0, zz = 0] = path[k]!
      const direction = DX.findIndex((dx, d) => x + dx === xx && z + DZ[d]! === zz)
      mask |= BITS[direction]!
    }
    target[z * n + x] = mask
  }
  const domains = target.map((mask, cell) => TILES.filter(tile => BITS.every((bit, d) => {
    const x = cell % n + DX[d]!, z = Math.floor(cell / n) + DZ[d]!
    return x >= 0 && x < n && z >= 0 && z < n || Boolean(tile & bit) === Boolean(mask & bit)
  })))
  const frames: Frame[] = []
  const record = (cell: number, cause: number) => frames.push({ domains: domains.map(v => v.slice()), cell, cause })
  record(-1, -1)
  let changed = true
  while (changed) {
    changed = false
    for (let cell = 0; cell < domains.length; cell++) for (let d = 0; d < 4; d++) {
      const x = cell % n + DX[d]!, z = Math.floor(cell / n) + DZ[d]!
      if (x < 0 || x >= n || z < 0 || z >= n) continue
      const neighbour = z * n + x
      const kept = domains[cell]!.filter(tile => domains[neighbour]!.some(other => Boolean(tile & BITS[d]!) === Boolean(other & BITS[(d + 2) % 4]!)))
      if (kept.length === domains[cell]!.length) continue
      domains[cell] = kept; record(cell, neighbour); changed = true
    }
    if (!changed) {
      const candidates = domains.map((v, i) => ({ size: v.length, i })).filter(v => v.size > 1).sort((a, b) => a.size - b.size || a.i - b.i)
      if (candidates.length) {
        const cell = candidates[0]!.i
        domains[cell] = [target[cell]!]; record(cell, -1); changed = true
      }
    }
  }
  return { n, frames }
})
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.42,
  draw(pen, t, view) {
    const small = view.size < 32
    const { n, frames } = LEVELS[small ? 0 : 1]!
    const project = camera({ yaw: -0.3, pitch: -0.77, distance: 290, cx: view.w / 2, cy: 53 })
    const hair = (small ? 1.1 : 1) / view.px
    const step = 60 / n
    const at = (frames.length - 1) * (span(t, 0.05, 0.61) - span(t, 0.75, 0.97))
    const index = Math.min(frames.length - 1, Math.floor(Math.max(0, at)))
    const before = frames[index]!, after = frames[Math.min(index + 1, frames.length - 1)]!
    const f = view.ease.emphasized(at - index)
    for (let cell = 0; cell < n * n; cell++) {
      const x = -30 + (cell % n + 0.5) * step, z = -30 + (Math.floor(cell / n) + 0.5) * step
      const old = before.domains[cell]!, next = after.domains[cell]!
      // The socket stays at ground level, establishing the final footprint.
      xy.length = 0
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]) {
        project(x + dx! * step, 0, z + dz! * step, p); xy.push(p.x, p.y)
      }
      depth.path(xy, -200, { width: hair * 0.65, alpha: 0.2, closed: true })
      for (const tile of TILES) {
        const oi = old.indexOf(tile), ni = next.indexOf(tile)
        if (oi < 0 && ni < 0) continue
        const show = mix(oi >= 0 ? 1 : 0, ni >= 0 ? 1 : 0, f)
        if (show <= 0.004) continue
        const y0 = old.length === 1 ? 0 : 4 + Math.max(0, oi) * 5
        const y1 = next.length === 1 ? 0 : 4 + Math.max(0, ni) * 5
        const y = mix(y0, y1, f) + (ni < 0 ? 5 * f : 0)
        const half = step * 0.43 * show
        xy.length = 0
        let order = 0
        for (const [dx, dz] of [[-half, -half], [half, -half], [half, half], [-half, half]]) {
          project(x + dx!, y, z + dz!, p); xy.push(p.x, p.y); order += p.z / 4
        }
        // A lit paper plane occludes earlier candidates. Removed choices
        // contract into their own socket instead of popping off the stack.
        depth.poly(xy, order, 0.075 * show, 'ink', true)
        depth.path(xy, order + 0.01, { width: hair * 0.7, alpha: (next.length === 1 ? 0.72 : 0.35) * show, closed: true })
        const directions = BITS.map((bit, d) => tile & bit ? d : -1).filter(d => d >= 0)
        xy.length = 0
        for (const d of [directions[0]!, -1, directions[1]!]) {
          project(x + (d < 0 ? 0 : DX[d]! * step * 0.5 * show), y + 0.35, z + (d < 0 ? 0 : DZ[d]! * step * 0.5 * show), p)
          xy.push(p.x, p.y)
        }
        // A cell collapsing to its last tile flushes with its color, then settles to the ink.
        const settling = next.length === 1 && old.length > 1 ? Math.sin(Math.PI * f) : 0
        depth.path(xy, order + 0.1, { width: hair * (small ? 1.5 : 1.25), alpha: show * clamp(0.88 + order / 250, 0.55, 1), tone: blend('ink', 'c1', settling), join: 'round', cap: 'round' })
      }
    }
    // A constraint witness bridges the affected shared edge at the exact
    // moment its last unsupported tile disappears.
    const active = Math.sin(Math.PI * clamp(at - index)) ** 2
    if (active > 0.004 && after.cell >= 0) {
      const cell = after.cell, cause = after.cause
      const x = -30 + (cell % n + 0.5) * step, z = -30 + (Math.floor(cell / n) + 0.5) * step
      if (cause >= 0) {
        const xx = -30 + (cause % n + 0.5) * step, zz = -30 + (Math.floor(cause / n) + 0.5) * step
        project(mix(x, xx, 0.35), 2, mix(z, zz, 0.35), p)
        project(mix(x, xx, 0.65), 2, mix(z, zz, 0.65), q)
      } else {
        project(x - step * 0.25, 2, z - step * 0.44, p)
        project(x + step * 0.25, 2, z - step * 0.44, q)
      }
      depth.line(p, q, hair * 1.7, active, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Edge compatibility prunes hovering alternatives into a connected conduit layout.
 *
 * Color: a cell collapsing to its last tile flushes with `c1` as it settles, then returns to the ink; the witness of each constraint is the accent. */
export function LoaderEntail(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
