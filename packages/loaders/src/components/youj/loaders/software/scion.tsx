'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, weight } from './workspace'

export const meta = {
  id: 'scion', title: 'Scion', category: 'software', technique: 'planes',
  tags: ['component', 'instances', 'inheritance', 'design', 'update', 'linked'],
  description: 'A source component lifts from its card and changes its proportions. Two linked instances receive the edit in succession, their inner controls widening to match; the inheritance links release and all three cards return to their original design.',
  order: 3,
  colors: [{ part: 'Inheritance', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the inheritance links are `c1`, and each instance’s
 * control warms toward it as the edit arrives, then settles to the ink; the
 * source’s mark and the travelling edit stay the accent. */

const depth = new Depth()
const world: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
const segmentXY = new Array<number>(4).fill(0)
const a = point(), b = point()
const CARDS = [[0, 26, 8], [-24, -19, 0], [24, -19, -4]] as const

export const scene: Scene = {
  beats: 6, still: 0.5,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const pose = { yaw: -0.22, pitch: -0.28 }
    const project = camera({ ...pose, distance: 330, cx: 50, cy: 50 })
    const turn = orient(pose)
    const source = gesture(view, t, 0.09, 0.27, 0.74, 0.91)
    const clear = 1 - clamp(view.ease.exit(span(t, 0.74, 0.9)))
    // Orthogonal inheritance links live behind the floating component cards.
    for (let i = 1; i < 3; i++) {
      const [x, y, z] = CARDS[i]!
      world[0]![0] = 0; world[0]![1] = 14; world[0]![2] = 8
      world[1]![0] = 0; world[1]![1] = 6; world[1]![2] = 4
      world[2]![0] = x; world[2]![1] = 6; world[2]![2] = z
      world[3]![0] = x; world[3]![1] = y + 11; world[3]![2] = z
      const f = projectPath(world, project, xy)
      depth.path(f.xy, -100, { width: hair * 0.75, alpha: 0.24, join: 'round', tone: 'c1' })
      const travel = clamp(view.ease.standard(span(t, 0.25 + (i - 1) * 0.14, 0.4 + (i - 1) * 0.14)))
      if (travel > 0 && travel < 1 && clear > 0) {
        const at = travel * 3, segment = Math.min(2, Math.floor(at))
        const p = world[segment]!, q = world[segment + 1]!
        project(mix(p[0], q[0], at - segment), mix(p[1], q[1], at - segment), mix(p[2], q[2], at - segment), a)
        a.z = -99
        depth.dot(a, small ? 2.5 : 1.8, Math.sin(Math.PI * travel) * clear, 'accent')
      }
    }

    for (let i = 0; i < 3; i++) {
      const [x, y, base] = CARDS[i]!
      const update = i === 0 ? source : gesture(view, t, 0.39 + (i - 1) * 0.14, 0.51 + (i - 1) * 0.14, 0.77 + (i - 1) * 0.035, 0.93 + (i - 1) * 0.025)
      const z = base + 5 * update
      const width = small ? 31 : 29, height = 23
      const box = (bx: number, by: number, w: number, h: number, bz: number) => {
        for (let j = 0; j < 4; j++) {
          world[j]![0] = bx + (j === 1 || j === 2 ? w : 0)
          world[j]![1] = by - (j > 1 ? h : 0)
          world[j]![2] = bz
        }
        return projectPath(world, project, xy)
      }
      const key = i * 20
      // A thin underside gives the lift a real, readable edge.
      for (let j = 0; j < 4; j++) {
        world[j]![0] = x + (j === 1 || j === 2 ? width / 2 : -width / 2)
        world[j]![1] = y - height / 2
        world[j]![2] = z - (j > 1 ? 2 : 0)
      }
      const edge = projectPath(world, project, xy)
      depth.face(edge.xy, key, lambert(...turn(0, -1, 0)))
      const card = box(x - width / 2, y + height / 2, width, height, z)
      depth.poly(card.xy, key + 1, 0.04, 'ink', true)
      depth.path(card.xy, key + 2, { width: hair * 0.8, alpha: 0.55, closed: true })
      if (!small) {
        project(x - width / 2 + 4, y + 6, z, a)
        project(x - width / 2 + 13, y + 6, z, b)
        segmentXY[0] = a.x; segmentXY[1] = a.y; segmentXY[2] = b.x; segmentXY[3] = b.y
        depth.path(segmentXY, key + 3, { width: hair, alpha: 0.38 })
      }
      const controlW = mix(12, 21, update), controlH = mix(5, 8, update)
      const control = box(x - controlW / 2, y + controlH / 2 - 2, controlW, controlH, z + 0.1)
      depth.poly(control.xy, key + 4, 0.16 + 0.12 * update)
      // An instance's control warms toward the inheritance color as the edit reaches it, and settles back.
      depth.path(control.xy, key + 5, { width: hair, alpha: 0.76, closed: true, tone: i === 0 ? 'ink' : blend('ink', 'c1', 0.85 * Math.sin(Math.PI * update)) })
      if (i === 0) {
        project(x - controlW / 2, y - controlH / 2 - 2, z + 0.2, a)
        project(x + controlW / 2, y - controlH / 2 - 2, z + 0.2, b)
        segmentXY[0] = a.x; segmentXY[1] = a.y; segmentXY[2] = b.x; segmentXY[3] = b.y
        depth.path(segmentXY, key + 6, { width: hair * 1.5, alpha: 0.95, tone: 'accent' })
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An edited source control passes its new dimensions to two linked instances. */
export function LoaderScion(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
