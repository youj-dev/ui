import type { Box } from './read'
import type { Draw, Run } from './run'

/** What the kit needs of a run: its device-pixel geometry and reading direction. */
type Surface = Pick<Run<string>, 'X' | 'Y' | 'dpr' | 'lw' | 'rtl' | 'offX' | 'offY'>

/* The entrances' drawing kit, on a run's canvases. Every stroke is cumulative: a mark is called with its progress and
 * draws only what became due since its last call (the next dots, the next pixels of a rule, the next slice of a
 * reveal), so a frame's work is the marks in flight, never a redraw. Geometry is in the demo's CSS px; lines land on
 * whole device pixels. */

export type Pen = ReturnType<typeof pen>

export function pen(run: Surface) {
  const { X, Y, dpr, lw, rtl } = run
  const DOT = 4

  /** A run of round dots from a to b, evenly spaced with a dot on both ends. */
  const dots = (x1: number, y1: number, x2: number, y2: number, step = DOT): Draw => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step))
    let k = 0
    return (ctx, q) => {
      const to = Math.floor(q * n + 1e-6)
      if (to < k) return
      ctx.beginPath()
      for (; k <= to; k++) dot(ctx, x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n)
      ctx.fill()
    }
  }
  const dot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const px = (x + run.offX) * dpr
    const py = (y + run.offY) * dpr
    ctx.moveTo(px + 0.6 * dpr, py)
    ctx.arc(px, py, 0.6 * dpr, 0, Math.PI * 2)
  }
  /** A 1px axis-aligned rule from a to b, solid or dashed (`dash` px on, three quarters of that off); grows from a. */
  const rule = (x1: number, y1: number, x2: number, y2: number, dash = 0): Draw => {
    const horizontal = y1 === y2
    const a = horizontal ? X(x1) : Y(y1)
    const b = horizontal ? X(x2) : Y(y2)
    const across = horizontal ? Y(y1) : X(x1)
    let at = a
    return (ctx, q) => {
      const to = Math.round(a + (b - a) * q)
      const lo = Math.min(at, to)
      const hi = Math.max(at, to)
      if (hi === lo) return
      // dashes keep one phase across the drawing, so overlapping construction lines coincide
      const on = Math.round(dash * dpr)
      const period = Math.round(dash * 1.75 * dpr)
      for (let s = lo; s < hi; ) {
        const phase = dash ? s % period : 0
        if (dash && phase >= on) {
          s += period - phase
          continue
        }
        const n = dash ? Math.min(hi - s, on - phase) : hi - s
        if (horizontal) ctx.fillRect(s, across, n, lw)
        else ctx.fillRect(across, s, lw, n)
        s += n
      }
      at = to
    }
  }
  /** Its steps one after another over the mark's progress. */
  const chain =
    (...steps: Draw[]): Draw =>
    (ctx, q) => {
      for (let i = 0; i < steps.length; i++) steps[i]!(ctx, Math.min(1, Math.max(0, q * steps.length - i)))
    }
  const both =
    (...steps: Draw[]): Draw =>
    (ctx, q) => {
      for (const s of steps) s(ctx, q)
    }
  const tint =
    (style: string, alpha: number, draw: Draw): Draw =>
    (ctx, q) => {
      ctx.fillStyle = style
      ctx.strokeStyle = style
      ctx.globalAlpha = alpha
      draw(ctx, q)
      ctx.globalAlpha = 1
    }
  /** A square-cornered outline from the reading start corner around: dotted (a dot on every corner), dashed (running
   *  `over` px past each corner, as construction lines do) or solid. */
  const outline = (b: Box, style: 'dots' | 'dash' | 'solid', step = DOT, over = 10): Draw => {
    if (style === 'dash') {
      const l = b.x
      const t = b.y
      const r = b.x + b.w - 1
      const bt = b.y + b.h - 1
      return both(
        rule(l - over, t, r + over, t, 4),
        rule(r, t - over, r, bt + over, 4),
        rule(r + over, bt, l - over, bt, 4),
        rule(l, bt + over, l, t - over, 4),
      )
    }
    const d = style === 'dots' ? 0.5 : 0
    const l = style === 'dots' ? b.x + d : Math.round(b.x)
    const t = style === 'dots' ? b.y + d : Math.round(b.y)
    const r = style === 'dots' ? b.x + b.w - d : Math.round(b.x + b.w) - 1
    const bt = style === 'dots' ? b.y + b.h - d : Math.round(b.y + b.h) - 1
    const side = (x1: number, y1: number, x2: number, y2: number) => (style === 'dots' ? dots(x1, y1, x2, y2, step) : rule(x1, y1, x2, y2))
    // solid sides butt into each other: each runs to one past its corner
    const e = style === 'dots' ? 0 : 1
    return rtl
      ? chain(side(r + e, t, l, t), side(l, t, l, bt + e), side(l, bt, r + e, bt), side(r, bt + e, r, t))
      : chain(side(l, t, r + e, t), side(r, t, r, bt + e), side(r + e, bt, l, bt), side(l, bt + e, l, t))
  }
  /** A circle from the top, clockwise: dotted, or a solid stroke. */
  const circle = (cx: number, cy: number, radius: number, style: 'dots' | 'solid'): Draw => {
    if (style === 'solid') {
      let a = -Math.PI / 2
      return (ctx, q) => {
        const to = -Math.PI / 2 + Math.PI * 2 * q
        if (to <= a) return
        ctx.lineWidth = lw
        ctx.beginPath()
        ctx.arc((cx + run.offX) * dpr, (cy + run.offY) * dpr, radius * dpr, a, to)
        ctx.stroke()
        a = to
      }
    }
    const n = Math.max(8, Math.round((Math.PI * 2 * radius) / DOT))
    let k = 0
    return (ctx, q) => {
      const to = Math.floor(q * (n - 1) + 1e-6)
      ctx.beginPath()
      for (; k <= to; k++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * k) / n
        dot(ctx, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
      }
      ctx.fill()
    }
  }
  /** A small + on a point. */
  const centre = (cx: number, cy: number, arm = 3) => {
    const x = Math.round(cx)
    const y = Math.round(cy)
    return both(rule(x - arm, y, x + arm + 1, y), rule(x, y - arm, x, y + arm + 1))
  }
  /** Reveals a box in the reading direction, a slice per frame: clears what was drawn there (when asked) and copies the
   *  slice in on whole device pixels. The box is painted once, off screen, on its first frame, so a chart of hundreds of
   *  paths costs one paint, and every frame after it one copy. `paint` draws in the demo's CSS px. */
  const reveal = (b: Box, erase: boolean, paint: (ctx: CanvasRenderingContext2D) => void): Draw => {
    const x0 = X(b.x) - 1
    const x1 = X(b.x + b.w) + 1
    const y0 = Y(b.y) - 1
    const y1 = Y(b.y + b.h) + 1
    let at = rtl ? x1 : x0
    let off: HTMLCanvasElement | undefined
    return (ctx, q) => {
      const to = Math.round(rtl ? x1 - (x1 - x0) * q : x0 + (x1 - x0) * q)
      const lo = Math.min(at, to)
      const hi = Math.max(at, to)
      if (hi <= lo) return
      if (!off) {
        off = document.createElement('canvas')
        off.width = x1 - x0
        off.height = y1 - y0
        const o = off.getContext('2d')
        if (o) {
          o.setTransform(dpr, 0, 0, dpr, run.offX * dpr - x0, run.offY * dpr - y0)
          paint(o)
        }
      }
      if (erase) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillRect(lo, y0, hi - lo, y1 - y0)
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.drawImage(off, lo - x0, 0, hi - lo, y1 - y0, lo, y0, hi - lo, y1 - y0)
      at = to
      if (q >= 1) off = undefined
    }
  }
  /** A repeating tile, drawn once (at `size` CSS px), for filling: a dot grid, hatching, a halftone screen. */
  const pattern = (ctx: CanvasRenderingContext2D | null, size: number, draw: (tile: CanvasRenderingContext2D, n: number) => void) => {
    if (!ctx) return undefined
    const tile = document.createElement('canvas')
    tile.width = tile.height = Math.max(2, Math.round(size * dpr))
    const t = tile.getContext('2d')
    if (!t) return undefined
    draw(t, tile.width)
    const p = ctx.createPattern(tile, 'repeat') ?? undefined
    p?.setTransform(new DOMMatrix([1, 0, 0, 1, X(0), Y(0)]))
    return p
  }
  return { dots, rule, chain, both, tint, outline, circle, centre, reveal, pattern }
}
