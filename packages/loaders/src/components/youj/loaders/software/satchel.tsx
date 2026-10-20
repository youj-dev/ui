'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { type Tone, camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, weight } from './workspace'

export const meta = {
  id: 'satchel', title: 'Satchel', category: 'software', technique: 'planes',
  tags: ['upload', 'files', 'folder', 'transfer', 'documents', 'batch'],
  description: 'Three folded-corner files rise into an open folder one at a time. Each file writes its upload rule while approaching the mouth, seats behind the front cover and adds a receipt to the folder edge; the completed batch fans back out along its original paths.',
  order: 21,
  colors: [{ part: 'Files', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: each file’s folded corner and title are `c1`, so the
 * files read apart from the folder; the upload rules and receipts stay the
 * accent. */

type V3 = [number, number, number]
const depth = new Depth()
const world: V3[] = Array.from({ length: 5 }, () => [0, 0, 0])
const BACK: V3[] = [[-29, -13, -5], [29, -13, -5], [29, 22, -5], [-5, 22, -5], [-10, 29, -5], [-29, 29, -5]]
const front: V3[] = [[-29, -14, 8], [29, -14, 8], [33, 13, 12], [-25, 13, 12]]
const FILES: [number, number][][] = [17, 19].map(w => [[-w / 2, -12], [w / 2, -12], [w / 2, 7], [w / 2 - 5, 12], [-w / 2, 12]])
const xy: number[] = []
const segment = new Array<number>(4).fill(0)
const a = point(), b = point()

export const scene: Scene = {
  beats: 6, still: 0.53,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view), count = small ? 2 : 3
    const pose = { yaw: -0.24, pitch: -0.28 }
    const project = camera({ ...pose, distance: 390, cx: 50, cy: 51 })
    const turn = orient(pose)
    const shape = (vertices: readonly V3[], z: number, fill: number, alpha: number, lit = false) => {
      const f = projectPath(vertices, project, xy)
      if (lit) depth.face(f.xy, z, fill)
      else depth.poly(f.xy, z, fill, 'ink', true)
      depth.path(f.xy, z + 0.01, { width: hair * 0.85, alpha, closed: true, join: 'round' })
    }
    const line = (x0: number, y0: number, x1: number, y1: number, wz: number, key: number, width: number, alpha: number, tone: Tone = 'ink') => {
      project(x0, y0, wz, a); project(x1, y1, wz, b)
      segment[0] = a.x; segment[1] = a.y; segment[2] = b.x; segment[3] = b.y
      depth.path(segment, key, { width, alpha, tone })
    }
    // A folder has a real back, a tab and a tilted front. Files enter the
    // gap between them; depth order makes their lower halves disappear.
    shape(BACK, -100, 0.055, 0.58)
    const mouth = gesture(view, t, 0.03, 0.16, 0.81, 0.96)
    for (let i = 0; i < count; i++) {
      const start = 0.08 + i * 0.17
      const u = gesture(view, t, start, start + 0.21, 0.76 + (count - 1 - i) * 0.05, 0.9 + (count - 1 - i) * 0.03)
      const x = mix(-23 + i * (small ? 43 : 23), -12 + i * (small ? 23 : 12), u)
      const y = mix(-24 - (i % 2) * 5, 9 + i * 2, u)
      const z = mix(19, -1 + i * 1.8, u)
      const w = small ? 19 : 17, h = 24
      const coords = FILES[small ? 1 : 0]!
      for (let j = 0; j < coords.length; j++) {
        world[j]![0] = x + coords[j]![0]; world[j]![1] = y + coords[j]![1]; world[j]![2] = z
      }
      const key = -50 + i * 10
      shape(world, key, lambert(...turn(0, 0, 1)), 0.79, true)
      line(x + w / 2 - 5, y + h / 2, x + w / 2 - 5, y + h / 2 - 5, z, key + 1, hair * 0.7, 0.4, 'c1')
      line(x + w / 2 - 5, y + h / 2 - 5, x + w / 2, y + h / 2 - 5, z, key + 1, hair * 0.7, 0.4, 'c1')
      if (!small) line(x - w / 2 + 4, y + 2, x + w / 2 - 4, y + 2, z, key + 1, hair, 0.58, 'c1')
      // Transfer progress belongs to the file while it is in flight.
      const progress = clamp(view.ease.standard(span(t, start, start + 0.19)))
      const active = Math.sin(Math.PI * progress)
      if (active > 0.002) line(x - w / 2 + 3, y - 4, x - w / 2 + 3 + (w - 6) * progress, y - 4, z, key + 2, hair * 1.3, active, 'accent')
    }
    const topY = mix(13, 5, mouth), frontZ = mix(12, 22, mouth)
    front[2]![1] = topY; front[2]![2] = frontZ
    front[3]![1] = topY; front[3]![2] = frontZ
    const slope = (frontZ - 8) / (topY + 14)
    shape(front, 100, lambert(...turn(0, -slope, 1)), 0.82, true)
    // A quiet folder label and one receipt per seated file. The accent
    // stays on this short edge rather than colouring an entire cover.
    const labelY = mix(-14, topY, 0.36), labelZ = mix(8, frontZ, 0.36) + 0.1
    line(-18, labelY, -3, labelY, labelZ, 101, hair * 1.3, 0.5)
    for (let i = 0; i < count; i++) {
      const received = gesture(view, t, 0.27 + i * 0.17, 0.35 + i * 0.17, 0.79 + (count - 1 - i) * 0.04, 0.9 + (count - 1 - i) * 0.03)
      line(7 + i * 6, labelY, 7 + i * 6 + 4 * received, labelY, labelZ, 102, hair * 1.6, received * 0.95, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Files write their upload progress and seat inside a folder with real depth. */
export function LoaderSatchel(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
