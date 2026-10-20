'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'occlude', title: 'Occlude', category: 'interface', technique: 'planes',
  tags: ['render', 'depth buffer', 'visibility', 'fragments', 'tiles', 'rasterization'],
  description: 'A tiled depth buffer resolves two overlapping triangular surfaces. The first pass writes one candidate; the second retains only the nearer fragments, splitting their overlap along its exact depth boundary while a sample ray connects the working tile to its source.',
  order: 30,
  colors: [{ part: 'Depth test', mono: 'ink' }],
} satisfies LoaderMeta

type V2 = [number, number]
type V3 = [number, number, number]
const A: V2[] = [[-29, -24], [30, -18], [-6, 29]]
const B: V2[] = [[-28, 17], [12, -29], [29, 24]]
const za = (x: number, y: number) => 13 + 0.28 * x + 0.12 * y
const zb = (x: number, y: number) => 13 - 0.3 * x - 0.15 * y

/** Clip a convex polygon against a signed half-space, retaining its positive side.
 *
 * Color: the depth test, each pass’s probe sampling the surfaces and the boundary it finds, is `c1`; the surfaces keep the ink, the scan line the accent. */
function clip(poly: V2[], side: (p: V2) => number): V2[] {
  const out: V2[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!, b = poly[(i + 1) % poly.length]!
    const da = side(a), db = side(b)
    if (da >= 0) out.push(a)
    if ((da >= 0) !== (db >= 0)) {
      const k = da / (da - db)
      out.push([mix(a[0], b[0], k), mix(a[1], b[1], k)])
    }
  }
  return out
}
const edge = (a: V2, b: V2) => (p: V2) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
/** A fragment big enough to draw: slivers at the triangles' tips would only read as stray ticks. */
const solid = (poly: V2[]) => {
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!, b = poly[(i + 1) % poly.length]!
    area += a[0] * b[1] - b[0] * a[1]
  }
  return poly.length >= 3 && Math.abs(area) / 2 > 1.2
}
interface Tile { x: number; y: number; a: V3[]; b: V3[][]; order: number }

// Visibility is solved once, geometrically. Outside A, B survives; inside
// A, B survives only where its depth is greater. No random cell colours.
const LEVELS = [3, 5, 7].map(count => {
  const tiles: Tile[] = []
  const step = 64 / count
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
    const x = -32 + col * step, y = -32 + row * step
    const bounds = [(p: V2) => p[0] - x - 0.6, (p: V2) => x + step - 0.6 - p[0], (p: V2) => p[1] - y - 0.6, (p: V2) => y + step - 0.6 - p[1]]
    const clipped = bounds.reduce((poly, side) => clip(poly, side), A)
    const a = solid(clipped) ? clipped : []
    let inside = bounds.reduce((poly, side) => clip(poly, side), B)
    const visible: V2[][] = []
    for (let i = 0; i < A.length; i++) {
      const side = edge(A[i]!, A[(i + 1) % A.length]!)
      const outside = clip(inside, p => -side(p))
      if (solid(outside)) visible.push(outside)
      inside = clip(inside, side)
    }
    const nearer = clip(inside, p => zb(...p) - za(...p))
    if (solid(nearer)) visible.push(nearer)
    // Boustrophedon order, top row first: the working marker slides from each tile to the next and never jumps back across.
    const line = count - 1 - row
    tiles.push({ x: x + step / 2, y: y + step / 2, a: a.map(([xx, yy]) => [xx, yy, 0]), b: visible.map(poly => poly.map(([xx, yy]) => [xx, yy, 0.1])), order: line * count + (line % 2 ? count - 1 - col : col) })
  }
  return { count, tiles, step, path: [...tiles].sort((m, n) => m.order - n.order) }
})
const sources = [A.map(([x, y]): V3 => [x, y, za(x, y)]), B.map(([x, y]): V3 => [x, y, zb(x, y)])]
// The exact depth boundary, where za = zb, across the overlap of the two surfaces (B clipped to inside A).
const OVERLAP = A.reduce((poly, a, i) => clip(poly, edge(a, A[(i + 1) % A.length]!)), B)
const BOUNDARY: V3[] = []
for (let i = 0; i < OVERLAP.length; i++) {
  const a = OVERLAP[i]!, b = OVERLAP[(i + 1) % OVERLAP.length]!
  const da = za(...a) - zb(...a), db = za(...b) - zb(...b)
  if ((da >= 0) !== (db >= 0)) {
    const k = da / (da - db)
    BOUNDARY.push([mix(a[0], b[0], k), mix(a[1], b[1], k), 0.15])
  }
}
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.55,
  draw(pen, t, view) {
    const small = view.size < 32
    const { count, tiles, step, path } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.05 : 1) / view.px
    // A slow sway keeps the plate alive while it holds its result; none when tiny, where it would only shimmer.
    const pose = { yaw: -0.18 + (small ? 0 : 0.05 * Math.sin(TAU * t)), pitch: -0.36 }
    const project = camera({ ...pose, distance: 400, cx: view.w / 2, cy: 54 })
    const turn = orient(pose)
    const light = [lambert(...turn(-0.28, -0.12, 1)), lambert(...turn(0.3, 0.15, 1))]
    const clear = 1 - view.ease.exit(span(t, 0.78, 0.97))
    const pass = [span(t, 0.04, 0.33), span(t, 0.36, 0.68)]
    const cells = count * count
    // Each tile settles over a few tiles' time behind the marker: a soft front rather than a flicker of cells.
    const soft = small ? 1.4 : 2.6
    for (let i = 0; i <= count; i++) {
      const u = -32 + i * step
      project(u, -32, -0.2, p); project(u, 32, -0.2, q); depth.line(p, q, hair * 0.65, 0.18)
      project(-32, u, -0.2, p); project(32, u, -0.2, q); depth.line(p, q, hair * 0.65, 0.18)
    }
    for (const tile of tiles) for (let bank = 0; bank < 2; bank++) {
      const on = view.ease.standard(clamp((pass[bank]! * (cells + soft) - tile.order) / soft)) * clear
      if (on <= 0.004) continue
      const shapes = bank === 0 ? [tile.a] : tile.b
      for (const shape of shapes) {
        if (shape.length < 3) continue
        const f = projectPath(shape, project, xy)
        // Both passes write one receiver plane. The second pass contains
        // only geometrically winning fragments, so it cannot overwrite a
        // nearer first-pass sample or reveal a hidden far fragment.
        depth.poly(f.xy, 30 + bank, (bank === 0 ? 0.23 : 0.58) * on, 'ink', true)
        depth.path(f.xy, 30.1 + bank, { width: hair * 0.55, alpha: on * (0.42 + 0.3 * light[bank]!), closed: true })
      }
    }
    if (!small) {
      for (const [i, source] of sources.entries()) {
        const guide = view.ease.standard(span(t, i ? 0.34 : 0.02, i ? 0.4 : 0.08)) * (1 - view.ease.exit(span(t, i ? 0.68 : 0.32, i ? 0.75 : 0.38)))
        const f = projectPath(source, project, xy)
        depth.path(f.xy, 40, { width: hair * 0.7, alpha: guide * 0.27, closed: true, dash: [3 * hair, 2 * hair] })
      }
      // Once the second pass is in, the boundary it resolved is ruled across the overlap, end to end.
      const rule = view.ease.emphasized(span(t, 0.62, 0.75)) * clear
      if (BOUNDARY.length === 2 && rule > 0.004) {
        const [a, b] = BOUNDARY as [V3, V3]
        project(...a, p)
        project(mix(a[0], b[0], rule), mix(a[1], b[1], rule), a[2], q)
        depth.path([p.x, p.y, q.x, q.y], 44, { width: hair * 1.1, alpha: 0.85 * clear, tone: 'c1', cap: 'round' })
        depth.square(p, 2.4 * hair, 0.9 * clear, 'c1')
        depth.square(project(...b, q), 2.4 * hair, 0.9 * span(rule, 0.85, 1), 'c1')
      }
    }
    // The working marker rides the scan path: tile centre to tile centre, turning at each row's end.
    for (let bank = 0; bank < 2; bank++) {
      const show = Math.sin(Math.PI * span(t, bank ? 0.35 : 0.02, bank ? 0.72 : 0.35)) ** 2
      if (show <= 0.004) continue
      const u = clamp(pass[bank]! * (cells + soft) - 0.5, 0, cells - 1)
      const i = Math.min(cells - 2, Math.floor(u))
      const x = mix(path[i]!.x, path[i + 1]!.x, u - i)
      const y = mix(path[i]!.y, path[i + 1]!.y, u - i)
      const z = bank ? zb(x, y) : za(x, y)
      project(x, y, 0.2, p); project(x, y, z, q)
      depth.path([p.x, p.y, q.x, q.y], 45, { width: hair * 0.8, alpha: 0.65 * show, tone: 'c1' })
      // The ray ends in a small sample knot on the source surface.
      depth.square(q, 2 * hair, 0.85 * show, 'c1')
      project(x - step / 2, y + step / 2, 0.3, p)
      project(x + step / 2, y + step / 2, 0.3, q)
      depth.path([p.x, p.y, q.x, q.y], 46, { width: hair * 1.3, alpha: show, tone: 'accent' })
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A second depth pass writes only the nearer fragments of intersecting surfaces. */
export function LoaderOcclude(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
