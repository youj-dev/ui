'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'winnow', title: 'Winnow', category: 'software', technique: 'planes',
  tags: ['filter', 'list', 'results', 'criteria', 'narrow', 'records'],
  description: 'A filter criterion locks into a list toolbar. Nonmatching records slide out, matching rows close the gaps without changing their order, and the result count settles before clearing the criterion restores the complete list.',
  order: 11,
  colors: [{ part: 'Matches', mono: 'ink', role: 'success' }],
} satisfies LoaderMeta

/* Color: the matching rows’ checks are `c1` (success); the criterion stays
 * the accent, the records the ink. */

const FUNNEL = [20, 19, 34, 19, 29, 24, 29, 29, 25, 31, 25, 24] as const
const LENGTHS = [30, 38, 23, 32, 36] as const

export const scene: Scene = {
  beats: 5.5, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const count = small ? 4 : 5, step = 52 / count
    const criterion = gesture(view, t, 0.04, 0.18, 0.8, 0.97)
    const settle = gesture(view, t, 0.28, 0.56, 0.72, 0.91)
    rect(pen, 12, 13, 76, 22, hair * 0.8, 0.51, 0.035, 'ink', 3)
    pen.path(FUNNEL, { width: hair, alpha: 0.8, closed: true, join: 'round' })
    const chipX = mix(58, 43, criterion)
    rect(pen, chipX, 19, 22, 10, hair * 0.7, 0.25 + criterion * 0.4, 0.045)
    rule(pen, chipX + 4, 23, 10, hair * 1.1, 0.6)
    rule(pen, chipX + 4, 28, 14 * criterion, hair, criterion * 0.95, 'accent')
    if (!small) {
      // The count loses one slot per rejected record; it is not a progress bar.
      for (let i = 0; i < count; i++) rule(pen, 73 + i * 2, 24, 1, 3, i < Math.ceil(count / 2) ? 0.6 : 0.6 * (1 - settle))
    }

    for (let i = 0; i < count; i++) {
      const match = i % 2 === 0
      const reject = match ? 0 : gesture(view, t, 0.18 + i * 0.035, 0.32 + i * 0.035, 0.79 + i * 0.02, 0.91 + i * 0.02)
      const alpha = 1 - reject
      if (alpha < 0.002) continue
      const rank = Math.floor(i / 2)
      const y = match ? mix(42 + i * step, 42 + rank * step, settle) : 42 + i * step
      const x = 12 + 7 * reject, height = step - 3
      rect(pen, x, y, 76, height, hair * 0.65, 0.33 * alpha, 0.03 * alpha, 'ink', 2, true)
      // A little record thumbnail and its title remain attached as it moves.
      rect(pen, x + 5, y + 3, small ? 5 : 4, height - 6, hair * 0.65, 0.55 * alpha, 0.14 * alpha, 'ink', 0)
      rule(pen, x + 16, y + height / 2 - hair / 2, LENGTHS[i]!, hair * 1.25, 0.76 * alpha)
      if (match) tick(pen, x + 67, y + height / 2, small ? 6 : 5, hair * 0.9, settle, 0.6 * settle, 'c1')
    }
    if (view.size >= 80) {
      const completed = gesture(view, t, 0.55, 0.65, 0.7, 0.8)
      rule(pen, 17, 91, 17 * completed, hair * 0.8, 0.4 * completed)
      rule(pen, 39, 91, 8 * completed, hair * 0.8, 0.23 * completed)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Filtering removes nonmatches while the surviving records keep their order. */
export function LoaderWinnow(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
