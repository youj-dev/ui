'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, clamp, mix, seeded, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'least-squares',
  title: 'Least squares',
  category: 'signal',
  technique: 'particles',
  tags: ['scatter', 'regression', 'trend', 'fit', 'data', 'analytics', 'chart', 'line'],
  description: 'Scattered square particles gather into a trend, and a line in the accent finds it: it turns from level to the fit as the residuals between it and each point shrink, then the points scatter again.',
  order: 11,
  colors: [{ part: 'Residuals', mono: 'ink' }],
} satisfies LoaderMeta

/* A regression, done in front of you with the brand's square particles.
 * The points gather from wherever they were into their places (each
 * `emphasized`, a little after the last), then a line is drawn through
 * their mean, level, and turns to the fit about that mean, a pin the line
 * hinges on, with the mean's own construction lines dashed through it. Each
 * point's residual is drawn as what least squares minimises: a hairline to
 * the line and, when there's room, the square on it, so the squares shrink
 * as the line finds the trend. At the fit the pin sends out one ring and a
 * glint runs the line; then the line draws off and the points scatter
 * (`standard`) to where they started, so the loop has no seam.
 *
 * Color: the residuals between the line and each point are `c1`, shrinking as the fit lands; the points stay the ink and the line the accent. */

const ASPECT = 1.3
const L = 12
const R = 118
const TOP = 14
const BOTTOM = 86
const SLOPE = 0.62
const BASE = 0.2

interface Point {
  /** Its place in the data, 0–1 across and up the plot. */
  x: number
  y: number
  /** Where it waits, scattered. */
  sx: number
  sy: number
}

function points(n: number, seed: number): Point[] {
  const random = seeded(seed)
  return Array.from({ length: n }, (_, i) => {
    const x = 0.06 + (0.88 * (i + 0.2 + 0.6 * random())) / n
    return { x, y: BASE + SLOPE * x + (random() - 0.5) * 0.2, sx: 0.04 + 0.92 * random(), sy: 0.04 + 0.92 * random() }
  })
}

const LEVELS = [points(9, 5), points(13, 9), points(17, 3)]
/** The fit through each set, by least squares. */
const FITS = LEVELS.map((set) => {
  const n = set.length
  const mx = set.reduce((a, p) => a + p.x, 0) / n
  const my = set.reduce((a, p) => a + p.y, 0) / n
  const slope = set.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / set.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  return { mx, my, slope }
})

const px = (u: number) => L + (R - L) * u
const py = (v: number) => BOTTOM - (BOTTOM - TOP) * v
const ARM = 4
const MID = (L + R) / 2

/** When (0–1 through the window [a, b]) the eased value `ease` reaches `v`: its inverse, by bisection. */
function when(ease: (s: number) => number, v: number, a: number, b: number) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 18; i++) {
    const s = (lo + hi) / 2
    if (ease(s) < v) lo = s
    else hi = s
  }
  return mix(a, b, (lo + hi) / 2)
}

export const scene: Scene = {
  beats: 6,
  still: 0.55,
  draw(pen, t, view) {
    const lod = detail(view)
    const set = LEVELS[lod]!
    const { mx, my, slope } = FITS[lod]!
    const { hair, line } = pens(view)
    const side = clamp(view.size * 0.03, 3, 5) / view.px

    // The plot's corners, in the docs' crop marks.
    for (const [cx, cy, dx, dy] of [
      [L - 4, TOP - 4, 1, 1],
      [R + 4, TOP - 4, -1, 1],
      [R + 4, BOTTOM + 4, -1, -1],
      [L - 4, BOTTOM + 4, 1, -1],
    ] as const) {
      pen.line(cx, cy, cx + dx * ARM, cy, hair, 0.4)
      pen.line(cx, cy, cx, cy + dy * ARM, hair, 0.4)
    }

    // The line: drawn on through the mean, level, then turned about it to the fit; drawn off before the points scatter.
    const on = view.ease.standard(span(t, 0.3, 0.44))
    const off = view.ease.exit(span(t, 0.8, 0.88))
    const turn = view.ease.emphasized(span(t, 0.4, 0.68))
    const k = slope * turn
    const fit = (u: number) => my + k * (u - mx)
    const a = mix(0.02, 0.98, off)
    const b = mix(0.02, 0.98, on)
    const shown = on * (1 - off)
    const cx = px(mx)
    const cy = py(my)

    // The mean's construction lines, dashed through the pin, while the line is there.
    if (lod === 2 && shown > 0.01) {
      pen.path([cx, TOP - 2, cx, BOTTOM + 2], { width: hair, alpha: 0.16 * shown, dash: [2 * hair, 3 * hair] })
      pen.path([L - 2, cy, R + 2, cy], { width: hair, alpha: 0.16 * shown, dash: [2 * hair, 3 * hair] })
    }

    // Each point, its residual and, with room, the square on it (toward the middle, so it stays in the plot).
    const spots = set.map((p, i) => {
      const n = set.length
      const gather = view.ease.emphasized(span(t, 0.02 + (0.12 * i) / n, 0.24 + (0.12 * i) / n))
      const scatter = view.ease.standard(span(t, 0.84 + (0.06 * i) / n, 0.96 + (0.04 * i) / n))
      const g = gather * (1 - scatter)
      return { x: mix(p.sx, p.x, g), y: mix(p.sy, p.y, g), g }
    })
    if (lod > 0 && on > 0) {
      for (const { x, y, g } of spots) {
        // A residual grows out of the line just after the line reaches it, and folds back into it just before it's erased.
        const u = clamp((x - 0.02) / 0.96)
        const reached = when(view.ease.standard, u, 0.3, 0.44)
        const erased = when(view.ease.exit, u, 0.8, 0.88)
        const reach = view.ease.standard(span(t, reached, reached + 0.06)) * (1 - view.ease.standard(span(t, erased - 0.04, erased)))
        if (reach <= 0.004) continue
        const foot = py(fit(x))
        const tip = mix(foot, py(y), reach)
        if (lod === 2) {
          // The square on the residual, growing with it from the line's foot.
          const s = Math.abs(foot - tip)
          const x0 = px(x)
          const x1 = x0 + (x0 < MID ? s : -s)
          const box = [x0, tip, x1, tip, x1, foot, x0, foot]
          pen.poly(box, 0.035 * g)
          pen.path(box, { width: hair, alpha: 0.26 * g, closed: true })
        }
        pen.line(px(x), tip, px(x), foot, hair, 0.55 * g, 'c1')
      }
    }
    for (const { x, y, g } of spots) pen.square(px(x), py(y), side, 0.55 + 0.4 * g)

    if (b > a) {
      pen.line(px(a), py(fit(a)), px(b), py(fit(b)), line * 0.85, 1, 'accent')
      // At the fit a glint runs the line, left to right.
      const run = span(t, 0.64, 0.84)
      if (lod > 0 && run > 0 && run < 1) {
        const u = mix(-0.12, 1.12, view.ease.standard(run))
        const g0 = clamp(u - 0.1, a, b)
        const g1 = clamp(u + 0.1, a, b)
        if (g1 > g0) pen.line(px(g0), py(fit(g0)), px(g1), py(fit(g1)), line * 2.6, 0.22 * Math.sin(Math.PI * run), 'accent')
      }
    }

    // The pin the line turns about, at the mean: it knocks the line out, and rings once as the fit lands.
    if (lod > 0 && shown > 0.01) {
      const r = clamp(view.size * 0.012, 1.6, 2.6) / view.px
      const pin: number[] = []
      for (let i = 0; i < 16; i++) pin.push(cx + r * Math.cos((TAU * i) / 16), cy + r * Math.sin((TAU * i) / 16))
      pen.poly(pin, 0, 'ink', true)
      pen.path(pin, { width: hair * 1.2, alpha: 0.9 * shown, closed: true })
      pen.dot(cx, cy, r * 0.32, 0.9 * shown)
      const ring = span(t, 0.62, 0.8)
      if (ring > 0 && ring < 1) {
        const rr = mix(r, r * 4.2, view.ease.standard(ring))
        const pulse: number[] = []
        for (let i = 0; i < 28; i++) pulse.push(cx + rr * Math.cos((TAU * i) / 28), cy + rr * Math.sin((TAU * i) / 28))
        pen.path(pulse, { width: hair, alpha: 0.5 * (1 - ring), closed: true, tone: 'accent' })
      }
    }
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** Scattered square particles gather into a trend, and an accent line turns to fit them. */
export function LoaderLeastSquares(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
