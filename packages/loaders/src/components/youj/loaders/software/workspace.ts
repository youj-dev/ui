import { clamp, span, type Pen, type Tone, type View } from '../field'

// Reused geometry: each pen consumes its coordinates synchronously. The
// same outlines therefore serve the canvas and the reduced-motion SVG.
const outline = new Array<number>(40).fill(0)
const corners = Array.from({ length: 20 }, (_, i) => {
  const corner = Math.floor(i / 5)
  const a = -Math.PI / 2 + corner * Math.PI / 2 + (i % 5) * Math.PI / 8
  return { right: corner < 2, bottom: corner === 1 || corner === 2, dx: Math.cos(a), dy: Math.sin(a) }
})
const quad = new Array<number>(8).fill(0)
const arrow = [0, 0, 0.8, 12, 3.8, 9.1, 6.3, 14, 8.6, 12.8, 6.1, 8, 10.4, 7.4] as const
const pointer = new Array<number>(arrow.length).fill(0)
const check = new Array<number>(6).fill(0)
const HALOS = [true, false] as const

export function rect(pen: Pen, x: number, y: number, w: number, h: number, width: number, alpha = 0.5, fill = 0.025, tone: Tone = 'ink', r = 2, solid = false) {
  const radius = Math.min(r, w / 2, h / 2)
  for (let i = 0; i < corners.length; i++) {
    const c = corners[i]!
    outline[2 * i] = x + (c.right ? w - radius : radius) + c.dx * radius
    outline[2 * i + 1] = y + (c.bottom ? h - radius : radius) + c.dy * radius
  }
  if (fill > 0 || solid) pen.poly(outline, fill, tone, solid)
  if (alpha > 0) pen.path(outline, { width, alpha, tone, closed: true, join: 'round' })
}

/** A square-ended UI rule, rather than a particle. */
export function rule(pen: Pen, x: number, y: number, w: number, h: number, alpha = 0.7, tone: Tone = 'ink') {
  if (w <= 0 || h <= 0 || alpha <= 0) return
  quad[0] = x; quad[1] = y; quad[2] = x + w; quad[3] = y
  quad[4] = x + w; quad[5] = y + h; quad[6] = x; quad[7] = y + h
  pen.poly(quad, alpha, tone)
}

export function cursor(pen: Pen, x: number, y: number, scale: number, alpha = 1, tone: Tone = 'ink') {
  // A paper halo keeps collaborators legible over a line or a filled card.
  for (const halo of HALOS) {
    for (let i = 0; i < arrow.length; i += 2) {
      pointer[i] = x + ((arrow[i]! - 4) * (halo ? 1.28 : 1) + 4) * scale
      pointer[i + 1] = y + ((arrow[i + 1]! - 7) * (halo ? 1.28 : 1) + 7) * scale
    }
    pen.poly(pointer, halo ? 0 : alpha, tone, true)
  }
}

export function tick(pen: Pen, x: number, y: number, size: number, width: number, progress: number, alpha = 1, tone: Tone = 'ink') {
  if (progress <= 0 || alpha <= 0) return
  const first = clamp(progress * 3)
  const last = clamp((progress - 1 / 3) * 1.5)
  check[0] = x - size * 0.5; check[1] = y
  check[2] = x - size * 0.5 + size * 0.35 * first; check[3] = y + size * 0.3 * first
  check[4] = check[2]! + size * 0.7 * last; check[5] = check[3]! - size * 0.8 * last
  pen.path(check, { width, alpha, tone, cap: 'round', join: 'round' })
}

/** A rest-to-rest gesture that leaves the same geometry at both seams. */
export const gesture = (view: View, t: number, a: number, b: number, c: number, d: number) =>
  clamp(view.ease.emphasized(span(t, a, b))) * (1 - clamp(view.ease.emphasized(span(t, c, d))))

export const weight = (view: View) => clamp(view.size * 0.015, 1, 1.7) / view.px
