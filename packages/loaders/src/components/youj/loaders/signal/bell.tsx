'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, mix, seeded, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'bell',
  title: 'Bell',
  category: 'signal',
  technique: 'particles',
  tags: ['distribution', 'histogram', 'bell curve', 'normal', 'galton', 'probability', 'statistics'],
  description: 'Square particles drop through a board of pegs, falling left or right at each, and stack in the bins below into a bell, which a curve then traces before the bins empty and it begins again.',
  order: 12,
  colors: [{ part: 'Particles', mono: 'ink' }],
} satisfies LoaderMeta

/* A Galton board: each particle leaves the hopper's spout in turn, hops left
 * or right at every row of pegs, quickening as it falls, and lands on its
 * bin's stack. The newest one in flight wears the accent: it warms as it's
 * released and hands the accent on as the next one leaves, cooling to ink
 * before it lands. Each peg it strikes answers with a brief glint. The
 * stacks grow into the binomial bell, a curve draws over their tops
 * (`standard`), and then the floor lets go: the stacks drop and fade
 * (`exit`) and the curve draws off, leaving the board as it began, so the
 * loop has no seam.
 *
 * Color: each particle falls in `c1` and settles to the ink as it lands, so the bins fill in ink and only the moving ones are colored. */

interface Board {
  rows: number
  counts: number[]
  dx: number
  dy: number
  side: number
}

const BOARDS: Board[] = [
  { rows: 4, counts: [1, 2, 3, 2, 1], dx: 13, dy: 7.5, side: 8.5 },
  { rows: 4, counts: [1, 3, 4, 3, 1], dx: 12, dy: 7.5, side: 7 },
  { rows: 5, counts: [1, 3, 5, 5, 3, 1], dx: 10.5, dy: 6.5, side: 5.6 },
]

const CX = 50
const TOP = 14
const FLOOR = 88
const GAP = 1

interface Drop {
  bin: number
  /** Its place in its bin's stack, from the floor up. */
  level: number
  /** Left (-1) or right (+1) at each row. */
  steps: number[]
}

/** The particles in release order: each bin's share, shuffled, with a seeded path to its bin. */
const DROPS: Drop[][] = BOARDS.map((board, b) => {
  const random = seeded(17 + b)
  const bins = board.counts.flatMap((count, bin) => Array<number>(count).fill(bin))
  for (let i = bins.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[bins[i], bins[j]] = [bins[j]!, bins[i]!]
  }
  const filled = board.counts.map(() => 0)
  return bins.map((bin) => {
    const steps = [...Array<number>(bin).fill(1), ...Array<number>(board.rows - bin).fill(-1)]
    for (let i = steps.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[steps[i], steps[j]] = [steps[j]!, steps[i]!]
    }
    return { bin, level: filled[bin]!++, steps }
  })
})

const RELEASE = [0.02, 0.56]
const FALL = 0.15
/** How brightly each peg glints, row by row (reused every frame). */
const glint: number[] = Array<number>(21).fill(0)

export const scene: Scene = {
  beats: 6,
  still: 0.5,
  draw(pen, t, view) {
    const lod = detail(view)
    const board = BOARDS[lod]!
    const drops = DROPS[lod]!
    const { hair, line } = pens(view)
    const { rows, dx, dy, side } = board
    const pegY = (r: number) => TOP + 8 + r * dy
    const binTop = pegY(rows - 1) + dy * 0.9
    const binX = (k: number) => CX + (k - rows / 2) * dx
    const legs = rows + 1
    const start = (i: number) => mix(RELEASE[0]!, RELEASE[1]!, i / (drops.length - 1))

    // The pegs each particle has struck, glinting for a moment after.
    glint.fill(0)
    if (lod === 2) {
      drops.forEach((d, i) => {
        let right = 0
        for (let m = 1; m <= rows; m++) {
          const since = t - (start(i) + (FALL * m) / legs)
          if (since >= 0 && since < 0.08) {
            const peg = ((m - 1) * m) / 2 + right
            glint[peg] = Math.max(glint[peg]!, Math.exp(-since / 0.022))
          }
          if (d.steps[m - 1] === 1) right++
        }
      })
    }

    // The hopper and its spout, the pegs, the bins' walls and the floor.
    if (lod > 0) {
      for (const s of [-1, 1]) {
        pen.path([CX + s * 11.5, TOP - 8, CX + s * 9, TOP - 8, CX + s * 2.8, TOP - 1.6, CX + s * 2.8, TOP + 0.8], { width: hair, alpha: 0.45, join: 'miter' })
      }
      for (let r = 0; r < rows; r++) {
        for (let j = 0; j <= r; j++) {
          const x = CX + (j - r / 2) * dx
          const y = pegY(r)
          if (lod === 2) {
            const g = glint[(r * (r + 1)) / 2 + j]!
            const k = 1.25 + 0.35 * g
            pen.poly([x, y - k, x + k, y, x, y + k, x - k, y], 0.38 + 0.5 * g)
          } else pen.square(x, y, hair * 1.6, 0.42)
        }
      }
    }
    for (let k = 0; k <= rows + 1; k++) {
      const wx = binX(k) - dx / 2
      pen.line(wx, binTop, wx, FLOOR, hair, 0.22)
      if (lod === 2) pen.square(wx, binTop, hair * 2, 0.4)
    }
    pen.line(binX(0) - dx / 2, FLOOR, binX(rows) + dx / 2, FLOOR, hair, 0.4)
    if (lod > 0) for (let k = 0; k <= rows; k++) pen.line(binX(k), FLOOR, binX(k), FLOOR + 2.5, hair, 0.3)

    // The floor lets go at the end of the loop: the stacks fall away.
    const drain = view.ease.exit(span(t, 0.8, 0.95))
    const sink = drain * 10

    drops.forEach((d, i) => {
      const s = span(t, start(i), start(i) + FALL)
      if (s <= 0) return
      const restY = FLOOR - GAP - side / 2 - d.level * (side + GAP)
      let x = binX(d.bin)
      let y = restY + sink
      if (s < 1) {
        // Down onto the first peg, a hop to one side at each row after, quickening, then into the bin.
        const leg = Math.min(Math.floor(s * legs), legs - 1)
        const u = s * legs - leg
        const at = (m: number): [number, number] => {
          if (m === 0) return [CX, TOP]
          if (m === legs) return [binX(d.bin), restY]
          let col = 0
          for (let r = 0; r < m - 1; r++) col += d.steps[r]! / 2
          return [CX + col * dx, pegY(m - 1) - side * 0.7]
        }
        const [x0, y0] = at(leg)
        const [x1, y1] = at(leg + 1)
        x = mix(x0, x1, u)
        y = y0 + (y1 - y0) * u * u - (leg > 0 && leg < legs - 1 ? 9 * u * (1 - u) : 0)
      }
      // Settled, a particle dims a touch; the stacks fade as they fall.
      const alpha = (1 - 0.08 * span(t, start(i) + FALL, start(i) + FALL + 0.03)) * (1 - drain)
      if (alpha <= 0.01) return
      // A falling particle is the board's color, and settles to the ink as it lands in its bin.
      pen.square(x, y, side, alpha, blend('c1', 'ink', span(s, 0.88, 1)))
      // The accent: warming as it's released, handed on as the next one leaves, gone before it lands.
      const next = i + 1 < drops.length ? start(i + 1) : Infinity
      const warm = view.ease.standard(span(t, start(i), start(i) + 0.02)) * (1 - view.ease.standard(span(t, next, next + 0.025))) * (1 - view.ease.standard(span(s, 0.78, 1)))
      if (warm > 0.01) pen.square(x, y, side, alpha * warm, 'accent')
    })

    // The curve over the stacks: drawn on once they're built, off as they fall.
    const on = view.ease.standard(span(t, 0.62, 0.76))
    const off = view.ease.standard(span(t, 0.8, 0.9))
    if (on > off) {
      const peak = Math.max(...board.counts)
      const sigma = Math.sqrt(rows) / 2
      const xy: number[] = []
      const n = 48
      for (let i = 0; i <= n; i++) {
        const u = mix(off, on, i / n)
        const k = -0.5 + (rows + 1) * u
        const height = (peak * Math.exp(-(((k - rows / 2) / sigma) ** 2) / 2)) * (side + GAP)
        xy.push(binX(k), FLOOR - GAP - height - 3)
      }
      pen.path(xy, { width: line * 0.9, alpha: 0.85, join: 'round', cap: 'round' })
    }
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Square particles drop through pegs and stack into a bell, which a curve then traces. */
export function LoaderBell(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
