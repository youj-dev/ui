'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, weight } from './workspace'

export const meta = {
  id: 'pipette', title: 'Pipette', category: 'software', technique: 'planes',
  tags: ['design', 'colour', 'eyedropper', 'swatch', 'palette', 'canvas'],
  description: 'An eyedropper samples a small colour source on a design canvas. The picked colour seats in the palette, transfers to the selected shape and leaves a short selection edge; the tool releases the sample and restores the original fill.',
  order: 16,
  colors: [{ part: 'First swatch', mono: 'ink' }, { part: 'Third swatch', mono: 'ink' }],
} satisfies LoaderMeta

/* Color: the palette holds real colors, its first swatch `c1` and
 * its third `c2`; the sampled color stays the accent. */

const tube = [0, 0, 1, -5, 11, -15, 15, -11, 5, -1] as const
const grip = [9, -17, 13, -21, 21, -13, 17, -9] as const
const tool = new Array<number>(tube.length).fill(0)
const handle = new Array<number>(grip.length).fill(0)

export const scene: Scene = {
  beats: 5.5, still: 0.5,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view)
    const sample = gesture(view, t, 0.1, 0.26, 0.79, 0.96)
    const picked = gesture(view, t, 0.25, 0.34, 0.78, 0.89)
    const applied = gesture(view, t, 0.42, 0.56, 0.72, 0.85)
    rect(pen, 11, 17, 78, 54, hair * 0.8, 0.4, 0.015, 'ink', 2)
    if (!small) {
      // Modest canvas registration; this belongs to a design tool rather
      // than a browser, and carries no product-specific chrome.
      for (const x of [17, 83]) for (const y of [23, 65]) {
        pen.line(x, y, x + (x < 50 ? 4 : -4), y, hair * 0.7, 0.3)
        pen.line(x, y, x, y + (y < 40 ? 4 : -4), hair * 0.7, 0.3)
      }
    }
    pen.dot(29, 43, small ? 8 : 7, 0.82, 'accent')
    rect(pen, 56, 32, 22, 24, hair, 0.75, 0.18, 'ink', 3)
    if (applied > 0.002) rect(pen, 56, 32, 22, 24, hair, 0, 0.34 * applied, 'accent', 3)
    // Selection is a short edge, leaving the sampled fill as the main
    // colour cue. Corner handles are omitted where they would clog it.
    pen.line(56, 59, 56 + 22 * applied, 59, hair * 1.2, applied * 0.9, 'accent')
    if (!small) for (const x of [54, 80]) for (const y of [30, 58]) rect(pen, x - 1, y - 1, 2, 2, hair * 0.65, 0.55 * applied, 0, 'ink', 0, true)

    rect(pen, 19, 76, 62, 14, hair * 0.8, 0.52, 0.045, 'ink', 3)
    const count = small ? 3 : 4, gap = small ? 18 : 14
    for (let i = 0; i < count; i++) {
      const x = 24 + i * gap, chosen = i === 1 ? picked : 0
      rect(pen, x, 79, 10, 8, hair * 0.55, 0.4, 0.12 + i * 0.14, i === 0 ? 'c1' : i === 2 ? 'c2' : 'ink', 1)
      if (chosen > 0.002) rect(pen, x, 79, 10, 8, hair * 0.55, 0, 0.83 * chosen, 'accent', 1)
      if (!small && i === 1) rule(pen, x + 1, 89, 8 * picked, hair * 0.8, picked * 0.8, 'accent')
    }
    // A recognisable eyedropper, with a paper halo behind its open barrel.
    // Its tip touches the source before the palette receives anything.
    const x = mix(47, 29, sample), y = mix(65, 43, sample)
    const scale = small ? 0.88 : 0.8
    for (let i = 0; i < tube.length; i += 2) { tool[i] = x + tube[i]! * scale; tool[i + 1] = y + tube[i + 1]! * scale }
    for (let i = 0; i < grip.length; i += 2) { handle[i] = x + grip[i]! * scale; handle[i + 1] = y + grip[i + 1]! * scale }
    pen.poly(tool, 0.025, 'ink', true)
    pen.path(tool, { width: hair, alpha: 0.9, closed: true, join: 'round' })
    pen.poly(handle, 0.74, 'ink', true)
    pen.line(x + 2 * scale, y - 2 * scale, x + 6 * scale, y - 6 * scale, hair * 1.35, picked, 'accent')
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An eyedropper carries a sampled colour into a palette and a selected shape. */
export function LoaderPipette(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
