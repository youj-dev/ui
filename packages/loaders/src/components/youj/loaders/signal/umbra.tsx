'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, hump, lambert, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'umbra', title: 'Umbra', category: 'signal', technique: 'lines',
  tags: ['optics', 'eclipse', 'shadow', 'penumbra', 'rays', 'projection'],
  description: 'An opaque disc drifts across an extended light source. Grazing rays bound its core shadow and soft penumbra on a gridded screen; a short light front travels along the clear boundary while the shadow follows the disc at its projected magnification.',
  order: 16,
  colors: [{ part: 'Grazing rays', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

/* Color: the grazing rays that bound the shadow are `c1`; the
 * disc, screen and shadow stay the ink and the light front the accent. */

export const scene: Scene = {
  beats: 5.5,
  still: 0.31,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const hair = (small ? 1 : 0.95) / view.px
    const samples = small ? 28 : view.size < 80 ? 40 : 64
    const pose = { yaw: -0.62, pitch: -0.2 }
    const project = camera({ ...pose, distance: 380, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient(pose)
    const lift = 8 * (view.ease.standard(hump(t)) - 0.5)
    const source = -33
    const disc = -4
    const screen = 31
    const magnify = (screen - source) / (disc - source)
    const shadow = lift * magnify
    const inner = 6 + (7 - 6) * magnify
    const outer = -6 + (7 + 6) * magnify
    const ring = (x: number, y: number, r: number) => {
      xy.length = 0
      let z = 0
      for (let j = 0; j < samples; j++) {
        const a = TAU * j / samples
        project(x, y + r * Math.cos(a), r * Math.sin(a), p)
        xy.push(p.x, p.y)
        z += p.z / samples
      }
      return z
    }
    // The receiver stays translucent. Its two axes and rim locate the
    // shadow as a projection onto a real plane, rather than a floating disc.
    xy.length = 0
    let receiverZ = 0
    for (const [y, z] of [[-34, -28], [34, -28], [34, 28], [-34, 28]]) {
      project(screen, y!, z!, p)
      xy.push(p.x, p.y)
      receiverZ += p.z / 4
    }
    depth.poly(xy, receiverZ, 0.035)
    depth.path(xy, receiverZ + 0.01, { width: hair * 0.8, alpha: 0.38, closed: true })
    if (!small) for (const coordinate of [-20, 0, 20]) {
      project(screen, coordinate, -28, p)
      project(screen, coordinate, 28, q)
      depth.line(p, q, hair * 0.65, 0.16)
      project(screen, -34, coordinate, p)
      project(screen, 34, coordinate, q)
      depth.line(p, q, hair * 0.65, 0.16)
    }
    const bands = small ? 2 : 4
    for (let band = 0; band < bands; band++) {
      const r = outer - (outer - inner) * band / bands
      ring(screen + 0.02, shadow, r)
      depth.poly(xy, receiverZ + 0.03 + band * 0.01, small ? 0.095 : 0.055)
    }
    ring(screen + 0.04, shadow, inner)
    depth.poly(xy, receiverZ + 0.1, 0.24)
    depth.path(xy, receiverZ + 0.11, { width: hair * 0.8, alpha: 0.56, closed: true })
    // Similar triangles give the four tangent boundaries exactly. The
    // outer two enclose partial light; the inner two enclose total shadow.
    for (const side of [-1, 1]) for (const edge of [-1, 1]) {
      const ys = 6 * side
      const yd = lift + 7 * edge
      const end = ys + (yd - ys) * magnify
      project(source, ys, 0, p)
      project(screen, end, 0, q)
      depth.line(p, q, hair * 0.8, edge === side ? 0.62 : 0.28, 'c1')
      if (side === 1 && edge === 1) {
        const u = view.ease.standard(t)
        const show = span(t, 0, 0.1) * (1 - span(t, 0.9, 1))
        const from = Math.max(0, u - 0.07)
        project(source + (screen - source) * from, ys + (end - ys) * from, 0, p)
        project(source + (screen - source) * u, ys + (end - ys) * u, 0, q)
        depth.line(p, q, hair * 1.3, show, 'accent')
      }
    }
    const sourceZ = ring(source, 0, 6)
    depth.face(xy, sourceZ, lambert(...turn(1, 0, 0)))
    depth.path(xy, sourceZ + 0.02, { width: hair, alpha: 0.9, closed: true })
    const discZ = ring(disc, lift, 7)
    depth.face(xy, discZ, lambert(...turn(1, 0, 0), 0.18))
    depth.path(xy, discZ + 0.01, { width: hair, alpha: 0.95, closed: true })
    project(disc, lift - 7, 0, p)
    project(disc, -27, 0, q)
    depth.line(p, q, hair, 0.72)
    project(source, -6, 0, p)
    project(source, -27, 0, q)
    depth.line(p, q, hair, 0.45)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A grazing-ray construction reveals a moving disc's umbra and penumbra on a receiving plane. */
export function LoaderUmbra(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
