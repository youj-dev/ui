'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { dataPlane } from './data-plane'

export const meta = {
  id: 'reduce', title: 'Reduce', category: 'interface', technique: 'lines',
  tags: ['compiler', 'syntax tree', 'reduction', 'expression', 'assembly', 'build'],
  description: 'Four operand records fold into two intermediate instructions, which then lower into one wide output register. The records keep their strokes while travelling down separate depth lanes; consumed operands fill their parent instructions, and the expression expands in reverse dependency order.',
  order: 39,
  colors: [{ part: 'Values', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const VALUES = [3, 6, 4, 7]

export const scene: Scene = {
  beats: 6, still: 0.37,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 0.95) / view.px
    const pose = { yaw: -0.22, pitch: -0.2 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 49 })
    const light = lambert(...orient(pose)(0, 0, 1))
    const folds = [0, 1].map(bank => clamp(view.ease.emphasized(span(t, 0.04 + bank * 0.16, 0.25 + bank * 0.16))) * (1 - view.ease.emphasized(span(t, 0.82 - bank * 0.06, 0.98 - bank * 0.06))))
    const root = clamp(view.ease.emphasized(span(t, 0.45, 0.64))) * (1 - view.ease.emphasized(span(t, 0.69, 0.81)))

    const wire = (x: number, y: number, tx: number, ty: number, alpha: number) => {
      xy.length = 0
      for (const [xx, yy] of [[x, y - 5], [x, (y + ty) / 2], [tx, (y + ty) / 2], [tx, ty + 5]]) {
        project(xx!, yy!, -4, p); xy.push(p.x, p.y)
      }
      depth.path(xy, -12, { width: hair * 0.8, alpha, join: 'miter' })
    }
    for (let leaf = 0; leaf < 4; leaf++) wire(-27 + leaf * 18, 26, leaf < 2 ? -18 : 18, 1, 0.18 + 0.28 * (1 - folds[leaf < 2 ? 0 : 1]!))
    for (const x of [-18, 18]) wire(x, 1, 0, -25, 0.2 + 0.3 * (1 - root))

    // The output widens as it absorbs the two lowered instructions. Its
    // socket and the four leaf sockets remain visible throughout the loop.
    const output = dataPlane(depth, project, 0, -25, 0, mix(11, 35, root), 10, hair * 0.8, light, 0.85)
    if (root > 0.004) for (let j = 0; j < 3; j++) {
      project(-12 * root, -23 - j * 2, 0.2, p); project((j === 2 ? 6 : 12) * root, -23 - j * 2, 0.2, q)
      depth.path([p.x, p.y, q.x, q.y], output + 0.04, { width: hair * 0.8, alpha: root * 0.85, tone: j === 2 ? 'accent' : 'c1' })
    }
    for (let bank = 0; bank < 2; bank++) {
      const x0 = bank === 0 ? -18 : 18, fold = folds[bank]!
      const x = mix(x0, 0, root), y = mix(1, -25, root)
      const z = (bank === 0 ? 10 : -7) * Math.sin(Math.PI * root)
      // Intermediate instructions shrink on ingestion, exposing the
      // strokes accumulating inside the final register beneath them.
      const size = 1 - root
      if (size > 0.004) {
        const order = dataPlane(depth, project, x, y, z, mix(9, 20, fold) * size, 9 * size, hair * 0.75, light, 0.75)
        if (fold > 0.01) for (let j = 0; j < 2; j++) {
          project(x - 7 * size, y + (j ? -1.6 : 1.6) * size, z + 0.2, p)
          project(x + (VALUES[bank * 2 + j]! - 2) * size, y + (j ? -1.6 : 1.6) * size, z + 0.2, q)
          depth.path([p.x, p.y, q.x, q.y], order + 0.04, { width: hair, alpha: fold * size * 0.85, tone: 'c1' })
        }
      }
      for (let local = 0; local < 2; local++) {
        const leaf = bank * 2 + local, start = -27 + leaf * 18
        const lx = mix(start, x0, fold), ly = mix(26, 1, fold)
        const lz = (local === 0 ? 9 : -6) * Math.sin(Math.PI * fold)
        const scale = 1 - span(fold, 0.65, 1)
        if (scale <= 0.004) continue
        const order = dataPlane(depth, project, lx, ly, lz, 12 * scale, 8 * scale, hair * 0.7, light, 0.82)
        project(lx - 4 * scale, ly + scale, lz + 0.2, p); project(lx + (VALUES[leaf]! - 3) * scale, ly + scale, lz + 0.2, q)
        depth.path([p.x, p.y, q.x, q.y], order + 0.04, { width: hair, alpha: 0.82, tone: 'c1' })
        if (!small) {
          project(lx - 4 * scale, ly - 1.5 * scale, lz + 0.2, p); project(lx - scale, ly - 1.5 * scale, lz + 0.2, q)
          depth.path([p.x, p.y, q.x, q.y], order + 0.04, { width: hair * 0.65, alpha: 0.5 })
        }
      }
    }
    if (!small) for (let leaf = 0; leaf < 4; leaf++) {
      project(-31 + leaf * 18, 34, -2, p); project(-23 + leaf * 18, 34, -2, q)
      depth.line(p, q, hair * 0.65, 0.27)
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Operand records reduce bottom-up into a single output instruction.
 *
 * Color: the values, each leaf’s and each partial result’s, are `c1` as they fold down into the output; the cards and wires keep the ink, the output’s last stroke the accent. */
export function LoaderReduce(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
