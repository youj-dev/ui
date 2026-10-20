'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'tenon',
  title: 'Tenon',
  category: 'geometry',
  technique: 'planes',
  tags: ['join', 'interlock', 'solid', 'assembly', 'isometric', 'blueprint', 'tab'],
  description: 'Two complementary stepped solids slide together into a square joint, the accent square riding the tongue. Flat-lit walls show the socket before it closes; the halves hold, then withdraw in reverse order.',
  order: 16,
  colors: [{ part: 'Witness marks', mono: 'ink' }],
} satisfies LoaderMeta

// The halves share the very same stepped seam. Each is a single extruded
// polygon, so the socket is empty space, not a dark shape painted on top.
const PROFILES = [
  [[-25, -20], [0, -20], [0, -7], [9, -7], [9, 7], [0, 7], [0, 20], [-25, 20]],
  [[0, -20], [25, -20], [25, 20], [0, 20], [0, 7], [9, 7], [9, -7], [0, -7]],
] as const
const TOP = 9
const BASE = -5
const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const cap: [number, number, number][] = Array.from({ length: 8 }, () => [0, TOP, 0])
const caps = PROFILES.map(() => ({ xy: [] as number[] }))
const wall: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])
const stamp: [number, number, number][] = Array.from({ length: 4 }, () => [0, TOP + 0.02, 0])
const SIGNS = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const
const stampXY: number[] = []

export const scene: Scene = {
  beats: 5.5,
  still: 0.27,
  draw(pen, t, view) {
    const small = view.size < 32
    const pose = { yaw: -0.65 + 0.08 * Math.sin(TAU * t), pitch: -0.68 }
    const project = camera({ ...pose, distance: 310, cx: view.w / 2, cy: view.h / 2 + 1 })
    const light = orient(pose)
    const hair = (small ? 1.05 : 0.9) / view.px

    PROFILES.forEach((profile, half) => {
      // Even a personality with an overshooting arrival must not push
      // the solid tongue through the back of its matching socket.
      const dock = clamp(view.ease.emphasized(span(t, 0.07 + half * 0.12, 0.3 + half * 0.12)))
      const withdraw = clamp(view.ease.emphasized(span(t, 0.66 + (1 - half) * 0.1, 0.86 + (1 - half) * 0.1)))
      const dx = (half === 0 ? -1 : 1) * mix(12, 0, dock * (1 - withdraw))

      // All side normals travel through the camera's orientation. Cull
      // back walls, then sort the remaining walls by their real depth.
      profile.forEach(([x, z], i) => {
        const [bx, bz] = profile[(i + 1) % profile.length]!
        cap[i]![0] = x + dx
        cap[i]![2] = z
        const n = light(bz - z, 0, x - bx)
        if (n[2] <= 0) return
        wall[0]![0] = wall[3]![0] = x + dx
        wall[1]![0] = wall[2]![0] = bx + dx
        wall[0]![1] = wall[1]![1] = BASE
        wall[2]![1] = wall[3]![1] = TOP
        wall[0]![2] = wall[3]![2] = z
        wall[1]![2] = wall[2]![2] = bz
        const f = projectPath(wall, project, xy)
        depth.face(f.xy, f.z, lambert(...n))
        depth.path(f.xy, f.z + 0.01, { width: hair * 0.8, alpha: small ? 0.32 : 0.5, closed: true })
      })
      projectPath(cap, project, caps[half]!.xy)

      if (half === 0) {
        const s = small ? 2.6 : 2.2
        SIGNS.forEach(([sx, sz], i) => {
          stamp[i]![0] = 4.5 + sx * s + dx
          stamp[i]![2] = sz * s
        })
        projectPath(stamp, project, stampXY)
      }
    })

    if (!small) {
      // Witness marks remain on the assembly bed as the halves move.
      for (const z of [-25, 25]) {
        project(-38, BASE - 1, z, p)
        project(38, BASE - 1, z, q)
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2, { width: hair, alpha: 0.19, dash: [3 * hair, 3 * hair], tone: 'c1' })
        project(0, BASE - 1, z - 3, p)
        project(0, BASE - 1, z + 3, q)
        depth.line(p, q, hair, 0.5, 'c1')
      }
    }
    depth.flush(pen)

    // Both caps lie on one plane above every wall. With the eye above that
    // plane, no wall can obscure either cap, even across the concave seam.
    // Paint the coplanar caps last instead of sorting a concave polygon by
    // its centroid (which would expose a socket wall through its neighbor).
    const topLight = lambert(...light(0, 1, 0))
    for (const f of caps) {
      pen.face(f.xy, topLight)
      pen.path(f.xy, { width: hair, alpha: 0.85, closed: true, join: 'miter' })
    }
    pen.poly(stampXY, 1, 'accent')
  },
}

/* Color: the witness marks on the assembly bed are `c1`; the
 * solids stay lit ink and the stamped square the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Two stepped, flat-lit halves slide into a square joint and withdraw. */
export function LoaderTenon(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
