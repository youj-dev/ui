/* Path geometry for flattening icons: SVG path data parsed to absolute
 * M/L/C/Z segments (arcs, quadratics, shorthands and H/V expanded), SVG and
 * CSS transforms as matrices, and the few measurements the flattening needs
 * (length, bounds). Figma then imports plain paths with nothing left to
 * interpret. */

/** An affine matrix, SVG order: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type Matrix = [number, number, number, number, number, number]
export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

export type Seg =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Z' }

/** m1 · m2: m2 applies first. */
export function multiply(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1
  const [a2, b2, c2, d2, e2, f2] = m2
  return [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2, a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1]
}

export const translate = (x: number, y = 0): Matrix => [1, 0, 0, 1, x, y]
export const scale = (x: number, y = x): Matrix => [x, 0, 0, y, 0, 0]
export function rotate(deg: number, cx = 0, cy = 0): Matrix {
  const r = (deg * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const m: Matrix = [cos, sin, -sin, cos, 0, 0]
  return cx || cy ? multiply(translate(cx, cy), multiply(m, translate(-cx, -cy))) : m
}
const skew = (ax: number, ay: number): Matrix => [1, Math.tan((ay * Math.PI) / 180), Math.tan((ax * Math.PI) / 180), 1, 0, 0]

export function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

/** How much a matrix scales lengths (strokes): the square root of its area factor. */
export const scaleOf = (m: Matrix) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]))

export const isIdentity = (m: Matrix) => m.every((v, i) => Math.abs(v - IDENTITY[i]!) < 1e-9)

const NUM = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g

function numbers(s: string): number[] {
  return (s.match(NUM) ?? []).map(Number)
}

/** An SVG transform attribute: matrix, translate, scale, rotate, skewX/Y, in order. */
export function parseSvgTransform(value: string): Matrix {
  let m = IDENTITY
  for (const [, fn, args] of value.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const n = numbers(args!)
    let t: Matrix
    switch (fn) {
      case 'matrix':
        t = n as Matrix
        break
      case 'translate':
        t = translate(n[0]!, n[1] ?? 0)
        break
      case 'scale':
        t = scale(n[0]!, n[1] ?? n[0]!)
        break
      case 'rotate':
        t = rotate(n[0]!, n[1] ?? 0, n[2] ?? 0)
        break
      case 'skewX':
        t = skew(n[0]!, 0)
        break
      case 'skewY':
        t = skew(0, n[0]!)
        break
      default:
        throw new Error(`unsupported SVG transform ${fn}()`)
    }
    m = multiply(m, t)
  }
  return m
}

function angle(token: string): number {
  const v = parseFloat(token)
  if (token.endsWith('rad')) return (v * 180) / Math.PI
  if (token.endsWith('turn')) return v * 360
  if (token.endsWith('grad')) return v * 0.9
  return v
}

function length(token: string): number {
  if (token.endsWith('px') || /^[+-]?[\d.]+(e-?\d+)?$/.test(token)) return parseFloat(token)
  throw new Error(`unsupported length ${token} in a CSS transform`)
}

/** A CSS transform function list (px lengths, any angle unit). Origin is applied by the caller. */
export function parseCssTransform(value: string): Matrix {
  let m = IDENTITY
  if (value.trim() === 'none') return m
  for (const [, fn, raw] of value.matchAll(/([\w-]+)\(([^)]*)\)/g)) {
    const args = raw!.split(/[\s,]+/).filter(Boolean)
    let t: Matrix
    switch (fn) {
      case 'translate':
        t = translate(length(args[0]!), args[1] ? length(args[1]) : 0)
        break
      case 'translateX':
        t = translate(length(args[0]!), 0)
        break
      case 'translateY':
        t = translate(0, length(args[0]!))
        break
      case 'scale':
        t = scale(Number(args[0]), Number(args[1] ?? args[0]))
        break
      case 'scaleX':
        t = scale(Number(args[0]), 1)
        break
      case 'scaleY':
        t = scale(1, Number(args[0]))
        break
      case 'rotate':
      case 'rotateZ':
        t = rotate(angle(args[0]!))
        break
      case 'skewX':
        t = skew(angle(args[0]!), 0)
        break
      case 'skewY':
        t = skew(0, angle(args[0]!))
        break
      case 'matrix':
        t = args.map(Number) as Matrix
        break
      default:
        throw new Error(`unsupported CSS transform ${fn}()`)
    }
    m = multiply(m, t)
  }
  return m
}

/** Whether a CSS transform only moves (so its origin can't matter). */
export const onlyTranslates = (value: string) => [...value.matchAll(/([\w-]+)\(/g)].every(([, fn]) => /^translate[XY]?$/.test(fn!))

/* ── Path data ─────────────────────────────────────────────────────────── */

const K = 0.5522847498307936

/** Endpoint arc → cubic segments (SVG implementation notes, F.6). */
function arcToCubics(x1: number, y1: number, rx: number, ry: number, phiDeg: number, large: boolean, sweep: boolean, x2: number, y2: number): Seg[] {
  if ((x1 === x2 && y1 === y2) || rx === 0 || ry === 0) return [{ type: 'L', x: x2, y: y2 }]
  const phi = (phiDeg * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy
  rx = Math.abs(rx)
  ry = Math.abs(ry)
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
  const vecAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return a
  }
  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let delta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  if (sweep && delta < 0) delta += 2 * Math.PI
  const n = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9))
  const step = delta / n
  const t = (4 / 3) * Math.tan(step / 4)
  const out: Seg[] = []
  const point = (ux: number, uy: number): [number, number] => [cx + rx * ux * cos - ry * uy * sin, cy + rx * ux * sin + ry * uy * cos]
  for (let i = 0; i < n; i++) {
    const a1 = theta1 + i * step
    const a2 = a1 + step
    const [c1x, c1y] = point(Math.cos(a1) - t * Math.sin(a1), Math.sin(a1) + t * Math.cos(a1))
    const [c2x, c2y] = point(Math.cos(a2) + t * Math.sin(a2), Math.sin(a2) - t * Math.cos(a2))
    const [ex, ey] = i === n - 1 ? [x2, y2] : point(Math.cos(a2), Math.sin(a2))
    out.push({ type: 'C', x1: c1x, y1: c1y, x2: c2x, y2: c2y, x: ex, y: ey })
  }
  return out
}

/** Path data → absolute M/L/C/Z. */
export function parsePath(d: string): Seg[] {
  const out: Seg[] = []
  let i = 0
  const src = d.trim()
  const skip = () => {
    while (i < src.length && /[\s,]/.test(src[i]!)) i++
  }
  const num = (): number => {
    skip()
    const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i))
    if (!m) throw new Error(`bad number in path "${d}" at ${i}`)
    i += m[0].length
    return Number(m[0])
  }
  const flag = (): boolean => {
    skip()
    const ch = src[i++]
    if (ch !== '0' && ch !== '1') throw new Error(`bad arc flag in path "${d}"`)
    return ch === '1'
  }
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  let lastC: [number, number] | null = null
  let lastQ: [number, number] | null = null
  let cmd = ''
  while (true) {
    skip()
    if (i >= src.length) break
    if (/[a-zA-Z]/.test(src[i]!)) cmd = src[i++]!
    else if (!cmd || cmd === 'Z' || cmd === 'z') throw new Error(`path "${d}": numbers without a command at ${i}`)
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    const ox = rel ? x : 0
    const oy = rel ? y : 0
    let nextC: [number, number] | null = null
    let nextQ: [number, number] | null = null
    switch (C) {
      case 'M': {
        x = ox + num()
        y = oy + num()
        sx = x
        sy = y
        out.push({ type: 'M', x, y })
        // Further pairs after a moveto are implicit linetos.
        cmd = rel ? 'l' : 'L'
        break
      }
      case 'L':
        x = ox + num()
        y = oy + num()
        out.push({ type: 'L', x, y })
        break
      case 'H':
        x = ox + num()
        out.push({ type: 'L', x, y })
        break
      case 'V':
        y = oy + num()
        out.push({ type: 'L', x, y })
        break
      case 'C': {
        const x1 = ox + num()
        const y1 = oy + num()
        const x2 = ox + num()
        const y2 = oy + num()
        x = ox + num()
        y = oy + num()
        out.push({ type: 'C', x1, y1, x2, y2, x, y })
        nextC = [x2, y2]
        break
      }
      case 'S': {
        const [x1, y1] = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y]
        const x2 = ox + num()
        const y2 = oy + num()
        x = ox + num()
        y = oy + num()
        out.push({ type: 'C', x1, y1, x2, y2, x, y })
        nextC = [x2, y2]
        break
      }
      case 'Q':
      case 'T': {
        let qx = x
        let qy = y
        if (C === 'Q') {
          qx = ox + num()
          qy = oy + num()
        } else if (lastQ) {
          qx = 2 * x - lastQ[0]
          qy = 2 * y - lastQ[1]
        }
        const ex = ox + num()
        const ey = oy + num()
        out.push({ type: 'C', x1: x + (2 / 3) * (qx - x), y1: y + (2 / 3) * (qy - y), x2: ex + (2 / 3) * (qx - ex), y2: ey + (2 / 3) * (qy - ey), x: ex, y: ey })
        x = ex
        y = ey
        nextQ = [qx, qy]
        break
      }
      case 'A': {
        const rx = num()
        const ry = num()
        const rot = num()
        const large = flag()
        const sweep = flag()
        const ex = ox + num()
        const ey = oy + num()
        out.push(...arcToCubics(x, y, rx, ry, rot, large, sweep, ex, ey))
        x = ex
        y = ey
        break
      }
      case 'Z':
        out.push({ type: 'Z' })
        x = sx
        y = sy
        break
      default:
        throw new Error(`unsupported path command ${cmd} in "${d}"`)
    }
    lastC = nextC
    lastQ = nextQ
  }
  return out
}

export function transformSegs(segs: Seg[], m: Matrix): Seg[] {
  if (isIdentity(m)) return segs
  return segs.map((s) => {
    if (s.type === 'Z') return s
    const [x, y] = apply(m, s.x, s.y)
    if (s.type !== 'C') return { type: s.type, x, y }
    const [x1, y1] = apply(m, s.x1, s.y1)
    const [x2, y2] = apply(m, s.x2, s.y2)
    return { type: 'C', x1, y1, x2, y2, x, y }
  })
}

const fmt = (v: number) => {
  const r = Math.round(v * 1000) / 1000
  return String(Object.is(r, -0) ? 0 : r)
}

export function toPathData(segs: Seg[]): string {
  return segs
    .map((s) => {
      if (s.type === 'Z') return 'Z'
      if (s.type === 'C') return `C ${fmt(s.x1)} ${fmt(s.y1)} ${fmt(s.x2)} ${fmt(s.y2)} ${fmt(s.x)} ${fmt(s.y)}`
      return `${s.type} ${fmt(s.x)} ${fmt(s.y)}`
    })
    .join(' ')
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): Seg[] {
  const kx = rx * K
  const ky = ry * K
  return [
    { type: 'M', x: cx + rx, y: cy },
    { type: 'C', x1: cx + rx, y1: cy + ky, x2: cx + kx, y2: cy + ry, x: cx, y: cy + ry },
    { type: 'C', x1: cx - kx, y1: cy + ry, x2: cx - rx, y2: cy + ky, x: cx - rx, y: cy },
    { type: 'C', x1: cx - rx, y1: cy - ky, x2: cx - kx, y2: cy - ry, x: cx, y: cy - ry },
    { type: 'C', x1: cx + kx, y1: cy - ry, x2: cx + rx, y2: cy - ky, x: cx + rx, y: cy },
    { type: 'Z' },
  ]
}

export function rectPath(x: number, y: number, w: number, h: number, rx = 0, ry = rx): Seg[] {
  rx = Math.min(Math.max(rx, 0), w / 2)
  ry = Math.min(Math.max(ry, 0), h / 2)
  if (!rx || !ry)
    return [{ type: 'M', x, y }, { type: 'L', x: x + w, y }, { type: 'L', x: x + w, y: y + h }, { type: 'L', x, y: y + h }, { type: 'Z' }]
  const kx = rx * K
  const ky = ry * K
  return [
    { type: 'M', x: x + rx, y },
    { type: 'L', x: x + w - rx, y },
    { type: 'C', x1: x + w - rx + kx, y1: y, x2: x + w, y2: y + ry - ky, x: x + w, y: y + ry },
    { type: 'L', x: x + w, y: y + h - ry },
    { type: 'C', x1: x + w, y1: y + h - ry + ky, x2: x + w - rx + kx, y2: y + h, x: x + w - rx, y: y + h },
    { type: 'L', x: x + rx, y: y + h },
    { type: 'C', x1: x + rx - kx, y1: y + h, x2: x, y2: y + h - ry + ky, x, y: y + h - ry },
    { type: 'L', x, y: y + ry },
    { type: 'C', x1: x, y1: y + ry - ky, x2: x + rx - kx, y2: y, x: x + rx, y },
    { type: 'Z' },
  ]
}

/** Splits at every moveto. */
export function subpaths(segs: Seg[]): Seg[][] {
  const out: Seg[][] = []
  for (const s of segs) {
    if (s.type === 'M' || !out.length) out.push([])
    out[out.length - 1]!.push(s)
  }
  return out
}

function cubicPoint(p0: [number, number], s: Extract<Seg, { type: 'C' }>, t: number): [number, number] {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * s.x1 + 3 * u * t * t * s.x2 + t * t * t * s.x,
    u * u * u * p0[1] + 3 * u * u * t * s.y1 + 3 * u * t * t * s.y2 + t * t * t * s.y,
  ]
}

/** Walks the outline as a polyline: every vertex, with cubics sampled. */
function polyline(segs: Seg[], samples = 24): [number, number][][] {
  const lines: [number, number][][] = []
  let start: [number, number] = [0, 0]
  let at: [number, number] = [0, 0]
  for (const s of segs) {
    if (s.type === 'M') {
      start = [s.x, s.y]
      at = start
      lines.push([at])
    } else if (s.type === 'L') {
      at = [s.x, s.y]
      lines[lines.length - 1]!.push(at)
    } else if (s.type === 'C') {
      for (let i = 1; i <= samples; i++) lines[lines.length - 1]!.push(cubicPoint(at, s, i / samples))
      at = [s.x, s.y]
    } else {
      at = start
      lines[lines.length - 1]!.push(at)
    }
  }
  return lines
}

export function pathLength(segs: Seg[]): number {
  let total = 0
  for (const line of polyline(segs, 64)) for (let i = 1; i < line.length; i++) total += Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1])
  return total
}

export interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function bounds(segs: Seg[]): Box {
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (const line of polyline(segs))
    for (const [x, y] of line) {
      box.minX = Math.min(box.minX, x)
      box.minY = Math.min(box.minY, y)
      box.maxX = Math.max(box.maxX, x)
      box.maxY = Math.max(box.maxY, y)
    }
  return box
}

export const overlaps = (a: Box, b: Box) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY
