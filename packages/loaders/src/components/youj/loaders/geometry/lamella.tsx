'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'lamella', title: 'Lamella', category: 'geometry', technique: 'planes',
  tags: ['lamination', 'sheets', 'fabrication', 'courses', 'hollow', 'assembly'],
  description: 'Waisted annular sheets register in alternating arrivals around an open bore. Their cut walls and top faces stay lit as each lamination seats, a short bond travels around the final rim, and the sheets peel away from the top course downward.',
  order: 41,
  colors: [{ part: 'Bore', mono: 'ink' }],
} satisfies LoaderMeta

const LEVELS = [
  { layers: 3, segments: 12 }, { layers: 5, segments: 20 }, { layers: 6, segments: 28 },
].map(({ layers, segments }) => ({
  layers, segments,
  rings: Array.from({ length: layers }, (_, layer) => Array.from({ length: segments + 1 }, (_, j) => {
    const a = Math.PI * 2 * j / segments
    const waist = 1 - 0.2 * Math.cos(2 * a)
    const profile = 1 - 0.12 * Math.sin(layer * Math.PI / (layers - 1))
    return { x: 28 * waist * profile * Math.cos(a), z: 22 * profile * Math.sin(a), ix: 12.5 * Math.cos(a), iz: 10.5 * Math.sin(a) }
  })),
}))
const depth = new Depth()
const p = Array.from({ length: 4 }, point)
const xy: number[] = []
const outer: number[] = [], inner: number[] = []

export const scene: Scene = {
  beats: 6.2, still: 0.58,
  draw(pen, t, view) {
    const small = view.size < 32
    const { layers, segments, rings } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.54, pitch: -0.92 }
    const project = camera({ ...pose, distance: 350, cx: 50, cy: 54 })
    const light = orient(pose)
    const topLight = lambert(...light(0, 1, 0))
    // A permanent thin plan survives while the laminate is disassembled.
    for (let j = 0; j < segments; j++) {
      const a = rings[0]![j]!, b = rings[0]![j + 1]!
      project(a.x, -16, a.z, p[0]!); project(b.x, -16, b.z, p[1]!)
      depth.line(p[0]!, p[1]!, hair * 0.75, 0.28)
    }
    for (let i = 0; i < layers; i++) {
      const from = 0.025 + i * 0.07
      const off = 0.7 + (layers - 1 - i) * 0.035
      const fit = clamp(view.ease.emphasized(span(t, from, from + 0.16)) - view.ease.emphasized(span(t, off, off + 0.115)))
      if (fit <= 0.003) continue
      const sx = (i % 2 ? 1 : -1) * 18 * (1 - fit)
      const y = -12 + i * 24 / (layers - 1) + 12 * (1 - fit)
      const scale = 0.25 + 0.75 * fit
      const thickness = (small ? 2.3 : 1.9) * fit
      outer.length = 0
      inner.length = 0
      let topOrder = 0
      for (let j = 0; j <= segments; j++) {
        const a = rings[i]![j]!
        project(sx + a.x * scale, y, a.z * scale, p[0]!)
        outer.push(p[0]!.x, p[0]!.y)
        topOrder += p[0]!.z / (segments + 1)
        project(sx + a.ix * scale, y, a.iz * scale, p[1]!)
        inner.push(p[1]!.x, p[1]!.y)
      }
      // Opposite winding leaves the bore open. A single annular face has
      // no antialiased radial joins between otherwise identical sectors.
      xy.length = 0
      for (const v of outer) xy.push(v)
      for (let j = inner.length - 2; j >= 0; j -= 2) xy.push(inner[j]!, inner[j + 1]!)
      depth.face(xy, topOrder, topLight)
      depth.path(outer, topOrder + 0.02, { width: hair * 0.8, alpha: 0.76, closed: true })
      depth.path(inner, topOrder + 0.03, { width: hair * 0.7, alpha: 0.57, closed: true, tone: 'c1' })
      for (let j = 0; j < segments; j++) {
        const a = rings[i]![j]!, b = rings[i]![j + 1]!
        for (const inner of [false, true]) {
          const ax = inner ? a.ix : a.x, az = inner ? a.iz : a.z
          const bx = inner ? b.ix : b.x, bz = inner ? b.iz : b.z
          const direction = inner ? -1 : 1
          const normal = light((bz - az) * direction, 0, (ax - bx) * direction)
          if (normal[2] <= 0) continue
          project(sx + ax * scale, y, az * scale, p[0]!)
          project(sx + bx * scale, y, bz * scale, p[1]!)
          project(sx + bx * scale, y - thickness, bz * scale, p[2]!)
          project(sx + ax * scale, y - thickness, az * scale, p[3]!)
          xy.length = 0
          let z = 0
          for (const q of p) { xy.push(q.x, q.y); z += q.z / 4 }
          depth.face(xy, z, lambert(...normal))
          if (!small) depth.line(p[2]!, p[3]!, hair * 0.6, 0.37)
        }
      }
      if (i === layers - 1) {
        const bond = span(t, 0.5, 0.67) * segments
        const fade = 1 - view.ease.exit(span(t, 0.67, 0.73))
        const j = Math.min(segments - 1, Math.floor(bond))
        const a = rings[i]![j]!, b = rings[i]![j + 1]!
        project(sx + a.x * scale, y + 0.15, a.z * scale, p[0]!)
        project(sx + b.x * scale, y + 0.15, b.z * scale, p[1]!)
        depth.path([p[0]!.x, p[0]!.y, p[1]!.x, p[1]!.y], topOrder + 0.05, { width: hair * 1.6, alpha: span(t, 0.49, 0.53) * fade * fit, tone: 'accent' })
      }
    }
    if (!small) {
      for (const x of [-31, 31]) {
        project(x, -16, 0, p[0]!); project(x, 18, 0, p[1]!)
        depth.line(p[0]!, p[1]!, hair * 0.65, 0.17)
      }
    }
    depth.flush(pen)
  },
}
/* Color: each sheet’s bore edge is `c1`, so the open bore reads
 * through the stack; the bond on the last rim stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Cut annular laminations register around a visible bore, bond, and peel apart. */
export function LoaderLamella(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
