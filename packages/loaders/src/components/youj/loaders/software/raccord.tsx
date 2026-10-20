'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { gesture, rect, rule, tick, weight } from './workspace'

export const meta = {
  id: 'raccord', title: 'Raccord', category: 'software', technique: 'lines',
  tags: ['sync', 'records', 'stores', 'replication', 'bidirectional', 'data'],
  description: 'Two record stores exchange three edits in both directions. A changed source value travels through the shared gap before its corresponding destination updates; acknowledgements close the row brackets and the paired stores agree before their edits release.',
  order: 18,
  colors: [{ part: 'Record', mono: 'ink' }, { part: 'Acknowledged', mono: 'ink', role: 'success' }],
} satisfies LoaderMeta

/* Color: each record in flight is outlined in `c1`, and the
 * acknowledgement that closes its exchange is `c2` (success); the value it
 * carries and the final agreement stay the accent. */

const OLD = [11, 16, 13] as const
const NEW = [20, 10, 19] as const
const packet = new Array<number>(8).fill(0)

export const scene: Scene = {
  beats: 6, still: 0.63,
  draw(pen, t, view) {
    const small = view.size < 32, hair = weight(view), count = small ? 2 : 3
    for (const x of [10, 58]) {
      rect(pen, x, 25, 32, 53, hair, 0.65, 0.035, 'ink', 3)
      rule(pen, x + 6, 31, 13, hair * 1.4, 0.7)
      pen.line(x, 37, x + 32, 37, hair * 0.65, 0.32)
    }
    for (let i = 0; i < count; i++) {
      const from = 0.06 + i * 0.2, send = from + 0.12, arrive = send + 0.16
      const source = gesture(view, t, from, from + 0.11, 0.82, 0.96)
      const destination = gesture(view, t, arrive, arrive + 0.09, 0.83, 0.97)
      const rightward = i !== 1, y = small ? 47 + i * 20 : 46 + i * 12
      for (let bank = 0; bank < 2; bank++) {
        const x = bank ? 64 : 16
        const local = (bank === 0) === rightward ? source : destination
        rule(pen, x, y, mix(OLD[i]!, NEW[i]!, local), hair * (small ? 1.7 : 1.4), 0.78)
        if (!small) rule(pen, x, y + 5, 8 + i * 2, hair * 0.7, 0.25)
      }
      pen.line(43, y, 57, y, hair * 0.6, 0.2)
      const u = clamp(view.ease.standard(span(t, send, arrive)))
      const flight = Math.sin(Math.PI * u)
      if (u > 0 && u < 1) {
        // The transported mark is a tiny record, with a readable value
        // stroke. Its curved flight remains above the destination rule.
        const x = mix(rightward ? 36 : 64, rightward ? 64 : 36, u)
        const py = y - 8 * flight
        packet[0] = x - 5; packet[1] = py - 3; packet[2] = x + 5; packet[3] = py - 3
        packet[4] = x + 5; packet[5] = py + 3; packet[6] = x - 5; packet[7] = py + 3
        pen.poly(packet, 0.06, 'ink', true)
        pen.path(packet, { width: hair * 0.7, alpha: 0.85 * flight, closed: true, tone: 'c1' })
        rule(pen, x - 3, py - hair * 0.5, 6, hair, 0.95 * flight, 'accent')
      }
      const ack = gesture(view, t, arrive + 0.06, arrive + 0.13, 0.8, 0.92)
      const edge = rightward ? 88 : 12, dir = rightward ? -1 : 1
      pen.path([edge + dir * 3, y - 3, edge, y - 3, edge, y + 3, edge + dir * 3, y + 3], { width: hair * 0.75, alpha: ack * 0.75, tone: 'c2' })
    }
    const agreed = gesture(view, t, small ? 0.53 : 0.73, small ? 0.62 : 0.79, 0.82, 0.93)
    pen.path([26, 80, 26, 86, 43, 86], { width: hair * 0.7, alpha: 0.3 * agreed })
    pen.path([74, 80, 74, 86, 57, 86], { width: hair * 0.7, alpha: 0.3 * agreed })
    tick(pen, 50, 86, 9, hair * 1.1, agreed, agreed, 'accent')
    if (!small) {
      // Direction witnesses above the stores establish the bidirectional
      // exchange without making the whole drawing a pair of arrows.
      pen.path([29, 20, 29, 15, 70, 15, 67, 12], { width: hair * 0.7, alpha: 0.29 })
      pen.path([71, 20, 71, 15], { width: hair * 0.7, alpha: 0.29 })
    }
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Two record stores exchange edits and acknowledge each corresponding write. */
export function LoaderRaccord(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
