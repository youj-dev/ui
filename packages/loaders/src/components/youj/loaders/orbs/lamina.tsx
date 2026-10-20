'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, face, hairline, lod, type V3 } from './sphere'

export const meta = {
  id: 'lamina', title: 'Lamina', category: 'orbs', technique: 'planes',
  tags: ['sphere', 'slices', 'tomography', 'stack', 'section'],
  description: 'A sphere separates into horizontal laminae in a rising wave. Each cut face shows the section of the core inside, fine registration pins bridge the gaps as the slices sway, and the slices settle back into one spherical envelope.',
  order: 2,
  colors: [{ part: 'Sections', mono: 'ink' }],
} satisfies LoaderMeta

/* Real slices of a sphere: each lamina is a zone between two cuts, its wall
 * following the sphere's curve (so the closed stack is a sphere, not a
 * stack of drums), its top a lit cut face. A core sits inside the sphere,
 * and every cut face that passes through it shows the core's section as a
 * ring, the middle one in the accent: what a tomograph shows. The slices
 * lift apart from the bottom up (`emphasized`, a little later each), drift
 * sideways in a slow wave while apart, pinned to their neighbours by fine
 * registration stems, and sink back from the top down (`standard`).
 *
 * Color: the core’s section outlines on the cut faces lean toward `c1`, and the registration pins across the gaps take it; the middle section stays the accent. */

const R = 25
const CORE = 13
const levels = [4, 6, 8].map((count) => ({
  count,
  cuts: Array.from({ length: count + 1 }, (_, i) => -R + (2 * R * i) / count),
  zmin: Array.from({ length: count }, () => 0),
}))
const ring: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const depth = new Depth()
const p = point()
const q = point()
const cap: number[] = []

export const scene: Scene = {
  beats: 5.5, still: 0.34,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view)
    const small = level === 0
    const { count, cuts, zmin } = levels[level]!
    const circle = circles[level === 2 ? 1 : 0]!
    const sides = circle.length - 1
    const hair = hairline(view)
    const pose = { yaw: 0.22 + 0.16 * Math.sin(TAU * t), pitch: -0.5 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const sub = small ? 1 : 2
    const lifts: number[] = []
    const shifts: number[] = []
    const sways: number[] = []
    // Each cut opens in turn from the bottom up, the middle one widest, so its section shows whole.
    let rise = 0
    for (let i = 0; i < count; i++) {
      shifts.push(rise)
      if (i === count - 1) break
      const lag = (i / (count - 2 || 1)) * 0.12
      const open = view.ease.emphasized(span(t, 0.05 + lag, 0.33 + lag)) - view.ease.standard(span(t, 0.66 - lag * 0.6, 0.94 - lag * 0.6))
      lifts.push(open)
      rise += open * (i === Math.floor((count - 2) / 2) ? 10 : 5)
    }
    for (let i = 0; i < count; i++) {
      shifts[i]! -= rise / 2
      // Apart, the slices drift on a slow wave, each pinned to the next.
      const apart = Math.max(lifts[i - 1] ?? 0, lifts[i] ?? 0)
      sways.push(apart * 2.6 * Math.sin(TAU * t + i * 0.9))
    }
    // How far forward each slice's nearest wall comes: a cut face sorts behind every slice above it.
    for (let i = 0; i < count; i++) {
      project(sways[i]!, shifts[i]! + (cuts[i]! + cuts[i + 1]!) / 2, 0, p)
      zmin[i] = p.z - R
    }
    const radius = (y: number) => Math.sqrt(Math.max(0, R * R - y * y))
    for (let i = 0; i < count; i++) {
      const lo = cuts[i]!
      const hi = cuts[i + 1]!
      const dx = sways[i]!
      const dy = shifts[i]!
      // The wall: a zone of the sphere, in `sub` bands so its curve shows.
      for (let b = 0; b < sub; b++) {
        const ya = lo + ((hi - lo) * b) / sub
        const yb = lo + ((hi - lo) * (b + 1)) / sub
        const ra = radius(ya)
        const rb = radius(yb)
        for (let j = 0; j < sides; j++) {
          const [ca, sa] = circle[j]!
          const [cb, sb] = circle[j + 1]!
          ring[0]![0] = dx + ra * ca; ring[0]![1] = dy + ya; ring[0]![2] = ra * sa
          ring[1]![0] = dx + rb * ca; ring[1]![1] = dy + yb; ring[1]![2] = rb * sa
          ring[2]![0] = dx + rb * cb; ring[2]![1] = dy + yb; ring[2]![2] = rb * sb
          ring[3]![0] = dx + ra * cb; ring[3]![1] = dy + ya; ring[3]![2] = ra * sb
          face(depth, project, turn, ring)
        }
      }
      // The cut face on top (the top slice's is the pole: nothing to show), with the core's section in it.
      if (i === count - 1) continue
      const r = radius(hi)
      cap.length = 0
      let z = 0
      for (let j = 0; j < sides; j++) {
        const [c, s] = circle[j]!
        project(dx + r * c, dy + hi, r * s, p)
        cap.push(p.x, p.y)
        z += p.z / sides
      }
      let below = Infinity
      for (let j = i + 1; j < count; j++) below = Math.min(below, zmin[j]!)
      z = Math.min(z, below - 0.1)
      depth.face(cap, z, lambert(...turn(0, 1, 0)))
      depth.path(cap, z + 0.01, { width: hair * 0.85, alpha: 0.7, closed: true, join: 'round' })
      const core = Math.sqrt(Math.max(0, CORE * CORE - hi * hi))
      if (core > 0.5 && !small) {
        cap.length = 0
        for (let j = 0; j < sides; j++) {
          const [c, s] = circle[j]!
          project(dx + core * c, dy + hi + 0.02, core * s, p)
          cap.push(p.x, p.y)
        }
        const middle = i === Math.floor((count - 2) / 2)
        depth.poly(cap, z + 0.02, 0.07)
        depth.path(cap, z + 0.03, { width: hair * (middle ? 1.25 : 0.8), alpha: middle ? 1 : 0.55, closed: true, join: 'round', tone: middle ? 'accent' : blend('ink', 'c1', 0.55) })
      }
      // Registration pins across the gap to the next slice, there only while the gap is open.
      const gap = lifts[i]!
      if (gap > 0.02 && !small) {
        for (const sign of [-1, 1]) {
          const x = sign * 0.62 * radius(hi)
          project(dx + x, dy + hi, 0, p)
          project(sways[i + 1]! + x, shifts[i + 1]! + hi, 0, q)
          p.z = q.z = z + 0.05
          depth.line(p, q, hair * 0.7, 0.6 * span(gap, 0.02, 0.25), 'c1')
          depth.dot(p, 0.8 / view.px, 0.8 * span(gap, 0.02, 0.25), 'c1')
        }
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A sphere separates into curved laminae whose cut faces show its core, and closes again. */
export function LoaderLamina(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
