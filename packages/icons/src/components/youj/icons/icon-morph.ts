/* True path morphing between arbitrary stroke icons, with no dependencies.
 *
 * Libraries like flubber morph filled polygons: they close open paths and
 * treat every icon as one blob. Line icons are open strokes in several
 * subpaths, so this engine works on strokes instead:
 *
 *   1. Every visible shape is flattened into polylines ("contours") in
 *      24-unit view-box space.
 *   2. Contours are paired. Identical strokes stay put; a stroke that lies
 *      along a longer one is carved out of it (bell → bell-off keeps the
 *      body and cuts the gap where the slash goes); the rest are paired by
 *      position and length.
 *   3. Paired contours are resampled to the same point count, aligned
 *      (start point and direction) and interpolated with a rotation-aware
 *      blend, so a turning stroke keeps its length instead of collapsing.
 *   4. Anything left over draws in or retracts, anchored where it meets
 *      the rest of the icon.
 *
 * All functions are pure except `readContours`, which reads attributes of
 * an already rendered <svg> (never layout), so it also runs in tests. */

export type Point = [number, number]

export interface Contour {
  /** Flattened outline in view-box units (0–24). A closed contour doesn't repeat its first point. */
  points: Point[]
  closed: boolean
  fill: boolean
  stroke: boolean
}

export type TrackAnchor = 'start' | 'end' | 'center'

export interface MorphTrack {
  /** `morph` interpolates from → to; `enter` draws `to` in; `exit` retracts `from`. */
  kind: 'morph' | 'enter' | 'exit'
  from: Point[]
  to: Point[]
  /** Rendered with a closing segment (only when both ends are closed). */
  closed: boolean
  /** Where an entering stroke grows from, or an exiting one retracts to. */
  anchor: TrackAnchor
  /** Fill and stroke opacity at the start and end of the track. */
  fill: [number, number]
  stroke: [number, number]
  /** The slice of overall progress (0–1) this track plays in. */
  window: [number, number]
  /** Present when from and to are the same stroke: nothing to interpolate. */
  still?: boolean
  rig?: Rig
}

export interface MorphPlan {
  tracks: MorphTrack[]
}

interface Rig {
  from: Point
  to: Point
  angle: number
  scale: number
  /** from − its centroid */
  local: Point[]
  /** What the similarity transform can't explain, added linearly. */
  residual: Point[]
}

/* ── Parsing and flattening ─────────────────────────────────────────────── */

/** Flattening step in view-box units: fine enough that a 64px icon shows no facets. */
const STEP = 0.2
const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
const steps = (length: number, max: number) => Math.min(max, Math.max(2, Math.ceil(length / STEP)))

function arc(from: Point, rx: number, ry: number, rotation: number, large: boolean, sweep: boolean, to: Point, out: Point[]) {
  const [x1, y1] = from
  const [x2, y2] = to
  if (x1 === x2 && y1 === y2) return
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  if (!rx || !ry) {
    out.push([x2, y2])
    return
  }
  // SVG 1.1 implementation notes F.6.5–F.6.6: endpoint to center parameterisation.
  const phi = (rotation * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den))
  const cxp = (coef * rx * y1p) / ry
  const cyp = (-coef * ry * x1p) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  const ux = (x1p - cxp) / rx
  const uy = (y1p - cyp) / ry
  const start = angle(1, 0, ux, uy)
  let delta = angle(ux, uy, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  else if (sweep && delta < 0) delta += 2 * Math.PI
  const n = steps(Math.abs(delta) * Math.max(rx, ry), 160)
  for (let i = 1; i < n; i++) {
    const t = start + (delta * i) / n
    out.push([cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos])
  }
  out.push([x2, y2])
}

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, out: Point[]) {
  const n = steps(dist(p0, p1) + dist(p1, p2) + dist(p2, p3), 96)
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]])
  }
}

function quadratic(p0: Point, p1: Point, p2: Point, out: Point[]) {
  const n = steps(dist(p0, p1) + dist(p1, p2), 96)
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]])
  }
}

/** Drops repeated points and marks a contour closed when it ends where it began. */
function finish(points: Point[], closed: boolean, paint: Pick<Contour, 'fill' | 'stroke'>): Contour | null {
  const out: Point[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || dist(last, p) > 1e-6) out.push(p)
  }
  if (!out.length) return null
  if (out.length > 2 && dist(out[0]!, out[out.length - 1]!) < 0.02) {
    out.pop()
    closed = true
  }
  // A zero-length path ("M12 17h.01") is a dot: keep two points so it has a direction.
  if (out.length === 1) out.push([out[0]![0] + 0.01, out[0]![1]])
  return { points: out, closed: closed && out.length > 2, ...paint }
}

/** Parses SVG path data into flattened contours, one per subpath. */
export function pathContours(d: string, paint: Pick<Contour, 'fill' | 'stroke'> = { fill: false, stroke: true }): Contour[] {
  const contours: Contour[] = []
  let i = 0
  const skip = () => {
    while (i < d.length && ' ,\n\r\t'.includes(d[i]!)) i++
  }
  const more = () => {
    skip()
    return i < d.length && /[\d.+-]/.test(d[i]!)
  }
  const num = () => {
    skip()
    NUMBER.lastIndex = i
    const m = NUMBER.exec(d)
    if (!m) throw new Error('number')
    i = NUMBER.lastIndex
    return parseFloat(m[0])
  }
  const flag = () => {
    skip()
    return d[i++] === '1'
  }

  let pts: Point[] = []
  let cur: Point = [0, 0]
  let start: Point = [0, 0]
  let ctrl: Point | null = null
  let cmd = ''
  const flush = (closed: boolean) => {
    // A lone moveto draws nothing.
    const c = pts.length > 1 ? finish(pts, closed, paint) : null
    if (c) contours.push(c)
    pts = []
  }
  const begin = () => {
    if (!pts.length) pts.push([cur[0], cur[1]])
  }

  try {
    while (true) {
      skip()
      if (i >= d.length) break
      if (/[a-zA-Z]/.test(d[i]!)) cmd = d[i++]!
      else if (!cmd) break
      const rel = cmd === cmd.toLowerCase()
      const ox = rel ? cur[0] : 0
      const oy = rel ? cur[1] : 0
      const C = cmd.toUpperCase()
      if (C === 'Z') {
        flush(true)
        cur = [start[0], start[1]]
        ctrl = null
        cmd = ''
        continue
      }
      let next: Point
      let nextCtrl: Point | null = null
      switch (C) {
        case 'M':
          flush(false)
          next = [ox + num(), oy + num()]
          start = next
          pts.push(next)
          cmd = rel ? 'l' : 'L'
          break
        case 'L':
          begin()
          next = [ox + num(), oy + num()]
          pts.push(next)
          break
        case 'H':
          begin()
          next = [(rel ? cur[0] : 0) + num(), cur[1]]
          pts.push(next)
          break
        case 'V':
          begin()
          next = [cur[0], (rel ? cur[1] : 0) + num()]
          pts.push(next)
          break
        case 'C':
        case 'S': {
          begin()
          const c1: Point = C === 'C' ? [ox + num(), oy + num()] : ctrl ? [2 * cur[0] - ctrl[0], 2 * cur[1] - ctrl[1]] : cur
          const c2: Point = [ox + num(), oy + num()]
          next = [ox + num(), oy + num()]
          cubic(cur, c1, c2, next, pts)
          nextCtrl = c2
          break
        }
        case 'Q':
        case 'T': {
          begin()
          const c1: Point = C === 'Q' ? [ox + num(), oy + num()] : ctrl ? [2 * cur[0] - ctrl[0], 2 * cur[1] - ctrl[1]] : cur
          next = [ox + num(), oy + num()]
          quadratic(cur, c1, next, pts)
          nextCtrl = c1
          break
        }
        case 'A': {
          begin()
          const rx = num()
          const ry = num()
          const rotation = num()
          const large = flag()
          const sweep = flag()
          next = [ox + num(), oy + num()]
          arc(cur, rx, ry, rotation, large, sweep, next, pts)
          break
        }
        default:
          throw new Error('command')
      }
      // Reflection only carries over between curves of the same family.
      ctrl = nextCtrl && (C === 'C' || C === 'S' || C === 'Q' || C === 'T') ? nextCtrl : null
      cur = next
      if (!more() && !/[a-zA-Z]/.test(d[i] ?? '')) break
    }
  } catch {
    // Malformed data: keep what parsed cleanly, like browsers do.
  }
  flush(false)
  return contours
}

function ellipse(cx: number, cy: number, rx: number, ry: number, paint: Pick<Contour, 'fill' | 'stroke'>): Contour[] {
  if (rx <= 0 || ry <= 0) return []
  // Starts at 3 o'clock and runs clockwise, like the browser's own outline.
  const n = Math.max(12, steps(2 * Math.PI * Math.max(rx, ry), 200))
  const points: Point[] = []
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n
    points.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)])
  }
  return [{ points, closed: true, ...paint }]
}

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect'
const HIDDEN_BRANCH = 'mask, clipPath, defs, pattern, marker, symbol'

/** Flattens one SVG geometry element (path, line, polyline, polygon, circle, ellipse, rect). */
export function elementContours(el: Element, paint: Pick<Contour, 'fill' | 'stroke'> = { fill: false, stroke: true }): Contour[] {
  const n = (name: string) => parseFloat(el.getAttribute(name) ?? '') || 0
  switch (el.tagName.toLowerCase()) {
    case 'path':
      return pathContours(el.getAttribute('d') ?? '', paint)
    case 'line': {
      const c = finish([[n('x1'), n('y1')], [n('x2'), n('y2')]], false, paint)
      return c ? [c] : []
    }
    case 'polyline':
    case 'polygon': {
      const values = (el.getAttribute('points') ?? '').match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g)?.map(Number) ?? []
      const points: Point[] = []
      for (let i = 0; i + 1 < values.length; i += 2) points.push([values[i]!, values[i + 1]!])
      const c = finish(points, el.tagName.toLowerCase() === 'polygon', paint)
      return c ? [c] : []
    }
    case 'circle':
      return ellipse(n('cx'), n('cy'), n('r'), n('r'), paint)
    case 'ellipse':
      return ellipse(n('cx'), n('cy'), n('rx'), n('ry'), paint)
    case 'rect': {
      const x = n('x')
      const y = n('y')
      const w = n('width')
      const h = n('height')
      if (w <= 0 || h <= 0) return []
      const hasRx = el.hasAttribute('rx')
      const hasRy = el.hasAttribute('ry')
      let rx = hasRx ? n('rx') : hasRy ? n('ry') : 0
      let ry = hasRy ? n('ry') : rx
      rx = Math.min(rx, w / 2)
      ry = Math.min(ry, h / 2)
      if (!rx || !ry) return pathContours(`M${x} ${y}H${x + w}V${y + h}H${x}Z`, paint)
      return pathContours(
        `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}` +
          `H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`,
        paint,
      )
    }
    default:
      return []
  }
}

function inherited(el: Element, root: Element, name: string, fallback: string): string {
  for (let node: Element | null = el; node; node = node === root ? null : node.parentElement) {
    const v = node.getAttribute(name) ?? (node as HTMLElement).style?.getPropertyValue(name)
    if (v) return v
  }
  return fallback
}

function isHidden(el: Element, root: Element): boolean {
  for (let node: Element | null = el; node; node = node === root ? null : node.parentElement) {
    const style = (node as HTMLElement).style
    if (node.getAttribute('opacity') === '0' || style?.opacity === '0') return true
    if (node.getAttribute('display') === 'none' || style?.display === 'none') return true
    if (node.getAttribute('visibility') === 'hidden' || style?.visibility === 'hidden') return true
  }
  return false
}

/**
 * Reads every visible shape of a rendered icon into contours, normalized to
 * a 24-unit view box. Masks, clip paths and invisible parts are skipped.
 */
export function readContours(svg: Element): Contour[] {
  const box = (svg.getAttribute('viewBox') ?? '0 0 24 24').split(/[\s,]+/).map(Number)
  const [bx = 0, by = 0, bw = 24, bh = 24] = box
  const scale = 24 / Math.max(bw || 24, bh || 24)
  const out: Contour[] = []
  for (const el of svg.querySelectorAll(SHAPES)) {
    if (el.closest(HIDDEN_BRANCH) || isHidden(el, svg)) continue
    const fill = !['none', 'transparent'].includes(inherited(el, svg, 'fill', 'black'))
    const stroke = !['none', 'transparent'].includes(inherited(el, svg, 'stroke', 'none'))
    if (!fill && !stroke) continue
    for (const c of elementContours(el, { fill, stroke })) {
      out.push({ ...c, points: c.points.map(([x, y]) => [(x - bx) * scale, (y - by) * scale]) })
    }
  }
  return out
}

/* ── Measuring ──────────────────────────────────────────────────────────── */

interface Measured {
  c: Contour
  /** Cumulative length at each point; for closed contours one extra entry closes the loop. */
  cum: number[]
  length: number
  centroid: Point
  /** Evenly spaced samples, for coverage tests. */
  samples: Point[]
}

function measure(c: Contour): Measured {
  const pts = c.points
  const cum = [0]
  let cx = 0
  let cy = 0
  const segs = c.closed ? pts.length : pts.length - 1
  for (let i = 0; i < segs; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % pts.length]!
    const len = dist(a, b)
    cum.push(cum[i]! + len)
    cx += ((a[0] + b[0]) / 2) * len
    cy += ((a[1] + b[1]) / 2) * len
  }
  const length = cum[cum.length - 1]!
  const centroid: Point = length > 1e-6 ? [cx / length, cy / length] : [pts[0]![0], pts[0]![1]]
  const m: Measured = { c, cum, length, centroid, samples: [] }
  const count = Math.max(2, Math.ceil(length / 0.5))
  for (let i = 0; i <= count; i++) m.samples.push(pointAt(m, (length * i) / count))
  return m
}

function pointAt(m: Measured, s: number): Point {
  const { cum, c } = m
  const pts = c.points
  if (m.length <= 1e-9) return [pts[0]![0], pts[0]![1]]
  s = c.closed ? ((s % m.length) + m.length) % m.length : Math.min(Math.max(s, 0), m.length)
  let lo = 0
  let hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid]! <= s) lo = mid
    else hi = mid
  }
  const a = pts[lo]!
  const b = pts[(lo + 1) % pts.length]!
  const span = cum[lo + 1]! - cum[lo]!
  const t = span > 1e-9 ? (s - cum[lo]!) / span : 0
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/** Nearest point on the contour: its distance and arc-length position. */
function project(m: Measured, p: Point): { d: number; s: number } {
  const pts = m.c.points
  const segs = m.c.closed ? pts.length : pts.length - 1
  let best = { d: Infinity, s: 0 }
  for (let i = 0; i < segs; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % pts.length]!
    const vx = b[0] - a[0]
    const vy = b[1] - a[1]
    const len2 = vx * vx + vy * vy
    const t = len2 > 1e-12 ? clamp01(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2) : 0
    const d = Math.hypot(a[0] + vx * t - p[0], a[1] + vy * t - p[1])
    if (d < best.d) best = { d, s: m.cum[i]! + Math.sqrt(len2) * t }
  }
  return best
}

/** Fraction of `part` that lies within `tolerance` of `host`. */
function coverage(part: Measured, host: Measured, tolerance = 0.75): number {
  let near = 0
  for (const p of part.samples) if (project(host, p).d <= tolerance) near++
  return near / part.samples.length
}

/* ── Resampling and alignment ───────────────────────────────────────────── */

/**
 * `n` points evenly spaced by arc length (open: both ends included; closed:
 * the loop without its repeated start). Sharp corners snap onto the nearest
 * sample so a morph starts and ends on the exact outline, not a bevelled one.
 */
function resample(m: Measured, n: number): Point[] {
  const { c, length } = m
  const pts = c.points
  const step = c.closed ? length / n : length / (n - 1)
  const params = Array.from({ length: n }, (_, i) => i * step)
  if (step > 1e-9) {
    const snapped = new Set<number>([0, n - 1])
    const count = pts.length
    for (let i = c.closed ? 0 : 1; i < (c.closed ? count : count - 1); i++) {
      const prev = pts[(i - 1 + count) % count]!
      const at = pts[i]!
      const next = pts[(i + 1) % count]!
      const ax = at[0] - prev[0]
      const ay = at[1] - prev[1]
      const bx = next[0] - at[0]
      const by = next[1] - at[1]
      const turn = Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by))
      if (turn < 0.45) continue
      const k = Math.round(m.cum[i]! / step)
      if (k <= 0 || k >= n - 1 || snapped.has(k)) continue
      snapped.add(k)
      params[k] = m.cum[i]!
    }
  }
  return params.map((s) => pointAt(m, s))
}

function sqDist(a: Point[], b: Point[], offset: number, reverse: boolean): number {
  const n = a.length
  let sum = 0
  for (let i = 0; i < n; i++) {
    const j = reverse ? (offset - i + n) % n : (offset + i) % n
    const p = a[i]!
    const q = b[j]!
    sum += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
  }
  return sum
}

/** Reorders `b` (same length as `a`) to minimize travel: start point and direction for loops, direction for strokes. */
function align(a: Point[], b: Point[], closed: boolean): Point[] {
  const n = b.length
  let best = { cost: Infinity, offset: 0, reverse: false }
  const offsets = closed ? n : 1
  for (const reverse of [false, true]) {
    for (let o = 0; o < offsets; o++) {
      const offset = closed ? o : reverse ? n - 1 : 0
      const cost = sqDist(a, b, offset, reverse)
      if (cost < best.cost) best = { cost, offset, reverse }
    }
  }
  return a.map((_, i) => b[best.reverse ? (best.offset - i + n) % n : (best.offset + i) % n]!)
}

/**
 * A loop of n − 1 points cut open where it best matches an n-point stroke,
 * its first point repeated at the end so it still reads closed.
 */
function openLoop(ring: Point[], stroke: Point[]): Point[] {
  const n = stroke.length
  let best = { cost: Infinity, offset: 0, reverse: false }
  for (const reverse of [false, true]) {
    for (let o = 0; o < ring.length; o++) {
      let cost = 0
      for (let i = 0; i < n; i++) {
        const j = reverse ? (o - (i % ring.length) + ring.length) % ring.length : (o + i) % ring.length
        cost += (stroke[i]![0] - ring[j]![0]) ** 2 + (stroke[i]![1] - ring[j]![1]) ** 2
      }
      if (cost < best.cost) best = { cost, offset: o, reverse }
    }
  }
  return stroke.map((_, i) => ring[best.reverse ? (best.offset - (i % ring.length) + ring.length) % ring.length : (best.offset + i) % ring.length]!)
}

/**
 * A similarity transform (rotation + uniform scale + translation) that best
 * maps `from` onto `to`. Interpolating it keeps rotating strokes rigid;
 * whatever it can't explain is blended in linearly.
 */
function rigFor(from: Point[], to: Point[]): Rig | undefined {
  const n = from.length
  let fx = 0
  let fy = 0
  let tx = 0
  let ty = 0
  for (let i = 0; i < n; i++) {
    fx += from[i]![0]
    fy += from[i]![1]
    tx += to[i]![0]
    ty += to[i]![1]
  }
  fx /= n
  fy /= n
  tx /= n
  ty /= n
  let dot = 0
  let cross = 0
  let nf = 0
  let nt = 0
  const local: Point[] = []
  for (let i = 0; i < n; i++) {
    const ax = from[i]![0] - fx
    const ay = from[i]![1] - fy
    const bx = to[i]![0] - tx
    const by = to[i]![1] - ty
    local.push([ax, ay])
    dot += ax * bx + ay * by
    cross += ax * by - ay * bx
    nf += ax * ax + ay * ay
    nt += bx * bx + by * by
  }
  if (nf < 1e-6 || nt < 1e-6) return undefined
  const angle = Math.atan2(cross, dot)
  const scale = Math.sqrt(nt / nf)
  const cos = Math.cos(angle) * scale
  const sin = Math.sin(angle) * scale
  const residual: Point[] = []
  let err = 0
  for (let i = 0; i < n; i++) {
    const [ax, ay] = local[i]!
    const rx = to[i]![0] - tx - (cos * ax - sin * ay)
    const ry = to[i]![1] - ty - (sin * ax + cos * ay)
    residual.push([rx, ry])
    err += rx * rx + ry * ry
  }
  // Only worth it when the two strokes are (nearly) the same shape, turned;
  // otherwise a big swing plus a big correction reads as a swirl.
  if (Math.abs(angle) < 0.05 || Math.abs(angle) > 2.2 || err / nt > 0.12) return undefined
  return { from: [fx, fy], to: [tx, ty], angle, scale, local, residual }
}

/* ── Planning ───────────────────────────────────────────────────────────── */

/** Points on `host` from arc position s0 forwards to s1 (wrapping for loops). */
function slice(host: Measured, s0: number, s1: number): Point[] {
  const { c, cum, length } = host
  const span = c.closed ? (((s1 - s0) % length) + length) % length : s1 - s0
  const inner: { at: number; p: Point }[] = []
  c.points.forEach((p, i) => {
    const at = c.closed ? (((cum[i]! - s0) % length) + length) % length : cum[i]! - s0
    if (at > 1e-6 && at < span - 1e-6) inner.push({ at, p: [p[0], p[1]] })
  })
  inner.sort((x, y) => x.at - y.at)
  return [pointAt(host, s0), ...inner.map((v) => v.p), pointAt(host, s0 + span)]
}

function contourOf(points: Point[], closed: boolean, like: Contour): Measured {
  return measure({ points, closed, fill: like.fill, stroke: like.stroke })
}

function trackCount(a: Measured, b: Measured) {
  return Math.min(240, Math.max(16, Math.round(Math.max(a.length, b.length) / 0.3)))
}

function morphTrack(a: Measured, b: Measured): MorphTrack {
  const n = trackCount(a, b)
  const closed = a.c.closed && b.c.closed
  let from: Point[]
  let to: Point[]
  if (a.c.closed && !b.c.closed) {
    to = resample(b, n)
    from = openLoop(resample(a, n - 1), to)
  } else if (b.c.closed && !a.c.closed) {
    from = resample(a, n)
    to = openLoop(resample(b, n - 1), from)
  } else {
    from = resample(a, n)
    to = align(from, resample(b, n), closed)
  }
  let still = true
  for (let i = 0; i < n && still; i++) if (dist(from[i]!, to[i]!) > 0.05) still = false
  return {
    kind: 'morph',
    from,
    to,
    closed,
    anchor: 'start',
    fill: [a.c.fill ? 1 : 0, b.c.fill ? 1 : 0],
    stroke: [a.c.stroke ? 1 : 0, b.c.stroke ? 1 : 0],
    window: [0, 1],
    still: still || undefined,
    rig: still ? undefined : rigFor(from, to),
  }
}

/**
 * A stroke that only exists on one side. Given `toward` (the rest of the
 * icon), it grows out of, or retracts into, the point nearest it: the near
 * end of an open stroke, or for a loop the nearest point, from both sides.
 * Without it (the gaps a carve leaves) it shrinks to its own center.
 */
function soloTrack(kind: 'enter' | 'exit', m: Measured, toward?: Point): MorphTrack {
  let points = resample(m, Math.min(240, Math.max(4, Math.round(m.length / 0.3))))
  let anchor: TrackAnchor = 'center'
  if (toward && !m.c.closed) {
    anchor = dist(points[0]!, toward) <= dist(points[points.length - 1]!, toward) ? 'start' : 'end'
  } else if (toward) {
    // Re-seat the loop so its midpoint (where a centered dash collapses) is nearest `toward`.
    let nearest = 0
    points.forEach((p, i) => dist(p, toward) < dist(points[nearest]!, toward) && (nearest = i))
    const shift = (nearest - Math.floor(points.length / 2) + points.length) % points.length
    points = points.slice(shift).concat(points.slice(0, shift))
  }
  const paint = [m.c.fill ? 1 : 0, m.c.fill ? 1 : 0] as [number, number]
  const stroke = [m.c.stroke ? 1 : 0, m.c.stroke ? 1 : 0] as [number, number]
  return { kind, from: points, to: points, closed: m.c.closed, anchor, fill: paint, stroke, window: [0, 1] }
}

interface Carve {
  host: number
  pieces: number[]
}

/** Groups `parts` that lie along a longer `hosts` contour (a stroke cut into pieces, e.g. by a slash). */
function carve(hosts: Measured[], parts: Measured[], freeHost: boolean[], freePart: boolean[]): Carve[] {
  const groups = new Map<number, number[]>()
  parts.forEach((part, j) => {
    if (!freePart[j] || part.length < 0.8) return
    let best = -1
    let bestCover = 0.85
    hosts.forEach((host, i) => {
      if (!freeHost[i] || host.length < part.length * 1.02) return
      const cover = coverage(part, host)
      if (cover >= bestCover) {
        bestCover = cover
        best = i
      }
    })
    if (best >= 0) groups.set(best, [...(groups.get(best) ?? []), j])
  })
  return [...groups].map(([host, pieces]) => ({ host, pieces }))
}

/**
 * Splits `host` into the stretches its pieces cover (each oriented like its
 * piece) and the uncovered gaps between them.
 */
function divide(host: Measured, pieces: Measured[]): { spans: Point[][]; gaps: Point[][] } {
  const L = host.length
  const intervals: { s0: number; s1: number; reverse: boolean }[] = []
  for (const piece of pieces) {
    const pts = piece.c.points
    const a = project(host, pts[0]!).s
    const b = project(host, pts[pts.length - 1]!).s
    const mid = project(host, pointAt(piece, piece.length / 2)).s
    let forward: boolean
    if (host.c.closed) {
      const span = (((b - a) % L) + L) % L
      const at = (((mid - a) % L) + L) % L
      forward = at <= span
    } else forward = a <= b
    intervals.push(forward ? { s0: a, s1: b, reverse: false } : { s0: b, s1: a, reverse: true })
  }
  const spans = intervals.map(({ s0, s1, reverse }) => {
    const pts = slice(host, s0, s1)
    return reverse ? pts.reverse() : pts
  })

  // Gaps: whatever of the host no piece covers.
  const covered = intervals
    .map(({ s0, s1 }) => (host.c.closed ? [s0, s1 >= s0 ? s1 : s1 + L] : [s0, s1]) as [number, number])
    .sort((x, y) => x[0] - y[0])
  const gaps: Point[][] = []
  const minGap = 0.4
  if (host.c.closed) {
    const first = covered[0]!
    let cursor = first[1]
    for (let i = 1; i < covered.length; i++) {
      const [s0, s1] = covered[i]!
      if (s0 - cursor > minGap) gaps.push(slice(host, cursor, s0))
      cursor = Math.max(cursor, s1)
    }
    if (first[0] + L - cursor > minGap) gaps.push(slice(host, cursor % L, first[0]))
  } else {
    let cursor = 0
    for (const [s0, s1] of covered) {
      if (s0 - cursor > minGap) gaps.push(slice(host, cursor, s0))
      cursor = Math.max(cursor, s1)
    }
    if (L - cursor > minGap) gaps.push(slice(host, cursor, L))
  }
  return { spans, gaps }
}

function centroidOf(ms: Measured[]): Point {
  let x = 0
  let y = 0
  let w = 0
  for (const m of ms) {
    const weight = Math.max(m.length, 0.5)
    x += m.centroid[0] * weight
    y += m.centroid[1] * weight
    w += weight
  }
  return w ? [x / w, y / w] : [12, 12]
}

/** Spreads `tracks` across [start, end] with a stagger, in order. */
function stagger(tracks: MorphTrack[], start: number, end: number) {
  const n = tracks.length
  if (!n) return
  const step = n > 1 ? Math.min(0.06, (end - start) / (2 * (n - 1))) : 0
  const length = end - start - step * (n - 1)
  tracks.forEach((t, i) => (t.window = [start + i * step, start + i * step + length]))
}

/**
 * Pairs the strokes of two icons and returns the tracks that carry one into
 * the other. Compute it once per icon pair; render frames with `trackAt`.
 */
export function planMorph(from: Contour[], to: Contour[]): MorphPlan {
  const A = from.map(measure)
  const B = to.map(measure)
  const freeA = A.map(() => true)
  const freeB = B.map(() => true)
  const morphs: MorphTrack[] = []
  const exits: MorphTrack[] = []
  const enters: MorphTrack[] = []

  // 1. The same stroke in both icons (possibly starting elsewhere or running the other way).
  const same: { i: number; j: number; d: number }[] = []
  A.forEach((a, i) =>
    B.forEach((b, j) => {
      if (Math.abs(a.length - b.length) > Math.max(0.6, 0.15 * Math.max(a.length, b.length))) return
      if (dist(a.centroid, b.centroid) > 1.5) return
      if (coverage(a, b, 0.6) >= 0.9 && coverage(b, a, 0.6) >= 0.9) same.push({ i, j, d: dist(a.centroid, b.centroid) })
    }),
  )
  same.sort((x, y) => x.d - y.d)
  for (const { i, j } of same) {
    if (!freeA[i] || !freeB[j]) continue
    freeA[i] = freeB[j] = false
    morphs.push(morphTrack(A[i]!, B[j]!))
  }

  // 2. Strokes cut into pieces (split) or pieces joined into one stroke (merge).
  for (const { host, pieces } of carve(A, B, freeA, freeB)) {
    const h = A[host]!
    const parts = pieces.map((j) => B[j]!)
    const { spans, gaps } = divide(h, parts)
    freeA[host] = false
    pieces.forEach((j, k) => {
      freeB[j] = false
      morphs.push(morphTrack(contourOf(spans[k]!, false, h.c), B[j]!))
    })
    for (const g of gaps) exits.push(soloTrack('exit', contourOf(g, false, h.c)))
  }
  for (const { host, pieces } of carve(B, A, freeB, freeA)) {
    const h = B[host]!
    const parts = pieces.map((i) => A[i]!)
    const { spans, gaps } = divide(h, parts)
    freeB[host] = false
    pieces.forEach((i, k) => {
      freeA[i] = false
      morphs.push(morphTrack(A[i]!, contourOf(spans[k]!, false, h.c)))
    })
    for (const g of gaps) enters.push(soloTrack('enter', contourOf(g, false, h.c)))
  }

  // 3. Everything else pairs by position and length, nearest first.
  const pairs: { i: number; j: number; cost: number }[] = []
  A.forEach((a, i) => {
    if (!freeA[i]) return
    B.forEach((b, j) => {
      if (!freeB[j]) return
      const cost = dist(a.centroid, b.centroid) + 0.35 * Math.abs(a.length - b.length) + (a.c.closed !== b.c.closed ? 2 : 0)
      if (cost < 14) pairs.push({ i, j, cost })
    })
  })
  pairs.sort((x, y) => x.cost - y.cost)
  for (const { i, j } of pairs) {
    if (!freeA[i] || !freeB[j]) continue
    freeA[i] = freeB[j] = false
    morphs.push(morphTrack(A[i]!, B[j]!))
  }

  // 4. Leftovers retract into, or grow out of, the rest of the icon.
  const restB = centroidOf(B)
  const restA = centroidOf(A)
  A.forEach((a, i) => freeA[i] && exits.push(soloTrack('exit', a, restB)))
  B.forEach((b, j) => freeB[j] && enters.push(soloTrack('enter', b, restA)))

  // Choreography: exits lead, morphs span the middle, entries land last.
  stagger(exits, 0, enters.length || morphs.some((m) => !m.still) ? 0.6 : 1)
  stagger(enters, exits.length || morphs.some((m) => !m.still) ? 0.4 : 0, 1)
  for (const m of morphs) m.window = [exits.length ? 0.1 : 0, enters.length ? 0.9 : 1]
  return { tracks: [...exits, ...morphs, ...enters] }
}

/** The outline of a morph track at local progress t (0–1). */
export function trackAt(track: MorphTrack, t: number): Point[] {
  const { from, to, rig } = track
  if (track.kind !== 'morph' || track.still || t <= 0) return from
  if (t >= 1) return to
  if (!rig) return from.map((p, i) => [p[0] + (to[i]![0] - p[0]) * t, p[1] + (to[i]![1] - p[1]) * t])
  const angle = rig.angle * t
  const scale = Math.pow(rig.scale, t)
  const cos = Math.cos(angle) * scale
  const sin = Math.sin(angle) * scale
  const cx = rig.from[0] + (rig.to[0] - rig.from[0]) * t
  const cy = rig.from[1] + (rig.to[1] - rig.from[1]) * t
  return rig.local.map(([x, y], i) => [cx + cos * x - sin * y + rig.residual[i]![0] * t, cy + sin * x + cos * y + rig.residual[i]![1] * t])
}

/** Compact path data for a polyline. */
export function toPathData(points: Point[], closed: boolean): string {
  let d = ''
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i]!
    d += `${i ? 'L' : 'M'}${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100}`
  }
  return closed ? `${d}Z` : d
}
