import { landDots } from './land'

/* The globe's drawing, apart from React: an orthographic dot globe on a 2D
 * canvas. Everything is kept as unit vectors (x east at 0°, y north, z
 * toward 0°/0°) and turned to the view with one yaw and one pitch per frame,
 * so a frame is a few multiply-adds per dot and no trig. Dots on the far side
 * are skipped; the rest are batched into a handful of fills by color and
 * depth, which is what keeps it cheap on older machines. */

const RAD = Math.PI / 180

export interface Palette {
  land: string
  line: string
  ink: string
  accent: string
  halo: string
  /** Region colors, in REGIONS visit. */
  tones: string[]
}

/** The center of the view, degrees. */
export interface View {
  lon: number
  lat: number
}

export interface Size {
  width: number
  height: number
}

export type Vec = [number, number, number]

export const toVec = (lon: number, lat: number): Vec => {
  const c = Math.cos(lat * RAD)
  return [c * Math.sin(lon * RAD), Math.sin(lat * RAD), c * Math.cos(lon * RAD)]
}

/** The land as three columns of unit-vector components, decoded once. */
export function prepareLand() {
  const raw = landDots()
  const count = raw.length / 2
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  const z = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const [a, b, c] = toVec(raw[i * 2]!, raw[i * 2 + 1]!)
    x[i] = a
    y[i] = b
    z[i] = c
  }
  // Each frame's screen positions and fill buckets, reused so a frame allocates nothing.
  return { count, x, y, z, px: new Float32Array(count), py: new Float32Array(count), bucket: new Int16Array(count) }
}
export type Land = ReturnType<typeof prepareLand>

/** Each land dot's nearest country in reach, lit by that country's share: its region (-1 for none) and how strongly. */
export function tintLand(land: Land, countries: { at: Vec; tone: number; share: number }[]) {
  const tone = new Int8Array(land.count).fill(-1)
  const level = new Float32Array(land.count)
  for (const m of countries) {
    const reach = (2.6 + 8.5 * Math.sqrt(m.share)) * RAD
    const edge = Math.cos(reach)
    for (let i = 0; i < land.count; i++) {
      const d = land.x[i]! * m.at[0] + land.y[i]! * m.at[1] + land.z[i]! * m.at[2]
      if (d <= edge) continue
      const strength = (1 - Math.acos(Math.min(1, d)) / reach) * (0.45 + 0.55 * Math.sqrt(m.share))
      if (strength > level[i]!) {
        level[i] = strength
        tone[i] = m.tone
      }
    }
  }
  return { tone, level }
}
export type Tint = ReturnType<typeof tintLand>

/** A great-circle path from `a` to `b`, lifted off the surface in the middle by how far it goes. */
export function arcPoints(a: Vec, b: Vec, steps = 40) {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const angle = Math.acos(dot)
  const sin = Math.sin(angle) || 1
  const lift = 0.05 + 0.24 * (angle / Math.PI)
  const out = new Float32Array((steps + 1) * 3)
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const wa = Math.sin((1 - t) * angle) / sin
    const wb = Math.sin(t * angle) / sin
    const h = 1 + lift * Math.sin(Math.PI * t)
    out[s * 3] = (a[0] * wa + b[0] * wb) * h
    out[s * 3 + 1] = (a[1] * wa + b[1] * wb) * h
    out[s * 3 + 2] = (a[2] * wa + b[2] * wb) * h
  }
  return out
}

/** Turns a world vector to the view: writes screen-space x, y (unit radius, y up) and depth z into `out`. */
export function turner(view: View) {
  const sl = Math.sin(view.lon * RAD)
  const cl = Math.cos(view.lon * RAD)
  const sp = Math.sin(view.lat * RAD)
  const cp = Math.cos(view.lat * RAD)
  return (x: number, y: number, z: number, out: Float32Array | number[]) => {
    const x1 = x * cl - z * sl
    const z1 = z * cl + x * sl
    out[0] = x1
    out[1] = y * cp - z1 * sp
    out[2] = y * sp + z1 * cp
  }
}
export type Turn = ReturnType<typeof turner>

/** The globe's radius and center in a canvas of `size`: room is left around it for the arcs to rise. */
export function frameOf(size: Size) {
  const r = (Math.min(size.width, size.height) / 2) * 0.8
  return { cx: size.width / 2, cy: size.height / 2, r }
}

const LEVELS = 4
const scratch = new Float32Array(3)

/** The disc, its rim and the land: neutral dots by depth, lit ones by region and depth (`focus`, a region's index, dims the others). */
export function drawGlobe(ctx: CanvasRenderingContext2D, size: Size, land: Land, tint: Tint | null, turn: Turn, palette: Palette, focus: number, fade = 1) {
  const { cx, cy, r } = frameOf(size)
  ctx.clearRect(0, 0, size.width, size.height)
  // A faint body and a hairline rim.
  ctx.globalAlpha = 0.035
  ctx.fillStyle = palette.halo
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 1
  ctx.stroke()

  const dot = Math.max(0.75, r * 0.0052)
  const { px, py, bucket } = land
  for (let i = 0; i < land.count; i++) {
    turn(land.x[i]!, land.y[i]!, land.z[i]!, scratch)
    const depth = scratch[2]!
    if (depth <= 0.06) {
      bucket[i] = -1
      continue
    }
    px[i] = cx + scratch[0]! * r
    py[i] = cy - scratch[1]! * r
    const lvl = Math.min(LEVELS - 1, Math.floor(depth * LEVELS))
    const lit = tint && tint.tone[i]! >= 0 && tint.level[i]! > 0.12 ? tint.tone[i]! : -1
    bucket[i] = lit < 0 ? lvl : LEVELS + lit * LEVELS + lvl
  }
  const fills = LEVELS + palette.tones.length * LEVELS
  for (let b = 0; b < fills; b++) {
    const lit = b >= LEVELS
    const lvl = b % LEVELS
    const tone = Math.floor(b / LEVELS) - 1
    const depthAlpha = (0.12 + 0.88 * ((lvl + 1) / LEVELS) ** 1.3) * fade
    ctx.fillStyle = lit ? palette.tones[tone]! : palette.land
    ctx.globalAlpha = lit ? depthAlpha * (focus < 0 || focus === tone ? 1 : 0.28) : depthAlpha * 0.7
    const radius = lit ? dot * 1.18 : dot
    ctx.beginPath()
    let any = false
    for (let i = 0; i < land.count; i++) {
      if (bucket[i] !== b) continue
      ctx.moveTo(px[i]! + radius, py[i]!)
      ctx.arc(px[i]!, py[i]!, radius, 0, Math.PI * 2)
      any = true
    }
    if (any) ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** A point on the view: screen x, y and whether it faces us. */
export function place(at: Vec, size: Size, turn: Turn) {
  const { cx, cy, r } = frameOf(size)
  turn(at[0], at[1], at[2], scratch)
  return { x: cx + scratch[0]! * r, y: cy - scratch[1]! * r, depth: scratch[2]! }
}

/** A country's marker: a ring sized by its share over a dot, faded toward the rim. */
export function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, depth: number, share: number, color: string, alpha: number) {
  if (depth <= 0) return
  const fade = Math.min(1, depth * 3) * alpha
  ctx.globalAlpha = fade
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = fade * 0.55
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, 4 + 11 * Math.sqrt(share), 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** The picked country: an accent ring and four ticks, like a sight. */
export function drawSight(ctx: CanvasRenderingContext2D, x: number, y: number, depth: number, color: string) {
  if (depth <= 0) return
  ctx.globalAlpha = Math.min(1, depth * 3)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
    ctx.moveTo(x + dx * 12, y + dy * 12)
    ctx.lineTo(x + dx * 17, y + dy * 17)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * The part of an arc between `from` and `to` (0–1 along it): a faint thread
 * with a brighter stretch behind the head. Points the globe hides are skipped.
 */
export function drawArc(ctx: CanvasRenderingContext2D, points: Float32Array, from: number, to: number, size: Size, turn: Turn, color: string, alpha: number, head: boolean) {
  const { cx, cy, r } = frameOf(size)
  const steps = points.length / 3 - 1
  const start = Math.max(0, Math.floor(from * steps))
  const end = Math.min(steps, Math.ceil(to * steps))
  if (end <= start) return
  const bright = Math.max(start, end - Math.ceil(steps * 0.22))
  ctx.strokeStyle = color
  ctx.lineWidth = 1.35
  ctx.lineCap = 'round'
  for (const [a, b, strength] of [
    [start, end, 0.32],
    [bright, end, 0.95],
  ] as const) {
    ctx.globalAlpha = alpha * strength
    ctx.beginPath()
    let pen = false
    for (let s = a; s <= b; s++) {
      turn(points[s * 3]!, points[s * 3 + 1]!, points[s * 3 + 2]!, scratch)
      const hidden = scratch[2]! < 0 && scratch[0]! * scratch[0]! + scratch[1]! * scratch[1]! < 1
      if (hidden) {
        pen = false
        continue
      }
      const x = cx + scratch[0]! * r
      const y = cy - scratch[1]! * r
      if (pen) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      pen = true
    }
    ctx.stroke()
  }
  if (head && to < 1) {
    turn(points[end * 3]!, points[end * 3 + 1]!, points[end * 3 + 2]!, scratch)
    if (!(scratch[2]! < 0 && scratch[0]! * scratch[0]! + scratch[1]! * scratch[1]! < 1)) {
      const x = cx + scratch[0]! * r
      const y = cy - scratch[1]! * r
      ctx.fillStyle = color
      ctx.globalAlpha = alpha * 0.22
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

/** A landing: a ring that opens and fades, `progress` 0–1. */
export function drawPing(ctx: CanvasRenderingContext2D, x: number, y: number, depth: number, progress: number, color: string, alpha: number) {
  if (depth <= 0 || progress >= 1) return
  ctx.globalAlpha = (1 - progress) * Math.min(1, depth * 3) * alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.arc(x, y, 3 + progress * 15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
}
