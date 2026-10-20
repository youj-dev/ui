import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { cssColor } from './color'
import { fallbackBackground, useBackgroundCanvas, type FrameInfo } from './gl'

export interface MagneticFieldProps {
  /** [dots, bent] CSS colors. Default: `--color-fg-subtle` dots that take `--color-accent` as they are pushed. */
  colors?: [dots: string, bent: string]
  /** Dot opacity, 0–1.5. Default 1. */
  intensity?: number
  /** Spring speed multiplier. Default 1. */
  speed?: number
  /** Grid pitch in CSS px. Default 18. */
  spacing?: number
  /** Reach of the pointer in CSS px. Default 130. */
  radius?: number
  /** Whether the dots bend away from the pointer or toward it. Default 'repel'. */
  pointer?: 'repel' | 'attract'
  /** Pointer reactivity; a press shoves the dots near it. Default true. */
  interactive?: boolean
  className?: string
}

/** The low motion-budget tier widens the pitch, which cuts the dot count to about 60%. */
const LOW_SPACING = 1.3
/** Peak bend as a share of the radius. */
const BEND = 0.34
/** Spring stiffness (1/s²) and damping ratio: a touch under critical, so dots settle with one small wobble. */
const STIFFNESS = 130
const DAMPING = 0.6
const MAX_DT = 1 / 30
const STRIDE = 4 // offset x, offset y, velocity x, velocity y
const BUCKETS = 6
const PRESS_KICK = 520

/**
 * A grid of dots that bends away from the pointer and springs back. Each dot follows a target
 * on a damped spring, so the field flows around the cursor and rebounds when it leaves; a press
 * shoves everything near it. Canvas 2D, dots batched into a handful of paths per frame.
 */
export function MagneticField({
  colors,
  intensity = 1,
  speed = 1,
  spacing = 18,
  radius = 130,
  pointer = 'repel',
  interactive = true,
  className,
}: MagneticFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [dotColor = 'var(--color-fg-subtle)', bentColor = 'var(--color-accent)'] = colors ?? []
  const props = useRef({ intensity, speed, spacing, radius, pointer })
  props.current = { intensity, speed, spacing, radius, pointer }

  const { failed } = useBackgroundCanvas(hostRef, {
    colors: ['var(--color-canvas)', dotColor, bentColor],
    speed,
    interactive,
    create: (canvas) => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
      return createField(ctx, () => props.current)
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? fallbackBackground([bentColor]) : undefined}
    />
  )
}

type Settings = Required<Pick<MagneticFieldProps, 'intensity' | 'speed' | 'spacing' | 'radius' | 'pointer'>>

function createField(ctx: CanvasRenderingContext2D, settings: () => Settings) {
  let data = new Float32Array(0)
  let cols = 0
  let rows = 0
  let pitch = 0
  let width = 0
  let height = 0
  let x0 = 0
  let y0 = 0

  const fit = (w: number, h: number, spacing: number) => {
    if (w === width && h === height && spacing === pitch) return
    width = w
    height = h
    pitch = spacing
    // One extra ring beyond each edge, so a bent field never shows a bare border.
    cols = Math.ceil(w / spacing) + 3
    rows = Math.ceil(h / spacing) + 3
    x0 = (w - (cols - 1) * spacing) / 2
    y0 = (h - (rows - 1) * spacing) / 2
    data = new Float32Array(cols * rows * STRIDE)
  }

  /** Where the pointer wants the dot resting at (ox, oy) to sit, as an offset from its rest position. */
  const target = (ox: number, oy: number, px: number, py: number, strength: number, s: Settings, out: [number, number]) => {
    const dx = ox - px
    const dy = oy - py
    const d = Math.hypot(dx, dy)
    if (d >= s.radius || d < 1e-3) {
      out[0] = out[1] = 0
      return
    }
    const t = 1 - d / s.radius
    const attract = s.pointer === 'attract'
    // Attract can't carry a dot past the pointer.
    const push = Math.min(s.radius * BEND * t * t * strength, attract ? d * 0.85 : Infinity)
    const dir = attract ? -1 : 1
    out[0] = (dx / d) * push * dir
    out[1] = (dy / d) * push * dir
  }

  const step = (info: FrameInfo, s: Settings) => {
    const dt = Math.min(info.dt, MAX_DT) * s.speed
    if (dt <= 0) return
    const p = info.pointer
    const on = p.strength > 0.01
    const damping = 2 * DAMPING * Math.sqrt(STIFFNESS)
    const out: [number, number] = [0, 0]
    const kickR = s.radius * 1.4
    const kickDir = s.pointer === 'attract' ? -1 : 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const o = (r * cols + c) * STRIDE
        const ox = x0 + c * pitch
        const oy = y0 + r * pitch
        if (on) target(ox, oy, p.x, p.y, p.strength, s, out)
        else out[0] = out[1] = 0
        let vx = data[o + 2]!
        let vy = data[o + 3]!
        for (const press of p.presses) {
          const dx = ox - press.x
          const dy = oy - press.y
          const d = Math.hypot(dx, dy)
          if (d < kickR && d > 1e-3) {
            const kick = (1 - d / kickR) ** 2 * PRESS_KICK * kickDir
            vx += (dx / d) * kick
            vy += (dy / d) * kick
          }
        }
        vx += ((out[0] - data[o]!) * STIFFNESS - vx * damping) * dt
        vy += ((out[1] - data[o + 1]!) * STIFFNESS - vy * damping) * dt
        data[o + 2] = vx
        data[o + 3] = vy
        data[o] = data[o]! + vx * dt
        data[o + 1] = data[o + 1]! + vy * dt
      }
    }
  }

  /** Reduced motion: no spring, one fixed bend so the still frame shows what the field does. */
  const settle = (s: Settings) => {
    const out: [number, number] = [0, 0]
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const o = (r * cols + c) * STRIDE
        target(x0 + c * pitch, y0 + r * pitch, width * 0.62, height * 0.42, 1, s, out)
        data[o] = out[0]
        data[o + 1] = out[1]
        data[o + 2] = data[o + 3] = 0
      }
    }
  }

  const draw = (info: FrameInfo, s: Settings) => {
    const [canvasColor = [0, 0, 0], dotColor = [1, 1, 1], bentColor = [1, 1, 1]] = info.colors
    const k = Math.max(0, s.intensity)
    const max = s.radius * BEND
    const rest = Math.max(1, Math.min(2.2, 0.9 + pitch / 40))

    ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor(canvasColor)
    ctx.fillRect(0, 0, width, height)

    // Bucket 0 is the dots at rest; the others are bent dots, brighter and larger the further they are pushed.
    const paths = Array.from({ length: BUCKETS }, () => new Path2D())
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const o = (r * cols + c) * STRIDE
        const ox = data[o]!
        const oy = data[o + 1]!
        const bent = Math.min(1, Math.hypot(ox, oy) / max)
        const b = bent < 0.03 ? 0 : 1 + Math.min(BUCKETS - 2, Math.floor(bent * (BUCKETS - 1)))
        const dot = rest * (1 + 0.12 * b)
        const x = x0 + c * pitch + ox
        const y = y0 + r * pitch + oy
        paths[b]!.moveTo(x + dot, y)
        paths[b]!.arc(x, y, dot, 0, Math.PI * 2)
      }
    }
    ctx.globalAlpha = Math.min(1, 0.5 * k)
    ctx.fillStyle = cssColor(dotColor)
    ctx.fill(paths[0]!)
    ctx.fillStyle = cssColor(bentColor)
    for (let b = 1; b < BUCKETS; b++) {
      ctx.globalAlpha = Math.min(1, (0.5 + (0.5 * b) / (BUCKETS - 1)) * k)
      ctx.fill(paths[b]!)
    }
    ctx.globalAlpha = 1
  }

  return {
    frame: (info: FrameInfo) => {
      const s = settings()
      fit(info.width / info.dpr, info.height / info.dpr, s.spacing * (info.low ? LOW_SPACING : 1))
      if (info.reduced) settle(s)
      else step(info, s)
      draw(info, s)
    },
    dispose: () => {
      data = new Float32Array(0)
      cols = rows = 0
    },
  }
}
