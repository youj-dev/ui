'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'amanuensis', title: 'Amanuensis', category: 'software', technique: 'lines',
  tags: ['assistant', 'ai', 'response', 'document', 'streaming', 'writing'],
  description: 'A small assistant message feeds a document. Unequal word strokes arrive in reading order behind a moving caret, the caret wraps at the margin, and a completion mark settles beneath the response before the text retracts along the same lines.',
  order: 14,
  colors: [{ part: 'Words', mono: 'ink' }, { part: 'Done', mono: 'ink', role: 'success' }],
} satisfies LoaderMeta

/* Color: each word is written in `c1` and settles to the ink a few
 * characters behind the caret; the completion mark is `c2` (success). The
 * caret stays the accent. */

const PAPER = [27, 12, 69, 12, 79, 22, 79, 88, 27, 88] as const
const FOLD = [69, 12, 69, 22, 79, 22] as const
const WORDS = [[10, 14, 7], [16, 8, 7], [8, 10, 12], [13, 17], [9, 12]] as const
interface Word { x: number; y: number; length: number; from: number; to: number }
function paragraph(rows: number) {
  const words: Word[] = []
  let offset = 0
  for (let r = 0; r < rows; r++) {
    let x = 34
    for (const length of WORDS[r]!) {
      words.push({ x, y: 39 + r * (rows === 3 ? 12 : 8), length, from: offset, to: offset + length })
      offset += length + 3; x += length + 3
    }
  }
  return { words, total: offset - 3 }
}
const PARAGRAPHS = [paragraph(3), paragraph(4), paragraph(5)]

export const scene: Scene = {
  beats: 6, still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const plan = PARAGRAPHS[small ? 0 : view.size < 80 ? 1 : 2]!
    const connection = gesture(view, t, 0.03, 0.12, 0.7, 0.82)
    const write = span(t, 0.12, 0.68), clear = span(t, 0.8, 0.98)
    const at = plan.total * write * (1 - clear)
    pen.poly(PAPER, 0.025, 'ink', true)
    pen.path(PAPER, { width: hair, alpha: 0.65, closed: true, join: 'round' })
    pen.poly(FOLD, 0.08)
    pen.path(FOLD, { width: hair * 0.8, alpha: 0.45, join: 'round' })
    rule(pen, 34, 23, small ? 23 : 26, hair * 1.7, 0.85)
    if (!small) rule(pen, 34, 29, 17, hair * 0.9, 0.32)

    // The assistant is a generic message, not a brand mark or a sparkle.
    rect(pen, 5, 35, 16, 17, hair * 0.85, 0.52, 0.045, 'ink', 3, true)
    rule(pen, 9, 40, 8, hair * 1.2, 0.55 + 0.2 * connection)
    if (!small) rule(pen, 9, 45, 5, hair, 0.4)
    pen.line(21, 44, mix(21, 27, connection), 44, hair * 0.8, 0.5 * connection)

    let caretX = 34, caretY = 39
    for (const word of plan.words) {
      const progress = clamp(view.ease.standard(clamp((at - word.from) / word.length)))
      // A word is written in the response's color and settles to the ink a few characters on.
      rule(pen, word.x, word.y, word.length * progress, hair * (small ? 1.25 : 1.4), 0.78, blend('c1', 'ink', (at - word.from - word.length) / 10))
      if (at >= word.from) { caretX = word.x + word.length * progress + 1.5; caretY = word.y }
    }
    // No independent blinking clock: the caret belongs to this same loop,
    // and rests visibly at the margin until the next line starts.
    const caret = gesture(view, t, 0.08, 0.14, 0.7, 0.76) + gesture(view, t, 0.79, 0.83, 0.95, 0.99)
    rule(pen, caretX, caretY - 2.5, hair * 1.05, small ? 8 : 5.5, clamp(caret), 'accent')
    const done = gesture(view, t, 0.68, 0.75, 0.77, 0.83)
    tick(pen, 66, 80, small ? 8 : 6, hair * 1.1, done, 0.75 * done, 'c2')
    if (view.size >= 80) rule(pen, 34, 80, 20 * done, hair * 0.85, 0.28 * done)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An assistant streams word strokes into a document, wrapping its live caret. */
export function LoaderAmanuensis(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
