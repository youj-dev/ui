'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, mix, span, clamp, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'mullion', title: 'Mullion', category: 'software', technique: 'planes',
  tags: ['responsive', 'breakpoint', 'app', 'window', 'layout', 'reflow'],
  description: 'An app narrows from a wide workspace to a pocket-sized frame. Its sidebar folds into a navigation rail, a two-column card row stacks beneath the header, and every block finds its new margin before the wide layout opens again.',
  order: 1,
  colors: [{ part: 'Cards', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the header block is `c1`, and the cards’ outlines warm
 * toward it while they reflow to their new places, settling to the ink once
 * seated; the current navigation item stays the accent. */

export const scene: Scene = {
  beats: 5.5, still: 0.46,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = weight(view)
    const reflow = gesture(view, t, 0.07, 0.35, 0.74, 0.96)
    const frame = gesture(view, t, 0.21, 0.46, 0.64, 0.85)
    const nav = clamp(view.ease.standard(span(reflow, 0, 0.4)))
    const content = clamp(view.ease.standard(span(reflow, 0.4, 1)))
    // The second card descends before the two cards widen. On the return,
    // the app expands first, the cards narrow, then the second rises.
    const stack = clamp(view.ease.standard(span(content, 0, 0.55)))
    const widen = clamp(view.ease.standard(span(content, 0.55, 1)))
    const w = mix(78, 42, frame), h = mix(58, 78, nav)
    const x = 50 - w / 2, y = 50 - h / 2
    rect(pen, x, y, w, h, hair, 0.72, 0.02, 'ink', 4)
    pen.line(x, y + 10, x + w, y + 10, hair * 0.8, 0.3)
    rule(pen, x + 7, y + 4, mix(14, 10, frame), hair * 1.2, 0.72)
    if (!small) rule(pen, x + 26, y + 4, w - 34, hair, 0.16)

    // The same navigation items become horizontal, rather than disappearing.
    for (let i = 0; i < (small ? 2 : 3); i++) {
      const nx = mix(x + 6, x + 7 + i * 10, nav)
      const ny = mix(y + 18 + i * 11, y + 17, nav)
      rule(pen, nx, ny, mix(9, 5, nav), hair * (small ? 1.4 : 1.1), i === 0 ? 0.85 : 0.35, i === 0 ? 'accent' : 'ink')
    }
    if (!small) pen.line(x + 21, y + 15, x + 21, y + h - 7, hair * 0.7, 0.2 * (1 - nav))

    const cx = mix(x + 27, x + 6, content), cy = mix(y + 16, y + 27, nav)
    const cw = mix(w - 33, w - 12, content)
    rect(pen, cx, cy, cw, mix(14, 12, nav), hair * 0.65, 0.26, 0.08, 'c1')
    rule(pen, cx + 4, cy + 4, cw * 0.58, hair * 1.1, 0.72)
    if (!small) rule(pen, cx + 4, cy + 8, cw * 0.35, hair * 0.8, 0.3)

    for (let i = 0; i < 2; i++) {
      const cardW = mix((cw - 5) / 2, cw, widen)
      const cardX = mix(cx + i * (cw + 5) / 2, cx, widen)
      const cardY = cy + mix(20, 17 + i * 14, stack)
      const cardH = mix(17, 11, stack)
      rect(pen, cardX, cardY, cardW, cardH, hair * 0.7, 0.48, 0.035, blend('ink', 'c1', 0.85 * Math.sin(Math.PI * content)))
      rule(pen, cardX + 4, cardY + 4, (cardW - 8) * (i ? 0.66 : 0.85), hair * 1.2, 0.66)
      if (!small) rule(pen, cardX + 4, cardY + 8, (cardW - 8) * 0.45, hair * 0.75, 0.28)
    }
    if (view.size >= 80) {
      // Outside resize rails reveal the breakpoint without product chrome.
      const active = clamp(view.ease.standard(span(t, 0.04, 0.12))) * (1 - clamp(view.ease.standard(span(t, 0.93, 0.99))))
      for (const side of [-1, 1]) pen.line(50 + side * (w / 2 + 4), 44, 50 + side * (w / 2 + 4), 56, hair, active * 0.42)
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A responsive app's navigation and cards reflow between two breakpoints. */
export function LoaderMullion(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
