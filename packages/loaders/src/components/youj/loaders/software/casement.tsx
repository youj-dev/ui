'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { cursor, gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'casement', title: 'Casement', category: 'software', technique: 'planes',
  tags: ['browser', 'tabs', 'window', 'page', 'navigation', 'handoff'],
  description: 'A second browser tab opens beside the first. The active underline travels across the tab strip, an article gives way to a compact list, and closing the new tab hands the window back to its original page.',
  order: 8,
  colors: [{ part: 'New tab', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the new tab is outlined in `c1` while it’s open, so it
 * reads apart from the first; the active underline stays the accent. */

export const scene: Scene = {
  beats: 5.5, still: 0.43,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const opened = gesture(view, t, 0.08, 0.25, 0.81, 0.96)
    const active = gesture(view, t, 0.24, 0.4, 0.68, 0.81)
    const reach = gesture(view, t, 0.01, 0.08, 0.89, 0.98)
    rect(pen, 9, 20, 82, 66, hair, 0.66, 0.02, 'ink', 4)
    pen.line(9, 37, 91, 37, hair * 0.8, 0.33)
    rect(pen, 14, 24, 29, 13, hair * 0.65, 0.42, 0.055, 'ink', 2)
    rule(pen, 19, 29, small ? 16 : 13, hair * 1.2, 0.72 - active * 0.36)
    if (opened > 0.002) {
      rect(pen, 46, mix(30, 24, opened), 29 * opened, 13 - 6 * (1 - opened), hair * 0.65, 0.45 * opened, 0.055 * opened, 'c1', 2)
      rule(pen, 51, mix(33, 29, opened), 13 * opened, hair * 1.2, (0.36 + 0.4 * active) * opened)
      if (!small) {
        pen.line(68, 28, 71, 31, hair * 0.7, opened * 0.36)
        pen.line(68, 31, 71, 28, hair * 0.7, opened * 0.36)
      }
    }
    rule(pen, mix(19, 51, active), 36, 19, hair * 1.4, 0.94, 'accent')
    const plusX = mix(52, 82, opened)
    pen.line(plusX - 3, 29, plusX + 3, 29, hair, 0.6)
    pen.line(plusX, 26, plusX, 32, hair, 0.6)

    // Both pages occupy the same viewport. The old one yields before the
    // new rows seat; a short travel remains inside the window's margins.
    const old = 1 - active, dx = -3 * active
    if (old > 0.002) {
      rect(pen, 17 + dx, 45, 66, 16, hair * 0.65, 0.25 * old, 0.11 * old)
      rule(pen, 22 + dx, 50, 32, hair * 1.6, 0.8 * old)
      if (!small) rule(pen, 22 + dx, 55, 19, hair, 0.35 * old)
      for (let i = 0; i < 2; i++) {
        rect(pen, 17 + i * 35 + dx, 66, 31, 12, hair * 0.65, 0.38 * old, 0.035 * old)
        rule(pen, 22 + i * 35 + dx, 71, 19 - i * 4, hair * 1.2, 0.65 * old)
      }
    }
    for (let i = 0; i < 3; i++) {
      const row = gesture(view, t, 0.3 + i * 0.045, 0.44 + i * 0.045, 0.68 + i * 0.025, 0.79 + i * 0.025)
      if (row <= 0.002) continue
      const x = mix(21, 17, row), y = 45 + i * 11
      rect(pen, x, y, 66, 8, hair * 0.6, 0.26 * row, 0.035 * row)
      rule(pen, x + 5, y + 3, 33 - i * 6, hair * 1.35, 0.78 * row)
      if (!small) rule(pen, x + 50, y + 3, 10, hair, 0.28 * row)
    }
    if (!small) cursor(pen, mix(78, plusX, reach), mix(11, 29, reach), 0.7, 0.8)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A new browser tab takes the viewport, then hands it back as it closes. */
export function LoaderCasement(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
