'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'graft', title: 'Graft', category: 'software', technique: 'planes',
  tags: ['diff', 'patch', 'code', 'editor', 'merge', 'changes'],
  description: 'Two code panes hold the old and proposed versions of a small function. Removed lines contract, two added lines cross the gutter and seat between unchanged context, and the applied version separates back into its review panes.',
  order: 5,
  colors: [{ part: 'Added', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the added lines sit on a `c1` highlight, like a diff’s;
 * their markers stay the accent and the context the ink. */

const CONTEXT = [[0, 18], [1, 26], [4, 22], [5, 12]] as const
const chevron = [47, 47, 50, 50, 47, 53] as const

export const scene: Scene = {
  beats: 6, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const patch = gesture(view, t, 0.25, 0.61, 0.77, 0.97)
    rect(pen, 8, 18, 38, 64, hair, 0.6, 0.018, 'ink', 3)
    rect(pen, 54, 18, 38, 64, hair, 0.38, 0.018, 'ink', 3)
    pen.line(8, 28, 46, 28, hair * 0.7, 0.28)
    pen.line(54, 28, 92, 28, hair * 0.7, 0.23)
    rule(pen, 14, 22, 13, hair, 0.52)
    rule(pen, 60, 22, 13, hair, 0.4)
    if (!small) pen.path(chevron, { width: hair, alpha: 0.38 * (1 - patch), cap: 'round', join: 'round' })

    // Shared context never vanishes. Its indentation identifies an editor.
    for (const [row, length] of CONTEXT) {
      if (small && row === 5) continue
      const y = 35 + row * 7
      const indent = row === 0 || row === 5 ? 0 : 4
      rule(pen, 14 + indent, y, Math.min(length, 26 - indent), hair * 1.2, 0.7)
      rule(pen, 60 + indent, y, Math.min(length, 26 - indent), hair * 1.2, 0.36 * (1 - patch * 0.55))
      if (!small) {
        rule(pen, 11, y, 1.3, hair * 0.8, 0.25)
        rule(pen, 57, y, 1.3, hair * 0.8, 0.2)
      }
    }
    for (let i = 0; i < 2; i++) {
      const y = 49 + i * 7
      const remove = gesture(view, t, 0.13 + i * 0.045, 0.27 + i * 0.045, 0.86 + i * 0.025, 0.97 + i * 0.015)
      const take = gesture(view, t, 0.28 + i * 0.12, 0.47 + i * 0.12, 0.77 + i * 0.04, 0.94 + i * 0.04)
      // Minus marks stay attached to departing old lines.
      rule(pen, 10, y, 3 * (1 - remove), hair, 0.7 * (1 - remove))
      rule(pen, 18, y, (i ? 15 : 21) * (1 - remove), hair * 1.25, 0.64 * (1 - remove))
      // Added lines keep their identity while crossing the review gutter.
      const x = mix(64, 18, take), lift = Math.sin(Math.PI * take) * (small ? 3 : 5)
      rect(pen, x - 3, y - 2.5 - lift, i ? 22 : 25, 5.5, hair * 0.65, 0.13, 0.06, 'c1', 1, true)
      rule(pen, x, y - lift, i ? 17 : 20, hair * 1.25, 0.9)
      rule(pen, x - 7, y - lift, 3, hair, 0.94, 'accent')
      if (!small) rule(pen, x - 5.5 - hair / 2, y - 1.5 - lift, hair, 3, 0.94, 'accent')
    }
    // Only after both lines seat does the patch acquire its success witness.
    const done = clamp(view.ease.standard(span(t, 0.61, 0.69))) * (1 - clamp(view.ease.exit(span(t, 0.73, 0.8))))
    tick(pen, 80, 73, small ? 10 : 7, hair * 1.25, done, done, 'accent')
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Added code crosses a diff gutter and seats between unchanged context lines. */
export function LoaderGraft(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
