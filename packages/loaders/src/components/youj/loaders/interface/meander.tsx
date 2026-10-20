'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'meander', title: 'Meander', category: 'interface', technique: 'lines',
  tags: ['hilbert', 'space filling', 'spatial index', 'locality', 'pages', 'dataset'],
  description: 'A continuous Hilbert traversal indexes a square field without crossing itself. Neighbouring records join into four raised pages, their directory brackets close as each page completes, and the traversal walks backward to release the index.',
  order: 40,
  colors: [{ part: 'Route', mono: 'ink' }],
} satisfies LoaderMeta

// Integer Hilbert coordinates: each consecutive address shares a cell edge,
// and each quarter of the address space occupies one contiguous quadrant.
const LEVELS = [2, 4, 8].map(n => {
  const route = Array.from({ length: n * n }, (_, d) => {
    let x = 0, z = 0, address = d
    for (let side = 1; side < n; side *= 2) {
      const rx = 1 & (address >> 1), rz = 1 & (address ^ rx)
      if (rz === 0) {
        if (rx === 1) { x = side - 1 - x; z = side - 1 - z }
        const temp = x; x = z; z = temp
      }
      x += side * rx; z += side * rz; address >>= 2
    }
    return { x: -30 + (x + 0.5) * 60 / n, z: -30 + (z + 0.5) * 60 / n }
  })
  const pages = Array.from({ length: 4 }, (_, bank) => {
    const group = route.slice(bank * route.length / 4, (bank + 1) * route.length / 4)
    return { x: group.reduce((v, p) => v + p.x, 0) / group.length, z: group.reduce((v, p) => v + p.z, 0) / group.length }
  })
  return { n, route, pages }
})
const depth = new Depth()
const a = point(), b = point()
const xy: number[] = []
const heights = new Float32Array(4)

export const scene: Scene = {
  beats: 6, still: 0.42,
  draw(pen, t, view) {
    const small = view.size < 32
    const { n, route, pages } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const project = camera({ yaw: -0.3, pitch: -0.84, distance: 270, cx: view.w / 2, cy: 53 })
    const hair = (small ? 1.05 : 1) / view.px
    const count = route.length
    const at = count * (span(t, 0.04, 0.6) - span(t, 0.74, 0.97))
    const step = 60 / n
    for (let bank = 0; bank < 4; bank++) heights[bank] = 6 * view.ease.emphasized(clamp((at - (bank + 1) * count / 4 + 1) / 2))

    // The address field remains as open sockets. Written cells acquire an
    // opaque face, and a complete quadrant lifts as one contiguous page.
    route.forEach(({ x, z }, i) => {
      const written = view.ease.enter(clamp(at - i))
      const y = heights[Math.floor(i * 4 / count)]! * written
      const half = step * (small ? 0.43 : 0.46)
      xy.length = 0
      let order = 0
      for (const [dx, dz] of [[-half, -half], [half, -half], [half, half], [-half, half]]) {
        project(x + dx!, y, z + dz!, a); xy.push(a.x, a.y); order += a.z / 4
      }
      if (written > 0.004) depth.poly(xy, order, 0.04 * written, 'ink', true)
      depth.path(xy, order + 0.01, { width: hair * (small ? 0.85 : 0.65), alpha: small ? 0.18 + 0.28 * written : 0.12 + 0.16 * written, closed: true })
      if (!small && y > 0.1 && i % (count / 4) === 0) {
        project(x - half, 0, z - half, a); project(x - half, y, z - half, b)
        depth.line(a, b, hair * 0.65, written * 0.3)
      }
    })
    // The actual route follows the raised pages: no crossing, no jump from
    // one cell to another. Its newest segment wears a short accent head.
    for (let i = 1; i < count; i++) {
      const written = clamp(at - i)
      if (written <= 0) continue
      const p = route[i - 1]!, q = route[i]!
      const f = view.ease.standard(written)
      const y0 = 1.2 + heights[Math.floor((i - 1) * 4 / count)]!
      const y1 = 1.2 + heights[Math.floor(i * 4 / count)]!
      project(p.x, y0, p.z, a)
      project(mix(p.x, q.x, f), mix(y0, y1, f), mix(p.z, q.z, f), b)
      // The newest stretch of the route is its color; a quarter of the route behind the head, it has settled to the ink.
      depth.line(a, b, hair * (small ? 1.4 : 1.25), 0.94, blend('c1', 'ink', clamp((at - i - 1) / (count / 4))))
      const leader = Math.sin(Math.PI * written) ** 2
      if (leader > 0.004) {
        project(mix(p.x, q.x, Math.max(0, f - 0.3)), mix(y0, y1, Math.max(0, f - 0.3)) + 0.05, mix(p.z, q.z, Math.max(0, f - 0.3)), a)
        depth.line(a, b, hair * 1.6, leader, 'accent')
      }
    }
    pages.forEach(({ x, z }, bank) => {
      const settled = heights[bank]! / 6
      if (settled <= 0.004) return
      const y = heights[bank]! + 0.5
      // A directory entry is a pair of brackets, rather than another card.
      // Their closing stroke grows only when that page's final key is read.
      for (const side of [-1, 1]) {
        xy.length = 0
        for (const [dx, dz] of [[side * 10, -13], [side * 14, -13], [side * 14, 13], [side * 10, 13]]) {
          project(x + dx!, y, z + dz!, a); xy.push(a.x, a.y)
        }
        depth.path(xy, a.z + 0.2, { width: hair * 0.85, alpha: settled * 0.52 })
      }
      if (!small) {
        project(x - 7, y, z + 16, a); project(x - 7 + 14 * settled, y, z + 16, b)
        depth.line(a, b, hair * 1.25, settled * 0.78)
      }
    })
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A Hilbert address traversal assembles four contiguous spatial index pages.
 *
 * Color: the route is written in `c1` and settles to the ink a quarter of its length behind the head; the cells, banks and pages keep the ink, the route’s leading edge the accent. */
export function LoaderMeander(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
