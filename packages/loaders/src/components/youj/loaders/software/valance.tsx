'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { cursor, gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'valance', title: 'Valance', category: 'software', technique: 'planes',
  tags: ['app', 'sheet', 'panel', 'overlay', 'settings', 'confirm'],
  description: 'An app opens a side sheet over its workspace. The page recedes, the sheet seats against the window edge and reveals its controls in order; a confirmation closes the action before the sheet withdraws and restores the page.',
  order: 15,
  colors: [{ part: 'Sheet', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the side sheet is outlined and faintly tinted in `c1`,
 * the layer over the page; the confirmation stays the accent. */

export const scene: Scene = {
  beats: 6, still: 0.54,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const open = gesture(view, t, 0.09, 0.3, 0.78, 0.96)
    const content = gesture(view, t, 0.27, 0.4, 0.77, 0.85)
    const done = gesture(view, t, 0.62, 0.71, 0.76, 0.84)
    rect(pen, 10, 19, 80, 66, hair, 0.64, 0.025, 'ink', 3)
    pen.line(10, 32, 90, 32, hair * 0.8, 0.32)
    rule(pen, 17, 25, 22, hair * 1.5, 0.72)
    rect(pen, 74, 23, 9, 5, hair * 0.8, 0.64, 0.08)

    // The underlying page stays in place as its contrast recedes. The
    // sheet covers its own portion with paper, as a real overlay would.
    const page = 1 - open * 0.63
    pen.line(29, 37, 29, 79, hair * 0.7, 0.26 * page)
    for (let i = 0; i < (small ? 2 : 3); i++) rule(pen, 16, 41 + i * 12, 8, hair * 1.4, 0.55 * page)
    rect(pen, 35, 39, 47, 14, hair * 0.65, 0.3 * page, 0.06 * page)
    rule(pen, 40, 44, 26, hair * 1.4, 0.65 * page)
    for (let i = 0; i < 2; i++) rect(pen, 35 + i * 25, 60, 22, 17, hair * 0.65, 0.3 * page, 0.055 * page)
    if (open > 0.002) {
      const x = mix(76, 43, open), y = mix(41, 34, open)
      rect(pen, x, y, 44 * open, 48 * open, hair, 0.76 * open, 0.035, 'c1', 2, true)
      if (content > 0.002) {
        rule(pen, x + 6, y + 7, 20 * content, hair * 1.6, 0.83 * content)
        if (!small) {
          pen.line(x + 34, y + 6, x + 37, y + 9, hair * 0.65, content * 0.44)
          pen.line(x + 34, y + 9, x + 37, y + 6, hair * 0.65, content * 0.44)
        }
        for (let i = 0; i < 2; i++) {
          const row = gesture(view, t, 0.32 + i * 0.07, 0.44 + i * 0.07, 0.75, 0.84)
          if (row <= 0.002) continue
          rect(pen, x + 6, y + 16 + i * 10, 31, 6, hair * 0.65, 0.44 * row, 0.06 * row)
          rule(pen, x + 10, y + 18 + i * 10, (i ? 13 : 20) * row, hair, 0.62 * row)
        }
        rect(pen, x + 22, y + 37, 15, 6, hair * 0.8, 0.72 * content, 0.15 * content)
        rule(pen, x + 25, y + 40, 9 * (1 - done), hair, 0.64 * content)
        tick(pen, x + 29, y + 40, 6, hair, done, done, 'accent')
      }
    }
    if (!small) {
      const reach = gesture(view, t, 0.01, 0.09, 0.86, 0.98)
      const submit = gesture(view, t, 0.47, 0.61, 0.73, 0.84)
      cursor(pen, mix(mix(83, 77, reach), 71, submit), mix(mix(12, 25, reach), 74, submit), 0.65, 0.8)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A side sheet seats over an app and confirms an action before closing. */
export function LoaderValance(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
