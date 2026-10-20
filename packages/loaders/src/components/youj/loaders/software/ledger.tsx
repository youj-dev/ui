'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, mix, polylineLength, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'ledger', title: 'Ledger', category: 'software', technique: 'lines',
  tags: ['spreadsheet', 'formula', 'recalculate', 'cells', 'dependencies', 'sum'],
  description: 'An edited spreadsheet input invalidates its dependent cells. Two source values contribute to a subtotal, that subtotal recomputes a final result, and an active cell outline follows the calculation through the grid before the edit unwinds.',
  order: 10,
  colors: [{ part: 'Recalculation', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the dependency routes are `c1`, and the values that
 * change glow in it while the sheet recalculates, then settle to the ink;
 * the active cell stays the accent. */

const INPUT_LINK = [29, 46, 29, 62, 53, 62] as const
const TOTAL_LINK = [53, 62, 77, 62, 77, 78] as const
const EQUALS = [20, 19, 26, 19, 20, 22, 26, 22] as const

export const scene: Scene = {
  beats: 6, still: 0.44,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const edit = gesture(view, t, 0.08, 0.27, 0.85, 0.99)
    const subtotal = gesture(view, t, 0.3, 0.47, 0.8, 0.94)
    const result = gesture(view, t, 0.5, 0.65, 0.74, 0.87)
    const calculating = gesture(view, t, 0.23, 0.31, 0.65, 0.74)
    rect(pen, 11, 13, 78, 14, hair * 0.8, 0.43, 0.03)
    pen.line(EQUALS[0], EQUALS[1], EQUALS[2], EQUALS[3], hair, 0.66)
    pen.line(EQUALS[4], EQUALS[5], EQUALS[6], EQUALS[7], hair, 0.66)
    rule(pen, 34, 19, 10, hair * 1.3, 0.57)
    pen.line(50, 17, 50, 23, hair * 0.85, 0.45)
    pen.line(47, 20, 53, 20, hair * 0.85, 0.45)
    rule(pen, 59, 19, 14, hair * 1.3, 0.57)
    rule(pen, 33, 25, 42 * calculating, hair, calculating * 0.8, 'accent')

    rect(pen, 11, 32, 78, 54, hair, 0.7, 0.02)
    rule(pen, 11, 32, 78, 6, 0.065)
    rule(pen, 11, 38, 6, 48, 0.045)
    for (let c = 0; c < 3; c++) pen.line(17 + c * 24, 32, 17 + c * 24, 86, hair * 0.65, 0.23)
    for (let r = 0; r < 3; r++) pen.line(11, 38 + r * 16, 89, 38 + r * 16, hair * 0.65, 0.23)
    if (!small) for (let i = 0; i < 3; i++) {
      rule(pen, 27 + i * 24, 34, 4, hair * 0.75, 0.34)
      rule(pen, 13, 45 + i * 16, 2, hair * 0.75, 0.34)
    }

    // The bars retain their values. A1 changes 6 → 14, B2 = A1 + 10,
    // C3 = B2 × 0.75; the different scales fit each cell's value range.
    // The values that change glow in the recalculation's color while it runs, and settle to the ink.
    const glow = blend('ink', 'c1', 0.75 * calculating)
    rule(pen, 21, 44, mix(6, 14, edit), hair * 1.7, 0.9, glow)
    rule(pen, 21, 60, 10, hair * 1.7, 0.66)
    rule(pen, 45, 60, mix(16, 24, subtotal) * 0.65, hair * 1.7, 0.78, glow)
    rule(pen, 69, 76, mix(12, 18, result) * 0.85, hair * 1.7, 0.88, glow)
    if (!small) {
      for (const route of [INPUT_LINK, TOTAL_LINK]) pen.path(route, { width: hair * 0.65, alpha: 0.14, dash: [2, 2], join: 'round' })
      for (let i = 0; i < 2; i++) {
        const k = i === 0 ? subtotal : result, route = i === 0 ? INPUT_LINK : TOTAL_LINK
        const length = polylineLength(route)
        if (k > 0.002) pen.path(route, { width: hair * 0.9, alpha: 0.4 * calculating, dash: [length * k, length + 1], join: 'round', tone: 'c1' })
      }
    }
    // A selection advances by actual dependency stages, never in reading order.
    const first = gesture(view, t, 0.02, 0.08, 0.25, 0.3)
    const second = gesture(view, t, 0.28, 0.34, 0.47, 0.52)
    const last = gesture(view, t, 0.49, 0.55, 0.69, 0.77)
    for (let i = 0; i < 3; i++) {
      const on = i === 0 ? first : i === 1 ? second : last
      if (on > 0.002) rect(pen, 17 + i * 24, 38 + i * 16, 24, 16, hair * 1.35, on * 0.92, 0, 'accent', 0)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A spreadsheet edit recomputes its subtotal and final dependent cell. */
export function LoaderLedger(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
