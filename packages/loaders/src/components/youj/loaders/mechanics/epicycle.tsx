'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, lambert, orient, projectPath, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { disc, part, pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'epicycle', title: 'Epicycle', category: 'mechanics', technique: 'mixed',
  tags: ['planetary', 'gearbox', 'carrier', 'transmission', 'annulus', 'kinematics'],
  description: 'Three planets roll between a driven sun and a fixed internal ring. A spider carrier turns once a loop in three swelling strokes that never stop, while the sun turns four times and each planet counterturns twice; the accent arm follows the carrier.',
  order: 30,
  colors: [{ part: 'Planets', mono: 'ink' }],
} satisfies LoaderMeta

// Pitch radii 10:10:30, tooth counts 12:12:36. With the annulus fixed,
// Willis gives sun = 4 × carrier and planet = -2 × carrier. The planet
// phase seats a crest opposite a root at both contacts simultaneously.
const TOOTH = [[0.18, -0.9], [0.32, 0.9], [0.56, 0.9], [0.7, -0.9]] as const
const GEARS = Array.from({ length: 4 }, () => Array.from({ length: 48 }, () => [0, 0, 0] as V3))
const HOLES = Array.from({ length: 4 }, () => Array.from({ length: 3 }, (): V3[] => []))
const RING_TOOTH = [[0, 0.9], [0.32, -0.9], [0.56, -0.9], [0.7, 0.9]] as const
const RING = Array.from({ length: 144 }, (_, i) => {
  const [u, dr] = RING_TOOTH[i % 4]!
  return { a: TAU * (Math.floor(i / 4) + u) / 36, r: 30 + dr }
})
const sector: V3[] = []
const boss: V3[] = []
const arm: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const lug: V3[] = Array.from({ length: 6 }, () => [0, 0, 0])
const xy: number[] = []
const depth = new Depth()

/** A carrier arm: a lit bar from the hub to a planet's pin, its top and the side toward the viewer.
 *
 * Color: the three planets are edged in `c1`, the sun and the ring in the ink; one spoke of the carrier stays the accent. */
function spoke(project: Project, turn: Turn, a: number, from: number, to: number, z: number, half: number, hair: number, tone: 'ink' | 'accent') {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const put = (k: number, r: number, w: number, h: number) => {
    arm[k]![0] = r * c - w * s
    arm[k]![1] = r * s + w * c
    arm[k]![2] = h
  }
  for (const side of [-1, 1]) {
    const n = turn(-s * side, c * side, 0)
    if (n[2] <= 0) continue
    put(0, from, side * half, z)
    put(1, to, side * half, z)
    put(2, to, side * half, z - 1.4)
    put(3, from, side * half, z - 1.4)
    const f = projectPath(arm, project, xy)
    depth.face(f.xy, f.z + 40, lambert(...n))
  }
  put(0, from, -half, z)
  put(1, to, -half, z)
  put(2, to, half, z)
  put(3, from, half, z)
  const f = projectPath(arm, project, xy)
  depth.face(f.xy, 41, lambert(...turn(0, 0, 1)))
  depth.path(f.xy, 41.01, { width: hair * 0.85, alpha: 0.8, closed: true, join: 'round' })
  if (tone === 'accent') {
    // The marked arm carries an accent inlay down its length.
    put(0, from + 2.4, 0, z + 0.05)
    put(1, to - 2.6, 0, z + 0.05)
    const inlay = projectPath(arm.slice(0, 2), project, xy)
    depth.path(inlay.xy, 41.02, { width: hair * 1.6, alpha: 1, tone: 'accent', cap: 'round' })
  }
}

export const scene: Scene = {
  beats: 5.8, still: 0.29,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.28 + (small ? 0 : 0.05) * Math.sin(TAU * t), pitch: -0.48 }
    const project = camera({ ...pose, distance: 260, cx: view.w / 2, cy: 48 })
    const turn = orient(pose)
    // One carrier turn a loop in three strokes that swell and ease without stopping (1 − k·cos).
    const angle = TAU * (t - (0.7 * Math.sin(3 * TAU * t)) / (3 * TAU))

    // A rim with a real open bore, rather than a disc painted over the gears.
    // Everything else stands in front of the ring's plane, so it sorts
    // beneath them all: its face a tooth's width at a time, and behind that
    // the same ring 5 units deeper, one fill whose rim and bore show round
    // the face's edges as the outer and inner walls.
    const segments = small ? 36 : RING.length
    const per = segments / 36
    const inner = (i: number, z: number): V3 => {
      const a = small ? TAU * i / segments : i === segments ? TAU : RING[i % segments]!.a
      const r = small ? 30 : RING[i % segments]!.r
      return [r * Math.cos(a), r * Math.sin(a), z]
    }
    for (let k = 0; k < 36; k++) {
      sector.length = 0
      for (let i = k * per; i <= (k + 1) * per; i++) sector.push(inner(i, -1))
      const a0 = TAU * k / 36
      const a1 = TAU * (k + 1) / 36
      sector.push([35 * Math.cos(a1), 35 * Math.sin(a1), -1], [35 * Math.cos(a0), 35 * Math.sin(a0), -1])
      const path = projectPath(sector, project, xy)
      depth.face(path.xy, -40 + k * 0.001, lambert(...turn(0, 0, 1)) * 0.8)
    }
    sector.length = 0
    for (let k = 0; k <= 36; k++) sector.push([35 * Math.cos(TAU * k / 36), 35 * Math.sin(TAU * k / 36), -6])
    for (let i = segments; i >= 0; i--) sector.push(inner(i, -6))
    const back = projectPath(sector, project, xy)
    depth.face(back.xy, -41, lambert(...turn(0, -1, 0.25)))
    // The ring's rim, and three mounting lugs bolted down outside it.
    const rim = projectPath(disc(0, 0, -1, 35, 72, boss), project, xy)
    depth.path(rim.xy, -39.9, { width: hair, alpha: 0.72, closed: true, join: 'round' })
    if (!small) {
      for (let i = 0; i < 3; i++) {
        const a = TAU * (i + 0.5) / 3 + 0.2
        const c = Math.cos(a)
        const s = Math.sin(a)
        const pts = [[34, -4.5], [39.5, -3], [41, 0], [39.5, 3], [34, 4.5]] as const
        pts.forEach(([r, w], k) => {
          lug[k]![0] = r * c - w * s
          lug[k]![1] = r * s + w * c
          lug[k]![2] = -1
        })
        const layer = part(depth, project, turn, lug.slice(0, 5), [], 2.2, hair * 0.85)
        pin(depth, project, turn, 38.4 * c, 38.4 * s, -0.9, 1.25, hair * 0.75, 'ink', layer)
      }
    }

    // Gears sit above the fixed ring. At icon size the crests are omitted:
    // the orbital relationship, hubs and carrier carry the same story.
    const centres: [number, number][] = []
    for (let i = 0; i < 4; i++) {
      const orbit = angle + (i - 1) * TAU / 3
      const x = i ? 20 * Math.cos(orbit) : 0
      const y = i ? 20 * Math.sin(orbit) : 0
      const spin = i ? -2 * angle + TAU / 24 : 4 * angle
      const outline = small ? disc(x, y, 1, 10, 16, GEARS[i]!) : GEARS[i]!
      if (!small) {
        outline.length = 48
        for (let j = 0; j < 48; j++) {
          const tooth = TOOTH[j % 4]!
          const a = spin + TAU * (Math.floor(j / 4) + tooth[0]) / 12
          const r = 10 + tooth[1]
          const v = (outline[j] ??= [0, 0, 0])
          v[0] = x + r * Math.cos(a)
          v[1] = y + r * Math.sin(a)
          v[2] = 1
        }
      }
      // Three lightening holes through each web, turning with it, where they're big enough to see.
      const holes = view.size >= 100 ? HOLES[i]!.map((h, k) => disc(x + 5.6 * Math.cos(spin + TAU * (k + 0.5) / 3), y + 5.6 * Math.sin(spin + TAU * (k + 0.5) / 3), 1, 1.75, 9, h)) : []
      part(depth, project, turn, outline, holes, 3, hair * 0.8, 0, 0.8, undefined, true, i === 0 ? 'ink' : 'c1')
      const top = part(depth, project, turn, disc(x, y, 2.2, small ? 3 : 3.4, small ? 10 : 12, boss), [], 1.2, hair * 0.8, 0, 0.8, undefined, true)
      if (i === 0) pin(depth, project, turn, x, y, 2.3, 1.6, hair * 0.8, 'ink', top + 0.01)
      centres.push([x, y])
    }
    // The spider carrier rides above: a hub, an arm to each planet's pin (one in the accent).
    for (let i = 1; i < 4; i++) {
      const orbit = angle + (i - 1) * TAU / 3
      spoke(project, turn, orbit, 2.5, 20, 6, small ? 2.1 : 1.7, hair, i === 1 ? 'accent' : 'ink')
      const [x, y] = centres[i]!
      pin(depth, project, turn, x, y, 6.05, small ? 2.6 : 2.3, hair * 0.8, 'ink', 42 + i * 0.01)
    }
    const hub = part(depth, project, turn, disc(0, 0, 6.6, small ? 4.4 : 4.6, 24, boss), [], 2, hair * 0.85, 0, 0.85, 43, true)
    pin(depth, project, turn, 0, 0, 6.7, small ? 1.8 : 1.5, hair * 0.8, 'ink', hub + 0.01)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A fixed annulus, three rolling planets and a spider carrier transmit three measured strokes. */
export function LoaderEpicycle(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
