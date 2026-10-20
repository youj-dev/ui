import { useRef } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { cssColor } from './color'
import { fallbackBackground, useBackgroundCanvas, type FrameInfo } from './gl'

export interface SwarmProps {
  /** [boids, highlight] CSS colors. Default: `--color-fg-muted`, `--color-accent`. */
  colors?: [boids: string, highlight: string]
  /** Opacity of the flock, 0–1.5. Default 1. */
  intensity?: number
  /** Flight speed multiplier. Default 1. */
  speed?: number
  /** Boids per area, relative. 1 ≈ one boid per 3 800 CSS px². Default 1. */
  density?: number
  /** Size of each boid, 0.5–2.5. Default 1. */
  size?: number
  /** Pointer reactivity: the flock gathers and circles the pointer. Default true. */
  interactive?: boolean
  className?: string
}

const AREA_PER_BOID = 3800
const MAX_BOIDS = 480
/** The low motion-budget tier keeps this share of the flock. */
const LOW_DENSITY = 0.6
const STEP = 1 / 60
const MAX_STEPS = 4
const SIGHT = 66 // neighbors count within this many CSS px; also the spatial-hash cell
const CROWD = 20 // closer than this and a boid backs off
const MIN_SPEED = 40
const MAX_SPEED = 118
const EDGE = 70
const REACH = 440 // how far away the pointer still draws the flock
const ORBIT = 112 // radius of the circle around the pointer
const WARMUP_STEPS = 260
const TIERS = 3
const TIER_ALPHA = [0.42, 0.68, 0.95]
const TIER_SIZE = [0.82, 1, 1.18]
const STRIDE = 7 // x, y, vx, vy, wander phase, wander rate, own cruising speed

/**
 * A flock that roams the canvas, then gathers and circles the pointer. Each boid steers by three rules
 * (steer away from crowding, match the heading of neighbors, drift toward their center) plus a slow
 * personal wander, and the pointer adds an orbit. Neighbors come from a spatial hash, so the cost stays
 * linear in the flock. Canvas 2D: boids are darts, batched into a few alpha tiers for a sense of depth.
 */
export function Swarm({ colors, intensity = 1, speed = 1, density = 1, size = 1, interactive = true, className }: SwarmProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [boidColor = 'var(--color-fg-muted)', highlight = 'var(--color-accent)'] = colors ?? []
  const props = useRef({ intensity, speed, density, size })
  props.current = { intensity, speed, density, size }

  const { failed } = useBackgroundCanvas(hostRef, {
    colors: ['var(--color-canvas)', boidColor, highlight],
    speed,
    interactive,
    create: (canvas) => {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return null
      return createSwarm(ctx, () => props.current)
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

type Settings = Required<Pick<SwarmProps, 'intensity' | 'speed' | 'density' | 'size'>>

function createSwarm(ctx: CanvasRenderingContext2D, settings: () => Settings) {
  let random = mulberry32(0x73776d)
  let data = new Float32Array(0)
  let count = 0
  let width = 0
  let height = 0
  let clock = 0
  let owed = 0
  let wasReduced: boolean | null = null
  let heads = new Int32Array(0)
  let next = new Int32Array(0)
  let cols = 1
  let rows = 1

  const spawn = (i: number) => {
    const o = i * STRIDE
    const x = random() * width
    const y = random() * height
    // A coherent starting heading that varies across the canvas, so the flock begins as a few streams.
    const angle = (x / Math.max(width, 1) + y / Math.max(height, 1)) * Math.PI * 2 + (random() - 0.5) * 0.7
    const cruise = 56 + random() * 44
    const v = cruise
    data[o] = x
    data[o + 1] = y
    data[o + 2] = Math.cos(angle) * v
    data[o + 3] = Math.sin(angle) * v
    data[o + 4] = random() * Math.PI * 2
    data[o + 5] = 0.3 + random() * 0.6
    data[o + 6] = cruise
  }

  const fit = (w: number, h: number, reduced: boolean, low: boolean, s: Settings) => {
    const target = Math.min(MAX_BOIDS, Math.round(((w * h) / AREA_PER_BOID) * s.density * (low ? LOW_DENSITY : 1)))
    // Reduced motion always shows the same composition.
    if (reduced !== wasReduced) {
      random = mulberry32(0x73776d)
      count = 0
      clock = 0
      owed = 0
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

  const rebuildHash = () => {
    cols = Math.max(1, Math.ceil(width / SIGHT))
    rows = Math.max(1, Math.ceil(height / SIGHT))
    if (heads.length < cols * rows) heads = new Int32Array(cols * rows)
    if (next.length < count) next = new Int32Array(count)
    heads.fill(-1, 0, cols * rows)
    for (let i = 0; i < count; i++) {
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(data[i * STRIDE]! / SIGHT)))
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(data[i * STRIDE + 1]! / SIGHT)))
      const c = cy * cols + cx
      next[i] = heads[c]!
      heads[c] = i
    }
  }

  const advance = (p: FrameInfo['pointer'], pointerOn: boolean) => {
    rebuildHash()
    const sight2 = SIGHT * SIGHT
    for (let i = 0; i < count; i++) {
      const o = i * STRIDE
      const x = data[o]!
      const y = data[o + 1]!
      let vx = data[o + 2]!
      let vy = data[o + 3]!
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(x / SIGHT)))
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(y / SIGHT)))

      let n = 0
      let sumVx = 0
      let sumVy = 0
      let sumX = 0
      let sumY = 0
      let awayX = 0
      let awayY = 0
      for (let gy = Math.max(0, cy - 1); gy <= Math.min(rows - 1, cy + 1); gy++) {
        for (let gx = Math.max(0, cx - 1); gx <= Math.min(cols - 1, cx + 1); gx++) {
          for (let j = heads[gy * cols + gx]!; j !== -1; j = next[j]!) {
            if (j === i) continue
            const dx = data[j * STRIDE]! - x
            const dy = data[j * STRIDE + 1]! - y
            const d2 = dx * dx + dy * dy
            if (d2 >= sight2) continue
            n++
            sumVx += data[j * STRIDE + 2]!
            sumVy += data[j * STRIDE + 3]!
            sumX += dx
            sumY += dy
            if (d2 < CROWD * CROWD && d2 > 1e-4) {
              const d = Math.sqrt(d2)
              const push = (1 - d / CROWD) / d
              awayX -= dx * push
              awayY -= dy * push
            }
          }
        }
      }

      let ax = awayX * 240
      let ay = awayY * 240
      if (n) {
        // Match the neighbors' heading and drift toward their center.
        ax += (sumVx / n - vx) * 1.5 + (sumX / n) * 0.45
        ay += (sumVy / n - vy) * 1.5 + (sumY / n) * 0.45
      }

      // A slow personal wander, sideways to the heading, so the flock roams instead of settling.
      const speed = Math.hypot(vx, vy) || 1
      const wander = Math.sin(clock * data[o + 5]! + data[o + 4]!) * 62
      ax += (-vy / speed) * wander
      ay += (vx / speed) * wander
      // ...and each boid's own pace, so the flock keeps shuffling.
      const pace = (data[o + 6]! - speed) * 1.1
      ax += (vx / speed) * pace
      ay += (vy / speed) * pace

      // Turn away from the edges before reaching them.
      if (x < EDGE) ax += (1 - x / EDGE) * 260
      else if (x > width - EDGE) ax -= (1 - (width - x) / EDGE) * 260
      if (y < EDGE) ay += (1 - y / EDGE) * 260
      else if (y > height - EDGE) ay -= (1 - (height - y) / EDGE) * 260

      let top = MAX_SPEED
      if (pointerOn) {
        const rx = x - p.x
        const ry = y - p.y
        const d = Math.hypot(rx, ry)
        if (d > 1e-3 && d < REACH) {
          const pull = p.strength * (1 - d / REACH) ** 0.6
          // Spring toward the orbit radius, plus a push around it: a ring that keeps turning.
          const radial = Math.max(-260, Math.min(260, (ORBIT - d) * 2.4))
          ax += (rx / d) * radial * pull
          ay += (ry / d) * radial * pull
          ax += (-ry / d) * 150 * pull
          ay += (rx / d) * 150 * pull
          top = MAX_SPEED + 40 * pull
        }
      }

      vx += ax * STEP
      vy += ay * STEP
      const v = Math.hypot(vx, vy) || 1
      const clamped = Math.min(top, Math.max(MIN_SPEED, v))
      vx *= clamped / v
      vy *= clamped / v
      data[o + 2] = vx
      data[o + 3] = vy
      data[o] = x + vx * STEP
      data[o + 1] = y + vy * STEP
    }
    clock += STEP
  }

  const draw = (info: FrameInfo, s: Settings) => {
    const [canvasColor = [0, 0, 0], boidColor = [1, 1, 1], highlight = [1, 1, 1]] = info.colors
    const p = info.pointer
    const pointerOn = !info.reduced && p.strength > 0.01
    const k = Math.max(0, s.intensity)
    const L = 5.6 * s.size
    const W = 2.5 * s.size

    ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = cssColor(canvasColor)
    ctx.fillRect(0, 0, width, height)

    // Tails first (one stroked path per color), then the darts per tier and color.
    for (const lit of [false, true]) {
      ctx.strokeStyle = cssColor(lit ? highlight : boidColor)
      ctx.lineWidth = Math.max(0.8, s.size * 0.9)
      ctx.lineCap = 'round'
      ctx.globalAlpha = Math.min(1, 0.22 * k)
      ctx.beginPath()
      let any = false
      for (let i = 0; i < count; i++) {
        if (isLit(i, p, pointerOn) !== lit) continue
        const o = i * STRIDE
        ctx.moveTo(data[o]!, data[o + 1]!)
        ctx.lineTo(data[o]! - data[o + 2]! * 0.11, data[o + 1]! - data[o + 3]! * 0.11)
        any = true
      }
      if (any) ctx.stroke()
    }

    for (const lit of [false, true]) {
      ctx.fillStyle = cssColor(lit ? highlight : boidColor)
      for (let t = 0; t < TIERS; t++) {
        const l = L * TIER_SIZE[t]!
        const w = W * TIER_SIZE[t]!
        ctx.globalAlpha = Math.min(1, TIER_ALPHA[t]! * k)
        ctx.beginPath()
        let any = false
        for (let i = t; i < count; i += TIERS) {
          if (isLit(i, p, pointerOn) !== lit) continue
          const o = i * STRIDE
          const vx = data[o + 2]!
          const vy = data[o + 3]!
          const v = Math.hypot(vx, vy) || 1
          const ux = vx / v
          const uy = vy / v
          const x = data[o]!
          const y = data[o + 1]!
          // A dart with a notched tail: tip, left wing, notch, right wing.
          ctx.moveTo(x + ux * l, y + uy * l)
          ctx.lineTo(x - ux * l * 0.7 - uy * w, y - uy * l * 0.7 + ux * w)
          ctx.lineTo(x - ux * l * 0.3, y - uy * l * 0.3)
          ctx.lineTo(x - ux * l * 0.7 + uy * w, y - uy * l * 0.7 - ux * w)
          ctx.closePath()
          any = true
        }
        if (any) ctx.fill()
      }
    }

    if (pointerOn) {
      ctx.fillStyle = cssColor(highlight)
      ctx.globalAlpha = Math.min(1, p.strength * k)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // A boid lights up in the accent while the pointer has it in its circle.
  const isLit = (i: number, p: FrameInfo['pointer'], pointerOn: boolean) =>
    pointerOn && p.strength > 0.25 && Math.hypot(data[i * STRIDE]! - p.x, data[i * STRIDE + 1]! - p.y) < ORBIT * 1.7

  return {
    frame: (info: FrameInfo) => {
      const s = settings()
      fit(info.width / info.dpr, info.height / info.dpr, info.reduced, info.low, s)
      const p = info.pointer
      // Settle the flock before the first frame, so it never starts as a random scatter.
      if (clock === 0 && count > 0) for (let n = 0; n < WARMUP_STEPS; n++) advance(p, false)
      if (!info.reduced) {
        owed = Math.min(owed + info.dt * s.speed, STEP * MAX_STEPS)
        const pointerOn = p.strength > 0.01
        while (owed >= STEP) {
          advance(p, pointerOn)
          owed -= STEP
        }
      }
      draw(info, s)
    },
    dispose: () => {
      data = new Float32Array(0)
      heads = new Int32Array(0)
      next = new Int32Array(0)
      count = 0
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
