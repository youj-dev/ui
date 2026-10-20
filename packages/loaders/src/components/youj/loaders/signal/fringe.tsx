'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'fringe', title: 'Fringe', category: 'signal', technique: 'lines',
  tags: ['diffraction', 'interference', 'double slit', 'wavefront', 'light', 'optics'],
  description: 'A coherent beam meets two narrow slits. Paired circular wavefronts spread through depth, overlap, and reach a receiving screen whose bright and dark bands follow their path-length difference; the central fringe carries a small accent tick.',
  order: 18,
  colors: [{ part: 'Bright bands', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const BARRIER = [[-23, -11.5], [-8.5, 8.5], [11.5, 23]]
const P = [point(), point(), point(), point()]
const a = point(), b = point()
const xy: number[] = []

/* Color: the screen’s bright bands glow `c1` in proportion to
 * their intensity; the dark bands stay the ink. */

export const scene: Scene = {
  beats: 5, still: 0.38,
  draw(pen, t, view) {
    const small = view.size < 32
    const fronts = small ? 3 : view.size < 80 ? 4 : 5
    const steps = small ? 24 : view.size < 80 ? 36 : 56
    const hair = (small ? 0.9 : 1) / view.px
    const pose = { yaw: -0.56, pitch: -0.52 }
    const project = camera({ ...pose, distance: 400, cx: 49, cy: 50 })
    const turn = orient(pose)
    const plane = (x: number, z0: number, z1: number, y0: number, y1: number, light: number) => {
      project(x, y0, z0, P[0]!); project(x, y0, z1, P[1]!); project(x, y1, z1, P[2]!); project(x, y1, z0, P[3]!)
      xy.length = 0
      let z = 0
      for (const p of P) { xy.push(p.x, p.y); z += p.z / 4 }
      depth.face(xy, z, light)
      depth.path(xy, z + 0.08, { width: hair, alpha: 0.5, closed: true })
    }
    for (const z of [-10, 0, 10]) {
      project(-38, 0, z, a); project(-17, 0, z, b)
      depth.line(a, b, hair, 0.4)
      const x = -38 + 21 * t
      const fade = view.ease.enter(span(t, 0, 0.08)) * (1 - view.ease.exit(span(t, 0.88, 1)))
      project(x - 2, 0, z, a); project(x + 2, 0, z, b)
      depth.line(a, b, hair * 1.2, 0.85 * fade)
    }
    // Three solid strips leave two actual open slits in the barrier.
    for (const [z0, z1] of BARRIER) plane(-17, z0!, z1!, -16, 16, lambert(...turn(1, 0, 0)))
    for (const y of [-18, 18]) {
      project(-17, y, -24, a); project(-17, y, 24, b); depth.line(a, b, hair * 1.2, 0.75)
    }
    // Only the forward semicircles exist. Clip at the screen and the
    // optical bench's edges; no wavefront leaves the drawing's bounds.
    const spacing = 50 / fronts
    for (const source of [-10, 10]) for (let n = 0; n < fronts; n++) {
      const r = (n + t) * spacing
      const alpha = 0.42 * view.ease.enter(span(r, 0, 5)) * (1 - view.ease.exit(span(r, 43, 50)))
      xy.length = 0
      let zsum = 0, samples = 0
      const flush = () => {
        if (samples < 2) return
        const z = zsum / samples
        depth.path(xy, z, { width: hair * 0.8, alpha: alpha * (0.68 + 0.32 * Math.max(0, (z + 20) / 40)), join: 'round' })
      }
      for (let j = 0; j <= steps; j++) {
        const q = -Math.PI / 2 + Math.PI * j / steps
        const x = -17 + r * Math.cos(q), z = source + r * Math.sin(q)
        const inside = x <= 32 && Math.abs(z) <= 23
        if (!inside) { flush(); xy.length = 0; zsum = 0; samples = 0; continue }
        project(x, 0, z, b)
        xy.push(b.x, b.y); zsum += b.z; samples++
        // Four-segment patches retain useful depth ordering without
        // making every sample a separate mark in the engine buffer.
        if (samples === 5) {
          flush(); xy.length = 0; xy.push(b.x, b.y); zsum = b.z; samples = 1
        }
      }
      flush()
    }
    const bands = small ? 5 : view.size < 80 ? 13 : 21
    for (let i = 0; i < bands; i++) {
      const z = -22 + 44 * i / (bands - 1)
      const delta = Math.hypot(49, z - 10) - Math.hypot(49, z + 10)
      const intensity = Math.cos(Math.PI * delta / 5) ** 2 * Math.exp(-((z / 32) ** 2))
      project(33, -13, z, a); project(33, 13, z, b)
      depth.line(a, b, (small ? 0.95 : 1.7) / view.px, 0.12 + intensity * (0.65 + 0.12 * Math.sin(TAU * t)), blend('ink', 'c1', 0.85 * intensity))
    }
    for (const y of [-17, 17]) {
      project(33, y, -24, a); project(33, y, 24, b); depth.line(a, b, hair, 0.38)
    }
    project(33.2, -18, -2, a); project(33.2, -18, 2, b)
    depth.line(a, b, hair * 1.5, 0.95, 'accent')
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Coherent wavefronts meet a screen of path-difference interference bands. */
export function LoaderFringe(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
