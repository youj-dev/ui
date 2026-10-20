'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'quire', title: 'Quire', category: 'software', technique: 'lines',
  tags: ['query', 'table', 'database', 'results', 'records', 'rows'],
  description: 'A compact query strip dispatches into a waiting table. Result rows slide into their ruled slots and reveal unequal values column by column, an accent write bracket follows the returning batch, and the rows drain before the next query.',
  order: 4,
  colors: [{ part: 'Results', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: each value arrives in `c1` as its cell is written and
 * settles to the ink; the execute chevron and the write bracket stay the
 * accent. */

const VALUES = [[0.78, 0.48, 0.65], [0.52, 0.82, 0.45], [0.9, 0.6, 0.8], [0.64, 0.4, 0.56], [0.42, 0.72, 0.7]] as const
const bracket = new Array<number>(8).fill(0)

export const scene: Scene = {
  beats: 6, still: 0.49,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const count = small ? 3 : view.size < 80 ? 4 : 5
    const rowH = 48 / count
    const query = gesture(view, t, 0.03, 0.14, 0.78, 0.92)
    rect(pen, 15, 12, 70, 13, hair * 0.8, 0.46, 0.03)
    // A query token, two operands and a small execute chevron; no text UI.
    rule(pen, 21, 17, 10, hair * 1.3, 0.78)
    rule(pen, 36, 17, 19 * query, hair * 1.3, 0.55)
    if (!small) rule(pen, 59, 17, 10 * query, hair * 1.3, 0.3)
    pen.line(77, 16, 80, 18.5, hair, 0.7, 'accent')
    pen.line(80, 18.5, 77, 21, hair, 0.7, 'accent')

    const flight = clamp(view.ease.standard(span(t, 0.13, 0.23)))
    if (flight > 0 && flight < 1) pen.line(50, mix(26, 31, flight), 50, mix(28, 33, flight), hair * 1.5, Math.sin(Math.PI * flight), 'accent')
    rect(pen, 15, 33, 70, 55, hair, 0.63, 0.018)
    rule(pen, 15, 33, 70, 7, 0.06)
    pen.line(15, 40, 85, 40, hair * 0.8, 0.35)
    const columns = small ? 2 : 3
    const colW = 70 / columns
    for (let c = 1; c < columns; c++) pen.line(15 + c * colW, 33, 15 + c * colW, 88, hair * 0.65, 0.17)
    if (!small) for (let c = 0; c < columns; c++) rule(pen, 20 + c * colW, 35.5, colW * 0.45, hair * 0.8, 0.45)

    for (let i = 0; i < count; i++) {
      const arrive = 0.22 + i * 0.075
      const on = clamp(view.ease.enter(span(t, arrive, arrive + 0.095)))
      const off = clamp(view.ease.exit(span(t, 0.77 + i * 0.025, 0.88 + i * 0.025)))
      const shown = on * (1 - off)
      const y = 40 + i * rowH
      if (i > 0) pen.line(15, y, 85, y, hair * 0.65, 0.17)
      if (shown < 0.003) continue
      const dy = mix(-3, 0, on) + 3 * off
      rule(pen, 17, y + 1 + dy, 66, rowH - 2, 0.025 * shown)
      for (let c = 0; c < columns; c++) {
        const written = clamp(view.ease.standard(span(t, arrive + c * 0.022, arrive + 0.095 + c * 0.022)))
        rule(pen, 20 + c * colW, y + rowH / 2 - hair / 2 + dy, (colW - 10) * VALUES[i]![c]! * written, hair * (small ? 1.25 : 1.05), 0.75 * shown, blend('c1', 'ink', span(t, arrive + 0.095 + c * 0.022, arrive + 0.2 + c * 0.022)))
      }
    }
    // A single write bracket moves down the batch instead of lighting every cell.
    const track = span(t, 0.22, 0.62) * count
    const idx = Math.min(count - 1, Math.floor(track))
    const local = clamp(view.ease.standard(clamp(track - idx)))
    const by = 40 + Math.min(count - 1, idx + local) * rowH
    const active = gesture(view, t, 0.2, 0.26, 0.63, 0.72)
    if (active > 0.003) {
      bracket[0] = 12; bracket[1] = by + 2; bracket[2] = 9; bracket[3] = by + 2
      bracket[4] = 9; bracket[5] = by + rowH - 2; bracket[6] = 12; bracket[7] = by + rowH - 2
      pen.path(bracket, { width: hair * 1.25, alpha: active, tone: 'accent', join: 'round' })
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A query returns rows into a table, with one write bracket following the batch. */
export function LoaderQuire(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
