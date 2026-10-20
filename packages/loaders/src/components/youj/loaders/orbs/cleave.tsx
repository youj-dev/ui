'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, hump, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { face, hairline, lod, near, type V3 } from './sphere'

export const meta = {
  id: 'cleave', title: 'Cleave', category: 'orbs', technique: 'planes',
  tags: ['orb', 'liquid', 'metaball', 'split', 'merge'],
  description: 'A liquid Cassini surface narrows at its waist and cleaves into two rounded lobes. An accent waist ring pinches to nothing on a registered cleavage plane, the lobes turn through depth with contours that follow the changing topology, and surface tension draws them back together.',
  order: 4,
  colors: [{ part: 'Plane', mono: 'ink' }],
} satisfies LoaderMeta

/* A Cassini solid: (x² + rho² + d²)² - 4d²x² = b⁴.
 * Its neck reaches zero at d=b, so the same analytic surface changes from
 * one connected orb to two lobes without swapping meshes or crossfading.
 *
 * Color: the registered cleavage plane and its marks are `c1`, showing as it cleaves; the waist ring stays the accent. */
const levels = [[6, 12], [9, 18], [12, 24]].map(([rows, cols]) => ({ rows: rows!, cols: cols!, world: Array.from({ length: 2 * (rows! + 1) * (cols! + 1) }, () => [0, 0, 0] as V3) }))
const depth = new Depth(), p = point(), q = point()
const corners: V3[] = []

export const scene: Scene = {
  beats: 5.5, still: 0.25,
  draw(pen, t, view) {
    t %= 1
    const { rows, cols, world } = levels[lod(view)]!, hair = hairline(view)
    const pose = { yaw: 0.32 + 0.32 * Math.sin(TAU * t), pitch: -0.25, roll: 0.12 * Math.sin(TAU * t) }, project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: view.h / 2 }), turn = orient(pose)
    const b = 22.5, d = 23.5 * view.ease.standard(hump(t))
    const inner = Math.sqrt(Math.max(0, d * d - b * b)), outer = Math.sqrt(d * d + b * b)
    // Integrate the analytic cross-sections, then normalize the model’s
    // volume. A small pullback keeps both conserved-volume lobes in frame.
    let volume = 0
    for (let i = 0;i < 48;i++) {
      const x = mix(inner, outer, (i + 0.5) / 48)
      volume += Math.max(0, Math.sqrt(b ** 4 + 4 * d * d * x * x) - x * x - d * d)
    }
    volume *= 2 * Math.PI * (outer - inner) / 48
    const scale = Math.cbrt((4 * Math.PI * b ** 3 / 3) / volume) * mix(1, 0.74, d / 23.5)
    for (let side = 0;side < 2;side++) {
      const sign = side ? 1 : -1, base = side * (rows + 1) * (cols + 1)
      for (let j = 0;j <= rows;j++) {
        // Cosine spacing puts more samples at both rounded tips and at the
        // neck, where uniform samples would visibly kink during separation.
        const u = 0.5 - 0.5 * Math.cos(Math.PI * j / rows), x = mix(inner, outer, u)
        const r = Math.sqrt(Math.max(0, Math.sqrt(b ** 4 + 4 * d * d * x * x) - x * x - d * d))
        for (let i = 0;i <= cols;i++) {
          const a = TAU * i / cols, v = world[base + j * (cols + 1) + i]!
          v[0] = sign * x * scale; v[1] = r * Math.cos(a) * scale; v[2] = r * Math.sin(a) * scale
        }
      }
      for (let j = 0;j < rows;j++) for (let i = 0;i < cols;i++) {
        const a = base + j * (cols + 1) + i
        corners.length = 0
        if (sign > 0) corners.push(world[a]!, world[a + 1]!, world[a + cols + 2]!, world[a + cols + 1]!)
        else corners.push(world[a + 1]!, world[a]!, world[a + cols + 1]!, world[a + cols + 2]!)
        face(depth, project, turn, corners)
      }
      // Material contours expose the narrowing waist: each segment fades in as it turns to face the eye, never cut at a line.
      for (const j of view.size < 32 ? [2, 4] : [2, 4, 6]) {
        if (j >= rows) continue
        for (let i = 0;i < cols;i++) {
          const a = TAU * (i + 0.5) / cols
          const facing = turn(0, Math.cos(a), Math.sin(a))[2]
          const shown = clamp((facing + 0.05) / 0.35)
          if (shown <= 0) continue
          project(...world[base + j * (cols + 1) + i]!, p); project(...world[base + j * (cols + 1) + i + 1]!, q)
          p.z += 0.2; q.z += 0.2
          depth.line(p, q, hair * 0.7, 0.4 * shown * near((p.z + q.z) / 2))
        }
      }
    }
    // The waist: an accent ring round the neck that pinches to nothing as the lobes part.
    const neck = Math.sqrt(Math.max(0, b * b - d * d)) * scale
    // Only while the waist is really narrowing: it fades in as the lobes draw apart and pinches out at the split.
    const waist = span(d / b, 0.35, 0.7) * clamp(neck / 4)
    if (waist > 0.004) {
      for (let i = 0;i < cols;i++) {
        const a0 = TAU * i / cols, a1 = TAU * (i + 1) / cols
        const facing = turn(0, Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2))[2]
        project(0, (neck + 0.25) * Math.cos(a0), (neck + 0.25) * Math.sin(a0), p)
        project(0, (neck + 0.25) * Math.cos(a1), (neck + 0.25) * Math.sin(a1), q)
        p.z += 0.3; q.z += 0.3
        depth.line(p, q, hair * 1.4, waist * (facing > 0 ? 1 : 0.25), 'accent')
      }
    }
    // The cleavage plane, registered by crop marks at its corners while the waist thins and the lobes stand apart.
    const plane = span(d / b, 0.55, 0.85)
    if (plane > 0 && view.size >= 40) {
      const half = 20
      const arm = 4.5
      for (const [sy, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
        project(0, sy * half, sz * half, p)
        project(0, sy * (half - arm), sz * half, q)
        p.z = q.z = 50
        depth.line(p, q, hair * 0.85, 0.6 * plane, 'c1')
        project(0, sy * half, sz * (half - arm), q)
        q.z = 50
        depth.line(p, q, hair * 0.85, 0.6 * plane, 'c1')
      }
      project(0, -half + 2, 0, p)
      project(0, half - 2, 0, q)
      depth.path([p.x, p.y, q.x, q.y], -1, { width: hair * 0.7, alpha: 0.4 * plane, dash: [4 * hair, 1.6 * hair, 1.2 * hair, 1.6 * hair] })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A liquid Cassini surface narrows at its waist and cleaves into two rounded lobes. The lobes turn through depth, their cut contours follow the changing topology, and surface tension draws them back together. */
export function LoaderCleave(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
