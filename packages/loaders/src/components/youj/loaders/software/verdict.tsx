'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'verdict', title: 'Verdict', category: 'software', technique: 'lines',
  tags: ['tests', 'suite', 'assertions', 'checks', 'code', 'success'],
  description: 'A test suite works through a stack of assertions. Each active row grows its result rule and resolves into an ink check, the suite counter fills one segment per passing test, and one accent confirmation appears only after the last assertion completes.',
  order: 6,
  colors: [{ part: 'Passed', mono: 'ink', role: 'success' }],
} satisfies LoaderMeta

/* Color: each passing test’s check and its segment of the counter are `c1`
 * (success); the suite’s final mark stays the accent. */

const arc = new Array<number>(34).fill(0)
const LEFT_CODE = [19, 17, 15, 20, 19, 23] as const
const RIGHT_CODE = [26, 17, 30, 20, 26, 23] as const
const LENGTHS = [31, 23, 36, 27] as const

export const scene: Scene = {
  beats: 6, still: 0.51,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const count = view.size >= 80 ? 4 : 3
    const step = 49 / count
    const release = 1 - clamp(view.ease.exit(span(t, 0.8, 0.97)))
    // A compact suite header: code brackets and a per-test completion meter.
    if (!small) {
      pen.path(LEFT_CODE, { width: hair, alpha: 0.55, join: 'round' })
      pen.path(RIGHT_CODE, { width: hair, alpha: 0.55, join: 'round' })
    }
    const start = small ? 17 : 37, meterW = small ? 51 : 43
    for (let i = 0; i < count; i++) {
      const at = 0.07 + i * 0.15
      const pass = clamp(view.ease.standard(span(t, at + 0.125, at + 0.18))) * release
      const width = (meterW - (count - 1) * 3) / count
      rule(pen, start + i * (width + 3), 19, width, hair * 1.8, 0.12)
      rule(pen, start + i * (width + 3), 19, width * pass, hair * 1.8, 0.72, 'c1')

      const y = 32 + i * step
      rect(pen, 13, y, 74, step - 3, hair * 0.65, 0.22, 0.02)
      const cy = y + (step - 3) / 2
      const run = gesture(view, t, at, at + 0.045, at + 0.09, at + 0.125)
      const rr = small ? 4 : 3.1
      pen.dot(23, cy, rr, 0.04, 'ink')
      // Only the current test has an open running arc. Completion replaces
      // it with a drawn check; the rest of the suite keeps its settled state.
      if (run > 0.002) {
        const local = span(t, at, at + 0.18)
        for (let j = 0; j <= 16; j++) {
          const a = -Math.PI / 2 + local * Math.PI * 2 + j / 16 * Math.PI * 1.4
          arc[j * 2] = 23 + Math.cos(a) * rr
          arc[j * 2 + 1] = cy + Math.sin(a) * rr
        }
        pen.path(arc, { width: hair, alpha: 0.9 * run, cap: 'round' })
      }
      tick(pen, 23, cy, small ? 9 : 7, hair * 1.2, pass, pass, 'c1')
      const length = small ? 36 - i * 5 : LENGTHS[i]!
      rule(pen, 34, cy - hair / 2, length, hair * 1.1, mix(0.23, 0.62, pass))
      const work = clamp(view.ease.standard(span(t, at + 0.025, at + 0.13))) * release
      if (!small) {
        rule(pen, 34, cy + 3.5, length, hair * 0.65, 0.1)
        rule(pen, 34, cy + 3.5, length * work, hair * 0.65, 0.48)
      }
    }
    const done = clamp(view.ease.standard(span(t, 0.07 + count * 0.15, 0.15 + count * 0.15))) * release
    tick(pen, 82, 20, small ? 10 : 8, hair * 1.4, done, done, 'accent')
    if (view.size >= 80) {
      rule(pen, 17, 87, 28 * done, hair * 0.8, 0.4 * done)
      rule(pen, 50, 87, 12 * done, hair * 0.8, 0.22 * done)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Assertions resolve one by one before the suite earns its accent confirmation. */
export function LoaderVerdict(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
