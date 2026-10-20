'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, lambert, mix, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'splice', title: 'Splice', category: 'interface', technique: 'planes',
  tags: ['linker', 'compile', 'relocation', 'sections', 'addresses', 'assembly'],
  description: 'Three object sections dock into one continuous address space. Unresolved reference slots acquire their relocated targets through raised binding arches, the image closes along its address ruler, and the bindings release before the sections separate.',
  order: 45,
  colors: [{ part: 'References', mono: 'ink' }],
} satisfies LoaderMeta

const SECTIONS = [{ from: -23, to: -18, width: 18 }, { from: 0, to: -2, width: 14 }, { from: 23, to: 16, width: 22 }]
const REFERENCES = [{ source: 0, at: -2, target: 2, offset: -5 }, { source: 2, at: 5, target: 1, offset: 1 }]
const centers = SECTIONS.map(() => [0, 0, 0])
const xy: number[] = [], arch: number[] = []
const p = point(), q = point(), depth = new Depth()

export const scene: Scene = {
  beats: 6, still: 0.6,
  draw(pen, t, view) {
    const small = view.size < 32, hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.28, pitch: -0.65 }
    const lens = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 50 })
    const project = (x: number, y: number, z: number, out: typeof p) => lens(x * 1.2, y * 1.2, z * 1.2, out)
    const turn = orient(pose)
    const plane = (x0: number, x1: number, y: number, z0: number, z1: number) => {
      xy.length = 0
      let z = 0
      for (let j = 0; j < 4; j++) { project(j === 0 || j === 3 ? x0 : x1, y, j < 2 ? z0 : z1, p); xy.push(p.x, p.y); z += p.z / 4 }
      return z
    }
    plane(-28, 28, -0.5, 6, 22)
    depth.poly(xy, -100, 0.025, 'ink', true)
    depth.path(xy, -99, { width: hair * 0.85, alpha: 0.28, closed: true })
    for (let i = 0; i < 3; i++) {
      const section = SECTIONS[i]!
      const arrive = view.ease.emphasized(span(t, 0.03 + i * 0.11, 0.2 + i * 0.11))
      const leave = view.ease.emphasized(span(t, 0.79 + (2 - i) * 0.025, 0.92 + (2 - i) * 0.025))
      const fit = arrive * (1 - leave), c = centers[i]!
      c[0] = mix(section.from, section.to, fit); c[1] = 11 * (1 - fit) + 9 * Math.sin(Math.PI * fit); c[2] = mix(-18, 14, fit)
      const half = section.width / 2 - 0.65, y = c[1]!, x = c[0]!, z = c[2]!
      const key = plane(x - half, x + half, y, z - 6, z + 6)
      depth.face(xy, key, lambert(...turn(0, 1, 0)))
      depth.path(xy, key + 0.03, { width: hair, alpha: 0.85, closed: true })
      // The section has thickness; its ruled contents travel with it and
      // retain their local offsets throughout relocation.
      xy.length = 0
      for (const [xx, yy] of [[x - half, y], [x + half, y], [x + half, y - 2], [x - half, y - 2]]) { project(xx!, yy!, z + 6, p); xy.push(p.x, p.y) }
      depth.face(xy, key + 0.05, lambert(...turn(0, 0, 1)))
      depth.path(xy, key + 0.06, { width: hair * 0.7, alpha: 0.65, closed: true })
      if (!small) for (let row = 0; row < 3; row++) {
        project(x - half + 2, y + 0.1, z - 3.4 + row * 2.8, p)
        project(x - half + 2 + (section.width - 5) * (row === 1 ? 0.57 : 0.83), y + 0.1, z - 3.4 + row * 2.8, q)
        depth.line(p, q, hair * 0.75, 0.66)
      }
    }
    const clear = 1 - view.ease.exit(span(t, 0.74, 0.81))
    REFERENCES.forEach((ref, index) => {
      const source = centers[ref.source]!, target = centers[ref.target]!
      const x0 = source[0]! + ref.at, x1 = target[0]! + ref.offset
      const on = view.ease.standard(span(t, 0.44 + index * 0.085, 0.55 + index * 0.085)) * clear
      project(x0, source[1]! + 0.2, source[2]! + 1.5, p)
      project(x0, source[1]! + 0.2, source[2]! + 4, q)
      depth.line(p, q, hair * 1.5, 0.9)
      if (on > 0.004) {
        arch.length = 0
        let key = 0
        const samples = small ? 12 : 24
        for (let j = 0; j <= samples; j++) {
          const u = j / samples * on
          project(mix(x0, x1, u), mix(source[1]!, target[1]!, u) + 0.5 + (index === 0 ? 16 : 10) * Math.sin(Math.PI * u), mix(source[2]! + 2.7, target[2]! - 2.7, u), p)
          arch.push(p.x, p.y); key += p.z / (samples + 1)
        }
        depth.path(arch, key + 0.2, { width: hair * 1.15, alpha: 0.87 * clear, join: 'round', tone: 'c1' })
        project(x1 - 2, target[1]! + 0.3, target[2]! - 2.7, p); project(x1 + 2, target[1]! + 0.3, target[2]! - 2.7, q)
        depth.line(p, q, hair * 1.45, on, index === 1 ? 'accent' : 'c1')
      }
    })
    // Addresses are attached to the output, so the image is sealed only
    // after both relocated references have their destination slots.
    project(-28, -3, 25, p); project(28, -3, 25, q)
    depth.line(p, q, hair * 0.75, 0.3)
    if (!small) for (let j = 0; j <= 7; j++) {
      project(-28 + j * 8, -3, 25, p); project(-28 + j * 8, -3, 28, q); depth.line(p, q, hair * 0.7, 0.45)
    }
    const seal = view.ease.standard(span(t, 0.65, 0.73)) * clear
    if (seal > 0.004) {
      project(-28, 0.3, 22, p); project(mix(-28, 28, seal), 0.3, 22, q)
      depth.line(p, q, hair * 1.3, 0.92 * clear)
      project(mix(-28, 28, Math.max(0, seal - 0.14)), 0.3, 22, p)
      depth.line(p, q, hair * 1.6, Math.sin(Math.PI * seal) * clear, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Object sections relocate into a linked image with resolved reference arches.
 *
 * Color: the relocated references, each arch from a section to its new target and the slot it lands in, are `c1`; the sections and the image keep the ink, one slot and the seal the accent. */
export function LoaderSplice(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
