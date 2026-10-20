'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'portico', title: 'Portico', category: 'software', technique: 'lines',
  tags: ['dashboard', 'cards', 'metrics', 'chart', 'analytics', 'refresh'],
  description: 'A dashboard resolves its two metric cards before plotting the detailed chart below. Unequal columns grow from a common baseline, the latest sample takes the accent and a header receipt closes only after all cards are ready; the cards clear for the next refresh.',
  order: 17,
  colors: [{ part: 'Series', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the chart’s columns lean toward `c1`, a data series; the
 * latest sample stays the accent, the cards the ink. */

const HEIGHTS = [8, 14, 10, 20, 17] as const

export const scene: Scene = {
  beats: 6, still: 0.64,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    rect(pen, 10, 16, 80, 70, hair * 0.9, 0.62, 0.025, 'ink', 3)
    rule(pen, 17, 24, 23, hair * 1.5, 0.7)
    if (!small) rule(pen, 17, 29, 13, hair * 0.7, 0.25)
    const ready = gesture(view, t, 0.7, 0.76, 0.8, 0.9)
    pen.line(71, 25, 71 + 11 * ready, 25, hair * 1.45, ready, 'accent')
    for (let i = 0; i < 2; i++) {
      const value = gesture(view, t, 0.08 + i * 0.15, 0.25 + i * 0.15, 0.82 + i * 0.025, 0.94 + i * 0.025)
      const x = 17 + i * 35
      rect(pen, x, 35, 31, 19, hair * 0.7, 0.4, 0.03)
      rule(pen, x + 5, 40, 12, hair * 0.8, 0.27)
      // Two broad strokes read as a metric even at 24px. The shorter
      // suffix appears after its main value rather than fading as a group.
      rule(pen, x + 5, 46, (i ? 10 : 14) * value, hair * 2.1, 0.88)
      if (!small) rule(pen, x + 22, 47, 4 * clamp((value - 0.5) * 2), hair * 0.9, 0.44)
    }
    rect(pen, 17, 60, 66, 19, hair * 0.7, 0.4, 0.025)
    const count = small ? 3 : HEIGHTS.length
    const baseline = 75
    pen.line(23, baseline, 77, baseline, hair * 0.7, 0.3)
    for (let i = 0; i < count; i++) {
      const k = gesture(view, t, 0.34 + i * 0.055, 0.47 + i * 0.055, 0.77 + (count - 1 - i) * 0.026, 0.89 + (count - 1 - i) * 0.026)
      const x = 25 + i * (small ? 21 : 11)
      const h = (small ? [7, 12, 10][i]! : HEIGHTS[i]! * 0.56) * k
      if (h > 0.002) rule(pen, x, baseline - h, small ? 8 : 5, h, i === count - 1 ? 0.86 : 0.57 + i * 0.07, i === count - 1 ? 'accent' : blend('ink', 'c1', 0.6))
    }
    if (!small) {
      // A narrow read bracket descends from summaries into the chart.
      const scan = clamp(view.ease.standard(span(t, 0.07, 0.66)))
      const clear = gesture(view, t, 0.02, 0.1, 0.69, 0.8)
      const y = mix(36, 77, scan)
      if (clear > 0.002) pen.path([86, y - 3, 88, y - 3, 88, y + 3, 86, y + 3], { width: hair * 0.7, alpha: clear * 0.65 })
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Dashboard summaries resolve before their detailed chart and refresh receipt. */
export function LoaderPortico(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
