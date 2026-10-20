'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { cursor, gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'cadence', title: 'Cadence', category: 'software', technique: 'lines',
  tags: ['auto-layout', 'spacing', 'design', 'distribution', 'padding', 'constraints'],
  description: 'Auto-layout gathers three unequal controls onto a common centreline. Their gaps become equal, the parent widens and redistributes the spare space, and paired spacing rulers follow the constraints before the controls return to their loose arrangement.',
  order: 9,
  colors: [{ part: 'Rulers', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the spacing rulers are `c1`, like a layout tool’s
 * redlines; the controls keep the ink and the equal-gap mark stays the
 * accent. */

const WIDTHS = [13, 20, 11] as const
const HEIGHTS = [17, 25, 20] as const
const FROM_X = [21, 41, 70] as const
const FROM_Y = [41, 32, 48] as const
const positions = new Array<number>(3).fill(0)

export const scene: Scene = {
  beats: 5.5, still: 0.56,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const align = gesture(view, t, 0.14, 0.34, 0.81, 0.98)
    const expand = gesture(view, t, 0.39, 0.61, 0.7, 0.85)
    const rulers = gesture(view, t, 0.26, 0.39, 0.79, 0.88)
    const w = mix(74, 86, expand), x = 50 - w / 2
    rect(pen, x, 29, w, 45, hair, 0.62, 0.02, 'ink', 2)
    const gap = (w - 14 - 44) / 2
    if (!small) {
      for (const at of [x + 7, x + w - 7]) pen.line(at, 33, at, 70, hair * 0.65, 0.23 * align, 'ink')
      pen.line(x + 3, 51.5, x + w - 3, 51.5, hair * 0.65, 0.18 * rulers)
    }
    let offset = 0
    for (let i = 0; i < 3; i++) {
      const width = WIDTHS[i]!, height = HEIGHTS[i]!
      const target = x + 7 + offset
      const cx = mix(FROM_X[i]!, target, align), cy = mix(FROM_Y[i]!, 51.5 - height / 2, align)
      positions[i] = cx
      rect(pen, cx, cy, width, height, hair * 0.85, 0.77, 0.085, 'ink', 1, true)
      rule(pen, cx + 3, cy + height / 2 - hair / 2, width - 6, hair * 1.3, 0.65)
      offset += width + gap
    }
    // Equal-space rulers are consequences of layout, and stretch with it.
    for (let i = 0; i < 2; i++) {
      const a = positions[i]! + WIDTHS[i]!, b = positions[i + 1]!
      const y = 81
      if (rulers > 0.002) {
        pen.line(a, y, b, y, hair * 0.8, rulers * 0.52, 'c1')
        pen.line(a, y - 3, a, y + 3, hair * 0.8, rulers * 0.52, 'c1')
        pen.line(b, y - 3, b, y + 3, hair * 0.8, rulers * 0.52, 'c1')
        // One active gap, rather than colouring every child and guide.
        if (i === 0) rule(pen, (a + b) / 2 - 2, y - hair / 2, 4, hair, rulers * 0.95, 'accent')
      }
    }
    rect(pen, 37, 10, 26, 12, hair * 0.7, 0.42, 0.03)
    for (let i = 0; i < 3; i++) rule(pen, 42 + i * 6, 13, 3, 6, 0.4 + 0.35 * align)
    if (!small) {
      const reach = gesture(view, t, 0.01, 0.13, 0.84, 0.97)
      cursor(pen, mix(70, 57, reach), mix(14, 18, reach), 0.65, 0.85)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Unequal children distribute evenly as their auto-layout parent widens. */
export function LoaderCadence(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
