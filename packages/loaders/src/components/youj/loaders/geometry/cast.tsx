'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, TAU, Depth, point, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'cast', title: 'Cast', category: 'geometry', technique: 'planes',
  tags: ['casting', 'formwork', 'fabrication', 'mould', 'construction', 'solid'],
  description: 'Two profiled mould halves register around a tapered casting. A cutaway exposes the rising material and its level rim; the formwork parts only after the pour sets, revealing the lit shoulders and waist before the casting clears into its bed.',
  order: 56,
  colors: [{ part: 'Material', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
interface Face { corners: V3[]; normal: V3; half: number; rim: boolean }
const HEIGHTS = [-24, -17, 7, 21]
const RADII = [14, 19, 11, 15]
const radius = (y: number) => {
  for (let i = 1; i < HEIGHTS.length; i++) if (y <= HEIGHTS[i]!) return mix(RADII[i - 1]!, RADII[i]!, span(y, HEIGHTS[i - 1]!, HEIGHTS[i]!))
  return RADII[RADII.length - 1]!
}
function normal(c: V3[]): V3 {
  const a = c[0]!, b = c[1]!, d = c[2]!
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
  const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2]
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
}
const at = (a: number, y: number, offset: number): V3 => [(radius(y) + offset) * Math.cos(a), y, (radius(y) + offset) * Math.sin(a)]
// The profiled wall is real shell geometry: outer and inner skins, cut
// crowns, and parting returns. Its front panels are cut back to expose the
// cavity. No translucent wall is used to fake visibility of the pour.
const FORMS: Face[] = []
for (let half = 0; half < 2; half++) for (let panel = 0; panel < 4; panel++) {
  const a = -Math.PI / 2 + half * Math.PI + panel * Math.PI / 4
  const b = a + Math.PI / 4
  const cap = Math.sin((a + b) / 2) > 0.4 ? -9 : 21
  for (let level = 0; level < 3; level++) {
    const lo = HEIGHTS[level]!, hi = Math.min(cap, HEIGHTS[level + 1]!)
    if (lo >= hi) continue
    for (const offset of [1.5, 4]) {
      const corners = [at(a, lo, offset), at(a, hi, offset), at(b, hi, offset), at(b, lo, offset)]
      if (offset === 1.5) corners.reverse()
      FORMS.push({ corners, normal: normal(corners), half, rim: false })
    }
    if (hi === cap) {
      const corners = [at(a, hi, 1.5), at(a, hi, 4), at(b, hi, 4), at(b, hi, 1.5)]
      FORMS.push({ corners, normal: [0, 1, 0], half, rim: true })
    }
    for (const angle of panel === 0 ? [a] : panel === 3 ? [b] : []) {
      const corners = [at(angle, lo, 1.5), at(angle, hi, 1.5), at(angle, hi, 4), at(angle, lo, 4)]
      const n = normal(corners)
      // Each parting return faces out of its own half-shell.
      if (panel === 3) { n[0] *= -1; n[1] *= -1; n[2] *= -1 }
      FORMS.push({ corners, normal: n, half, rim: true })
    }
    // Close the exposed section at the two boundaries of the cutaway.
    // Splitting its return at each profile shoulder preserves the cavity.
    if ((half === 0 && panel === 2 || half === 1 && panel === 1) && hi > -9) {
      const angle = half === 0 ? b : a
      const bottom = Math.max(lo, -9)
      const corners = [at(angle, bottom, 1.5), at(angle, hi, 1.5), at(angle, hi, 4), at(angle, bottom, 4)]
      if (half === 0) corners.reverse()
      FORMS.push({ corners, normal: normal(corners), half, rim: true })
    }
  }
}
const CASTING = Array.from({ length: 8 }, (_, panel) => {
  const a = -Math.PI / 2 + panel * Math.PI / 4, b = a + Math.PI / 4
  const directions = [[Math.cos(a), Math.sin(a)], [Math.cos(b), Math.sin(b)]] as const
  const bands = HEIGHTS.slice(0, -1).map((lo, band) => {
    const hi = HEIGHTS[band + 1]!
    return { lo, hi, normal: normal([at(a, lo, 0), at(a, hi, 0), at(b, hi, 0), at(b, lo, 0)]) }
  })
  return { directions, bands }
})
const BED = Array.from({ length: 33 }, (_, i) => [28 * Math.cos(TAU * i / 32), 28 * Math.sin(TAU * i / 32)])
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const material: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const place = (out: V3, direction: readonly number[], y: number) => {
  const r = radius(y)
  out[0] = direction[0]! * r; out[1] = y; out[2] = direction[1]! * r
}

function face(project: Project, corners: V3[], n: V3, turn: (x: number, y: number, z: number) => V3, hair: number, shift = 0, edge = 0.7, tone: Tone = 'ink') {
  const v = turn(...n)
  if (v[2] <= 0.001) return
  xy.length = 0
  let z = 0
  for (const c of corners) { project(c[0] + shift, c[1], c[2], p); xy.push(p.x, p.y); z += p.z / corners.length }
  depth.face(xy, z, lambert(...v))
  depth.path(xy, z + 0.015, { width: hair * 0.75, alpha: edge * clamp(0.84 + z / 230, 0.5, 1), closed: true, tone })
}

export const scene: Scene = {
  beats: 6, still: 0.77,
  draw(pen, t, view) {
    const small = view.size < 32
    const pose = { yaw: -0.43, pitch: -0.5 }
    const project = camera({ ...pose, distance: 310, cx: view.w / 2, cy: 50 })
    const turn = orient(pose)
    const hair = (small ? 1.05 : 1) / view.px
    const closed = view.ease.emphasized(span(t, 0.04, 0.25)) - view.ease.emphasized(span(t, 0.65, 0.82))
    const poured = view.ease.standard(span(t, 0.28, 0.59)) * (1 - view.ease.exit(span(t, 0.85, 0.98)))
    const level = mix(-24, 21, poured)
    const gap = 17 * (1 - closed)

    // The measured bed stays visible around the formwork's footprint.
    xy.length = 0
    for (const [x, z] of BED) { project(x!, -24.2, z!, p); xy.push(p.x, p.y) }
    depth.path(xy, -200, { width: hair * 0.7, alpha: 0.25, closed: true, dash: small ? undefined : [3 * hair, 2 * hair] })
    for (const side of [-1, 1]) {
      project(side * 34, -24.2, -6, p); project(side * 34, -24.2, 6, q)
      depth.line(p, q, hair * 0.85, 0.36)
    }
    for (const f of FORMS) face(project, f.corners, f.normal, turn, hair, (f.half === 0 ? 1 : -1) * gap, f.rim ? 0.82 : 0.42)

    if (poured > 0.002) {
      // The casting fills the exact stepped profile of the cavity. Its top
      // is a physical section, and its side normals follow each taper.
      for (const { directions, bands } of CASTING) {
        for (const band of bands) {
          const lo = band.lo, hi = Math.min(level, band.hi)
          if (lo >= hi) continue
          place(material[0]!, directions[0], lo); place(material[1]!, directions[0], hi)
          place(material[2]!, directions[1], hi); place(material[3]!, directions[1], lo)
          face(project, material, band.normal, turn, hair, 0, 0.68, 'c1')
        }
      }
      xy.length = 0
      let z = 0
      for (const { directions } of CASTING) { place(material[0]!, directions[0], level); project(...material[0]!, p); xy.push(p.x, p.y); z += p.z / 8 }
      depth.face(xy, z + 0.03, lambert(...turn(0, 1, 0)))
      depth.path(xy, z + 0.045, { width: hair, alpha: 0.9, closed: true, tone: 'c1' })
      // A short level rim is the only accent, most visible through the
      // cutaway while the pour rises and again as the formwork releases.
      place(material[0]!, CASTING[3]!.directions[0], level); place(material[1]!, CASTING[4]!.directions[0], level)
      material[0]![1] += 0.1; material[1]![1] += 0.1
      project(...material[0]!, p); project(...material[1]!, q)
      depth.line(p, q, hair * 1.4, 0.88 * Math.sin(Math.PI * clamp(poured / 1.2)), 'accent')
    }
    depth.flush(pen)
  },
}
/* Color: the poured material is edged in `c1`, its rising level
 * and its bands, inside the ink formwork; the level rim stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Registered split formwork exposes a rising profiled casting and releases it after setting. */
export function LoaderCast(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
