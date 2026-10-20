'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'
import { dataPlane } from './data-plane'

export const meta = {
  id: 'folio', title: 'Folio', category: 'interface', technique: 'planes',
  tags: ['index', 'page split', 'b tree', 'separator', 'records', 'database'],
  description: 'An insertion fills an index page and separates it into two ordered leaves. The right leaf copies its first key into a raised parent; routing branches connect only after that separator seats, then the split reunites for the next insertion.',
  order: 29,
  colors: [{ part: 'Keys', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()

export const scene: Scene = {
  beats: 5.8, still: 0.66,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.25, pitch: -0.34 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 50 })
    const light = lambert(...orient(pose)(0, 0, 1))
    const stage = (a: number, b: number, c: number, d: number) =>
      clamp(view.ease.emphasized(span(t, a, b))) * (1 - clamp(view.ease.standard(span(t, c, d))))
    const insert = stage(0.035, 0.19, 0.88, 1)
    const split = stage(0.23, 0.4, 0.84, 0.96)
    const promote = stage(0.4, 0.56, 0.76, 0.86)
    const route = stage(0.54, 0.66, 0.69, 0.78)

    // Two contiguous half-pages become separate physical leaves. Their
    // original records stay in order throughout the split and reunion.
    for (let bank = 0; bank < 2; bank++) {
      const cx = (bank ? 1 : -1) * (13.5 + 9.5 * split)
      const z = split * (bank ? 2 : -2)
      window(depth, project, cx, -18, z, 27, 22, hair, 0.72, 0.045)
      for (let slot = 0; slot < 3; slot++) {
        const key = bank * 3 + slot + 1
        const dx = cx - 8 + slot * 8
        const incoming = key === 6 ? insert : 1
        const x = key === 6 ? mix(34, dx, incoming) : dx
        const y = key === 6 ? mix(11, -18, incoming) : -18
        const zz = z + 4 + (key === 6 ? 12 * Math.sin(Math.PI * incoming) : 0)
        const order = dataPlane(depth, project, x, y, zz, 6, 13, hair * 0.65, light, 0.68)
        rule(depth, project, x, y - 4.5, zz + 0.12, x, y - 4.5 + key * 1.4, zz + 0.12, hair, 0.85, 'c1', order + 0.05)
        if (key === 6) rule(depth, project, x - 3, y + 6.5, zz + 0.15, x + 3, y + 6.5, zz + 0.15, hair * 1.25, Math.sin(Math.PI * incoming) ** 2, 'accent', order + 0.06)
      }
      // The leaf-to-leaf link survives promotion; only its span changes.
      if (!small && bank === 0) {
        rule(depth, project, cx + 13.5, -24, z, -cx - 13.5, -24, -z, hair * 0.7, split * 0.4)
      }
    }

    // Copy the first right-hand key into the parent, rather than deleting
    // it from the leaf. The copy has a visible flight and its own depth.
    if (promote > 0.003) {
      const x = mix(5.5 + 9.5 * split, 0, promote)
      const y = mix(-18, 23, promote)
      const z = 3 + 9 * Math.sin(Math.PI * promote)
      const order = dataPlane(depth, project, x, y, z, 13 * promote, 13 * promote, hair * 0.9, light)
      rule(depth, project, x - 3 * promote, y, z + 0.15, x + 3 * promote, y, z + 0.15, hair * 1.25, promote, 'accent', order + 0.05)
      if (!small) rule(depth, project, x, y - 4 * promote, z + 0.15, x, y - promote, z + 0.15, hair * 0.7, promote * 0.65, 'ink', order + 0.05)
    }

    for (const sign of [-1, 1]) {
      const cx = sign * (13.5 + 9.5 * split)
      const first = clamp(route * 3)
      const across = clamp(route * 3 - 1)
      const last = clamp(route * 3 - 2)
      rule(depth, project, 0, 16.5, 2, 0, mix(16.5, 5, first), 2, hair, first * 0.75)
      rule(depth, project, 0, 5, 2, cx * across, 5, sign * 2, hair, across * 0.75)
      rule(depth, project, cx, 5, sign * 2, cx, mix(5, -7, last), sign * 2, hair, last * 0.75)
    }
    if (!small) {
      rule(depth, project, -37, -33, -6, 37, -33, -6, hair * 0.7, 0.23)
      for (const x of [-27, 0, 27]) rule(depth, project, x, -32, -6, x, -35, -6, hair * 0.7, 0.3)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A full leaf splits and promotes a separator into a new index level.
 *
 * Color: each record’s key, the rule whose height is its value, is `c1`; the leaves and the route keep the ink, the inserted and promoted keys the accent. */
export function LoaderFolio(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
