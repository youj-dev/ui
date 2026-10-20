'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'lexicon', title: 'Lexicon', category: 'interface', technique: 'lines',
  tags: ['index', 'documents', 'terms', 'postings', 'search', 'dataset'],
  description: 'Three documents contribute their matching terms to an inverted index. Each read comb dispatches two curved transfer strokes, ordered document tabs seat beneath the corresponding term headers, and the completed posting lists unwrite back to their sources.',
  order: 15,
  colors: [{ part: 'Postings', mono: 'ink' }],
} satisfies LoaderMeta

const TERMS = [[0, 2], [1, 2], [0, 1]] as const
const transfers = TERMS.flatMap((terms, doc) => terms.map((term, at) => ({
  doc, term, at, rank: TERMS.slice(0, doc).filter((v) => v.some((i) => i === term)).length,
})))
const depth = new Depth()
const p = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.49,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.18, pitch: -0.23, distance: 390, cx: 49, cy: 51 })
    const clear = 1 - view.ease.exit(span(t, 0.8, 0.98))
    for (let term = 0; term < 3; term++) {
      const x = 9 + term * 15
      const header = window(depth, project, x, 30, 0, 11, 8, hair, 0.68, 0.06)
      rule(depth, project, x, 26, 0, x, -24, 0, hair * 0.75, 0.26)
      if (!small) for (let n = 0; n <= term; n++) rule(depth, project, x - 3.5 + n * 3.1, 29, 0.2, x - 3.5 + n * 3.1, 32, 0.2, hair, 0.8, 'ink', header + 0.1)
    }
    for (let doc = 0; doc < 3; doc++) {
      const y = 25 - doc * 25
      const card = window(depth, project, -27, y, 1, 23, 17, hair, 0.7, 0.035)
      if (small) rule(depth, project, -33, y, 1.3, -21, y, 1.3, hair, 0.74, 'ink', card + 0.1)
      for (let at = 0; at < 2; at++) {
        if (small) break
        const term = TERMS[doc]![at]!
        rule(depth, project, -34, y + 3 - at * 6, 1.3, -23 + term * 2, y + 3 - at * 6, 1.3, hair * 1.25, 0.74, 'ink', card + 0.1)
      }
      const read = span(t, 0.04 + doc * 0.2, 0.2 + doc * 0.2)
      const light = Math.sin(Math.PI * read) * clear
      if (light > 0.002) {
        const cy = y + mix(6, -6, view.ease.standard(read))
        rule(depth, project, -37, cy, 2, -17, cy, 2, hair * 1.45, light, 'accent', card + 0.2)
      }
    }
    for (const r of transfers) {
      const start = 0.08 + r.doc * 0.2 + r.at * 0.045
      const u = clamp(view.ease.standard(span(t, start, start + 0.15)))
      if (u <= 0 || clear <= 0) continue
      const x0 = -17, y0 = 28 - r.doc * 25 - r.at * 6
      const x1 = 9 + r.term * 15, y1 = 14 - r.rank * 20
      // Transfer lanes bow above the record plane; the moving tip is part
      // of the stroke, rather than a detached particle.
      if (!small || u < 1) {
        xy.length = 0
        for (let i = 0; i <= 18; i++) {
          const s = u * i / 18, e = s * s * (3 - 2 * s)
          project(mix(x0, x1, s), mix(y0, y1, e), 2 + 10 * Math.sin(Math.PI * s), p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, 45, { width: hair, alpha: (0.18 + 0.55 * Math.sin(Math.PI * u)) * clear, tone: 'c1', join: 'round' })
      }
      const seat = clamp(view.ease.emphasized(span(t, start + 0.1, start + 0.18))) * clear
      if (seat <= 0.002) continue
      const z = 2 + 5 * (1 - seat)
      const card = window(depth, project, x1, y1, z, 11, 8 * seat, hair, 0.85 * seat, 0.1)
      if (!small) for (let j = 0; j <= r.doc; j++) rule(depth, project, x1 - 3.4 + j * 3, y1 - seat, z + 0.2, x1 - 3.4 + j * 3, y1 + 1.6 * seat, z + 0.2, hair, 0.86 * seat, 'c1', card + 0.1)
    }
    const bind = view.ease.standard(span(t, 0.65, 0.74)) * clear
    if (bind > 0) rule(depth, project, 3, -29, 1, mix(3, 45, bind), -29, 1, hair * 1.35, bind, 'accent')
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Documents populate ordered term posting lists.
 *
 * Color: the postings, each term’s flight from a document into the index and the marks it seats there, are `c1`; the documents and terms keep the ink, the reading line and the binding the accent. */
export function LoaderLexicon(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
