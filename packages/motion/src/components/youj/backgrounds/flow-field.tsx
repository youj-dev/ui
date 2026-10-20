import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { cssColor } from './color'
import { fallbackBackground, useBackgroundCanvas, type FrameInfo } from './gl'

export interface FlowFieldProps {
  /** [streaks, highlight] CSS colors. Default: `--color-fg-muted`, `--color-accent`. */
  colors?: [streaks: string, highlight: string]
  /** Opacity of the streaks, 0–1.5. Default 1. */
  intensity?: number
  /** Current speed multiplier. Default 1. */
  speed?: number
  /** Streaks per area, relative. 1 ≈ one streak per 3 200 CSS px². Default 1. */
  density?: number
  /** Trail length multiplier, 0.3–1.5. Default 1. */
  trail?: number
  /** Size of the swirls in the current: above 1 is broader and calmer, below 1 is busier. Default 1. */
  scale?: number
  /** Pointer reactivity: the pointer stirs a vortex in the current. Default true. */
  interactive?: boolean
  className?: string
}

const AREA_PER_STREAK = 3200
const MAX_STREAKS = 800
/** The low motion-budget tier keeps this share of the streaks. */
const LOW_DENSITY = 0.6
const MAX_TRAIL = 32
const BASE_TRAIL = 22
/** The trail keeps one point per this many steps, so it is long enough to read as a streak. */
const SAMPLE_EVERY = 3
const BUCKETS = 8
const STEP = 1 / 60
const MAX_STEPS = 4
const CURRENT_SPEED = 58 // CSS px per second
const NOISE_SIZE = 340 // CSS px per noise cell at scale 1
const POINTER_RADIUS = 190
const POINTER_SWIRL = 2.6 // × the current's speed, at the vortex's strongest
const WARMUP_STEPS = 140
const STRIDE = 4 // x, y, age, life

/**
 * Streaks drifting on a smooth noise current, each leaving a fading trail. The pointer stirs a vortex in
 * the current and lights the streaks it catches in the accent. Trails are redrawn from a short history
 * every frame (a ring buffer shared by all streaks), so nothing ghosts and a resize or a theme change is
 * exact. Canvas 2D with alpha-bucketed batched strokes: a handful of draw calls per frame.
 */
export function FlowField({
  colors,
  intensity = 1,
  speed = 1,
  density = 1,
  trail = 1,
  scale = 1,
  interactive = true,
  className,
}: FlowFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [streakColor = 'var(--color-fg-muted)', highlight = 'var(--color-accent)'] = colors ?? []
  const props = useRef({ intensity, speed, density, trail, scale })
  props.current = { intensity, speed, density, trail, scale }

  const { failed } = useBackgroundCanvas(hostRef, {
    colors: ['var(--color-canvas)', streakColor, highlight],
    speed,
    interactive,
    create: (canvas) => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
      return createFlowField(ctx, () => props.current)
    },
  })

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? fallbackBackground([highlight]) : undefined}
    />
  )
}

type Settings = Required<Pick<FlowFieldProps, 'intensity' | 'speed' | 'density' | 'trail' | 'scale'>>

function createFlowField(ctx: CanvasRenderingContext2D, settings: () => Settings) {
  const noise = createNoise(0x666c6f)
  let random = mulberry32(0x666c6f)
  let data = new Float32Array(0)
  let history = new Float32Array(0) // MAX_TRAIL × (x, y) per streak; `head` is shared by all
  let count = 0
  let head = 0
  let width = 0
  let height = 0
  let clock = 0
  let ticks = 0
  let owed = 0
  let wasReduced: boolean | null = null
  // Segment buffers per alpha bucket: [streak × BUCKETS, highlight × BUCKETS], each x1 y1 x2 y2 …
  const segments = Array.from({ length: BUCKETS * 2 }, () => ({ data: new Float32Array(2048), n: 0 }))

  const spawn = (i: number, fresh: boolean) => {
    const o = i * STRIDE
    const x = random() * width
    const y = random() * height
    data[o] = x
    data[o + 1] = y
    data[o + 3] = 4 + random() * 6
    // A streak seeded at start is already part-way through its life, so they don't all fade in together.
    data[o + 2] = fresh ? random() * data[o + 3]! : 0
    for (let k = 0; k < MAX_TRAIL; k++) {
      history[(i * MAX_TRAIL + k) * 2] = x
      history[(i * MAX_TRAIL + k) * 2 + 1] = y
    }
  }

  const fit = (w: number, h: number, reduced: boolean, low: boolean, s: Settings) => {
    const target = Math.min(MAX_STREAKS, Math.round(((w * h) / AREA_PER_STREAK) * s.density * (low ? LOW_DENSITY : 1)))
    // Reduced motion always shows the same composition.
    if (reduced !== wasReduced) {
      random = mulberry32(0x666c6f)
      count = 0
      clock = 0
      ticks = 0
      owed = 0
      wasReduced = reduced
    }
    if (width && height && (w !== width || h !== height)) {
      const sx = w / width
      const sy = h / height
      for (let i = 0; i < count; i++) {
        data[i * STRIDE] = data[i * STRIDE]! * sx
        data[i * STRIDE + 1] = data[i * STRIDE + 1]! * sy
        for (let k = 0; k < MAX_TRAIL; k++) {
          history[(i * MAX_TRAIL + k) * 2] = history[(i * MAX_TRAIL + k) * 2]! * sx
          history[(i * MAX_TRAIL + k) * 2 + 1] = history[(i * MAX_TRAIL + k) * 2 + 1]! * sy
        }
      }
    }
    width = w
    height = h
    if (data.length < target * STRIDE) {
      const grownData = new Float32Array(target * STRIDE)
      grownData.set(data.subarray(0, count * STRIDE))
      data = grownData
      const grownHistory = new Float32Array(target * MAX_TRAIL * 2)
      grownHistory.set(history.subarray(0, count * MAX_TRAIL * 2))
      history = grownHistory
    }
    for (let i = count; i < target; i++) spawn(i, true)
    count = target
  }

  const push = (bucket: number, x1: number, y1: number, x2: number, y2: number) => {
    const s = segments[bucket]!
    if (s.n + 4 > s.data.length) {
      const grown = new Float32Array(s.data.length * 2)
      grown.set(s.data)
      s.data = grown
    }
    s.data[s.n++] = x1
    s.data[s.n++] = y1
    s.data[s.n++] = x2
    s.data[s.n++] = y2
  }

  const advance = (s: Settings, p: FrameInfo['pointer'], pointerOn: boolean) => {
    const size = NOISE_SIZE * s.scale
    if (ticks++ % SAMPLE_EVERY === 0) head = (head + 1) % MAX_TRAIL
    for (let i = 0; i < count; i++) {
      const o = i * STRIDE
      let x = data[o]!
      let y = data[o + 1]!
      // The current: a smooth angle from 3D noise over (x, y, time).
      const angle = noise(x / size, y / size, clock * 0.07) * Math.PI * 4
      let vx = Math.cos(angle) * CURRENT_SPEED
      let vy = Math.sin(angle) * CURRENT_SPEED
      if (pointerOn) {
        const dx = x - p.x
        const dy = y - p.y
        const d = Math.hypot(dx, dy)
        if (d < POINTER_RADIUS && d > 1e-3) {
          // A vortex: tangential flow that peaks mid-way and eases to nothing at the edge and at the eye,
          // with a slight inward pull so the streaks wind around it.
          const swirl = Math.sin((Math.PI * d) / POINTER_RADIUS) ** 1.2 * POINTER_SWIRL * CURRENT_SPEED * p.strength
          vx += (-dy / d) * swirl - (dx / d) * swirl * 0.18
          vy += (dx / d) * swirl - (dy / d) * swirl * 0.18
        }
      }
      x += vx * STEP
      y += vy * STEP
      data[o + 2] = data[o + 2]! + STEP
      const margin = 12
      if (data[o + 2]! > data[o + 3]! || x < -margin || x > width + margin || y < -margin || y > height + margin) {
        spawn(i, false)
        continue
      }
      data[o] = x
      data[o + 1] = y
      history[(i * MAX_TRAIL + head) * 2] = x
      history[(i * MAX_TRAIL + head) * 2 + 1] = y
    }
    clock += STEP
  }

  const draw = (info: FrameInfo, s: Settings) => {
    const [canvasColor = [0, 0, 0], streakColor = [1, 1, 1], highlight = [1, 1, 1]] = info.colors
    const p = info.pointer
    const pointerOn = !info.reduced && p.strength > 0.01
    const k = Math.max(0, s.intensity)
    const length = Math.max(2, Math.min(MAX_TRAIL, Math.round(BASE_TRAIL * s.trail)))
    const glowR = POINTER_RADIUS * 1.1

    ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor(canvasColor)
    ctx.fillRect(0, 0, width, height)

    for (const seg of segments) seg.n = 0
    for (let i = 0; i < count; i++) {
      const o = i * STRIDE
      const age = data[o + 2]!
      const life = data[o + 3]!
      const presence = Math.min(1, age / 0.9, (life - age) / 1.2)
      if (presence <= 0) continue
      let lit = 0
      if (pointerOn) {
        const d = Math.hypot(data[o]! - p.x, data[o + 1]! - p.y)
        lit = d < glowR ? (1 - d / glowR) * p.strength : 0
      }
      const hi = lit > 0.12 ? BUCKETS : 0
      let px = history[(i * MAX_TRAIL + head) * 2]!
      let py = history[(i * MAX_TRAIL + head) * 2 + 1]!
      for (let j = 1; j < length; j++) {
        const slot = (head - j + MAX_TRAIL) % MAX_TRAIL
        const x = history[(i * MAX_TRAIL + slot) * 2]!
        const y = history[(i * MAX_TRAIL + slot) * 2 + 1]!
        if (x !== px || y !== py) {
          const fade = (1 - j / length) ** 1.6
          const level = Math.min(1, fade * presence * (hi ? 0.6 + lit : 1))
          push(hi + Math.min(BUCKETS - 1, Math.floor(level * BUCKETS)), px, py, x, y)
        }
        px = x
        py = y
      }
    }

    ctx.lineWidth = 1.25
    ctx.lineCap = 'round'
    const stroke = (from: number, color: string) => {
      ctx.strokeStyle = color
      for (let b = 0; b < BUCKETS; b++) {
        const seg = segments[from + b]!
        if (!seg.n) continue
        ctx.globalAlpha = Math.min(1, ((b + 0.5) / BUCKETS) * k)
        ctx.beginPath()
        for (let q = 0; q < seg.n; q += 4) {
          ctx.moveTo(seg.data[q]!, seg.data[q + 1]!)
          ctx.lineTo(seg.data[q + 2]!, seg.data[q + 3]!)
        }
        ctx.stroke()
      }
    }
    stroke(0, cssColor(streakColor))
    stroke(BUCKETS, cssColor(highlight))
  }

  return {
    frame: (info: FrameInfo) => {
      const s = settings()
      fit(info.width / info.dpr, info.height / info.dpr, info.reduced, info.low, s)
      const p = info.pointer
      // Lay down full trails before the first frame, so the field never starts as a scatter of dots.
      if (clock === 0 && count > 0) for (let n = 0; n < WARMUP_STEPS; n++) advance(s, p, false)
      if (!info.reduced) {
        owed = Math.min(owed + info.dt * s.speed, STEP * MAX_STEPS)
        const pointerOn = p.strength > 0.01
        while (owed >= STEP) {
          advance(s, p, pointerOn)
          owed -= STEP
        }
      }
      draw(info, s)
    },
    dispose: () => {
      data = new Float32Array(0)
      history = new Float32Array(0)
      count = 0
    },
  }
}

/** Smooth 3D value noise in [-1, 1], seeded: quintic-faded trilinear blend of hashed lattice values. */
function createNoise(seed: number) {
  const random = mulberry32(seed)
  const table = new Float32Array(256)
  const perm = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    table[i] = random() * 2 - 1
    perm[i] = i
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const t = perm[i]!
    perm[i] = perm[j]!
    perm[j] = t
  }
  const at = (x: number, y: number, z: number) => table[perm[(perm[(perm[x & 255]! + y) & 255]! + z) & 255]!]!
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const zi = Math.floor(z)
    const u = fade(x - xi)
    const v = fade(y - yi)
    const w = fade(z - zi)
    return mix(
      mix(mix(at(xi, yi, zi), at(xi + 1, yi, zi), u), mix(at(xi, yi + 1, zi), at(xi + 1, yi + 1, zi), u), v),
      mix(mix(at(xi, yi, zi + 1), at(xi + 1, yi, zi + 1), u), mix(at(xi, yi + 1, zi + 1), at(xi + 1, yi + 1, zi + 1), u), v),
      w,
    )
  }
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
