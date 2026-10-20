'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'descent', title: 'Descent', category: 'signal', technique: 'lines',
  tags: ['optimization', 'gradient', 'loss', 'training', 'landscape', 'iteration'],
  description: 'A measured descent follows the gradient of an asymmetric loss basin. Each iterate leaves a checkpoint, a tangent frame tilts to the local slope, and the next step shortens toward the minimum; the path retraces its evaluations to begin again.',
  order: 31,
  colors: [{ part: 'Path', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const height = (x: number, z: number) => {
  const u = x + 7, v = z - 6
  return -13 + 0.018 * u * u + 0.023 * v * v + 0.012 * u * v
}
const gradient = (x: number, z: number) => [0.036 * (x + 7) + 0.012 * (z - 6), 0.046 * (z - 6) + 0.012 * (x + 7)] as const
const ITERATES: V3[] = [[25, height(25, -23) + 1, -23]]
for (let i = 0; i < 9; i++) {
  const prev = ITERATES[i]!, [dx, dz] = gradient(prev[0], prev[2])
  const x = prev[0] - 10 * dx, z = prev[2] - 10 * dz
  ITERATES.push([x, height(x, z) + 1, z])
}
// The objective and its sampled profiles never change between frames.
// A cut-out skirt under each profile hides the farther parts of the basin.
const LEVELS = [
  { rows: 6, samples: 24, steps: 5 },
  { rows: 10, samples: 40, steps: 7 },
  { rows: 15, samples: 64, steps: 9 },
].map(({ rows, samples, steps }) => ({
  steps,
  profiles: Array.from({ length: rows }, (_, r) => {
    const z = -29 + 58 * r / (rows - 1)
    return Array.from({ length: samples + 1 }, (_, i): V3 => {
      const x = -30 + 60 * i / samples
      return [x, height(x, z), z]
    })
  }),
}))
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const skirt: number[] = []
const fragment: V3[] = Array.from({ length: 9 }, () => [0, 0, 0])
const tangent: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])

/* Color: the descent path is `c1`; the basin’s profiles and
 * checkpoints stay the ink and the iterate the accent. */

export const scene: Scene = {
  beats: 5.8, still: 0.39,
  draw(pen, t, view) {
    const small = view.size < 32
    const { profiles, steps } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const project = camera({ yaw: -0.28, pitch: -0.58, distance: 300, cx: view.w / 2, cy: 51 })
    const hair = (small ? 1.05 : 1) / view.px

    for (const profile of profiles) {
      const line = projectPath(profile, project, xy)
      skirt.length = 0
      skirt.push(...line.xy)
      const first = profile[0]!, last = profile[profile.length - 1]!
      project(last[0], -16, last[2], p); skirt.push(p.x, p.y)
      project(first[0], -16, first[2], p); skirt.push(p.x, p.y)
      depth.poly(skirt, line.z - 0.02, 0.02, 'ink', true)
      depth.path(line.xy, line.z, { width: hair * 0.85, alpha: clamp(0.56 + line.z / 110, 0.25, 0.85), join: 'round' })
    }

    // A short ground cross registers the true minimum. No moving camera
    // or changing objective is needed to suggest that the solver is busy.
    project(-11, -12.7, 6, p); project(-3, -12.7, 6, q); depth.line(p, q, hair * 0.75, 0.35)
    project(-7, -12.7, 2, p); project(-7, -12.7, 10, q); depth.line(p, q, hair * 0.75, 0.35)

    // Advance rest-to-rest from one actual gradient evaluation to the next.
    // Reverse the same evaluation path; the seam is its initial iterate.
    const now = t < 0.7 ? span(t, 0.04, 0.65) * steps : (1 - span(t, 0.73, 0.97)) * steps
    const index = Math.min(steps - 1, Math.floor(now))
    const u = view.ease.emphasized(clamp(now - index))
    const at = index + u
    const a = ITERATES[index]!, b = ITERATES[index + 1]!
    const x = mix(a[0], b[0], u), z = mix(a[2], b[2], u), y = height(x, z) + 1.5

    for (let i = 0; i < steps; i++) {
      const shown = clamp(at - i)
      if (shown <= 0.004) continue
      const A = ITERATES[i]!, B = ITERATES[i + 1]!
      for (let j = 0; j < fragment.length; j++) {
        const s = shown * j / (fragment.length - 1)
        const px = mix(A[0], B[0], s), pz = mix(A[2], B[2], s)
        fragment[j]![0] = px; fragment[j]![1] = height(px, pz) + 1.5; fragment[j]![2] = pz
      }
      const path = projectPath(fragment, project, xy)
      depth.path(path.xy, path.z + 0.04, { width: hair * 1.5, alpha: 0.88, cap: 'round', join: 'round', tone: 'c1' })
      // Checkpoints are cross strokes anchored to the surface, not dots.
      if (!small) {
        project(A[0] - 1.4, A[1] + 0.6, A[2], p)
        project(A[0] + 1.4, A[1] + 0.6, A[2], q)
        depth.line(p, q, hair * 0.8, 0.7 * shown)
      }
    }

    // The local first-order approximation is a wire plane. Its four
    // corners have the actual gradient, so it flattens as loss decreases.
    const [dx, dz] = gradient(x, z)
    const radius = small ? 4.7 : 4.1
    for (let j = 0; j < 4; j++) {
      const sx = j === 0 || j === 3 ? -radius : radius, sz = j < 2 ? -radius : radius
      tangent[j]![0] = x + sx; tangent[j]![1] = y + 0.8 + dx * sx + dz * sz; tangent[j]![2] = z + sz
    }
    const frame = projectPath(tangent, project, xy)
    depth.path(frame.xy, frame.z + 0.1, { width: hair, alpha: 0.85, closed: true })
    // Its short downhill vector is the sole accent. It decreases in length
    // with the residual gradient, while its visible stem remains legible.
    const strength = Math.hypot(dx, dz)
    const scale = 6 / Math.max(1, strength)
    project(x, y + 1, z, p)
    project(x - dx * scale, y + 1 - (dx * dx + dz * dz) * scale, z - dz * scale, q)
    depth.line(p, q, hair * 1.7, 0.96, 'accent')
    if (!small) {
      // A witness at the initial sample makes the diminishing steps clear.
      const start = ITERATES[0]!
      project(start[0], -16, start[2], p); project(...start, q)
      depth.line(p, q, hair * 0.65, 0.3)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A solver follows a loss basin, carrying a tangent plane and its shrinking gradient. */
export function LoaderDescent(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
