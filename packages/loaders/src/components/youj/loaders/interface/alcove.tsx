'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'alcove', title: 'Alcove', category: 'interface', technique: 'planes',
  tags: ['hash', 'index', 'collision', 'probe', 'records', 'allocation'],
  description: 'Three distinct records hash to the same address. The first seats at home; the next two inspect occupied slots and descend through a linear probe to the first vacancy, preserving each resident key before the insertions retrace their own routes.',
  order: 17,
  colors: [{ part: 'Keys', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
// The same home address, with progressively longer collision paths.
const ROUTES = [0, 1, 2].map((i) => [
  [-29, 27 - i * 24, 2], [-6, 27, 10],
  ...Array.from({ length: i + 1 }, (_, k) => [-6, 27 - k * 18, 10]),
  [18, 27 - i * 18, 2],
])

export const scene: Scene = {
  beats: 6, still: 0.58,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.3, pitch: -0.24, distance: 370, cx: 51, cy: 51 })
    const clock = t < 0.77 ? span(t, 0.03, 0.74) : 1 - span(t, 0.78, 0.98)
    for (let slot = 0; slot < 4; slot++) {
      const y = 27 - slot * 18
      window(depth, project, 18, y, 0, 34, 14, hair, 0.45, -1)
      // Side returns turn a flat table into open, depth-separated pockets.
      rule(depth, project, 1, y - 7, 0, 1, y - 7, 7, hair * 0.75, 0.3)
      rule(depth, project, 1, y - 7, 7, 35, y - 7, 7, hair * 0.75, 0.33)
      if (!small) for (let k = 0; k <= slot; k++) rule(depth, project, 38, y - 2 + k * 1.8, 0, 41, y - 2 + k * 1.8, 0, hair * 0.65, 0.4)
    }
    rule(depth, project, -6, 32, 0, -6, -32, 0, hair * 0.75, 0.25)
    for (let i = 0; i < 3; i++) {
      const route = ROUTES[i]!
      const progress = span(clock, i * 0.32, i * 0.32 + 0.3)
      const steps = route.length - 1
      const at = progress * steps, segment = Math.min(steps - 1, Math.floor(at))
      const u = clamp(view.ease.standard(progress === 1 ? 1 : at - segment))
      const a = route[segment]!, b = route[segment + 1]!
      const x = mix(a[0]!, b[0]!, u), y = mix(a[1]!, b[1]!, u), z = mix(a[2]!, b[2]!, u)
      // An empty source socket remains as the original record travels.
      window(depth, project, -29, 27 - i * 24, 0, 18, 12, hair * 0.7, 0.2, -1)
      const card = window(depth, project, x, y, z, 18, 11, hair, 0.86, 0.12)
      for (let key = 0; key <= i; key++) rule(depth, project, x - 5 + key * 4, y - 2.5, z + 0.3, x - 5 + key * 4, y + 2.5, z + 0.3, hair * 1.3, 0.88, 'c1', card + 0.1)
      const flight = progress > 0 && progress < 1
      if (flight) {
        const collar = Math.sin(Math.PI * u)
        // Inspect at the rail; occupied addresses are bypassed, never overwritten.
        const inspect = segment > 0 && segment < steps - 1
        if (inspect) window(depth, project, 18, a[1]!, 8, 37, 16, hair * 1.35, 0.5 + 0.4 * collar, -1, 'accent')
        rule(depth, project, -6, y, 10, x - 9, y, z, hair, 0.65, 'accent')
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Colliding record keys find vacant pockets through linear probing.
 *
 * Color: each record’s key marks are `c1`, so a record reads as itself wherever it seats; the table and its probes keep the ink, the inspection the accent. */
export function LoaderAlcove(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
