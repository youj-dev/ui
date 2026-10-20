'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, lambert, mix, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'ogive', title: 'Ogive', category: 'geometry', technique: 'mixed',
  tags: ['vault', 'architecture', 'groin', 'shell', 'ribs', 'construction'],
  description: 'Four diagonal groins erect above a square footing and meet at one crown. Perimeter arches join the springings, curved shell courses infill two wings of the intersecting barrel vault, and a crown witness closes before the shell and ribs dismantle.',
  order: 57,
  colors: [{ part: 'Courses', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const R = 23, SPRING = -18, RISE = 31
interface Course { wing: number; a: number; b: number; rank: number }
const PLANS = [6, 10, 14].map(n => Array.from({ length: 4 * n }, (_, i): Course => {
  const row = i % n
  return { wing: Math.floor(i / n), a: -Math.PI / 2 + Math.PI * row / n, b: -Math.PI / 2 + Math.PI * (row + 1) / n, rank: Math.min(row, n - 1 - row) / n }
}))
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = [], p = point(), q = point(), depth = new Depth()
function surface(out: V3, wing: number, angle: number, across: number) {
  const s = R * Math.sin(angle), side = wing % 2 ? -1 : 1
  const v = side * mix(R, Math.abs(s), across)
  out[0] = wing < 2 ? v : s
  out[1] = SPRING + RISE * Math.cos(angle)
  out[2] = wing < 2 ? s : v
}

export const scene: Scene = {
  beats: 6, still: 0.64,
  draw(pen, t, view) {
    const small = view.size < 32, hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.52, pitch: -0.48 }
    const project = camera({ ...pose, distance: 380, cx: view.w / 2, cy: 54 })
    const turn = orient(pose)
    const courses = PLANS[small ? 0 : view.size < 80 ? 1 : 2]!
    const samples = small ? 9 : 18
    const rib = (sx: number, sz: number, progress: number, alpha: number, width: number) => {
      for (let j = 0; j < samples; j += 3) {
        xy.length = 0
        let z = 0, scale = 0
        for (let s = 0; s <= 3; s++) {
          const a = Math.PI / 2 * (1 - progress * (j + s) / samples)
          project(sx * R * Math.sin(a), SPRING + RISE * Math.cos(a), sz * R * Math.sin(a), p)
          xy.push(p.x, p.y); z += p.z / 4; scale += p.k / 4
        }
        depth.path(xy, z, { width: width * scale, alpha: alpha * clamp(0.8 + z / 80, 0.45, 1), cap: 'round', join: 'round' })
      }
    }
    // A square plan and four short springing posts ground the ribs. Their
    // feet remain present while the superstructure is being assembled.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      project(sx * R, SPRING - 5, sz * R, p); project(sx * R, SPRING, sz * R, q)
      depth.line(p, q, hair * 2, 0.72)
      project(sx * (R - 3), SPRING - 5, sz * R, p); project(sx * (R + 3), SPRING - 5, sz * R, q); depth.line(p, q, hair, 0.48)
      if (!small) { project(sx * R, SPRING - 5, sz * (R - 3), p); project(sx * R, SPRING - 5, sz * (R + 3), q); depth.line(p, q, hair * 0.7, 0.38) }
    }
    for (let wing = 0; wing < 4; wing++) {
      const side = wing % 2 ? -1 : 1
      project(wing < 2 ? side * R : -R, SPRING - 5, wing < 2 ? -R : side * R, p)
      project(wing < 2 ? side * R : R, SPRING - 5, wing < 2 ? R : side * R, q)
      depth.path([p.x, p.y, q.x, q.y], -100, { width: hair * 0.65, alpha: 0.2, dash: small ? undefined : [3 * hair, 2 * hair] })
      const on = view.ease.standard(span(t, 0.13 + wing * 0.025, 0.34 + wing * 0.025)) * (1 - view.ease.exit(span(t, 0.82, 0.95)))
      // Each perimeter arch grows inward from both springings, so no
      // unsupported stroke appears at the crown before its legs reach it.
      for (const sign of [-1, 1]) for (let j = 0; j < samples; j += 3) {
        xy.length = 0
        let z = 0
        for (let s = 0; s <= 3; s++) {
          const a = sign * Math.PI / 2 * (1 - on * (j + s) / samples)
          surface(quad[0]!, wing, a, 0); project(...quad[0]!, p)
          xy.push(p.x, p.y); z += p.z / 4
        }
        if (on > 0.004) depth.path(xy, z, { width: hair * 1.15, alpha: 0.73 * clamp(on / 0.15), cap: 'round', join: 'round', tone: blend('ink', 'c1', 0.5) })
      }
    }
    for (const course of courses) {
      const { wing, a, b, rank } = course
      const on = view.ease.standard(span(t, 0.33 + rank * 0.37 + wing * 0.012, 0.43 + rank * 0.37 + wing * 0.012))
      const off = view.ease.exit(span(t, 0.71 + (0.5 - rank) * 0.14, 0.81 + (0.5 - rank) * 0.14))
      const fit = on * (1 - off)
      if (fit <= 0.004) continue
      surface(quad[0]!, wing, a, 0); surface(quad[1]!, wing, b, 0)
      surface(quad[2]!, wing, b, fit); surface(quad[3]!, wing, a, fit)
      xy.length = 0
      let key = 0
      for (const v of quad) { project(...v, p); xy.push(p.x, p.y); key += p.z / 4 }
      // Two wings stay cut away. The remaining thin barrel surfaces are
      // lit on either side, exposing both the arch and its hollow interior.
      if (wing === 0 || wing === 3) {
        const angle = (a + b) / 2
        const normal = turn(wing < 2 ? 0 : RISE * Math.sin(angle), R * Math.cos(angle), wing < 2 ? RISE * Math.sin(angle) : 0)
        const sign = normal[2] >= 0 ? 1 : -1
        depth.face(xy, key, lambert(normal[0] * sign, normal[1] * sign, normal[2] * sign) * (sign > 0 ? 1 : 0.82))
        depth.path(xy, key + 0.02, { width: hair * 0.55, alpha: 0.38, closed: true })
      } else {
        project(...quad[0]!, p); project(...quad[3]!, q); depth.line(p, q, hair * 0.7, 0.52 * fit)
        if (!small) {
          surface(quad[0]!, wing, (a + b) / 2, 0); surface(quad[1]!, wing, (a + b) / 2, fit)
          project(...quad[0]!, p); project(...quad[1]!, q); depth.line(p, q, hair * 0.5, 0.25 * fit)
        }
      }
    }
    let index = 0
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      rib(sx, sz, 1, 0.12, hair * 0.65)
      const on = view.ease.standard(span(t, 0.025 + index * 0.023, 0.24 + index * 0.023)) * (1 - view.ease.exit(span(t, 0.84 + index * 0.01, 0.945 + index * 0.01)))
      if (on > 0.004) rib(sx, sz, on, 0.93, hair * 1.6)
      index++
    }
    const witness = view.ease.standard(span(t, 0.61, 0.67)) * (1 - view.ease.exit(span(t, 0.69, 0.735)))
    if (witness > 0.004) {
      const a = 0.19 * witness
      project(-R * Math.sin(a), SPRING + RISE * Math.cos(a), -R * Math.sin(a), p)
      project(0, SPRING + RISE, 0, q); depth.line(p, q, hair * 1.6, witness, 'accent')
      project(R * Math.sin(a), SPRING + RISE * Math.cos(a), R * Math.sin(a), p); depth.line(q, p, hair * 1.6, witness, 'accent')
    }
    depth.flush(pen)
  },
}
/* Color: the shell courses filling the wings lean toward `c1`
 * against the ink groins and arches; the crown witnesses stay the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Diagonal groins and barrel wings erect a square, partly cut-away vault. */
export function LoaderOgive(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
