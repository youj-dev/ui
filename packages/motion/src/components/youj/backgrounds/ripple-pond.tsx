import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { cssColor } from './color'
import { fallbackBackground, useBackgroundCanvas, type FrameInfo } from './gl'

export interface RipplePondProps {
  /** [dots, wave] CSS colors. Default: `--color-fg-subtle` dots that take `--color-accent` on a crest. */
  colors?: [dots: string, wave: string]
  /** Dot opacity and wave height, 0–1.5. Default 1. */
  intensity?: number
  /** Clock multiplier for how fast the rings travel and fade. Default 1. */
  speed?: number
  /** Lattice pitch in CSS px. Default 16. */
  spacing?: number
  /** A drop every few seconds while nobody is interacting. Default true. */
  ambient?: boolean
  /** Moving the pointer drops soft ripples; a press drops a strong one. Default true. */
  interactive?: boolean
  className?: string
}

/** The low motion-budget tier widens the pitch, which cuts the dot count to about 60%. */
const LOW_SPACING = 1.3
/** Ring travel in CSS px per clock second. */
const TRAVEL = 230
/** Clock seconds a ripple lives; it has faded to nothing by then. */
const LIFE = 3.4
/** Half-width of a ring's envelope in CSS px, and the wavelength of the wavelets that trail it. */
const SPREAD = 34
const WAVELENGTH = 46
/** Pointer travel (CSS px) between wake ripples. */
const WAKE_STEP = 110
/** Clock seconds of quiet before an ambient drop. */
const AMBIENT_GAP = 2.6
const MAX_RIPPLES = 28
const BUCKETS = 9
/** A dot rides this many px per unit of wave height. */
const LIFT = 5

interface Ripple {
  x: number
  y: number
  start: number
  amp: number
}

/**
 * A calm dot lattice that behaves like a pond. Moving the pointer drops soft ripples, a press
 * drops a strong one, and an idle field lets a drop fall now and then. Each ring is a travelling
 * wave packet with wavelets trailing it: dots rise and brighten on a crest, sink and dim in the trough.
 * Canvas 2D, dots batched by wave height.
 */
export function RipplePond({
  colors,
  intensity = 1,
  speed = 1,
  spacing = 16,
  ambient = true,
  interactive = true,
  className,
}: RipplePondProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [dotColor = 'var(--color-fg-subtle)', waveColor = 'var(--color-accent)'] = colors ?? []
  const props = useRef({ intensity, spacing, ambient })
  props.current = { intensity, spacing, ambient }

  const { failed } = useBackgroundCanvas(hostRef, {
    colors: ['var(--color-canvas)', dotColor, waveColor],
    speed,
    interactive,
    create: (canvas) => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
      return createPond(ctx, () => props.current)
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? fallbackBackground([waveColor]) : undefined}
    />
  )
}

type Settings = Required<Pick<RipplePondProps, 'intensity' | 'spacing' | 'ambient'>>

function createPond(ctx: CanvasRenderingContext2D, settings: () => Settings) {
  let ripples: Ripple[] = []
  let height_ = new Float32Array(0)
  let cols = 0
  let rows = 0
  let pitch = 0
  let width = 0
  let height = 0
  let x0 = 0
  let y0 = 0
  let lastWake: { x: number; y: number } | null = null
  let nextAmbient = -1
  let ambientCount = 0

  const fit = (w: number, h: number, spacing: number) => {
    if (w === width && h === height && spacing === pitch) return
    width = w
    height = h
    pitch = spacing
    cols = Math.floor(w / spacing) + 1
    rows = Math.floor(h / spacing) + 1
    x0 = (w - (cols - 1) * spacing) / 2
    y0 = (h - (rows - 1) * spacing) / 2
    height_ = new Float32Array(cols * rows)
  }

  const drop = (x: number, y: number, time: number, amp: number) => {
    ripples.push({ x, y, start: time, amp })
    if (ripples.length > MAX_RIPPLES) ripples.shift()
  }

  /** Adds one ripple's wave to the height field, visiting only the dots near its ring. */
  const addRipple = (rp: Ripple, age: number) => {
    const r = age * TRAVEL
    const reach = r + SPREAD * 3
    const fade = Math.exp(-age * 1.15) * (1 - age / LIFE)
    // Energy spreads over a growing circle: amplitude falls with the root of the radius.
    const amp = (rp.amp * fade) / Math.sqrt(1 + r / 70)
    if (amp < 0.01) return
    const c0 = Math.max(0, Math.floor((rp.x - reach - x0) / pitch))
    const c1 = Math.min(cols - 1, Math.ceil((rp.x + reach - x0) / pitch))
    const r0 = Math.max(0, Math.floor((rp.y - reach - y0) / pitch))
    const r1 = Math.min(rows - 1, Math.ceil((rp.y + reach - y0) / pitch))
    const inner = r - SPREAD * 3
    for (let row = r0; row <= r1; row++) {
      const dy = y0 + row * pitch - rp.y
      for (let col = c0; col <= c1; col++) {
        const dx = x0 + col * pitch - rp.x
        const d = Math.hypot(dx, dy)
        const off = d - r
        if (d < inner || off > SPREAD * 3) continue
        const envelope = Math.exp(-(off * off) / (2 * SPREAD * SPREAD))
        // The crest rides the envelope; wavelets trail behind it, none ahead.
        const wave = Math.cos((off / WAVELENGTH) * Math.PI * 2) * (off > 0 ? Math.exp(-off / 10) : 1)
        height_[row * cols + col] = height_[row * cols + col]! + amp * envelope * wave
      }
    }
  }

  const compose = (list: readonly Ripple[], time: number) => {
    height_.fill(0)
    for (const rp of list) {
      const age = time - rp.start
      if (age >= 0 && age < LIFE) addRipple(rp, age)
    }
  }

  const step = (info: FrameInfo, s: Settings) => {
    const p = info.pointer
    if (nextAmbient < 0) nextAmbient = info.time + 1.2
    for (const press of p.presses) drop(press.x, press.y, info.time, 1.5)
    if (p.strength > 0.3) {
      if (!lastWake) lastWake = { x: p.x, y: p.y }
      else if (Math.hypot(p.x - lastWake.x, p.y - lastWake.y) >= WAKE_STEP) {
        drop(p.x, p.y, info.time, 0.8)
        lastWake = { x: p.x, y: p.y }
      }
      nextAmbient = info.time + AMBIENT_GAP
    } else {
      lastWake = null
    }
    if (s.ambient && info.time >= nextAmbient) {
      // Drops land on a fixed, evenly spread sequence across the middle of the field.
      ambientCount++
      const u = (ambientCount * 0.6180339887) % 1
      const v = (ambientCount * 0.7548776662) % 1
      drop(width * (0.15 + 0.7 * u), height * (0.2 + 0.6 * v), info.time, 1.1)
      nextAmbient = info.time + AMBIENT_GAP
    }
    ripples = ripples.filter((rp) => info.time - rp.start < LIFE)
    compose(ripples, info.time)
  }

  const draw = (info: FrameInfo, s: Settings) => {
    const [canvasColor = [0, 0, 0], dotColor = [1, 1, 1], waveColor = [1, 1, 1]] = info.colors
    const k = Math.max(0, s.intensity)
    const rest = Math.max(0.9, Math.min(2, 0.5 + pitch / 18))

    ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor(canvasColor)
    ctx.fillRect(0, 0, width, height)

    // Buckets run from deep trough (0) through flat water to the highest crest (BUCKETS - 1).
    const flat = 2
    const paths = Array.from({ length: BUCKETS }, () => new Path2D())
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const h = height_[row * cols + col]! * k
        const b = h < 0 ? Math.max(0, flat + Math.round(h * 4)) : Math.min(BUCKETS - 1, flat + Math.round(h * 6))
        const dot = Math.max(0.35, rest * (1 + h * 0.9))
        const x = x0 + col * pitch
        const y = y0 + row * pitch - h * LIFT
        paths[b]!.moveTo(x + dot, y)
        paths[b]!.arc(x, y, dot, 0, Math.PI * 2)
      }
    }
    for (let b = 0; b < BUCKETS; b++) {
      const crest = b > flat
      ctx.fillStyle = cssColor(crest ? waveColor : dotColor)
      ctx.globalAlpha = Math.min(1, (crest ? 0.55 + (0.45 * (b - flat)) / (BUCKETS - 1 - flat) : 0.18 + 0.12 * b) * k)
      ctx.fill(paths[b]!)
    }
    ctx.globalAlpha = 1
  }

  return {
    frame: (info: FrameInfo) => {
      const s = settings()
      fit(info.width / info.dpr, info.height / info.dpr, s.spacing * (info.low ? LOW_SPACING : 1))
      if (info.reduced) {
        // One fixed composition: two rings caught mid-spread.
        const still: Ripple[] = [
          { x: width * 0.3, y: height * 0.45, start: 0, amp: 1.5 },
          { x: width * 0.72, y: height * 0.62, start: 0.5, amp: 1.1 },
        ]
        compose(still, 1.1)
      } else {
        step(info, s)
      }
      draw(info, s)
    },
    dispose: () => {
      ripples = []
      height_ = new Float32Array(0)
      cols = rows = 0
    },
  }
}
