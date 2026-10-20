import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { YoujProvider } from '@youj/core'
import { icons, type YoujIconComponent } from './index'

/* Originality: no Youj icon reuses a Lucide drawing.
 *
 * Every icon is rendered the way the docs render it (reduced motion, trigger
 * none): at rest and, for state icons, in the active state too. Each visible
 * stroke is compared as geometry with every stroke of lucide-react's icons:
 * two strokes match when they trace the same line to within 0.2 of a unit,
 * in either direction, however the path data is written. A match is allowed
 * only for primitives any 24-unit set draws the same way: a dot, a straight
 * line, a two-stroke corner (a chevron, a tick, an arrowhead), a circle or
 * an arc of one, a rectangle or one rounded corner of it. Whole icons are
 * compared too, by how much of each one's ink lies on the other's; a
 * near-duplicate must be a glyph of three primitive strokes at most, listed
 * in TRIVIAL with its reason.
 *
 * lucide-react is a devDependency of this package for this test and the
 * YoujIcon stories; nothing the package ships imports it. A slower raster
 * version of the check is opt-in: `node scripts/lucide-overlap.mjs`. */

/**
 * Glyphs whose whole drawing comes out close to a Lucide icon's. Each is three
 * primitive strokes at most, placed where any 24-unit set with 2-unit padding
 * places them, so there is no drawing to copy. Review a new entry before
 * adding it: anything more than this is redrawn instead.
 */
const TRIVIAL: Record<string, string> = {
  'arrow-down': 'a shaft and a two-stroke head',
  'arrow-down-left': 'a diagonal shaft and a two-stroke head',
  'arrow-down-right': 'a diagonal shaft and a two-stroke head',
  'arrow-left': 'a shaft and a two-stroke head',
  'arrow-right': 'a shaft and a two-stroke head',
  'arrow-up': 'a shaft and a two-stroke head (both states)',
  'arrow-up-left': 'a diagonal shaft and a two-stroke head',
  'arrow-up-right': 'a diagonal shaft and a two-stroke head',
  'chevron-down': 'one two-stroke chevron',
  'chevron-left': 'one two-stroke chevron',
  'chevron-right': 'one two-stroke chevron',
  'chevron-up': 'one two-stroke chevron',
  'chevrons-left-right': 'two two-stroke chevrons, mirrored (both states)',
  'chevrons-up-down': 'two two-stroke chevrons, mirrored',
  'code-xml': 'the typed symbols < / > as three strokes',
  columns: 'the 18-unit frame and two straight dividers',
  'corner-down-left': 'one rounded corner and a two-stroke head',
  'corner-down-right': 'one rounded corner and a two-stroke head',
  'corner-up-left': 'one rounded corner and a two-stroke head',
  'corner-up-right': 'one rounded corner and a two-stroke head',
  'git-commit': 'a node on a line: one circle, the line masked behind it',
  heading: 'the letter H: three straight strokes',
  italic: 'the letter I, slanted: three straight strokes',
  minus: 'one straight stroke (and a plus: two)',
  'more-horizontal': 'three dots in a row',
  'more-vertical': 'three dots in a column',
  'panel-bottom': 'the 18-unit frame and one straight divider',
  'panel-right': 'the 18-unit frame and one straight divider',
  plus: 'two crossed straight strokes',
  sidebar: 'the 18-unit frame and one straight divider',
  spline: 'one circular arc between two small circles',
  'square-check': 'the 18-unit frame (unchecked state)',
  terminal: 'the typed prompt > _ as two strokes',
  x: 'two crossed straight strokes',
}

type Pt = [number, number]
interface Node {
  tag: string
  attrs: Record<string, string>
  children: Node[]
}
interface Shape {
  /** Samples along the ink, every STEP units. */
  points: Pt[]
  length: number
  box: [number, number, number, number]
  primitive: boolean
  label: string
}

const STEP = 0.25
const SAME_STROKE = 0.2
const INK = 0.35
const NEAR_DUPLICATE = 0.9

/* ── Markup ─────────────────────────────────────────────────────────────── */

const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g
const ATTR = /([\w:-]+)="([^"]*)"/g

function parseMarkup(html: string): Node {
  const root: Node = { tag: '#root', attrs: {}, children: [] }
  const stack = [root]
  for (const [, close, tag, raw, selfClose] of html.matchAll(TAG)) {
    if (close) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const attrs: Record<string, string> = {}
    for (const [, name, value] of raw!.matchAll(ATTR)) attrs[name!] = value!.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    const node: Node = { tag: tag!, attrs, children: [] }
    stack[stack.length - 1]!.children.push(node)
    if (!selfClose) stack.push(node)
  }
  return root
}

function styleOf(node: Node): Record<string, string> {
  const out: Record<string, string> = {}
  for (const decl of (node.attrs.style ?? '').split(';')) {
    const at = decl.indexOf(':')
    if (at > 0) out[decl.slice(0, at).trim()] = decl.slice(at + 1).trim()
  }
  return out
}

/** Invisible at rest: faded out, scaled to nothing or drawn to zero length. */
function hiddenNode(node: Node): boolean {
  const style = styleOf(node)
  if (style.opacity === '0' || node.attrs.opacity === '0' || style.visibility === 'hidden') return true
  if (/scale[XY]?\(\s*0(?:\.0+)?\s*[,)]/.test(style.transform ?? '')) return true
  const filled = node.attrs.fill !== undefined && node.attrs.fill !== 'none'
  return node.attrs.pathLength !== undefined && Number.parseFloat(node.attrs['stroke-dasharray'] ?? '1') === 0 && !filled
}

const LEAVES = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])

interface Leaf {
  node: Node
  /** Regions its masks paint black: ink there is cut away (a slash's gap, a line behind a node). */
  cuts: Cutter[]
}

function visibleLeaves(node: Node, defs: Map<string, Node>, cuts: Cutter[] = [], out: Leaf[] = []): Leaf[] {
  if (node.tag === 'mask' || node.tag === 'clipPath' || node.tag === 'defs' || hiddenNode(node)) return out
  const maskId = /^url\(#(.+)\)$/.exec(node.attrs.mask ?? '')?.[1]
  const mask = maskId ? defs.get(maskId) : undefined
  const own = mask ? [...cuts, ...cuttersOf(mask)] : cuts
  if (LEAVES.has(node.tag)) out.push({ node, cuts: own })
  for (const child of node.children) visibleLeaves(child, defs, own, out)
  return out
}

function masksIn(node: Node, out = new Map<string, Node>()): Map<string, Node> {
  if (node.tag === 'mask' && node.attrs.id) out.set(node.attrs.id, node)
  for (const child of node.children) masksIn(child, out)
  return out
}

interface Cutter {
  inside: (p: Pt) => boolean
}

/** A part's rest translation, or null when it's transformed in a way the check doesn't follow. */
function translationOf(node: Node): Pt | null {
  const transform = styleOf(node).transform
  if (!transform || transform === 'none') return [0, 0]
  let x = 0
  let y = 0
  for (const [, fn, args] of transform.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const [a = 0, b = 0] = args!.split(',').map((v) => Number.parseFloat(v))
    if (fn === 'translateX') x += a
    else if (fn === 'translateY') y += a
    else if (fn === 'translate' || fn === 'translate3d') {
      x += a
      y += b
    } else if (!(/^(scale[XY]?)$/.test(fn!) && a === 1) && !(/^rotate/.test(fn!) && a === 0)) return null
  }
  return [x, y]
}

function insidePolygon([x, y]: Pt, poly: Pt[]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!
    const [xj, yj] = poly[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** The black parts of a mask, as regions: filled shapes by their outline, black strokes by their width. */
function cuttersOf(mask: Node): Cutter[] {
  const out: Cutter[] = []
  const black = (v: string | undefined) => v === 'black' || v === '#000' || v === '#000000'
  const walk = (node: Node, offset: Pt) => {
    if (hiddenNode(node)) return
    const t = translationOf(node)
    if (!t) return
    const at: Pt = [offset[0] + t[0], offset[1] + t[1]]
    if (LEAVES.has(node.tag)) {
      const points = shapesOf(node, '').flatMap((s) => s.points.map(([x, y]): Pt => [x + at[0], y + at[1]]))
      if (black(node.attrs.fill)) out.push({ inside: (p) => insidePolygon(p, points) })
      if (black(node.attrs.stroke)) {
        const r = num(node.attrs['stroke-width'], 1.5) / 2
        out.push({ inside: (p) => points.some((q) => dist(p, q) < r) })
      }
    }
    for (const child of node.children) walk(child, at)
  }
  for (const child of mask.children) walk(child, [0, 0])
  return out
}

/* ── Geometry ───────────────────────────────────────────────────────────── */

type Seg = { kind: 'L'; a: Pt; b: Pt } | { kind: 'C'; a: Pt; c1: Pt; c2: Pt; b: Pt } | { kind: 'A'; a: Pt; b: Pt; rx: number; ry: number; phi: number; large: boolean; sweep: boolean }

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y

/** Absolute segments, one list per subpath. Handles every SVG path command. */
function parsePath(d: string): Seg[][] {
  let i = 0
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i]!)) i++
  }
  const num = () => {
    skip()
    NUMBER.lastIndex = i
    const m = NUMBER.exec(d)
    if (!m) throw new Error(`bad path data at ${i}: ${d}`)
    i = NUMBER.lastIndex
    return Number(m[0])
  }
  const flag = () => {
    skip()
    return d[i++] === '1'
  }
  const more = () => {
    skip()
    return i < d.length && /[-+.\d]/.test(d[i]!)
  }
  const out: Seg[][] = []
  let segs: Seg[] = []
  let cur: Pt = [0, 0]
  let start: Pt = [0, 0]
  let lastC: Pt | null = null
  let lastQ: Pt | null = null
  const push = (seg: Seg) => {
    segs.push(seg)
    cur = seg.b
  }
  while (true) {
    skip()
    if (i >= d.length) break
    const cmd = d[i++]!
    const rel = cmd === cmd.toLowerCase()
    const at = (x: number, y: number): Pt => (rel ? [cur[0] + x, cur[1] + y] : [x, y])
    const upper = cmd.toUpperCase()
    let first = true
    do {
      let c: Pt | null = null
      let q: Pt | null = null
      switch (upper) {
        case 'M': {
          const p = at(num(), num())
          if (first) {
            if (segs.length) out.push(segs)
            segs = []
            cur = start = p
          } else push({ kind: 'L', a: cur, b: p })
          break
        }
        case 'L':
          push({ kind: 'L', a: cur, b: at(num(), num()) })
          break
        case 'H': {
          const x = num()
          push({ kind: 'L', a: cur, b: [rel ? cur[0] + x : x, cur[1]] })
          break
        }
        case 'V': {
          const y = num()
          push({ kind: 'L', a: cur, b: [cur[0], rel ? cur[1] + y : y] })
          break
        }
        case 'C': {
          const c1 = at(num(), num())
          const c2 = at(num(), num())
          const b = at(num(), num())
          push({ kind: 'C', a: cur, c1, c2, b })
          c = c2
          break
        }
        case 'S': {
          const c1: Pt = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur
          const c2 = at(num(), num())
          const b = at(num(), num())
          push({ kind: 'C', a: cur, c1, c2, b })
          c = c2
          break
        }
        case 'Q':
        case 'T': {
          const ctrl: Pt = upper === 'Q' ? at(num(), num()) : lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur
          const a = cur
          const b = at(num(), num())
          push({ kind: 'C', a, c1: [a[0] + (2 / 3) * (ctrl[0] - a[0]), a[1] + (2 / 3) * (ctrl[1] - a[1])], c2: [b[0] + (2 / 3) * (ctrl[0] - b[0]), b[1] + (2 / 3) * (ctrl[1] - b[1])], b })
          q = ctrl
          break
        }
        case 'A': {
          const rx = Math.abs(num())
          const ry = Math.abs(num())
          const phi = num()
          const large = flag()
          const sweep = flag()
          push({ kind: 'A', a: cur, b: at(num(), num()), rx, ry, phi, large, sweep })
          break
        }
        case 'Z':
          push({ kind: 'L', a: cur, b: start })
          break
        default:
          throw new Error(`unknown path command ${cmd} in ${d}`)
      }
      lastC = c
      lastQ = q
      first = false
    } while (upper !== 'Z' && more())
  }
  if (segs.length) out.push(segs)
  else if (out.length === 0) out.push([{ kind: 'L', a: cur, b: cur }])
  return out
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

function cubicAt(s: Extract<Seg, { kind: 'C' }>, t: number): Pt {
  const u = 1 - t
  return [
    u * u * u * s.a[0] + 3 * u * u * t * s.c1[0] + 3 * u * t * t * s.c2[0] + t * t * t * s.b[0],
    u * u * u * s.a[1] + 3 * u * u * t * s.c1[1] + 3 * u * t * t * s.c2[1] + t * t * t * s.b[1],
  ]
}

/** An endpoint arc as a point function (SVG implementation notes, F.6.5). */
function arcFn(s: Extract<Seg, { kind: 'A' }>): ((t: number) => Pt) | null {
  let { rx, ry } = s
  if (rx === 0 || ry === 0 || dist(s.a, s.b) === 0) return null
  const phi = (s.phi * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (s.a[0] - s.b[0]) / 2
  const dy = (s.a[1] - s.b[1]) / 2
  const x1 = cos * dx + sin * dy
  const y1 = -sin * dx + cos * dy
  const scale = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
  if (scale > 1) {
    rx *= Math.sqrt(scale)
    ry *= Math.sqrt(scale)
  }
  const sign = s.large === s.sweep ? -1 : 1
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
  const co = sign * Math.sqrt(Math.max(0, num / (rx * rx * y1 * y1 + ry * ry * x1 * x1)))
  const cx1 = (co * rx * y1) / ry
  const cy1 = (-co * ry * x1) / rx
  const cx = cos * cx1 - sin * cy1 + (s.a[0] + s.b[0]) / 2
  const cy = sin * cx1 + cos * cy1 + (s.a[1] + s.b[1]) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return a
  }
  const theta = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
  let delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
  if (!s.sweep && delta > 0) delta -= 2 * Math.PI
  if (s.sweep && delta < 0) delta += 2 * Math.PI
  return (t) => {
    const a = theta + delta * t
    const x = rx * Math.cos(a)
    const y = ry * Math.sin(a)
    return [cos * x - sin * y + cx, sin * x + cos * y + cy]
  }
}

/** Dense samples along one segment (both ends included). */
function sampleSeg(s: Seg): Pt[] {
  const fn: (t: number) => Pt =
    s.kind === 'L' ? (t) => [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t] : s.kind === 'C' ? (t) => cubicAt(s, t) : (arcFn(s) ?? ((t) => [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]))
  // Measure first, then place samples every STEP.
  const probe: Pt[] = []
  for (let k = 0; k <= 64; k++) probe.push(fn(k / 64))
  let len = 0
  for (let k = 1; k < probe.length; k++) len += dist(probe[k - 1]!, probe[k]!)
  const n = Math.max(1, Math.ceil(len / STEP))
  const out: Pt[] = []
  for (let k = 0; k <= n; k++) out.push(fn(k / n))
  return out
}

const num = (v: string | undefined, fallback = 0) => (v === undefined ? fallback : Number.parseFloat(v))

function rectPath(x: number, y: number, w: number, h: number, rx: number, ry: number): string {
  rx = Math.min(rx, w / 2)
  ry = Math.min(ry, h / 2)
  if (!rx || !ry) return `M${x} ${y} H${x + w} V${y + h} H${x} Z`
  return `M${x + rx} ${y} H${x + w - rx} A${rx} ${ry} 0 0 1 ${x + w} ${y + ry} V${y + h - ry} A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} H${x + rx} A${rx} ${ry} 0 0 1 ${x} ${y + h - ry} V${y + ry} A${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
}

/** A shape's path data, whatever element drew it. */
function pathOf({ tag, attrs: a }: Node): string {
  switch (tag) {
    case 'path':
      return a.d ?? ''
    case 'circle':
      return ellipsePath(num(a.cx), num(a.cy), num(a.r), num(a.r))
    case 'ellipse':
      return ellipsePath(num(a.cx), num(a.cy), num(a.rx), num(a.ry))
    case 'rect':
      return rectPath(num(a.x), num(a.y), num(a.width), num(a.height), num(a.rx ?? a.ry), num(a.ry ?? a.rx))
    case 'line':
      return `M${num(a.x1)} ${num(a.y1)} L${num(a.x2)} ${num(a.y2)}`
    default: {
      const pts = (a.points ?? '').trim().split(/[\s,]+/).map(Number)
      let d = ''
      for (let k = 0; k + 1 < pts.length; k += 2) d += `${k ? 'L' : 'M'}${pts[k]} ${pts[k + 1]} `
      return tag === 'polygon' ? `${d}Z` : d
    }
  }
}

/** The circle through three points, or null when they are (nearly) collinear. */
function circleThrough(a: Pt, b: Pt, c: Pt): { c: Pt; r: number } | null {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  if (Math.abs(d) < 1e-6) return null
  const sq = (p: Pt) => p[0] * p[0] + p[1] * p[1]
  const x = (sq(a) * (b[1] - c[1]) + sq(b) * (c[1] - a[1]) + sq(c) * (a[1] - b[1])) / d
  const y = (sq(a) * (c[0] - b[0]) + sq(b) * (a[0] - c[0]) + sq(c) * (b[0] - a[0])) / d
  return { c: [x, y], r: Math.hypot(a[0] - x, a[1] - y) }
}

/** Whether every point lies on one circle: a ring, however it is written, or an arc of one. */
function onOneCircle(points: Pt[]): boolean {
  const circle = circleThrough(points[0]!, points[Math.floor(points.length / 3)]!, points[Math.floor((2 * points.length) / 3)]!)
  return circle !== null && circle.r < 24 && points.every((p) => Math.abs(dist(p, circle.c) - circle.r) < 0.05)
}

/**
 * Grid primitives: a dot, straight strokes (two at most), a circle or an arc
 * of one, a rectangle (rounded or not).
 */
function isPrimitive(tag: string, segs: { seg: Seg; points: Pt[] }[], closedSubpaths: number): boolean {
  if (tag === 'circle' || tag === 'ellipse' || tag === 'rect' || tag === 'line') return true
  if (segs.length === 0) return true
  const straight = (s: Seg) => s.kind === 'L' || onLine(s)
  if (segs.every(({ seg }) => straight(seg)) && strokes(segs) <= 2) return true
  const points = segs.flatMap((s) => s.points)
  if (segs.every(({ seg }) => !straight(seg)) && onOneCircle(points)) return true
  const lines = segs.filter(({ seg }) => straight(seg))
  const corners = segs.filter(({ seg }) => !straight(seg))
  const axisAligned = lines.every(({ points: p }) => Math.abs(p[0]![0] - p[p.length - 1]![0]) < 1e-3 || Math.abs(p[0]![1] - p[p.length - 1]![1]) < 1e-3)
  const quarters = corners.every(({ points: p }) => onOneCircle(p) && quarterTurn(p))
  // A rectangle drawn as a path: one closed outline, axis-aligned sides, at most four rounded corners.
  if (closedSubpaths === 1 && strokes(lines) <= 4 && corners.length <= 4 && axisAligned && quarters) return true
  // One rounded corner: two perpendicular sides and the quarter circle between them (a chart's axes, a frame's corner).
  return strokes(lines) <= 2 && corners.length === 1 && axisAligned && quarters
}

/** An arc that turns through a quarter circle, as a rectangle's corner does (its length is π/2√2 of its chord). */
function quarterTurn(p: Pt[]): boolean {
  const a = p[0]!
  const b = p[p.length - 1]!
  let length = 0
  for (let i = 1; i < p.length; i++) length += dist(p[i - 1]!, p[i]!)
  return Math.abs(Math.abs(a[0] - b[0]) - Math.abs(a[1] - b[1])) < 1e-2 && Math.abs(length / dist(a, b) - Math.PI / (2 * Math.SQRT2)) < 0.02
}

/** Straight pieces, with collinear runs (M9 3 L9 12 L9 21) counted once. */
function strokes(segs: { points: Pt[] }[]): number {
  let count = 0
  let prev: [Pt, Pt] | null = null
  for (const { points } of segs) {
    const a = points[0]!
    const b = points[points.length - 1]!
    const continues = prev !== null && dist(prev[1], a) < 1e-3 && Math.abs((prev[1][0] - prev[0][0]) * (b[1] - a[1]) - (prev[1][1] - prev[0][1]) * (b[0] - a[0])) < 1e-3
    if (!continues) count++
    prev = [a, b]
  }
  return count
}

/** A curve whose control points all sit on its chord. */
function onLine(s: Seg): boolean {
  if (s.kind !== 'C') return false
  const len = dist(s.a, s.b)
  if (len < 1e-9) return false
  const off = (p: Pt) => Math.abs((s.b[0] - s.a[0]) * (s.a[1] - p[1]) - (s.a[0] - p[0]) * (s.b[1] - s.a[1])) / len
  return off(s.c1) < 1e-3 && off(s.c2) < 1e-3
}

/** One shape per subpath: a path that draws a shaft and a head is two strokes, as two paths would be. */
function shapesOf(node: Node, label: string): Shape[] {
  const subpaths = parsePath(pathOf(node))
  return subpaths.map((sub, k) => {
    const points: Pt[] = []
    const segs: { seg: Seg; points: Pt[] }[] = []
    let length = 0
    for (const seg of sub) {
      const pts = seg.kind === 'L' && dist(seg.a, seg.b) < 1e-9 ? [seg.a] : sampleSeg(seg)
      let segLength = 0
      for (let i = 1; i < pts.length; i++) segLength += dist(pts[i - 1]!, pts[i]!)
      length += segLength
      points.push(...pts)
      // Zero-length pieces (a morph's folded points) draw nothing and don't count as strokes.
      if (segLength > 1e-3) segs.push({ seg, points: pts })
    }
    const closed = sub.length > 0 && dist(sub[0]!.a, sub[sub.length - 1]!.b) < 1e-3 ? 1 : 0
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])
    return {
      points,
      length,
      box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      primitive: isPrimitive(node.tag, segs, closed),
      label: subpaths.length > 1 ? `${label} (subpath ${k + 1})` : label,
    }
  })
}

/* ── Matching ───────────────────────────────────────────────────────────── */

/** Point buckets on a unit grid, for nearest-ink queries. */
class Ink {
  private cells = new Map<number, Pt[]>()
  constructor(points: Pt[]) {
    for (const p of points) {
      const key = this.key(Math.floor(p[0]), Math.floor(p[1]))
      let cell = this.cells.get(key)
      if (!cell) this.cells.set(key, (cell = []))
      cell.push(p)
    }
  }
  private key(x: number, y: number) {
    return (x + 64) * 256 + (y + 64)
  }
  /** Whether any ink lies within `r` (≤ 1) of p. */
  near(p: Pt, r: number): boolean {
    const cx = Math.floor(p[0])
    const cy = Math.floor(p[1])
    for (let x = cx - 1; x <= cx + 1; x++) {
      for (let y = cy - 1; y <= cy + 1; y++) {
        for (const q of this.cells.get(this.key(x, y)) ?? []) if (dist(p, q) <= r) return true
      }
    }
    return false
  }
}

/** Fraction of `points` within `r` of `ink`. */
function coverage(points: Pt[], ink: Ink, r: number): number {
  let hit = 0
  for (const p of points) if (ink.near(p, r)) hit++
  return points.length ? hit / points.length : 1
}

function sameStroke(a: Shape, b: Shape): boolean {
  if (Math.abs(a.length - b.length) > Math.max(0.3, 0.04 * Math.max(a.length, b.length))) return false
  for (let k = 0; k < 4; k++) if (Math.abs(a.box[k]! - b.box[k]!) > SAME_STROKE) return false
  return coverage(a.points, new Ink(b.points), SAME_STROKE) === 1 && coverage(b.points, new Ink(a.points), SAME_STROKE) === 1
}

interface Drawing {
  name: string
  shapes: Shape[]
  points: Pt[]
  length: number
  box: [number, number, number, number]
  ink?: Ink
}

function drawingOf(name: string, shapes: Shape[]): Drawing {
  const points = shapes.flatMap((s) => s.points)
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return { name, shapes, points, length: shapes.reduce((t, s) => t + s.length, 0), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }
}

/* ── Sources ────────────────────────────────────────────────────────────── */

function lucideDrawings(): Drawing[] {
  const require = createRequire(import.meta.url)
  const dir = join(dirname(require.resolve('lucide-react')), '../esm/icons')
  const out: Drawing[] = []
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.mjs')) continue
    const src = readFileSync(join(dir, file), 'utf8')
    const m = src.match(/const __iconData = (\{[\s\S]*?\n\});/)
    if (!m) continue // an alias module re-exporting another icon
    // The icon data is a plain object literal from the installed devDependency.
    const data = Function(`return ${m[1]}`)() as { name: string; node: [string, Record<string, string>][] }
    const shapes = data.node.filter(([tag]) => LEAVES.has(tag)).flatMap(([tag, attrs], k) => shapesOf({ tag, attrs, children: [] }, `${data.name}#${k}`))
    if (shapes.length) out.push(drawingOf(data.name, shapes))
  }
  return out
}

/** A shape with the ink its masks cut away removed (the stroke's geometry, and so its primitive-ness, stays). */
function cut(shape: Shape, cuts: Cutter[]): Shape {
  if (!cuts.length) return shape
  const points = shape.points.filter((p) => !cuts.some((c) => c.inside(p)))
  if (points.length === shape.points.length) return shape
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return { ...shape, points, length: points.length * STEP, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }
}

function youjDrawings(): Drawing[] {
  const out: Drawing[] = []
  const render = (Icon: YoujIconComponent, active?: boolean) =>
    parseMarkup(renderToStaticMarkup(createElement(YoujProvider, { reducedMotion: 'always', children: createElement(Icon, { trigger: 'none', active }) })))
  for (const Icon of icons) {
    const poses: [string, boolean | undefined][] = Icon.meta.states ? [[Icon.meta.states[0], false], [Icon.meta.states[1], true]] : [['rest', undefined]]
    for (const [pose, active] of poses) {
      const root = render(Icon, active)
      const leaves = visibleLeaves(root, masksIn(root))
      const shapes = leaves
        .flatMap(({ node, cuts }, k) =>
          shapesOf(node, `${Icon.meta.name}:${pose}#${k} <${node.tag}${node.tag === 'path' ? ` d="${node.attrs.d}"` : ''}>`).map((shape) => cut(shape, cuts)),
        )
        .filter((shape) => shape.points.length > 0)
      if (shapes.length) out.push(drawingOf(Icon.meta.states ? `${Icon.meta.name}:${pose}` : Icon.meta.name, shapes))
    }
  }
  return out
}

/* ── The check ──────────────────────────────────────────────────────────── */

describe('originality against lucide-react', () => {
  const lucide = lucideDrawings()
  const youj = youjDrawings()
  const lucideShapes = lucide.flatMap((d) => d.shapes)

  // Candidate strokes by rounded bounding box, so each comparison looks at a handful.
  const byBox = new Map<string, Shape[]>()
  const boxKey = (b: number[]) => b.map((v) => Math.round(v * 2)).join(':')
  for (const s of lucideShapes) {
    const key = boxKey(s.box)
    byBox.set(key, [...(byBox.get(key) ?? []), s])
  }
  const candidates = (s: Shape) => {
    const base = s.box.map((v) => Math.round(v * 2))
    const out: Shape[] = []
    const walk = (k: number, acc: number[]) => {
      if (k === 4) {
        out.push(...(byBox.get(acc.join(':')) ?? []))
        return
      }
      for (const d of [-1, 0, 1]) walk(k + 1, [...acc, base[k]! + d])
    }
    walk(0, [])
    return out
  }

  const strokeMatches: { shape: Shape; lucide: string }[] = []
  for (const drawing of youj) {
    for (const shape of drawing.shapes) {
      for (const other of candidates(shape)) if (sameStroke(shape, other)) strokeMatches.push({ shape, lucide: other.label })
    }
  }

  const duplicates: { name: string; lucide: string; score: number; glyph: boolean }[] = []
  for (const drawing of youj) {
    for (const other of lucide) {
      if (drawing.box.some((v, k) => Math.abs(v - other.box[k]!) > 1)) continue
      if (Math.abs(drawing.length - other.length) > 0.12 * Math.max(drawing.length, other.length)) continue
      other.ink ??= new Ink(other.points)
      drawing.ink ??= new Ink(drawing.points)
      const score = Math.min(coverage(drawing.points, other.ink, INK), coverage(other.points, drawing.ink, INK))
      // A glyph: three primitive strokes at most (an ×, a plus, an arrow), which any set draws alike.
      const glyph = drawing.shapes.length <= 3 && drawing.shapes.every((s) => s.primitive)
      if (score >= NEAR_DUPLICATE) duplicates.push({ name: drawing.name, lucide: other.name, score, glyph })
    }
  }

  if (process.env.ORIGINALITY_REPORT) {
    console.log(`youj drawings: ${youj.length}, lucide icons: ${lucide.length}, lucide strokes: ${lucideShapes.length}`)
    console.log(`stroke matches (${strokeMatches.length}):\n${strokeMatches.map((m) => `  ${m.shape.primitive ? 'primitive ' : 'COMPLEX   '}${m.shape.label} = ${m.lucide}`).join('\n')}`)
    console.log(`near-duplicate drawings (${duplicates.length}):\n${duplicates.map((d) => `  ${d.glyph ? 'glyph     ' : 'COMPLEX   '} ${d.name} ≈ ${d.lucide} (${d.score.toFixed(3)})`).join('\n')}`)
  }

  test('reads both sets', () => {
    expect(lucide.length).toBeGreaterThan(1500)
    expect(youj.length).toBeGreaterThanOrEqual(icons.length)
  })

  test('no stroke beyond a grid primitive traces a Lucide stroke', () => {
    expect(strokeMatches.filter((m) => !m.shape.primitive).map((m) => `${m.shape.label} = ${m.lucide}`)).toEqual([])
  })

  test('no icon that draws more than a primitive glyph is a near-duplicate of a Lucide icon', () => {
    expect(duplicates.filter((d) => !d.glyph).map((d) => `${d.name} ≈ ${d.lucide}`)).toEqual([])
  })

  test('glyph near-duplicates are the reviewed ones in TRIVIAL, and TRIVIAL has no stale entries', () => {
    const found = [...new Set(duplicates.filter((d) => d.glyph).map((d) => d.name.split(':')[0]!))].sort()
    expect(found).toEqual(Object.keys(TRIVIAL).sort())
  })
})
