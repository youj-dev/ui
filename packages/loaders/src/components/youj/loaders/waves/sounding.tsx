'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { block, brightness, cylinder, detail, edge, hairline, packet, ruler, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'sounding',
  title: 'Sounding',
  category: 'waves',
  technique: 'lines',
  tags: ['seismic', 'compression', 'shear', 'p-wave', 's-wave', 'strata', '3d'],
  description: 'A hammer strikes an anvil post at the head of two cut ribbons of layered ground. A fast longitudinal packet bunches the upper ribbon’s rulings; the slower transverse packet heaves the lower ribbon, its lit surface tilting as it passes, and both settle as the hammer rises for the next blow.',
  order: 7,
  colors: [{ part: 'Moving ground', mono: 'ink' }],
} satisfies LoaderMeta

/* Two bars of layered ground, cut so their front faces show the strata and
 * a ruling every few units, run from an anvil post on the left. Once a
 * loop the hammer drops on the post (accelerating, `exit`), rebounds and is
 * hauled back up. The blow sends a compression packet down the upper bar
 * at the P speed, sliding its rulings together and apart (the accent marks
 * its leading front), and a shear packet down the lower bar at the slower
 * S speed (P/√3), lifting and dropping the whole section so its top surface
 * tilts toward and away from the light. Each packet enters from the post
 * as the hammer lands and has left the far end before the next blow, while
 * a faint ringing coda trails the P packet, so the ground is never still.
 *
 * Color: each ruling on the cut face warms toward `c1` while a packet moves it and settles to the ink behind; the P front stays the accent. */

const LEFT = -31
const RIGHT = 31
const DEPTH = 6
/** Packet centres enter from one packet width before the post and leave one width past the far end. */
const WIDTH = 10
const P_SPEED = (RIGHT - LEFT + 2 * WIDTH) / 0.5
const S_SPEED = P_SPEED / Math.sqrt(3)
const STRATA = [0, 2.2, 4.2, 7]
const LEVELS = [9, 13, 19].map((columns) => ({ columns, samples: 48 }))
const face: number[] = []
const top: V3[] = Array.from({ length: 49 }, () => [0, 0, 0])
const strip = Array.from({ length: 4 }, () => point())
const p = point()
const q = point()
const depth = new Depth()

/** The P packet's longitudinal displacement at x (a compression and rarefaction pair), plus its decaying coda. */
function along(x: number, u: number) {
  const d = x - (LEFT - WIDTH + P_SPEED * u)
  const coda = 0.35 * Math.exp(-u / 0.22) * (1 - u) * Math.sin(TAU * (d / 9)) * clamp(-d / 30) * clamp((x - LEFT) / 6)
  return 4.6 * packet(d, WIDTH) * Math.sin((Math.PI * d) / WIDTH) + coda
}
/** The S packet's vertical displacement at x. */
const heave = (x: number, u: number) => {
  const d = x - (LEFT - WIDTH + S_SPEED * u)
  return 4.4 * packet(d, WIDTH) * Math.sin((Math.PI * d) / WIDTH)
}

export const scene: Scene = {
  beats: 5.5,
  still: 0.3,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const { columns, samples } = LEVELS[lod]!
    const hair = hairline(view)
    const yaw = -0.3 + 0.05 * Math.sin(TAU * u)
    const pitch = -0.3
    const project = camera({ yaw, pitch, distance: 290, cx: view.w / 2 + 3, cy: 52 })
    const turn = orient({ yaw, pitch })
    const frontN = turn(0, 0, 1)
    const frontLight = lambert(...frontN)

    for (let bar = 0; bar < 2; bar++) {
      const base = bar === 0 ? 7.5 : -15.5
      const shear = bar === 1
      const dy = (x: number) => (shear ? heave(x, u) : 0)
      const dx = (x: number) => (shear ? 0 : along(x, u))

      // The top surface: one flat-lit fill, then strips lit by their slope only where the ground tilts
      // (the fill beneath keeps their shared edges from showing).
      const h = STRATA[STRATA.length - 1]!
      face.length = 0
      let tz = 0
      for (let i = 0; i <= samples; i++) {
        const x = LEFT + ((RIGHT - LEFT) * i) / samples
        project(x, base + h + dy(x), -DEPTH, p)
        face.push(p.x, p.y)
        tz += p.z / (2 * samples + 2)
      }
      for (let i = samples; i >= 0; i--) {
        const x = LEFT + ((RIGHT - LEFT) * i) / samples
        project(x, base + h + dy(x), DEPTH, p)
        face.push(p.x, p.y)
        tz += p.z / (2 * samples + 2)
      }
      depth.face(face, tz, lambert(...turn(0, 1, 0)))
      for (let i = 0; i < samples; i++) {
        const x0 = LEFT + ((RIGHT - LEFT) * i) / samples
        const x1 = LEFT + ((RIGHT - LEFT) * (i + 1)) / samples
        const y0 = base + h + dy(x0)
        const y1 = base + h + dy(x1)
        if (Math.abs(y1 - y0) < 0.004) continue
        project(x0, y0, -DEPTH, strip[0]!)
        project(x1, y1, -DEPTH, strip[1]!)
        project(x1, y1, DEPTH, strip[2]!)
        project(x0, y0, DEPTH, strip[3]!)
        const n = turn(-(y1 - y0) / (x1 - x0), 1, 0)
        face.length = 0
        for (const c of strip) face.push(c.x, c.y)
        depth.face(face, tz + 0.01, lambert(...n))
      }
      // The cut front face: one fill between the heaving top and bottom edges.
      face.length = 0
      let fz = 0
      for (let i = 0; i <= samples; i++) {
        const x = LEFT + ((RIGHT - LEFT) * i) / samples
        project(x, base + h + dy(x), DEPTH, p)
        face.push(p.x, p.y)
        fz += p.z / (2 * samples + 2)
      }
      for (let i = samples; i >= 0; i--) {
        const x = LEFT + ((RIGHT - LEFT) * i) / samples
        project(x, base + dy(x), DEPTH, p)
        face.push(p.x, p.y)
        fz += p.z / (2 * samples + 2)
      }
      depth.face(face, fz, frontLight * 0.92)
      depth.path(face, fz + 0.01, { width: hair * 0.9, alpha: 0.75 * brightness(fz), closed: true, join: 'round' })
      // The far end's cut face, so each bar reads as a solid section.
      const endN = turn(1, 0, 0)
      if (endN[2] > 0) {
        face.length = 0
        let ez = 0
        for (const [y, z] of [[base, DEPTH], [base, -DEPTH], [base + h, -DEPTH], [base + h, DEPTH]] as const) {
          project(RIGHT, y + dy(RIGHT), z, p)
          face.push(p.x, p.y)
          ez += p.z / 4
        }
        depth.face(face, ez, lambert(...endN))
        depth.path(face, ez + 0.01, { width: hair * 0.85, alpha: 0.6 * brightness(ez), closed: true })
      }
      // Strata lines along the cut face.
      for (let s = 1; s < STRATA.length - 1; s++) {
        for (let i = 0; i <= 48; i++) {
          const x = LEFT + ((RIGHT - LEFT) * i) / 48
          const v = top[i]!
          v[0] = x
          v[1] = base + STRATA[s]! + dy(x)
          v[2] = DEPTH + 0.05
        }
        wire(depth, project, top, hair * 0.75, 0.42, 'ink', 48)
      }
      // The rulings: material columns on the cut face, bunching (P) or heaving (S) with the ground.
      for (let i = 1; i < columns; i++) {
        const x = LEFT + ((RIGHT - LEFT) * i) / columns
        const xx = x + dx(x)
        project(xx, base + dy(x) + 0.3, DEPTH + 0.06, p)
        project(xx, base + h + dy(x) - 0.3, DEPTH + 0.06, q)
        p.z = q.z = fz + 0.03
        // A ruling warms toward its color as the packet passing through it moves it.
        depth.line(p, q, hair * 0.85, 0.7 * brightness(p.z), blend('ink', 'c1', clamp(Math.abs(dx(x) + dy(x)) / 3.2)))
      }
      // The P packet's leading front, in the accent, while it's in the bar.
      if (!shear) {
        const lead = LEFT - WIDTH + P_SPEED * u + WIDTH * 0.5
        const show = clamp((lead - LEFT) / 4) * clamp((RIGHT - lead) / 4)
        if (show > 0.004) {
          project(lead + dx(lead), base - 0.5, DEPTH + 0.1, p)
          project(lead + dx(lead), base + h + 1.2, DEPTH + 0.1, q)
          p.z = q.z = fz + 0.05
          depth.line(p, q, hair * 1.5, show, 'accent')
        }
      }
      // A geophone on the far end of each bar.
      cylinder(depth, project, turn, [RIGHT - 4, base + h + dy(RIGHT - 4), 1.5], 'y', 1.5, 2.2, lod === 0 ? 8 : 12, hair * 0.8)
    }

    // The anvil post both bars run from, and the hammer: dropped (accelerating) onto it at the seam, rebounding, hauled up.
    block(depth, project, turn, [LEFT - 2.6, -0.5, 0], [2.6, 16.5, DEPTH + 1.2], hair * 0.85, 'ink', { bevel: lod === 2 ? 0.8 : 0 })
    const lift = u < 0.12 ? view.ease.enter(span(u, 0, 0.12)) * 0.35 : u < 0.8 ? 0.35 + 0.65 * view.ease.standard(span(u, 0.12, 0.8)) : 1 - view.ease.exit(span(u, 0.8, 1))
    const hy = 16 + 9 * lift
    block(depth, project, turn, [LEFT - 2.6, hy + 2.2, 0], [3.6, 2.2, 3.6], hair * 0.85, 'ink', { bevel: lod === 2 ? 0.7 : 0 })
    edge(depth, project, [LEFT - 2.6, hy + 4.4, 0], [LEFT - 2.6, 33, 0], hair * 1.1, 0.6)
    if (lod > 0) ruler(depth, project, [LEFT, -18.5, DEPTH], [RIGHT, -18.5, DEPTH], 12, 3, [0, -1, 0], 1.2, hair * 0.75, 0.42)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A leading compression wave and a slower shear wave cross two exposed ground ribbons. */
export function LoaderSounding(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
