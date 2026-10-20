'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { cursor, gesture, rect, weight } from './workspace'

export const meta = {
  id: 'tangent', title: 'Tangent', category: 'software', technique: 'lines',
  tags: ['vector', 'bezier', 'handles', 'path', 'curve', 'design', 'pen'],
  description: 'A vector editor pulls a tangent handle and bends an S-shaped path between two fixed anchors. The paired handle mirrors the edit, the curve settles into a deeper inflection, and the pointer returns the handles to their original positions.',
  order: 2,
  colors: [{ part: 'Mirror', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the paired handle that mirrors the edit, its arm and point, is `c1`
 *; the handle being pulled stays the accent, the curve the ink. */

const curve = new Array<number>(66).fill(0)
const comparison = new Array<number>(66).fill(0)
const anchors = [[20, 69], [80, 31]] as const

export const scene: Scene = {
  beats: 5.5, still: 0.43,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const bend = gesture(view, t, 0.18, 0.43, 0.66, 0.89)
    const reach = gesture(view, t, 0.03, 0.17, 0.89, 0.98)
    const hx = mix(36, 27, bend), hy = mix(28, 15, bend)
    const qx = mix(64, 73, bend), qy = mix(72, 85, bend)
    rect(pen, 10, 10, 80, 80, hair * 0.65, small ? 0.17 : 0.24, 0.015, 'ink', 2)
    if (view.size >= 80) {
      for (const at of [30, 50, 70]) {
        pen.line(at, 14, at, 86, hair * 0.6, 0.07)
        pen.line(14, at, 86, at, hair * 0.6, 0.07)
      }
    }
    for (let i = 0; i <= 32; i++) {
      const u = i / 32, v = 1 - u
      curve[i * 2] = v ** 3 * 20 + 3 * v * v * u * hx + 3 * v * u * u * qx + u ** 3 * 80
      curve[i * 2 + 1] = v ** 3 * 69 + 3 * v * v * u * hy + 3 * v * u * u * qy + u ** 3 * 31
      comparison[i * 2] = v ** 3 * 20 + 3 * v * v * u * 36 + 3 * v * u * u * 64 + u ** 3 * 80
      comparison[i * 2 + 1] = v ** 3 * 69 + 3 * v * v * u * 28 + 3 * v * u * u * 72 + u ** 3 * 31
    }
    if (!small && bend > 0.01) pen.path(comparison, { width: hair * 0.7, alpha: 0.18 * bend, dash: [hair * 2, hair * 3] })
    // Handle arms are drawn before the curve; anchors knock out the crossing.
    pen.line(20, 69, hx, hy, hair * 0.8, 0.38)
    pen.line(80, 31, qx, qy, hair * 0.8, 0.38, 'c1')
    pen.path(curve, { width: hair * (small ? 1.65 : 1.8), alpha: 0.9, cap: 'round', join: 'round' })
    const r = small ? 3.4 : 2.2
    for (const [x, y] of anchors) rect(pen, x - r, y - r, r * 2, r * 2, hair, 0.92, 0.05, 'ink', 0, true)
    pen.dot(hx, hy, small ? 3.6 : 2.8, 1, 'accent')
    pen.dot(qx, qy, small ? 2.5 : 2, 0.65, 'c1')
    // The tip stays on the moving handle while held, then retreats home.
    cursor(pen, mix(61, hx, reach), mix(15, hy, reach), small ? 1.05 : 0.85)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Tangent handles bend a vector path while its anchors remain pinned. */
export function LoaderTangent(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
