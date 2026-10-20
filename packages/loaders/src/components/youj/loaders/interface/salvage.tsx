'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'salvage', title: 'Salvage', category: 'interface', technique: 'lines',
  tags: ['recovery', 'erasure', 'parity', 'restore', 'validation', 'data'],
  description: 'A missing data stripe is reconstructed from two surviving stripes and their parity. Three read fingers contribute to each exclusive-or result before the recovered cell seats; a witness binds the restored stripe and the recovery unwrites column by column.',
  order: 46,
  colors: [{ part: 'Donors', mono: 'ink' }, { part: 'Sealed', mono: 'ink', role: 'success' }],
} satisfies LoaderMeta

const A = [1, 0, 1, 1, 0, 1, 0, 0], B = [0, 1, 1, 0, 1, 0, 1, 1], C = [1, 1, 0, 1, 1, 0, 0, 1]
const PARITY = A.map((v, i) => v ^ B[i]! ^ C[i]!)
const DATA = [A, B, C, PARITY], DONORS = [0, 2, 3]
const xy: number[] = [], route: number[] = []
const p = point(), q = point(), depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32, n = small ? 5 : 8, hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.3, pitch: -0.26, distance: 350, cx: view.w / 2, cy: 49 })
    const gap = 54 / n, width = gap * 0.72, height = small ? 6 : 5.3
    const write = span(t, 0.07, 0.68) * n
    const undo = span(t, 0.78, 0.97) * n
    const rowY = (r: number) => 22 - r * 14
    const rowZ = (r: number) => -8 + r * 7
    const cellX = (i: number) => -27 + (i + 0.5) * gap
    for (let r = 0; r < 4; r++) {
      project(-29, rowY(r) - height / 2 - 2, rowZ(r), p); project(29, rowY(r) - height / 2 - 2, rowZ(r), q)
      depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair * 0.65, alpha: r === 1 ? 0.4 : 0.23, dash: r === 3 && !small ? [2.5 * hair, 2 * hair] : undefined })
      for (let i = 0; i < n; i++) {
        const ready = r === 1 ? view.ease.standard(span(write - i, 0.76, 1)) * (1 - view.ease.exit(clamp(undo - (n - 1 - i)))) : 1
        const x = cellX(i), y = rowY(r) - 3 * (1 - ready), z = rowZ(r)
        const bit = r === 1 ? A[i]! ^ C[i]! ^ PARITY[i]! : DATA[r]![i]!
        xy.length = 0
        let key = 0
        for (let j = 0; j < 4; j++) {
          project(x + (j === 0 || j === 3 ? -width / 2 : width / 2), y + (j < 2 ? height / 2 : -height / 2), z, p)
          xy.push(p.x, p.y); key += p.z / 4
        }
        depth.poly(xy, key, bit ? 0.44 * ready : 0.018, 'ink', true)
        depth.path(xy, key + 0.01, { width: hair * 0.85, alpha: r === 1 ? 0.15 + 0.7 * ready : 0.68, closed: true })
        if (r === 1 && ready > 0.004) {
          project(x - width / 2, y - height / 2, z + 0.1, p); project(x + width / 2, y - height / 2, z + 0.1, q)
          const witness = clamp(1 - (write - i - 1) / 1.1) * ready
          depth.line(p, q, hair * 1.4, witness, 'accent')
        }
      }
      if (!small) {
        // Stripe labels are short ruled tabs, not text or brand glyphs.
        project(-34, rowY(r), rowZ(r), p); project(-31, rowY(r), rowZ(r), q)
        depth.line(p, q, hair * 1.2, r === 1 ? 0.8 : 0.5)
        if (r === 3) { project(-34, rowY(r) - 2.4, rowZ(r), p); project(-31, rowY(r) - 2.4, rowZ(r), q); depth.line(p, q, hair, 0.5) }
      }
    }
    const show = view.ease.enter(span(t, 0.035, 0.08)) * (1 - view.ease.exit(span(t, 0.68, 0.74)))
    if (show > 0.004) {
      const i = Math.min(n - 1, Math.floor(write)), local = clamp(write - i)
      const x = mix(cellX(Math.max(0, i - 1)), cellX(i), view.ease.emphasized(span(local, 0, 0.16)))
      // The read comb steps to the next column through the theme curve.
      // Each donor joins separately; the result waits for the third input.
      for (let d = 0; d < DONORS.length; d++) {
        const r = DONORS[d]!, on = view.ease.standard(span(local, 0.16 + d * 0.2, 0.36 + d * 0.2))
        project(x, rowY(r), rowZ(r) + 3, p); project(x, rowY(r), rowZ(r) + 7, q)
        depth.line(p, q, hair * 1.1, (0.27 + 0.6 * on) * show)
        route.length = 0
        let key = 0
        const samples = small ? 6 : 12
        for (let j = 0; j <= samples; j++) {
          const u = j / samples * on
          project(x + 2.6 * Math.sin(Math.PI * u), mix(rowY(r), rowY(1), u), mix(rowZ(r) + 7, rowZ(1) + 7, u) + 5 * Math.sin(Math.PI * u), p)
          route.push(p.x, p.y); key += p.z / (samples + 1)
        }
        if (on > 0.004) depth.path(route, key, { width: hair * 0.85, alpha: 0.68 * show, join: 'round', tone: 'c1' })
      }
      project(x, rowY(1) + height / 2 + 2, rowZ(1) + 7, p); project(x, rowY(1) - height / 2 - 2, rowZ(1) + 7, q)
      depth.line(p, q, hair, 0.95 * show, 'accent')
    }
    const sealed = view.ease.standard(span(t, 0.69, 0.75)) * (1 - view.ease.exit(span(t, 0.755, 0.79)))
    if (sealed > 0.004) {
      project(-29, rowY(1) - height / 2 - 2, rowZ(1), p); project(mix(-29, 29, sealed), rowY(1) - height / 2 - 2, rowZ(1), q)
      depth.line(p, q, hair * 1.3, sealed, 'c2')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Surviving data stripes and parity reconstruct an erased stripe one column at a time.
 *
 * Color: each donor’s read, curving into the row being rebuilt, is `c1`, and the seal under the rebuilt row is `c2` (success); the stripes keep the ink, the read comb and each new bit the accent. */
export function LoaderSalvage(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
