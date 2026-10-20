import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { cssColor, lightness } from './color'
import { fallbackBackground, useBackgroundCanvas, type FrameInfo } from './gl'

export interface ParticleConstellationProps {
  /** [particles, links, highlight] CSS colors. Default: `--color-fg-muted`, `--color-fg-subtle`, `--color-accent`. */
  colors?: [particles: string, links: string, highlight: string]
  /** Opacity of particles and links, 0–1.5. Default 1. */
  intensity?: number
  /** Drift speed multiplier. Default 1. */
  speed?: number
  /** Particles per area, relative. 1 ≈ one particle per 9 000 CSS px². Default 1. */
  density?: number
  /** Max link length in CSS px. Default 130. */
  linkDistance?: number
  /** How particles respond to the pointer. Default 'attract' (they gather into a loose ring around it). */
  pointer?: 'attract' | 'repel'
  /** Pointer reactivity. Default true. */
  interactive?: boolean
  /**
   * Pulses of light that travel along the links from particle to particle, sometimes triggering the next one,
   * like neurons firing. `true` uses the default rainbow (mint, sky, violet, orange; brighter on a dark canvas).
   * Off by default; none under reduced motion.
   */
  signals?: boolean | SignalOptions
  className?: string
}

export interface SignalOptions {
  /** CSS colors, one per chain of pulses. Default: a soft rainbow that follows the theme. */
  colors?: string[]
  /** New chains per second. Default 3. */
  rate?: number
}

const SIGNAL_LIGHT = ['oklch(0.72 0.13 175)', 'oklch(0.7 0.13 230)', 'oklch(0.66 0.16 290)', 'oklch(0.74 0.15 55)'] // youj-allow: the signal rainbow, fixed hues
const SIGNAL_DARK = ['oklch(0.84 0.15 175)', 'oklch(0.8 0.15 230)', 'oklch(0.78 0.17 290)', 'oklch(0.86 0.15 55)'] // youj-allow: the signal rainbow, fixed hues
const SIGNAL_RATE = 3
const SIGNAL_SPEED = 200 // CSS px per second
const SIGNAL_TAIL = 56 // CSS px
const MAX_PULSES = 56
const LOW_MAX_PULSES = 20
const MAX_CHAIN = 7

const AREA_PER_PARTICLE = 9000
const MAX_PARTICLES = 900
/** The low motion-budget tier keeps this share of the particles (links scale with its square). */
const LOW_DENSITY = 0.6
const POINTER_RADIUS = 220
const POINTER_ACCEL = 340
const RELAX = 0.9
const BUCKETS = 8
const STRIDE = 6 // x, y, vx, vy, drift x, drift y

/**
 * Drifting particles linked by hairlines when near each other. The pointer draws
 * them into a loose ring (or pushes them away) and lights the nearby links in the accent.
 * Canvas 2D with a spatial grid and alpha-bucketed batched strokes: a handful of draw calls per frame.
 */
export function ParticleConstellation({
  colors,
  intensity = 1,
  speed = 1,
  density = 1,
  linkDistance = 130,
  pointer = 'attract',
  interactive = true,
  signals = false,
  className,
}: ParticleConstellationProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [dotColor = 'var(--color-fg-muted)', linkColor = 'var(--color-fg-subtle)', highlight = 'var(--color-accent)'] =
    colors ?? []
  const signalOptions = signals === true ? {} : signals || null
  // Light and dark defaults both resolve; the frame picks by the canvas's lightness.
  const signalColors = signalOptions?.colors?.length ? signalOptions.colors : signalOptions ? [...SIGNAL_LIGHT, ...SIGNAL_DARK] : []
  const signalRate = signalOptions ? (signalOptions.rate ?? SIGNAL_RATE) : 0
  const props = useRef({ intensity, speed, density, linkDistance, pointer, signalRate, customSignals: !!signalOptions?.colors?.length })
  props.current = { intensity, speed, density, linkDistance, pointer, signalRate, customSignals: !!signalOptions?.colors?.length }

  const { failed } = useBackgroundCanvas(hostRef, {
    colors: ['var(--color-canvas)', dotColor, linkColor, highlight, ...signalColors],
    speed,
    interactive,
    create: (canvas) => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
      return createConstellation(ctx, () => props.current)
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

type Settings = ParticleConstellationProps & {
  density: number
  linkDistance: number
  intensity: number
  signalRate: number
  customSignals: boolean
}

interface Pulse {
  from: number
  to: number
  t: number
  hue: number
  depth: number
}

function createConstellation(ctx: CanvasRenderingContext2D, settings: () => Settings) {
  let random = mulberry32(0x6b696e)
  let data = new Float32Array(0)
  let count = 0
  let width = 0
  let height = 0
  let wasReduced: boolean | null = null
  // Segment buffers per alpha bucket: [ink × BUCKETS, highlight × BUCKETS], each x1 y1 x2 y2 …
  const segments = Array.from({ length: BUCKETS * 2 }, () => ({ data: new Float32Array(1024), n: 0 }))
  let heads = new Int32Array(0)
  let next = new Int32Array(0)
  let gridCols = 1
  let gridRows = 1
  let gridCell = 1
  // Signals: pulses in flight, and a per-particle flash (0–1) with the hue that last lit it.
  const pulses: Pulse[] = []
  let flash = new Float32Array(0)
  let flashHue = new Uint8Array(0)
  let fireDebt = 0

  const spawn = (i: number) => {
    const o = i * STRIDE
    const angle = random() * Math.PI * 2
    const v = 6 + random() * 14
    data[o] = random() * width
    data[o + 1] = random() * height
    data[o + 2] = data[o + 4] = Math.cos(angle) * v
    data[o + 3] = data[o + 5] = Math.sin(angle) * v
  }

  const fit = (w: number, h: number, reduced: boolean, low: boolean) => {
    const density = settings().density * (low ? LOW_DENSITY : 1)
    const target = Math.min(MAX_PARTICLES, Math.round(((w * h) / AREA_PER_PARTICLE) * density))
    // Reduced motion always shows the same composition.
    if (reduced !== wasReduced) {
      random = mulberry32(0x6b696e)
      count = 0
      wasReduced = reduced
    }
    if (width && height && (w !== width || h !== height)) {
      for (let i = 0; i < count; i++) {
        data[i * STRIDE] = data[i * STRIDE]! * (w / width)
        data[i * STRIDE + 1] = data[i * STRIDE + 1]! * (h / height)
      }
    }
    width = w
    height = h
    if (data.length < target * STRIDE) {
      const grown = new Float32Array(target * STRIDE)
      grown.set(data.subarray(0, count * STRIDE))
      data = grown
    }
    for (let i = count; i < target; i++) spawn(i)
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

  const step = (info: FrameInfo, s: Settings) => {
    const dt = info.dt * (s.speed ?? 1)
    const p = info.pointer
    const relax = 1 - Math.exp(-dt * RELAX)
    const ring = POINTER_RADIUS * 0.38
    for (let i = 0; i < count; i++) {
      const o = i * STRIDE
      let vx = data[o + 2]!
      let vy = data[o + 3]!
      if (p.strength > 0.01) {
        const dx = p.x - data[o]!
        const dy = p.y - data[o + 1]!
        const d = Math.hypot(dx, dy)
        if (d < POINTER_RADIUS && d > 1e-3) {
          const falloff = (1 - d / POINTER_RADIUS) ** 2 * p.strength * POINTER_ACCEL * dt
          // Attract settles particles on a loose ring instead of collapsing them onto the cursor.
          const dir = s.pointer === 'repel' ? -1 : d > ring ? 1 : -0.8
          vx += (dx / d) * falloff * dir
          vy += (dy / d) * falloff * dir
        }
      }
      vx += (data[o + 4]! - vx) * relax
      vy += (data[o + 5]! - vy) * relax
      data[o + 2] = vx
      data[o + 3] = vy
      const margin = 24
      let x = data[o]! + vx * dt
      let y = data[o + 1]! + vy * dt
      if (x < -margin) x += width + margin * 2
      else if (x > width + margin) x -= width + margin * 2
      if (y < -margin) y += height + margin * 2
      else if (y > height + margin) y -= height + margin * 2
      data[o] = x
      data[o + 1] = y
    }
  }

  const draw = (info: FrameInfo, s: Settings) => {
    const [canvasColor = [0, 0, 0], dotColor = [1, 1, 1], linkColor = [1, 1, 1], highlight = [1, 1, 1]] = info.colors
    const L = s.linkDistance
    const L2 = L * L
    const p = info.pointer
    const pointerOn = !info.reduced && p.strength > 0.01
    const k = Math.max(0, s.intensity)

    ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor(canvasColor)
    ctx.fillRect(0, 0, width, height)

    // Spatial hash, cell = link distance: only neighboring cells can hold links.
    const cols = Math.max(1, Math.ceil(width / L) + 2)
    const rows = Math.max(1, Math.ceil(height / L) + 2)
    if (heads.length < cols * rows) heads = new Int32Array(cols * rows)
    if (next.length < count) next = new Int32Array(count)
    gridCols = cols
    gridRows = rows
    gridCell = L
    heads.fill(-1, 0, cols * rows)
    for (let i = 0; i < count; i++) {
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(data[i * STRIDE]! / L) + 1))
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(data[i * STRIDE + 1]! / L) + 1))
      const c = cy * cols + cx
      next[i] = heads[c]!
      heads[c] = i
    }

    for (const seg of segments) seg.n = 0
    const glowR = POINTER_RADIUS * 1.15
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        for (let i = heads[cy * cols + cx]!; i !== -1; i = next[i]!) {
          const xi = data[i * STRIDE]!
          const yi = data[i * STRIDE + 1]!
          // Same cell (later entries only) plus four forward neighbors: each pair visited once.
          for (let n = 0; n < 5; n++) {
            const nx = cx + (n === 0 ? 0 : n === 1 ? 1 : n - 3)
            const ny = cy + (n < 2 ? 0 : 1)
            if (nx < 0 || nx >= cols || ny >= rows) continue
            let j = n === 0 ? next[i]! : heads[ny * cols + nx]!
            for (; j !== -1; j = next[j]!) {
              const dx = data[j * STRIDE]! - xi
              const dy = data[j * STRIDE + 1]! - yi
              const d2 = dx * dx + dy * dy
              if (d2 >= L2) continue
              const a = 1 - Math.sqrt(d2) / L
              let lit = 0
              if (pointerOn) {
                const md = Math.hypot(xi + dx * 0.5 - p.x, yi + dy * 0.5 - p.y)
                lit = md < glowR ? (1 - md / glowR) * p.strength : 0
              }
              const hi = lit > 0.25
              const level = hi ? Math.min(1, a * (0.6 + lit)) : a ** 1.5
              const b = Math.min(BUCKETS - 1, Math.floor(level * BUCKETS))
              push(hi ? BUCKETS + b : b, xi, yi, xi + dx, yi + dy)
            }
          }
        }
      }
    }

    // Pointer as a node of its own: accent links to everything in reach.
    if (pointerOn) {
      for (let i = 0; i < count; i++) {
        const dx = data[i * STRIDE]! - p.x
        const dy = data[i * STRIDE + 1]! - p.y
        const d = Math.hypot(dx, dy)
        if (d < L * 1.4) {
          const level = (1 - d / (L * 1.4)) * p.strength
          push(BUCKETS + Math.min(BUCKETS - 1, Math.floor(level * BUCKETS)), p.x, p.y, p.x + dx, p.y + dy)
        }
      }
    }

    ctx.lineWidth = 0.75
    const stroke = (from: number, color: string, peak: number) => {
      ctx.strokeStyle = color
      for (let b = 0; b < BUCKETS; b++) {
        const seg = segments[from + b]!
        if (!seg.n) continue
        ctx.globalAlpha = Math.min(1, ((b + 0.5) / BUCKETS) * peak * k)
        ctx.beginPath()
        for (let q = 0; q < seg.n; q += 4) {
          ctx.moveTo(seg.data[q]!, seg.data[q + 1]!)
          ctx.lineTo(seg.data[q + 2]!, seg.data[q + 3]!)
        }
        ctx.stroke()
      }
    }
    stroke(0, cssColor(linkColor), 0.9)
    stroke(BUCKETS, cssColor(highlight), 0.9)

    // Particles: one path for the field, one for those lit by the pointer.
    ctx.globalAlpha = Math.min(1, 0.85 * k)
    ctx.fillStyle = cssColor(dotColor)
    ctx.beginPath()
    const lit: number[] = []
    for (let i = 0; i < count; i++) {
      const x = data[i * STRIDE]!
      const y = data[i * STRIDE + 1]!
      if (pointerOn && Math.hypot(x - p.x, y - p.y) < POINTER_RADIUS * 0.8) {
        lit.push(i)
        continue
      }
      ctx.moveTo(x + 1.4, y)
      ctx.arc(x, y, 1.4, 0, Math.PI * 2)
    }
    ctx.fill()
    if (lit.length) {
      ctx.globalAlpha = Math.min(1, k)
      ctx.fillStyle = cssColor(highlight)
      ctx.beginPath()
      for (const i of lit) {
        const x = data[i * STRIDE]!
        const y = data[i * STRIDE + 1]!
        ctx.moveTo(x + 1.75, y)
        ctx.arc(x, y, 1.75, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.globalAlpha = Math.min(1, p.strength * k)
      ctx.fill()
    }
  }

  /** A random particle linked to `i` (within the link distance), other than `not`; -1 if none. */
  const neighbor = (i: number, not: number) => {
    const xi = data[i * STRIDE]!
    const yi = data[i * STRIDE + 1]!
    const cx = Math.min(gridCols - 1, Math.max(0, Math.floor(xi / gridCell) + 1))
    const cy = Math.min(gridRows - 1, Math.max(0, Math.floor(yi / gridCell) + 1))
    let pick = -1
    let seen = 0
    for (let y = Math.max(0, cy - 1); y <= Math.min(gridRows - 1, cy + 1); y++) {
      for (let x = Math.max(0, cx - 1); x <= Math.min(gridCols - 1, cx + 1); x++) {
        for (let j = heads[y * gridCols + x]!; j !== -1; j = next[j]!) {
          if (j === i || j === not) continue
          if (Math.hypot(data[j * STRIDE]! - xi, data[j * STRIDE + 1]! - yi) >= gridCell) continue
          // Reservoir sampling: every candidate is equally likely.
          if (Math.random() * ++seen < 1) pick = j
        }
      }
    }
    return pick
  }

  const launch = (from: number, not: number, hue: number, depth: number, max: number) => {
    if (pulses.length >= max) return
    const to = neighbor(from, not)
    if (to >= 0) pulses.push({ from, to, t: 0, hue, depth })
  }

  const stepSignals = (dt: number, s: Settings, hues: number, max: number) => {
    if (flash.length < count) {
      const grown = new Float32Array(count)
      grown.set(flash)
      flash = grown
      const hueGrown = new Uint8Array(count)
      hueGrown.set(flashHue)
      flashHue = hueGrown
    }
    const decay = Math.exp(-dt * 3.2)
    for (let i = 0; i < count; i++) flash[i]! > 0.01 ? (flash[i] = flash[i]! * decay) : (flash[i] = 0)

    fireDebt = Math.min(4, fireDebt + dt * s.signalRate * (max / MAX_PULSES + 0.25))
    for (; fireDebt >= 1; fireDebt -= 1) {
      if (count) launch(Math.floor(Math.random() * count), -1, Math.floor(Math.random() * hues), 0, max)
    }

    for (let n = pulses.length - 1; n >= 0; n--) {
      const p = pulses[n]!
      const dx = data[p.to * STRIDE]! - data[p.from * STRIDE]!
      const dy = data[p.to * STRIDE + 1]! - data[p.from * STRIDE + 1]!
      const len = Math.hypot(dx, dy)
      // Gone: the link stretched past reach (or wrapped around an edge), or the particle no longer exists.
      if (p.from >= count || p.to >= count || len >= gridCell) {
        pulses.splice(n, 1)
        continue
      }
      p.t += (dt * SIGNAL_SPEED) / Math.max(len, 24)
      if (p.t < 1) continue
      pulses.splice(n, 1)
      flash[p.to] = 1
      flashHue[p.to] = p.hue
      // A cascade: usually the next particle fires too, sometimes two, and it thins out with depth.
      if (p.depth >= MAX_CHAIN || Math.random() > 0.82 - p.depth * 0.09) continue
      const hue = Math.random() < 0.25 ? Math.floor(Math.random() * hues) : p.hue
      launch(p.to, p.from, hue, p.depth + 1, max)
      if (Math.random() < 0.22) launch(p.to, p.from, hue, p.depth + 1, max)
    }
  }

  const drawSignals = (palette: readonly (readonly [number, number, number])[], dark: boolean, k: number) => {
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'
    ctx.lineCap = 'round'
    const colors = palette.map((c) => cssColor([c[0], c[1], c[2]]))
    const glow = dark ? 1 : 0.8
    for (const p of pulses) {
      const x1 = data[p.from * STRIDE]!
      const y1 = data[p.from * STRIDE + 1]!
      const dx = data[p.to * STRIDE]! - x1
      const dy = data[p.to * STRIDE + 1]! - y1
      const len = Math.hypot(dx, dy) || 1
      const hx = x1 + dx * p.t
      const hy = y1 + dy * p.t
      const color = colors[p.hue % colors.length]!
      ctx.strokeStyle = color
      ctx.fillStyle = color
      // The tail: three segments that fade away behind the head, never behind the sender.
      const tail = Math.min(SIGNAL_TAIL, p.t * len)
      for (let q = 0; q < 3; q++) {
        const a = p.t - ((q + 1) / 3) * (tail / len)
        const b = p.t - (q / 3) * (tail / len)
        ctx.globalAlpha = Math.min(1, (0.85 - q * 0.27) * k * glow)
        ctx.lineWidth = 2 - q * 0.45
        ctx.beginPath()
        ctx.moveTo(x1 + dx * a, y1 + dy * a)
        ctx.lineTo(x1 + dx * b, y1 + dy * b)
        ctx.stroke()
      }
      ctx.globalAlpha = Math.min(1, 0.26 * k * glow)
      ctx.beginPath()
      ctx.arc(hx, hy, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = Math.min(1, 0.95 * k)
      ctx.beginPath()
      ctx.arc(hx, hy, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    // The receiving particle brightens and settles back.
    for (let i = 0; i < count; i++) {
      const f = flash[i]!
      if (f <= 0) continue
      const x = data[i * STRIDE]!
      const y = data[i * STRIDE + 1]!
      ctx.fillStyle = colors[flashHue[i]! % colors.length]!
      ctx.globalAlpha = Math.min(1, 0.22 * f * k * glow)
      ctx.beginPath()
      ctx.arc(x, y, 3 + 5 * f, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = Math.min(1, f * k)
      ctx.beginPath()
      ctx.arc(x, y, 1.6 + 0.9 * f, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineCap = 'butt'
  }

  return {
    frame: (info: FrameInfo) => {
      const s = settings()
      fit(info.width / info.dpr, info.height / info.dpr, info.reduced, info.low)
      if (!info.reduced) step(info, s)
      draw(info, s)
      const extra = info.colors.slice(4)
      if (info.reduced || !s.signalRate || !extra.length) {
        pulses.length = 0
        return
      }
      // Default colors come as light then dark sets; custom ones are used as given.
      const half = extra.length / 2
      const dark = info.colors[0] ? lightness(info.colors[0]) < 0.5 : false
      const palette = s.customSignals ? extra : dark ? extra.slice(half) : extra.slice(0, half)
      stepSignals(info.dt * (s.speed ?? 1), s, palette.length, info.low ? LOW_MAX_PULSES : MAX_PULSES)
      drawSignals(palette, dark, Math.max(0, s.intensity))
    },
    dispose: () => {
      data = new Float32Array(0)
      count = 0
      pulses.length = 0
    },
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
