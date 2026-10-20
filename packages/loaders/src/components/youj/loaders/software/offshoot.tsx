'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, polylineLength, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'offshoot', title: 'Offshoot', category: 'software', technique: 'paths',
  tags: ['commit', 'branch', 'merge', 'version-control', 'history', 'code'],
  description: 'A feature branch leaves the main commit rail and acquires two commits while main advances independently. The branch curves back into one merge commit, the joined history continues, and the new work retraces to its branching point.',
  order: 12,
  colors: [{ part: 'Branch', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the feature branch and its two commits are `c1`, main and
 * the merge the ink; each commit being written still flashes the accent. */

function bend(x0: number, y0: number, x1: number, y1: number) {
  return Array.from({ length: 50 }, (_, i) => {
    const u = Math.floor(i / 2) / 24, v = 1 - u
    return i % 2 === 0 ? mix(x0, x1, u * u * (3 - 2 * u)) : v ** 3 * y0 + 3 * v * v * u * (y0 + 9) + 3 * v * u * u * (y1 - 9) + u ** 3 * y1
  })
}
const ROUTES = [bend(35, 28, 68, 44), [35, 28, 35, 52], [68, 44, 68, 60], bend(68, 60, 35, 77), [35, 52, 35, 77], [35, 77, 35, 88]]
const NODES = [[35, 16], [35, 28], [68, 44], [35, 52], [68, 60], [35, 77], [35, 88]] as const
const WINDOWS = [[0.06, 0.26], [0.25, 0.41], [0.32, 0.5], [0.51, 0.67], [0.51, 0.67], [0.68, 0.77]] as const
/** The feature branch's routes: out, along and back to the merge. */
const BRANCH = [0, 2, 3]
const ARRIVALS = [0, 0, 0.26, 0.41, 0.5, 0.67, 0.77] as const
const circle = new Array<number>(48).fill(0)
const UNIT = Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * Math.PI * 2), Math.sin(i / 24 * Math.PI * 2)] as const)

export const scene: Scene = {
  beats: 6, still: 0.6,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const radius = small ? 4 : 3.4
    pen.line(35, 16, 35, 28, hair * 1.45, 0.76)
    for (let i = 0; i < ROUTES.length; i++) {
      const route = ROUTES[i]!, window = WINDOWS[i]!
      pen.path(route, { width: hair * 0.8, alpha: 0.16, join: 'round' })
      const drawn = gesture(view, t, window[0], window[1], 0.8 + (5 - i) * 0.019, 0.88 + (5 - i) * 0.019)
      if (drawn > 0.002) {
        const length = polylineLength(route)
        pen.path(route, { width: hair * 1.45, alpha: 0.78, dash: [length * drawn, length + 1], join: 'round', cap: 'round', tone: BRANCH.includes(i) ? 'c1' : 'ink' })
      }
    }
    for (let i = 0; i < NODES.length; i++) {
      const [x, y] = NODES[i]!, at = ARRIVALS[i]!
      const ready = i < 2 ? 1 : gesture(view, t, at - 0.015, at + 0.055, 0.8 + (6 - i) * 0.02, 0.89 + (6 - i) * 0.016)
      for (let j = 0; j < UNIT.length; j++) { circle[j * 2] = x + UNIT[j]![0] * radius; circle[j * 2 + 1] = y + UNIT[j]![1] * radius }
      pen.poly(circle, 0.03, 'ink', true)
      pen.path(circle, { width: hair, alpha: 0.25 + ready * 0.6, closed: true })
      if (ready > 0.002) pen.dot(x, y, radius * 0.45 * ready, 0.88, i === 2 || i === 4 ? 'c1' : 'ink')
      // A brief accent rim witnesses the commit being written. The two
      // merging rails meet the same paper-backed node, never cross it.
      const writing = i < 2 ? 0 : gesture(view, t, at - 0.05, at, at + 0.06, at + 0.12)
      if (writing > 0.002) pen.path(circle, { width: hair * 1.5, alpha: writing, tone: 'accent', closed: true })
      if (view.size >= 80) {
        rule(pen, x + 7, y - hair / 2, i === 5 ? 15 : 7 + i % 3 * 3, hair * 0.85, 0.16 + ready * 0.32)
      }
    }
    if (!small) {
      rect(pen, 12, 11, 12, 9, hair * 0.65, 0.3, 0.02)
      rule(pen, 15, 15, 6, hair, 0.55)
      const branch = gesture(view, t, 0.2, 0.3, 0.86, 0.96)
      rect(pen, 73, 29, 16, 9, hair * 0.65, branch * 0.35, branch * 0.02)
      rule(pen, 76, 33, 10 * branch, hair, branch * 0.54)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Independent feature and main commits converge into one merge history. */
export function LoaderOffshoot(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
