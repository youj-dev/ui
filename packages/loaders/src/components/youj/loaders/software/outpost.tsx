'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { type Tone, camera, lambert, mix, orient, point, projectPath, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, weight } from './workspace'

export const meta = {
  id: 'outpost', title: 'Outpost', category: 'software', technique: 'planes',
  tags: ['deploy', 'regions', 'rollout', 'services', 'release', 'replacement'],
  description: 'A release reaches three regional service racks in succession. Each rack provisions a standby above its live service, transfers traffic as the replacement seats, and retires the old slot while the other regions keep serving; the rollout then returns to its original version.',
  order: 13,
  colors: [{ part: 'Release', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the new release’s mark on each standby is `c1`, so it
 * reads apart from the old service as it seats and takes the traffic; the
 * working edge stays the accent. */

const depth = new Depth()
const world: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
const segment = new Array<number>(4).fill(0)
const a = point(), b = point()
const REGIONS = [-29, 0, 29] as const

function panel(project: Project, x: number, y: number, w: number, h: number, z: number, key: number, hair: number, fill: number, alpha: number) {
  for (let j = 0; j < 4; j++) {
    world[j]![0] = x + (j === 1 || j === 2 ? w / 2 : -w / 2)
    world[j]![1] = y + (j < 2 ? h / 2 : -h / 2)
    world[j]![2] = z
  }
  const f = projectPath(world, project, xy)
  depth.poly(f.xy, key, fill, 'ink', true)
  depth.path(f.xy, key + 0.01, { width: hair, alpha, closed: true, join: 'round' })
}
function line(project: Project, x: number, y: number, xx: number, yy: number, z: number, key: number, width: number, alpha: number, tone: Tone = 'ink') {
  project(x, y, z, a); project(xx, yy, z, b)
  segment[0] = a.x; segment[1] = a.y; segment[2] = b.x; segment[3] = b.y
  depth.path(segment, key, { width, alpha, tone })
}

export const scene: Scene = {
  beats: 6, still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const pose = { yaw: -0.18, pitch: -0.3 }
    const project = camera({ ...pose, distance: 410, cx: 50, cy: 49 })
    const turn = orient(pose)
    // A release manifest, then a broadcast rail. Unlike a pipeline, all
    // regions retain a live service while their replacement is provisioned.
    panel(project, 0, 32, 20, 10, 0, -20, hair * 0.8, 0.05, 0.65)
    line(project, -5, 32, 5, 32, 0.1, -19, hair * 1.4, 0.78)
    line(project, 0, 27, 0, 21, 0, -18, hair * 0.8, 0.3)
    line(project, -29, 21, 29, 21, 0, -18, hair * 0.8, 0.3)
    for (let i = 0; i < 3; i++) {
      const x = REGIONS[i]!, key = i * 20
      const start = 0.04 + i * 0.17
      const provision = gesture(view, t, start, start + 0.14, 0.9 - i * 0.03, 0.99 - i * 0.02)
      const switchOver = gesture(view, t, start + 0.15, start + 0.3, 0.76 + (2 - i) * 0.05, 0.86 + (2 - i) * 0.05)
      const working = gesture(view, t, start, start + 0.05, start + 0.28, start + 0.34)
      line(project, x, 21, x, 14, 0, -17, hair * 0.8, 0.3)
      panel(project, x, -6, 22, 40, 0, key, hair * 0.8, 0.035, 0.58)
      if (!small) {
        line(project, x - 7, 9, x + 3, 9, 0.1, key + 1, hair * 0.8, 0.4)
        line(project, x - 7, -23, x + 7, -23, 0.1, key + 1, hair * 0.65, 0.25)
      }
      // The old live slot drains only as the new slot enters the live bay.
      const old = 1 - switchOver
      if (old > 0.002) {
        panel(project, x, -14, 16 * old, 9, 0.2, key + 2, hair * 0.75, 0.07 * old, 0.62 * old)
        line(project, x - 5 * old, -14, x + 5 * old, -14, 0.3, key + 3, hair * 1.4, old * 0.8)
      }
      if (provision > 0.002) {
        const y = mix(1, -14, switchOver), z = mix(7, 0.7, provision) + 2 * (1 - switchOver)
        // A lit lower edge makes the standby's lift actual depth.
        for (let j = 0; j < 4; j++) {
          world[j]![0] = x + (j === 1 || j === 2 ? 8 : -8)
          world[j]![1] = y - 4.5
          world[j]![2] = z - (j > 1 ? 1.7 : 0)
        }
        const edge = projectPath(world, project, xy)
        depth.face(edge.xy, key + 4, lambert(...turn(0, -1, 0)))
        panel(project, x, y, 16, 9, z, key + 5, hair * 0.9, 0.13 * provision, 0.8 * provision)
        line(project, x - 5, y, x + 5, y, z + 0.1, key + 6, hair * 1.5, 0.87 * provision, 'c1')
        line(project, x - 7, y + 4.5, x + 7, y + 4.5, z + 0.2, key + 7, hair * 1.3, working, 'accent')
      }
      // The traffic rail connects to the live bay throughout the handoff.
      line(project, x + 8.5, 5, x + 8.5, -14, 0.2, key + 8, hair * 0.65, 0.3)
      project(x + 8.5, mix(-14, 1, working), 0.4, a)
      a.z = key + 9
      depth.dot(a, small ? 1.8 : 1.2, 0.6 + working * 0.3)
      line(project, x - 5, -32, x + 5, -32, 0, key + 10, hair, 0.28 + switchOver * 0.4)
      if (!small) for (let j = 0; j <= i; j++) line(project, x - 3 + j * 3, -35, x - 3 + j * 3, -37, 0, key + 10, hair * 0.7, 0.3)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Regional services provision a standby and transfer traffic one rack at a time. */
export function LoaderOutpost(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
