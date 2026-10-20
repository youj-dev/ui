'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'attest', title: 'Attest', category: 'software', technique: 'lines',
  tags: ['form', 'autofill', 'document', 'extract', 'assistant', 'fields'],
  description: 'A source document supplies the values of an empty form. A read bracket selects each source line, a transfer stroke carries it into its field and the value fills behind the write edge; a single confirmation seals the completed form before the values clear.',
  order: 20,
  colors: [{ part: 'Transfer', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the transfer stroke is `c1` (chart-2); each value glows in it while
 * it is written, then settles to the ink, and a filled field keeps a `c1`
 * outline. The read bracket and the confirmation stay the accent. */

const link = new Array<number>(4).fill(0)

export const scene: Scene = {
  beats: 6, still: 0.53,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view), count = small ? 2 : 3
    // The asymmetric layout makes the provenance visible: one document
    // on the left, a larger form on the right, never two identical lists.
    pen.poly([10, 23, 33, 23, 41, 31, 41, 74, 10, 74], 0.035, 'ink', true)
    pen.path([10, 23, 33, 23, 41, 31, 41, 74, 10, 74], { width: hair * 0.85, alpha: 0.61, closed: true })
    pen.path([33, 23, 33, 31, 41, 31], { width: hair * 0.7, alpha: 0.43 })
    rule(pen, 16, 35, 15, hair * 1.5, 0.7)
    rect(pen, 52, 17, 38, 69, hair * 0.9, 0.65, 0.025, 'ink', 3)
    rule(pen, 59, 25, 19, hair * 1.4, 0.71)
    for (let i = 0; i < count; i++) {
      const from = 0.06 + i * 0.18, y = small ? 44 + i * 19 : 43 + i * 12
      const value = gesture(view, t, from + 0.12, from + 0.27, 0.79 + (count - 1 - i) * 0.025, 0.92 + (count - 1 - i) * 0.025)
      const reading = gesture(view, t, from, from + 0.05, from + 0.2, from + 0.26)
      const sourceY = small ? 47 + i * 17 : 46 + i * 10
      rule(pen, 16, sourceY, 18 - i * 3, hair * 1.2, 0.62)
      if (!small) rule(pen, 16, sourceY + 4, 8, hair * 0.65, 0.24)
      pen.path([13, sourceY - 3, 12, sourceY - 3, 12, sourceY + 3, 13, sourceY + 3], { width: hair, alpha: reading * 0.8, tone: 'accent' })
      // A field's outline takes the transfer's color as its value fills it, and holds it while it's filled.
      rect(pen, 58, y - 4, 26, 9, hair * 0.7, 0.43, 0.035, blend('ink', 'c1', 0.8 * value))
      // A value glows in the transfer's color while it's written, and settles to the ink.
      rule(pen, 62, y, (16 - i * 3) * value, hair * 1.3, 0.8, blend('ink', 'c1', Math.sin(Math.PI * clamp(view.ease.standard(span(t, from + 0.12, from + 0.27))))))
      // A brief write edge sweeps inside the actual field. The values
      // persist after it leaves, rather than following a moving focus box.
      const writing = Math.sin(Math.PI * clamp(view.ease.standard(span(t, from + 0.12, from + 0.27))))
      const wx = 62 + (16 - i * 3) * value
      pen.line(wx, y - 2, wx, y + 2, hair, writing * 0.95, 'accent')
      const u = clamp(view.ease.standard(span(t, from + 0.04, from + 0.16)))
      if (u > 0 && u < 1) {
        const x = mix(35, 61, u), py = mix(sourceY, y, u) - 3 * Math.sin(Math.PI * u)
        link[0] = x - 5; link[1] = py; link[2] = x; link[3] = py
        pen.path(link, { width: hair * 1.1, alpha: Math.sin(Math.PI * u) * 0.78, tone: 'c1' })
      }
    }
    const complete = gesture(view, t, small ? 0.52 : 0.65, small ? 0.61 : 0.74, 0.79, 0.9)
    rect(pen, 66, 75, 18, 6, hair * 0.7, 0.47, 0.07)
    rule(pen, 70, 78, 10 * (1 - complete), hair * 0.9, 0.53)
    tick(pen, 75, 78, 7, hair, complete, complete, 'accent')
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A document supplies successive form fields before one completion receipt. */
export function LoaderAttest(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
