'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, mix, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, bond, brightness, pens, stick, type V3 } from './matter'

export const meta = {
  id: 'kekule', title: 'Kekule', category: 'science', technique: 'lines',
  tags: ['benzene', 'aromatic', 'resonance', 'delocalization', 'chemical structure', '3d'],
  description: 'A lit benzene ring rocks in perspective while its two Kekulé drawings trade places: the alternating double bonds fade through one delocalized inner ring, with the pi clouds above and below it, and back. One accent electron pair slides from bond to bond as the structures turn over.',
  order: 9,
  colors: [{ part: 'Delocalized', mono: 'ink' }],
} satisfies LoaderMeta

/* Benzene in ball and stick: six carbons on sticks, each with its hydrogen.
 * Its two Kekulé structures (double bonds on alternate sides) and the
 * delocalized picture between them cross-fade on a circle, so one is always
 * giving way to the next: structure A, the inner ring (with the pi clouds
 * dashed above and below the plane at larger sizes), structure B, the ring,
 * and A again. The accent is one electron pair: a double bond in A, the arc
 * of the ring it spreads along, the neighbouring double bond in B, and back.
 * The ring rocks slowly so its plane, and the clouds off it, read in depth.
 *
 * Color: the delocalized picture leans toward `c1`: the inner ring halfway and the pi clouds fully, there while the double bonds fade through it; its arc stays the accent. */

const R = 25
const CARBONS: V3[] = Array.from({ length: 6 }, (_, i) => [R * Math.cos((i / 6) * TAU + Math.PI / 6), 0, R * Math.sin((i / 6) * TAU + Math.PI / 6)])
const HYDROGENS: V3[] = CARBONS.map(([x, y, z]) => [x * 1.44, y, z * 1.44])
/** A double bond's second stroke: inside the ring, a little shorter than the bond. */
const INNER = Array.from({ length: 6 }, (_, i) => {
  const a = CARBONS[i]!
  const b = CARBONS[(i + 1) % 6]!
  const s = 0.76
  const lo: V3 = [mix(a[0], b[0], 0.16) * s, 0, mix(a[2], b[2], 0.16) * s]
  const hi: V3 = [mix(a[0], b[0], 0.84) * s, 0, mix(a[2], b[2], 0.84) * s]
  return [lo, hi] as const
})
const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

/** A circle of radius r in the plane y = h, from angle a0 to a1, as one dashed or solid path. */
function arc(project: ReturnType<typeof camera>, r: number, h: number, a0: number, a1: number, samples: number) {
  xy.length = 0
  let z = 0
  for (let i = 0; i <= samples; i++) {
    const a = mix(a0, a1, i / samples)
    project(r * Math.cos(a), h, r * Math.sin(a), p)
    xy.push(p.x, p.y)
    z += p.z / (samples + 1)
  }
  return z
}

export const scene: Scene = {
  beats: 5.25,
  still: 0.2,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const { hair } = pens(view)
    const project = camera({ yaw: 0.45 + 0.28 * Math.sin(TAU * t), pitch: -0.86 + 0.1 * Math.cos(TAU * t), roll: 0.06 * Math.sin(TAU * t), distance: 250, cx: view.w / 2, cy: view.h / 2 })
    // Structure A, the ring, structure B, the ring: weights on a circle, each easing in and out of the next.
    const c = Math.cos(TAU * t)
    const s = Math.sin(TAU * t)
    const a = Math.max(0, c) ** 1.4
    const b = Math.max(0, -c) ** 1.4
    const ring = Math.abs(s) ** 1.4

    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6
      stick(depth, project, CARBONS[i]!, CARBONS[j]!, small ? 1.3 : 1.15, view)
      // The second stroke of a double bond: A doubles the even bonds, B the odd.
      const w = i % 2 ? b : a
      const accent = (i === 0 && a > 0) || (i === 1 && b > 0)
      if (w > 0.004) bond(depth, project, INNER[i]![0], INNER[i]![1], hair * 1.9, w, accent ? 'accent' : 'ink', 1, 3)
      if (!small) stick(depth, project, CARBONS[i]!, HYDROGENS[i]!, 0.85, view)
      atom(depth, project, CARBONS[i]!, small ? 4.2 : 3.8, view)
      if (!small) atom(depth, project, HYDROGENS[i]!, 2.4, view)
    }

    // The delocalized picture: one inner ring, its accent arc where the pair spreads between bonds 0 and 1.
    if (ring > 0.004) {
      const r = R * 0.62
      const from = (0.5 / 6) * TAU + Math.PI / 6
      const to = (1.5 / 6) * TAU + Math.PI / 6
      const z1 = arc(project, r, 0, to, from + TAU, small ? 30 : 60)
      depth.path(xy, z1, { width: hair * 1.25, alpha: 0.85 * ring * brightness(z1), join: 'round', tone: blend('ink', 'c1', 0.55) })
      const z2 = arc(project, r, 0.05, from, to, 12)
      depth.path(xy, z2 + 0.01, { width: hair * 1.6, alpha: ring, tone: 'accent', cap: 'round', join: 'round' })
      if (large) {
        // The pi clouds above and below the plane, dashed.
        for (const h of [-7, 7]) {
          const z = arc(project, R * 0.86, h, 0, TAU, 72)
          depth.path(xy, z, { width: hair * 0.9, alpha: 0.45 * ring * brightness(z), dash: [3 * hair, 2.5 * hair], join: 'round', tone: 'c1' })
        }
      }
    }
    if (large) {
      // The ring's six-fold axis, ruled through its centre.
      project(0, -17, 0, p)
      project(0, 17, 0, q)
      depth.path([p.x, p.y, q.x, q.y], -40, { width: hair * 0.8, alpha: 0.3, dash: [6 * hair, 2.5 * hair, 1.5 * hair, 2.5 * hair] })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An aromatic framework exchanges bond emphasis through a shared inner contour. */
export function LoaderKekule(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
