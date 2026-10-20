'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { type Tone, TAU, camera, clamp, mix, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'meniscus', title: 'Meniscus', category: 'geometry', technique: 'lines',
  tags: ['liquid', 'fill', 'vessel', 'ripples', 'volume', 'fluid'],
  description: 'Liquid rises inside an open cylindrical vessel, holds while concentric ripples expand, then drains. A sloshing meniscus and the visible rear wall keep the changing level grounded in a real volume.',
  order: 18,
  colors: [{ part: 'Liquid', mono: 'ink' }],
} satisfies LoaderMeta

/* A glass beaker in line: a rim with the glass's thickness, a thick base,
 * its sides, and graduations on the side toward us, a long mark every
 * second. Liquid fills it (`emphasized`), holds, and drains (`standard`).
 * Its surface tilts back and forth once a loop as it settles and climbs
 * the glass at the wall in a meniscus (the contact line, then the band
 * where it curves down to the flat), the stretch of the contact line
 * nearest us in the accent; slow rings spread from the middle while it
 * holds. The liquid's body is a faint tint behind its surface, and every
 * ring is drawn as its near and far arcs, the far one fainter.
 *
 * Color: the liquid’s surface and its ripples are `c1`, inside the
 * ink vessel; the level mark stays the accent. */

const R = 23
const GLASS = 1.4
const RIM = 29
const FLOOR = -27.5
const FOOT = -31
const YAW = -0.25
const PITCH = -0.42
/** The angle round the beaker that faces us. */
const FRONT = YAW + Math.PI / 2

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const ring: number[] = []
const ringZ: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.4,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.3 : view.size < 80 ? 1.25 : 1.4) / view.px
    const samples = small ? 32 : view.size < 80 ? 48 : 72
    const lens = camera({ yaw: YAW, pitch: PITCH, distance: 320, cx: view.w / 2, cy: 48 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * 1.1, y * 1.1, z * 1.1, out)
    const fill = view.ease.emphasized(span(t, 0.06, 0.4)) * (1 - view.ease.standard(span(t, 0.62, 0.96)))
    const level = mix(FLOOR + 3, 15, fill)
    // The slosh settles while it fills and drains, and keeps a little sway through the hold.
    const sway = 0.55 + 0.45 * Math.abs(Math.cos(Math.PI * t))
    const surface = (x: number, z: number) => level + sway * (1.4 * Math.sin(TAU * t) * x + 1.1 * Math.cos(TAU * t) * z) / 22
    // A ring of points, near and far arcs drawn as two strokes, the far one fainter: no piece of it switches tone on its own.
    const loop = (r: number, height: (x: number, z: number) => number, key: number, width: number, near: number, far: number, tone: Tone = 'ink') => {
      let zc = 0
      for (let i = 0; i < samples; i++) {
        const a = (TAU * i) / samples
        const x = r * Math.cos(a)
        const z = r * Math.sin(a)
        project(x, height(x, z), z, p)
        ring[2 * i] = p.x
        ring[2 * i + 1] = p.y
        ringZ[i] = p.z
        zc += p.z / samples
      }
      let k0 = 0
      while (k0 < samples - 1 && !(ringZ[k0]! >= zc && ringZ[(k0 - 1 + samples) % samples]! < zc)) k0++
      let e = 0
      while (e + 1 < samples && ringZ[(k0 + e + 1) % samples]! >= zc) e++
      for (const [from, to, alpha, k] of [
        [0, e + 1, near, key + 1],
        [e + 1, samples, far, key - 1],
      ] as const) {
        if (alpha <= 0.005) continue
        xy.length = 0
        for (let s = from; s <= to; s++) {
          const i = (k0 + s) % samples
          xy.push(ring[2 * i]!, ring[2 * i + 1]!)
        }
        depth.path(xy, k, { width, alpha, join: 'round', cap: 'round', tone })
      }
    }
    const flat = (y: number) => () => y

    // The glass: its sides, the rim's two edges (its thickness), the base's foot and the floor inside.
    for (const s of [-1, 1]) {
      const a = FRONT + (s * Math.PI) / 2
      project((R + GLASS) * Math.cos(a), FOOT, (R + GLASS) * Math.sin(a), p)
      project((R + GLASS) * Math.cos(a), RIM, (R + GLASS) * Math.sin(a), q)
      depth.line(p, q, line, 0.75)
    }
    loop(R + GLASS, flat(RIM), 60, line, 0.85, 0.5)
    if (!small) loop(R, flat(RIM), 60, hair, 0.55, 0.32)
    loop(R + GLASS, flat(FOOT), -60, line, 0.75, 0.25)
    if (!small) loop(R, flat(FLOOR), -61, hair, 0.18, 0.3)

    // Graduations on the side toward us: a long mark every second one, following the glass's curve.
    if (!small) {
      for (let g = 0; g <= 8; g++) {
        const y = FLOOR + 4 + g * 5
        if (y > RIM - 3) break
        const long = g % 2 === 0
        const a0 = FRONT + 0.55
        const a1 = a0 + (long ? 0.26 : 0.14)
        xy.length = 0
        for (let k = 0; k <= 4; k++) {
          const a = mix(a0, a1, k / 4)
          project((R + GLASS + 0.05) * Math.cos(a), y, (R + GLASS + 0.05) * Math.sin(a), p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, 50, { width: hair, alpha: long ? 0.6 : 0.4, cap: 'butt' })
      }
    }

    // The liquid: a faint body behind its surface, the surface itself, and the meniscus where it climbs the glass.
    const rise = 1.3
    xy.length = 0
    for (let i = 0; i < samples; i++) {
      const a = (TAU * i) / samples
      const x = (R - 0.1) * Math.cos(a)
      const z = (R - 0.1) * Math.sin(a)
      project(x, surface(x, z) + rise, z, p)
      xy.push(p.x, p.y)
    }
    depth.poly(xy, 0, 0.05)
    for (let i = 0; i < 24; i++) {
      // The body's walls, front half only: a faint tint from the floor to the contact line.
      const a0 = FRONT - Math.PI / 2 + (Math.PI * i) / 24
      const a1 = FRONT - Math.PI / 2 + (Math.PI * (i + 1)) / 24
      const x0 = (R - 0.1) * Math.cos(a0)
      const z0 = (R - 0.1) * Math.sin(a0)
      const x1 = (R - 0.1) * Math.cos(a1)
      const z1 = (R - 0.1) * Math.sin(a1)
      xy.length = 0
      project(x0, FLOOR, z0, p)
      xy.push(p.x, p.y)
      project(x1, FLOOR, z1, p)
      xy.push(p.x, p.y)
      project(x1, surface(x1, z1) + rise, z1, p)
      xy.push(p.x, p.y)
      project(x0, surface(x0, z0) + rise, z0, p)
      xy.push(p.x, p.y)
      depth.poly(xy, 1, 0.05)
    }
    loop(R - 0.1, (x, z) => surface(x, z) + rise, 20, line, 0.9, 0.42, 'c1')
    if (!small) loop(R - 2.4, surface, 19, hair, 0.42, 0.22, 'c1')
    // The accent: the stretch of the contact line nearest us.
    xy.length = 0
    for (let k = 0; k <= 12; k++) {
      const a = FRONT - 0.55 + (1.1 * k) / 12
      const x = (R - 0.1) * Math.cos(a)
      const z = (R - 0.1) * Math.sin(a)
      project(x, surface(x, z) + rise, z, p)
      xy.push(p.x, p.y)
    }
    depth.path(xy, 22, { width: line * 1.2, alpha: clamp(fill * 6), tone: 'accent', cap: 'round', join: 'round' })

    // Rings spreading slowly from the middle, one a half loop, gone before the meniscus; only while there's liquid to hold them.
    if (!small) {
      for (let j = 0; j < 2; j++) {
        const u = (t + j / 2) % 1
        const r = 2 + (R - 6) * u
        const alpha = 0.34 * Math.sin(Math.PI * u) ** 2 * clamp(fill * 3)
        if (alpha < 0.01) continue
        loop(r, (x, z) => surface(x, z) + 0.4 * Math.sin(TAU * u), 18, hair * 0.9, alpha, alpha * 0.6, 'c1')
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A contained liquid level rises and drains while its sloping surface carries expanding ripples. */
export function LoaderMeniscus(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
