'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, hump, lambert, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, face, grids, hairline, lod, near, ring, surface, type V3 } from './sphere'

export const meta = {
  id: 'armature', title: 'Armature', category: 'orbs', technique: 'mixed',
  tags: ['sphere', 'lattice', 'assembly', 'cage', 'core'],
  description: 'A spherical exoskeleton assembles around a softly lit core as it slowly turns. Paired meridian ribs swing shut on their pole hubs, latitude ties seat in succession and rivet to every rib, and a short inspection arc runs round before the cage opens again.',
  order: 6,
  colors: [{ part: 'Ties', mono: 'ink' }],
} satisfies LoaderMeta

/* The ribs are flat structural bands, lit by their own normals (both faces,
 * so the inside of a far rib shows through the open cage), each pair
 * hinged on hubs at the poles. They swing shut about the polar axis
 * (`emphasized`, one a beat after another), the ties drop or rise onto them
 * and rivet where they cross each rib, the accent inspection arc runs once
 * round, and the cage opens in reverse. The whole armature turns one rib
 * spacing a loop (it looks the same after it, so the loop has no seam) and
 * the view sways, so it never stands still.
 *
 * Color: each latitude tie swings in `c1` and settles to the ink as it seats; the inspection arc stays the accent. */

const R = 31
const depth = new Depth()
const p = point()
const q = point()
const band: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const hub: number[] = []
const edge: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.4,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view)
    const small = level === 0
    const circle = circles[level]!
    const hair = hairline(view)
    const count = [3, 5, 6][level]!
    const segments = [8, 12, 16][level]!
    const pose = { yaw: 0.3 + 0.2 * Math.sin(TAU * t), pitch: -0.3 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const spin = (TAU * t) / count

    // The core, breathing a little, a belt round it turning with the cage.
    const core = grids[Math.min(level, 1)]!
    const pulse = 1 + 0.06 * view.ease.standard(hump(t))
    core.unit.forEach((v, i) => {
      const w = core.world[i]!
      w[0] = 11.5 * pulse * v[0]
      w[1] = 11.5 * pulse * v[1]
      w[2] = 11.5 * pulse * v[2]
    })
    surface(depth, project, turn, core)
    if (!small) ring(depth, project, circle, (c, s, out) => {
      out[0] = 11.7 * pulse * c
      out[1] = 0
      out[2] = 11.7 * pulse * s
    }, hair * 0.8, 0.5)

    // The ribs: paired half-meridian bands, swinging shut about the polar axis.
    const width = small ? 0 : level === 1 ? 1.6 : 1.9
    const ribs: number[] = []
    for (let rib = 0; rib < count; rib++) {
      const lag = rib * 0.014
      const close = view.ease.emphasized(span(t, 0.04 + lag, 0.3 + lag)) - view.ease.emphasized(span(t, 0.7 + lag / 2, 0.94 + lag / 2))
      const lon = spin + (TAU * rib) / count
      for (const sign of [-1, 1]) {
        const angle = lon + sign * (0.07 + 0.55 * (1 - close))
        ribs.push(angle)
        const tx = -Math.sin(angle)
        const tz = Math.cos(angle)
        for (let j = 0; j < segments; j++) {
          const a = -Math.PI / 2 + (Math.PI * j) / segments
          const b = -Math.PI / 2 + (Math.PI * (j + 1)) / segments
          if (width) {
            const w = width / 2
            const at = (lat: number, side: number, v: V3) => {
              v[0] = R * Math.cos(lat) * Math.cos(angle) + side * w * tx
              v[1] = R * Math.sin(lat)
              v[2] = R * Math.cos(lat) * Math.sin(angle) + side * w * tz
            }
            at(a, -1, band[0]!)
            at(a, 1, band[1]!)
            at(b, 1, band[2]!)
            at(b, -1, band[3]!)
            face(depth, project, turn, band, 0, 'ink', 0, true)
            // The band's lit edge, in runs of four segments that each sort at their own depth.
            if (j % 4 === 0) {
              edge.length = 0
              let z = 0
              const j1 = Math.min(segments, j + 4)
              for (let k = j; k <= j1; k++) {
                const lat = -Math.PI / 2 + (Math.PI * k) / segments
                project(R * Math.cos(lat) * Math.cos(angle) + w * tx, R * Math.sin(lat), R * Math.cos(lat) * Math.sin(angle) + w * tz, p)
                edge.push(p.x, p.y)
                z += p.z / (j1 - j + 1)
              }
              depth.path(edge, z + 0.05, { width: hair * 0.7, alpha: 0.6 * near(z), join: 'round' })
            }
          } else {
            project(R * Math.cos(a) * Math.cos(angle), R * Math.sin(a), R * Math.cos(a) * Math.sin(angle), p)
            project(R * Math.cos(b) * Math.cos(angle), R * Math.sin(b), R * Math.cos(b) * Math.sin(angle), q)
            depth.line(p, q, hair, near((p.z + q.z) / 2) * (sign === 1 ? 0.95 : 0.6))
          }
        }
      }
    }

    // The ties drop or rise onto the closed ribs and rivet to each one.
    for (const lat of small ? [-0.45, 0.45] : [-0.75, -0.35, 0.35, 0.75]) {
      const lag = (lat + 0.75) * 0.08
      const seat = view.ease.emphasized(span(t, 0.22 + lag, 0.46 + lag)) - view.ease.exit(span(t, 0.62 + lag / 2, 0.83 + lag / 2))
      const r = (R + 0.6) * Math.cos(lat)
      const y = (R + 0.6) * Math.sin(lat) + Math.sign(lat) * 7 * (1 - seat)
      for (let i0 = 0; i0 < circle.length - 1; i0 += 4) {
        edge.length = 0
        let z = 0
        const i1 = Math.min(circle.length - 1, i0 + 4)
        for (let i = i0; i <= i1; i++) {
          project(r * circle[i]![0], y, r * circle[i]![1], p)
          edge.push(p.x, p.y)
          z += p.z / (i1 - i0 + 1)
        }
        // A tie swings in tinted and settles to the ink as it seats.
        depth.path(edge, z, { width: hair * (small ? 1 : 0.95), alpha: clamp(seat * 1.4) * near(z), join: 'round', tone: blend('c1', 'ink', clamp((seat - 0.55) / 0.45)) })
      }
      if (!small && seat > 0.01) {
        const riveted = span(seat, 0.85, 1)
        for (const angle of ribs) {
          project((R + 1.1) * Math.cos(lat) * Math.cos(angle), (R + 1.1) * Math.sin(lat), (R + 1.1) * Math.cos(lat) * Math.sin(angle), p)
          depth.dot(p, (level === 2 ? 1.25 : 1) / view.px, riveted * 0.95 * near(p.z))
        }
      }
    }

    // The hubs the ribs hinge on, and the polar axis through them.
    for (const sign of [-1, 1]) {
      hub.length = 0
      let z = 0
      const hr = small ? 3 : 3.6
      for (let i = 0; i < circle.length - 1; i++) {
        project(hr * circle[i]![0], sign * (R + 1.2), hr * circle[i]![1], p)
        hub.push(p.x, p.y)
        z += p.z / (circle.length - 1)
      }
      depth.face(hub, z + 2, lambert(...turn(0, sign, 0)) * 0.9 + 0.1)
      depth.path(hub, z + 2.01, { width: hair, alpha: 0.85, closed: true, join: 'round' })
      if (!small) {
        project(0, sign * (R + 1.2), 0, p)
        project(0, sign * (R + 7), 0, q)
        depth.path([p.x, p.y, q.x, q.y], z + 2.02, { width: hair * 0.8, alpha: 0.55, dash: [3.5 * hair, 1.5 * hair, 1 * hair, 1.5 * hair] })
        p.z = z + 2.03
        depth.dot(p, 0.8 / view.px, 0.9)
      }
    }

    // The inspection arc runs once round a great circle while the ties are seated.
    const show = view.ease.enter(span(t, 0.36, 0.46)) * (1 - view.ease.exit(span(t, 0.62, 0.72)))
    if (show > 0.004) {
      for (let i = 0; i < 6; i++) {
        const a = TAU * t * 1.5 + i * 0.07
        const b = a + 0.07
        project((R + 1.4) * Math.cos(a), (R + 1.4) * Math.sin(a), 0, p)
        project((R + 1.4) * Math.cos(b), (R + 1.4) * Math.sin(b), 0, q)
        depth.line(p, q, hair * 1.5, show * near((p.z + q.z) / 2), 'accent')
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A turning spherical exoskeleton of hinged ribs and riveted ties assembles round a lit core. */
export function LoaderArmature(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
