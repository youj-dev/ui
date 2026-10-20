import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { cssColor } from './color'
import { fallbackBackground, useBackgroundCanvas, type FrameInfo } from './gl'

export interface WarpGridProps {
  /** [lines, well] CSS colors. Default: `--color-fg-subtle` lines that take `--color-accent` near the well. */
  colors?: [lines: string, well: string]
  /** Line opacity, 0–1.5. Default 1. */
  intensity?: number
  /** Clock multiplier for the idle breathing and the pulse a press leaves. Default 1. */
  speed?: number
  /** Grid pitch in CSS px. Default 26. */
  spacing?: number
  /** How far the well pulls the grid, 0–2. Default 1. */
  depth?: number
  /** Reach of the well in CSS px. Default 240. */
  radius?: number
  /** Pointer reactivity; a press deepens the well for a moment. Default true. */
  interactive?: boolean
  className?: string
}

/** The low motion-budget tier samples each line more coarsely. */
const LOW_STEP = 1.6
const STEP = 8
const BUCKETS = 5
/** The well when nobody is near: shallower, resting in the middle of the field. */
const IDLE_DEPTH = 0.4
/** The pulse a press leaves decays at this rate (1/clock second). */
const PULSE_DECAY = 2.2

/**
 * A line grid that sags toward the pointer like mass bending space. Points slide toward the well
 * with a steep inverse-square falloff, so lines bunch and curve around it and stay put far away; the
 * lines nearest the well take the accent. With nobody there the well eases to the middle and breathes.
 * Canvas 2D, one path for the grid and a few alpha-bucketed paths for the lit segments.
 */
export function WarpGrid({
  colors,
  intensity = 1,
  speed = 1,
  spacing = 26,
  depth = 1,
  radius = 240,
  interactive = true,
  className,
}: WarpGridProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [lineColor = 'var(--color-fg-subtle)', wellColor = 'var(--color-accent)'] = colors ?? []
  const props = useRef({ intensity, spacing, depth, radius })
  props.current = { intensity, spacing, depth, radius }

  const { failed } = useBackgroundCanvas(hostRef, {
    colors: ['var(--color-canvas)', lineColor, wellColor],
    speed,
    interactive,
    create: (canvas) => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
      return createGrid(ctx, () => props.current)
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? fallbackBackground([wellColor]) : undefined}
    />
  )
}

type Settings = Required<Pick<WarpGridProps, 'intensity' | 'spacing' | 'depth' | 'radius'>>

function createGrid(ctx: CanvasRenderingContext2D, settings: () => Settings) {
  let width = 0
  let height = 0
  let pressedAt = -Infinity
  // Lit segments per alpha bucket, each x1 y1 x2 y2 …
  const lit = Array.from({ length: BUCKETS }, () => ({ data: new Float32Array(512), n: 0 }))

  const pushLit = (bucket: number, x1: number, y1: number, x2: number, y2: number) => {
    const seg = lit[bucket]!
    if (seg.n + 4 > seg.data.length) {
      const grown = new Float32Array(seg.data.length * 2)
      grown.set(seg.data)
      seg.data = grown
    }
    seg.data[seg.n++] = x1
    seg.data[seg.n++] = y1
    seg.data[seg.n++] = x2
    seg.data[seg.n++] = y2
  }

  const draw = (info: FrameInfo, s: Settings) => {
    const [canvasColor = [0, 0, 0], lineColor = [1, 1, 1], wellColor = [1, 1, 1]] = info.colors
    const k = Math.max(0, s.intensity)
    const p = info.pointer
    const R2 = s.radius * s.radius
    const step = STEP * (info.low ? LOW_STEP : 1)

    // The pointer's own strength blends the well from the middle of the field to the pointer, so it
    // glides in and out with no state of its own; a press adds a pulse that decays.
    if (p.presses.length) pressedAt = info.time
    const pulse = info.reduced ? 0 : Math.exp(-(info.time - pressedAt) * PULSE_DECAY)
    const w = info.reduced ? 0 : p.strength
    const mx = width / 2 + (p.x - width / 2) * w
    const my = height / 2 + (p.y - height / 2) * w
    const breathe = info.reduced ? 0 : Math.sin(info.time * 0.8) * 0.06
    const mass = (IDLE_DEPTH + (1 - IDLE_DEPTH) * w + pulse * 0.5 + breathe) * s.depth

    // Slide a grid point toward the well; the pull falls off with the inverse square of the distance.
    let wx = 0
    let wy = 0
    let pull = 0
    const warp = (x: number, y: number) => {
      const dx = mx - x
      const dy = my - y
      const fall = R2 / (dx * dx + dy * dy + R2)
      pull = Math.min(0.92, mass * 0.6 * fall * fall)
      wx = x + dx * pull
      wy = y + dy * pull
    }

    ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor(canvasColor)
    ctx.fillRect(0, 0, width, height)

    for (const seg of lit) seg.n = 0
    const base = new Path2D()
    const trace = (fixed: number, vertical: boolean) => {
      const span = vertical ? height : width
      let px = 0
      let py = 0
      for (let t = 0; t <= span + step; t += step) {
        const at = Math.min(t, span)
        warp(vertical ? fixed : at, vertical ? at : fixed)
        if (t === 0) base.moveTo(wx, wy)
        else {
          base.lineTo(wx, wy)
          const level = Math.min(BUCKETS - 1, Math.floor(pull * 1.1 * BUCKETS))
          if (pull > 0.06) pushLit(level, px, py, wx, wy)
        }
        px = wx
        py = wy
        if (at === span) break
      }
    }
    // Lines run a grid cell past each edge, so a pulled grid never shows a bare border.
    const pitch = s.spacing
    const cx = (width % pitch) / 2
    const cy = (height % pitch) / 2
    for (let y = cy - pitch; y <= height + pitch; y += pitch) trace(y, false)
    for (let x = cx - pitch; x <= width + pitch; x += pitch) trace(x, true)

    ctx.lineWidth = 1
    ctx.globalAlpha = Math.min(1, 0.4 * k)
    ctx.strokeStyle = cssColor(lineColor)
    ctx.stroke(base)

    ctx.strokeStyle = cssColor(wellColor)
    ctx.lineWidth = 1.1
    for (let b = 0; b < BUCKETS; b++) {
      const seg = lit[b]!
      if (!seg.n) continue
      ctx.globalAlpha = Math.min(1, ((b + 1) / BUCKETS) * 0.85 * k)
      ctx.beginPath()
      for (let q = 0; q < seg.n; q += 4) {
        ctx.moveTo(seg.data[q]!, seg.data[q + 1]!)
        ctx.lineTo(seg.data[q + 2]!, seg.data[q + 3]!)
      }
      ctx.stroke()
    }

    // A small bead where the mass sits, only once the pointer is there.
    if (w > 0.05) {
      ctx.globalAlpha = Math.min(1, w * k)
      ctx.fillStyle = cssColor(wellColor)
      ctx.beginPath()
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  return {
    frame: (info: FrameInfo) => {
      width = info.width / info.dpr
      height = info.height / info.dpr
      draw(info, settings())
    },
    dispose: () => {
      for (const seg of lit) seg.n = 0
    },
  }
}
