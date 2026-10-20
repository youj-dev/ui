'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'caustic', title: 'Caustic', category: 'signal', technique: 'lines',
  tags: ['optics', 'lens', 'focus', 'light', 'ray', 'convergence'],
  description: 'A cylindrical bundle of rays passes through a convex lens and converges at a travelling focus. Short light fronts cross the lens, meet at the waist and spread onto the receiving screen as the focus draws near and recedes.',
  order: 15,
  colors: [{ part: 'Refracted rays', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const depth = new Depth()
const ring: V3[] = Array.from({ length: 49 }, () => [0, 0, 0])
const ray: V3[] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
const xy: number[] = []
const a = point(), b = point()

/* Color: past the lens the refracted rays lean toward `c1`, the
 * incoming ones stay the ink and the chief ray the accent. */

export const scene: Scene = {
  beats: 5, still: 0.31,
  draw(pen, t, view) {
    const small = view.size < 32
    const count = small ? 4 : view.size < 80 ? 6 : 10
    const hair = (small ? 1.05 : 1.05) / view.px
    const pose = { yaw: -0.32, pitch: -0.32 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: 49 })
    const adjust = view.ease.standard(span(t, 0.03, 0.4)) - view.ease.standard(span(t, 0.57, 0.96))
    const focus = 13 + 13 * adjust
    // Two bulging meridians and the lens rim describe an optical volume without a filled disk.
    for (let i = 0; i < ring.length; i++) {
      const q = TAU * i / (ring.length - 1)
      ring[i]![0] = -10; ring[i]![1] = 22 * Math.cos(q); ring[i]![2] = 22 * Math.sin(q)
    }
    let f = projectPath(ring, project, xy)
    depth.path(f.xy, f.z, { width: hair, alpha: 0.7, join: 'round' })
    for (const side of [-1, 1]) {
      for (let i = 0; i < ring.length; i++) {
        const q = Math.PI * i / (ring.length - 1)
        ring[i]![0] = -10 + side * (4.5 - 1.4 * adjust) * Math.sin(q)
        ring[i]![1] = 22 * Math.cos(q); ring[i]![2] = 0
      }
      f = projectPath(ring, project, xy)
      depth.path(f.xy, f.z + 0.02, { width: hair * 0.85, alpha: 0.48, join: 'round' })
    }
    // Geometrical thin-lens rays: every outgoing line passes exactly through (focus, 0, 0).
    for (let j = 0; j < count; j++) {
      const q = TAU * (j + 0.2) / count
      const y = 16 * Math.cos(q), z = 16 * Math.sin(q)
      ray[0]![0] = -36; ray[0]![1] = y; ray[0]![2] = z
      ray[1]![0] = -10; ray[1]![1] = y; ray[1]![2] = z
      const ratio = 1 - 44 / (focus + 10)
      ray[2]![0] = 34; ray[2]![1] = y * ratio; ray[2]![2] = z * ratio
      f = projectPath(ray, project, xy)
      const near = clamp(0.5 + z / 40)
      depth.path(f.xy, f.z, { width: hair * 0.8, alpha: 0.18 + 0.22 * near })
      // Fronts are line segments on the ray, fading at the boundaries of the optical bench.
      const phase = (t * 2 + j * 0.08) % 1
      const tail = Math.max(0, phase - 0.12)
      const onRay = (u: number, out: typeof a) => {
        const x = mix(-36, 34, u)
        const scale = x < -10 ? 1 : 1 - (x + 10) / (focus + 10)
        return project(x, y * scale, z * scale, out)
      }
      onRay(tail, a); onRay(phase, b)
      // Split the segment at the lens so it never shortcuts across a refraction.
      const alpha = span(phase, 0, 0.1) * (1 - span(phase, 0.88, 1))
      const lensAt = 26 / 70
      if (tail < lensAt && phase > lensAt) {
        const lens = project(-10, y, z, point())
        depth.line(a, lens, hair * 1.25, alpha * (0.6 + 0.35 * near), j === 0 ? 'accent' : 'ink')
        depth.line(lens, b, hair * 1.25, alpha * (0.6 + 0.35 * near), j === 0 ? 'accent' : blend('ink', 'c1', 0.75))
      } else depth.line(a, b, hair * 1.25, alpha * (0.6 + 0.35 * near), j === 0 ? 'accent' : 'ink')
    }
    const screen = projectPath([[34, -23, -23], [34, 23, -23], [34, 23, 23], [34, -23, 23]], project, xy)
    depth.path(screen.xy, screen.z, { width: hair * 0.8, alpha: 0.25, closed: true })
    project(focus, -3, 0, a); project(focus, 3, 0, b)
    depth.line(a, b, hair * 1.15, 0.9, 'accent')
    if (!small) {
      project(-37, -25, 0, a); project(36, -25, 0, b)
      depth.line(a, b, hair * 0.75, 0.25)
      for (const x of [-10, focus, 34]) { project(x, -25, 0, a); project(x, -28, 0, b); depth.line(a, b, hair * 0.8, 0.45) }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Light fronts meet at the moving waist of a real three-dimensional ray bundle. */
export function LoaderCaustic(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
