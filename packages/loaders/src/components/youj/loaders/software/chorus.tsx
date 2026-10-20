'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { cursor, gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'chorus', title: 'Chorus', category: 'software', technique: 'planes',
  tags: ['collaboration', 'multiplayer', 'cursors', 'canvas', 'comment', 'alignment'],
  description: 'Collaborators take three scattered cards and bring them onto one shared baseline. Their pointers follow each card independently, an alignment guide closes across the canvas, and a pinned comment appears above the agreed arrangement before the collaborators release it.',
  order: 7,
  colors: [{ part: 'Collaborators', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the other collaborators’ pointers and name tags are `c1`;
 * yours stays the accent, the cards and the guide the ink. */

const FROM = [[17, 39], [43, 29], [68, 45]] as const
const HOME = [[17, 22], [45, 17], [73, 27]] as const
const xs = new Array<number>(3).fill(0), ys = new Array<number>(3).fill(0)
const connector = [51, 39, 51, 45] as const

export const scene: Scene = {
  beats: 6, still: 0.61,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const count = small ? 2 : 3
    rect(pen, 8, 14, 84, 73, hair * 0.75, 0.32, 0.018, 'ink', 2)
    if (view.size >= 80) {
      for (const x of [15, 50, 85]) {
        pen.line(x - 2, 81, x + 2, 81, hair * 0.6, 0.13)
        pen.line(x, 79, x, 83, hair * 0.6, 0.13)
      }
    }
    for (let i = 0; i < count; i++) {
      const from = FROM[small ? i * 2 : i]!
      const drag = gesture(view, t, 0.18 + i * 0.065, 0.39 + i * 0.065, 0.72 + i * 0.04, 0.91 + i * 0.025)
      xs[i] = mix(from[0], small ? 20 + i * 34 : 17 + i * 25, drag)
      ys[i] = mix(from[1], 48, drag)
      const width = small ? 26 : 20, height = 22
      rect(pen, xs[i]!, ys[i]!, width, height, hair * 0.8, 0.58, 0.055, 'ink', 2, true)
      rule(pen, xs[i]! + 4, ys[i]! + 6, width - 8, hair * 1.2, 0.7)
      if (!small) rule(pen, xs[i]! + 4, ys[i]! + 12, (width - 8) * 0.65, hair * 0.8, 0.32)
    }
    const aligned = gesture(view, t, small ? 0.46 : 0.53, small ? 0.54 : 0.61, 0.7, 0.78)
    if (aligned > 0.002) {
      pen.line(13, 71.5, 87, 71.5, hair * 0.85, aligned * 0.6)
      for (const x of [13, 87]) pen.line(x, 69, x, 74, hair * 0.85, aligned * 0.6)
    }
    // A pinned comment is held until the shared alignment releases.
    const comment = gesture(view, t, 0.57, 0.66, 0.72, 0.8)
    if (!small && comment > 0.003) {
      pen.path(connector, { width: hair * 0.7, alpha: 0.35 * comment })
      pen.dot(51, 45, 1.7, comment, 'accent')
      rect(pen, 39, mix(20, 25, comment), 27, 14, hair * 0.8, 0.58 * comment, 0.04 * comment, 'ink', 3, true)
      rule(pen, 44, mix(25, 30, comment), 17 * comment, hair, 0.6 * comment)
      rule(pen, 44, mix(29, 34, comment), 10 * comment, hair * 0.8, 0.28 * comment)
    }
    // Draw pointers last so they retain a crisp paper halo over the cards.
    for (let i = 0; i < count; i++) {
      const at = small ? i * 2 : i
      const reach = gesture(view, t, 0.03 + i * 0.035, 0.17 + i * 0.06, 0.89 + i * 0.025, 0.97 + i * 0.015)
      const home = HOME[at]!
      cursor(pen, mix(home[0], xs[i]! + 4, reach), mix(home[1], ys[i]! + 3, reach), small ? 1.1 : 0.72, i === 0 ? 1 : 0.66, i === 0 ? 'accent' : 'c1')
      if (view.size >= 80) rule(pen, mix(home[0], xs[i]! + 4, reach) + 9, mix(home[1], ys[i]! + 3, reach) + 9, 6 + i * 2, hair * 0.8, i === 0 ? 0.7 : 0.3, i === 0 ? 'accent' : 'c1')
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Independent collaborators align a shared canvas and pin an agreed comment. */
export function LoaderChorus(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
