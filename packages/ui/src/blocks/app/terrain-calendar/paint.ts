import { mix, type Lab } from './color'
import { FLOOR_HEIGHT, MARGIN, SLAB, TALL, columnFaces, project, type Frame, type Point } from './geometry'

/* Paint and drawing for the terrain's canvas. Colors are the theme's tokens
 * (resolved through probes, color.ts), with the faces shaded by the
 * isometric kit's own recipe: light from above and a little to the left, the
 * top lightest and the +x face darkest, `--yj-dark` choosing each mix. A column
 * takes its color from its height, along a ramp from the kit's neutral to the
 * metric's color, mixed in OKLab; while you look at one cell, the columns
 * off its row and week recede toward the floor. Every shade is built once per
 * theme into a table, so a frame only picks strings. */

const LIGHT = 'color-mix(in oklab, var(--color-surface) calc(100% - 100% * var(--yj-dark)), var(--color-fg))'
const SHADE = 'color-mix(in oklab, var(--color-fg) calc(100% - 100% * var(--yj-dark)), var(--color-canvas))'
const lift = (light: number, dark: number) => `color-mix(in oklab, var(--color-fg) calc(${light}% + ${dark - light}% * var(--yj-dark)), var(--color-surface))`
const ink = (alpha: number) => `color-mix(in oklab, var(--color-fg) ${alpha}%, transparent)`

/** A color's three faces, as the kit shades a solid box. */
const facesOf = (color: string) => [
  `color-mix(in oklab, ${color}, ${LIGHT} calc(14% + 8% * var(--yj-dark)))`,
  color,
  `color-mix(in oklab, ${color}, ${SHADE} calc(18% + 14% * var(--yj-dark)))`,
]

/** Every color the canvas needs, as CSS. `tone` is the metric's color, a token reference. */
export function sourcesFor(tone: string): Record<string, string> {
  const [hiTop, hiLeft, hiRight] = facesOf(tone)
  const [inkTop, inkLeft, inkRight] = facesOf('var(--color-fg)')
  return {
    // The floor is the kit's sunken plinth; a rest day, its neutral box.
    floorTop: lift(5, 6),
    floorLeft: lift(10, 4),
    floorRight: lift(16, 2),
    lowTop: lift(2, 17),
    lowLeft: lift(7, 10),
    lowRight: lift(13, 5),
    hiTop: hiTop!,
    hiLeft: hiLeft!,
    hiRight: hiRight!,
    inkTop: inkTop!,
    inkLeft: inkLeft!,
    inkRight: inkRight!,
    edge: ink(20),
    groove: ink(8),
    quarter: ink(16),
    cross: ink(58),
    xray: ink(78),
    pin: 'var(--color-fg)',
  }
}

/* ── The table of shades ────────────────────────────────────────────────── */

/** Steps along the ramp, and steps a column takes as it recedes. */
export const LEVELS = 20
export const DIMS = 5
/** How far a receding column goes toward the floor. */
const RECEDE = 0.66

export interface Paint {
  floor: [top: string, left: string, right: string]
  edge: string
  groove: string
  quarter: string
  cross: string
  /** The active column's outline, drawn over whatever stands in front of it. */
  xray: string
  pin: string
  ink: [top: string, left: string, right: string]
  /** Faces by recede step, level and face: ramp[(dim * LEVELS + level) * 3 + face]. */
  ramp: string[]
}

/** The canvas's paint from resolved colors; `css` writes one as the canvas takes it (color.ts's colorWriter). */
export function paintOf(c: Record<string, Lab>, css: (lab: Lab) => string): Paint {
  const low = [c.lowTop!, c.lowLeft!, c.lowRight!]
  const high = [c.hiTop!, c.hiLeft!, c.hiRight!]
  const ramp: string[] = []
  for (let d = 0; d < DIMS; d++) {
    for (let l = 0; l < LEVELS; l++) {
      // Curved, so the plain stays quiet and the peaks carry the color.
      const t = (l / (LEVELS - 1)) ** 1.35
      for (let f = 0; f < 3; f++) ramp.push(css(mix(mix(low[f]!, high[f]!, t), c.floorTop!, (RECEDE * d) / (DIMS - 1))))
    }
  }
  return {
    floor: [css(c.floorTop!), css(c.floorLeft!), css(c.floorRight!)],
    edge: css(c.edge!),
    groove: css(c.groove!),
    quarter: css(c.quarter!),
    cross: css(c.cross!),
    xray: css(c.xray!),
    pin: css(c.pin!),
    ink: [css(c.inkTop!), css(c.inkLeft!), css(c.inkRight!)],
    ramp,
  }
}

/* ── Drawing ────────────────────────────────────────────────────────────── */

export interface SceneState {
  frame: Frame
  /** Drawn heights, grid units, by row and column. */
  heights: Float32Array
  /** The cell being looked at (ink, the crosshair and the pin); null for none. */
  active: { row: number; col: number } | null
  /** The pinned cell when it isn't the active one: an ink outline on its top. */
  pinned: { row: number; col: number } | null
  /** 0 to 1: how far the columns off the crosshair have receded. */
  dim: number
}

function poly(ctx: CanvasRenderingContext2D, pts: readonly Point[], fill: string) {
  ctx.beginPath()
  ctx.moveTo(pts[0]![0], pts[0]![1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
}

/**
 * Draws the whole scene. `px` is CSS pixels per grid unit and `dpr` the
 * device pixels per CSS pixel; the canvas is `frame` at that scale.
 */
export function drawScene(ctx: CanvasRenderingContext2D, s: SceneState, paint: Paint, px: number, dpr: number) {
  const { frame, heights, active, pinned, dim } = s
  const { rows, cols } = frame
  const k = px * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.setTransform(k, 0, 0, k, -frame.x * k, -frame.y * k)
  const hair = 1 / px

  // The floor: a slab, its grooves one per week and day, a stronger one every four weeks (a training block).
  const [x0, x1, y0, y1] = [-MARGIN, cols + MARGIN, -MARGIN, rows + MARGIN]
  poly(ctx, [project(x0, y1, -SLAB), project(x1, y1, -SLAB), project(x1, y1, 0), project(x0, y1, 0)], paint.floor[1])
  poly(ctx, [project(x1, y0, -SLAB), project(x1, y1, -SLAB), project(x1, y1, 0), project(x1, y0, 0)], paint.floor[2])
  poly(ctx, [project(x0, y0, 0), project(x1, y0, 0), project(x1, y1, 0), project(x0, y1, 0)], paint.floor[0])
  ctx.lineWidth = hair
  ctx.strokeStyle = paint.edge
  ctx.beginPath()
  line(ctx, project(x0, y1, 0), project(x1, y1, 0))
  line(ctx, project(x1, y1, 0), project(x1, y0, 0))
  ctx.stroke()
  for (const quarter of [false, true]) {
    ctx.strokeStyle = quarter ? paint.quarter : paint.groove
    ctx.beginPath()
    for (let c = 0; c <= cols; c++) if ((c % 4 === 0) === quarter) line(ctx, project(c, 0, 0), project(c, rows, 0))
    if (!quarter) for (let r = 0; r <= rows; r++) line(ctx, project(0, r, 0), project(cols, r, 0))
    ctx.stroke()
  }

  // The crosshair on the floor: the active cell's row and week, under the columns.
  if (active) {
    ctx.strokeStyle = paint.cross
    ctx.beginPath()
    line(ctx, project(0, active.row + 0.5, 0), project(cols, active.row + 0.5, 0))
    line(ctx, project(active.col + 0.5, 0, 0), project(active.col + 0.5, rows, 0))
    ctx.stroke()
  }

  // Far to near, one diagonal at a time: nearer columns cover farther ones.
  const step = Math.round(dim * (DIMS - 1))
  for (let d = 0; d <= rows + cols - 2; d++) {
    for (let row = Math.min(rows - 1, d); row >= 0 && d - row < cols; row--) {
      const col = d - row
      const h = heights[row * cols + col]!
      const faces = columnFaces(row, col, h)
      const lit = active && active.row === row && active.col === col
      let top: string, left: string, right: string
      if (lit) [top, left, right] = paint.ink
      else {
        const level = Math.round(Math.min(1, Math.max(0, (h - FLOOR_HEIGHT) / (TALL - FLOOR_HEIGHT))) * (LEVELS - 1))
        const recede = active && active.row !== row && active.col !== col ? step : 0
        const i = (recede * LEVELS + level) * 3
        ;[top, left, right] = [paint.ramp[i]!, paint.ramp[i + 1]!, paint.ramp[i + 2]!]
      }
      if (h > FLOOR_HEIGHT) {
        poly(ctx, faces.outline, left)
        poly(ctx, faces.right, right)
      }
      poly(ctx, faces.top, top)
      if (pinned && pinned.row === row && pinned.col === col && !lit) {
        ctx.strokeStyle = paint.pin
        ctx.lineWidth = hair * 1.5
        ctx.beginPath()
        const [a, b, c, e] = faces.top
        line(ctx, a!, b!)
        ctx.lineTo(c![0], c![1])
        ctx.lineTo(e![0], e![1])
        ctx.closePath()
        ctx.stroke()
        ctx.lineWidth = hair
      }
    }
  }

  if (active) {
    // The active column's outline over everything, so a nearer column never hides which one it is.
    const h = heights[active.row * cols + active.col]!
    const { outline, top, left } = columnFaces(active.row, active.col, h)
    ctx.strokeStyle = paint.xray
    ctx.beginPath()
    ctx.moveTo(outline[0]![0], outline[0]![1])
    for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i]![0], outline[i]![1])
    ctx.closePath()
    line(ctx, top[3]!, top[2]!)
    line(ctx, top[2]!, top[1]!)
    line(ctx, top[2]!, left[1]!)
    ctx.stroke()

    // The pin: a short stem and a dot over it, a constant size on screen.
    const [x, y] = project(active.col + 0.5, active.row + 0.5, h)
    const stem = 14 / px
    ctx.strokeStyle = paint.pin
    ctx.beginPath()
    line(ctx, [x, y], [x, y - stem])
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y - stem, 2.5 / px, 0, Math.PI * 2)
    ctx.fillStyle = paint.pin
    ctx.fill()
  }
}
