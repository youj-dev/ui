'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { cursor, gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'elide', title: 'Elide', category: 'software', technique: 'lines',
  tags: ['code', 'editor', 'fold', 'indent', 'gutter', 'collapse'],
  description: 'An editor folds a nested block from its gutter. Indented code rules gather behind a compact fold marker, the closing bracket and following lines move up to recover the space, and reopening restores every line to its original indentation.',
  order: 19,
  colors: [{ part: 'Fold', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the folded placeholder and its ellipsis are `c1`, the
 * code it stands for; the gutter marker stays the accent. */

const marker = new Array<number>(6).fill(0)

export const scene: Scene = {
  beats: 5.5, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const folded = gesture(view, t, 0.17, 0.4, 0.66, 0.91)
    rect(pen, 13, 15, 74, 72, hair * 0.9, 0.65, 0.025, 'ink', 3)
    pen.line(13, 28, 87, 28, hair * 0.7, 0.32)
    rule(pen, 20, 21, 21, hair * 1.4, 0.7)
    if (!small) rule(pen, 70, 21, 9, hair * 0.8, 0.29)
    pen.line(29, 33, 29, 80, hair * 0.65, 0.22)
    // A chevron rotates into its folded direction. It is a gutter
    // control, not a caret that pretends to write the code.
    marker[0] = mix(20, 22, folded); marker[1] = mix(35, 33, folded)
    marker[2] = mix(23, 25, folded); marker[3] = mix(38, 36, folded)
    marker[4] = mix(26, 22, folded); marker[5] = mix(35, 39, folded)
    pen.path(marker, { width: hair, alpha: 0.88, tone: 'accent', join: 'round' })
    rule(pen, 35, 35, 14, hair * 1.5, 0.85)
    rule(pen, 53, 35, 10, hair * 1.2, 0.46)
    pen.path([70, 33, 67, 33, 67, 38, 70, 38], { width: hair * 0.8, alpha: 0.58 })

    const rows = small ? 2 : 3, spacing = small ? 13 : 10
    const reclaimed = (small ? 18 : 20) * folded
    for (let i = 0; i < rows; i++) {
      const y = mix(46 + i * spacing, 40, folded)
      const visible = 1 - folded
      rule(pen, 42, y, (i === 1 ? 17 : 27) * visible, hair * 1.3, 0.71 * visible)
      if (!small) rule(pen, 73, y, 5 * visible, hair, 0.34 * visible)
    }
    if (!small) pen.path([38, 43, 38, 67 - reclaimed], { width: hair * 0.65, alpha: 0.26 * (1 - folded) })
    // The fold marker grows from three slits, with square ends, rather
    // than particles. It only appears as the body has gathered away.
    rect(pen, 42, 42, 24 * folded, 7, hair * 0.65, 0.46 * folded, 0.07 * folded, 'c1', 1)
    if (folded > 0.002) for (let i = 0; i < 3; i++) rule(pen, 47 + i * 6, 45, 2 * folded, hair, 0.73 * folded, 'c1')
    const closeY = 74 - reclaimed
    pen.path([35, closeY - 2, 38, closeY - 2, 38, closeY + 3, 35, closeY + 3], { width: hair * 0.8, alpha: 0.65 })
    rule(pen, 46, closeY, 28, hair * 1.25, 0.65)
    rule(pen, 35, 82 - reclaimed, 19, hair * 1.25, 0.48)
    if (!small) {
      const reach = gesture(view, t, 0.02, 0.16, 0.87, 0.98)
      cursor(pen, mix(19, 23, reach), mix(66, 36, reach), 0.6, 0.8)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A gutter fold gathers a nested code block and reclaims its vertical space. */
export function LoaderElide(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
