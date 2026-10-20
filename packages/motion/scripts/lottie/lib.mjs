// A tiny Lottie (Bodymovin 5.x) builder. Timing comes from the youj
// tokens, so a generated animation moves like the rest of the library:
// durations become frames at FPS, easing tokens become bezier tangents,
// springs are simulated with Motion's model and baked into keyframes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { durations, easings, springs, staggers } from '../../../core/src/lib/youj/tokens.ts'

export const FPS = 60

/** Token duration (or raw ms) → whole frames. */
export const f = (token) => Math.round(((typeof token === 'number' ? token : durations[token]) / 1000) * FPS)
export const stagger = (token) => Math.round((staggers[token] / 1000) * FPS)

// ---------------------------------------------------------------- colors
// Default slot values are the light-theme tokens, read from youj.css so
// the files stay truthful to the contract. The player re-binds them live.

const css = readFileSync(join(import.meta.dirname, '../../../core/src/styles/youj.css'), 'utf8')
const themeBlock = css.slice(css.indexOf('@theme'), css.indexOf('@layer'))

function oklchToSrgb(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)
  return lin.map((x) => round(Math.min(1, Math.max(0, gamma(x))), 4))
}

export function tokenColor(name) {
  const m = themeBlock.match(new RegExp(`--color-${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`))
  if (!m) throw new Error(`unknown color token: ${name}`)
  return [...oklchToSrgb(Number(m[1]), Number(m[2]), Number(m[3])), 1]
}

// ---------------------------------------------------------------- values

const round = (n, p = 3) => Math.round(n * 10 ** p) / 10 ** p
const arr = (v) => (Array.isArray(v) ? v : [v])

export const value = (k) => ({ a: 0, k })

/** A color bound to a slot. The slot id is the token name it follows. */
export const slotColor = (token) => ({ a: 0, k: tokenColor(token), sid: token })

/**
 * Keyframed property. keys: [frame, value, easeToken?][]; the ease shapes the
 * segment that starts at that key. 'hold' jumps to the next value.
 * `spatial` uses scalar tangents (Bodymovin's form for position).
 */
export function animated(keys, { spatial = false } = {}) {
  return {
    a: 1,
    k: keys.map(([t, s, ease], i) => {
      const kf = { t, s: arr(s) }
      if (i === keys.length - 1) return kf
      if (ease === 'hold') return { ...kf, h: 1 }
      const [x1, y1, x2, y2] = easings[ease ?? 'standard']
      const dims = spatial ? null : kf.s.length
      const tan = (x, y) => (dims ? { x: Array(dims).fill(x), y: Array(dims).fill(y) } : { x, y })
      return { ...kf, o: tan(x1, y1), i: tan(x2, y2) }
    }),
  }
}

/**
 * Simulate a spring (Motion's visualDuration/bounce model, mass 1) from
 * `from` to `to` with an optional initial velocity (units/s), starting at
 * frame `t0`. Returns linear per-frame keys until it rests.
 */
export function springKeys(t0, from, to, token, { velocity = 0 } = {}) {
  const { visualDuration, bounce } = springs[token]
  const root = (2 * Math.PI) / (visualDuration * 1.2)
  const stiffness = root * root
  const damping = 2 * Math.min(1, Math.max(0.05, 1 - bounce)) * Math.sqrt(stiffness)
  const from_ = arr(from)
  const to_ = arr(to)
  const x = from_.slice()
  const v = from_.map(() => velocity)
  const keys = [[t0, from_.slice(), 'linear']]
  const sub = 16
  const dt = 1 / FPS / sub
  for (let frame = 1; frame < FPS * 3; frame++) {
    for (let s = 0; s < sub; s++) {
      for (let d = 0; d < x.length; d++) {
        const a = -stiffness * (x[d] - to_[d]) - damping * v[d]
        v[d] += a * dt
        x[d] += v[d] * dt
      }
    }
    const resting = x.every((xi, d) => Math.abs(xi - to_[d]) < 0.05 && Math.abs(v[d]) < 1)
    if (resting) {
      keys.push([t0 + frame, to_.slice()])
      return keys
    }
    keys.push([t0 + frame, x.map((xi) => round(xi)), 'linear'])
  }
  throw new Error('spring did not settle')
}

/** Initial velocity that makes an impulse spring peak `peak` units above rest. */
export function impulseFor(peak, token) {
  let lo = 0
  let hi = 10000
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const keys = springKeys(0, 0, 0, token, { velocity: mid })
    const max = Math.max(...keys.map((k) => k[1][0]))
    if (max > peak) hi = mid
    else lo = mid
  }
  return lo
}

// ---------------------------------------------------------------- shapes

export const ellipse = (d, p = [0, 0]) => ({ ty: 'el', nm: 'Ellipse', d: 1, p: value(p), s: value([d, d]) })

export const rect = (w, h, r = 0, p = [0, 0]) => ({ ty: 'rc', nm: 'Rect', d: 1, p: value(p), s: value([w, h]), r: value(r) })

/** Polyline through straight segments. */
export const polyline = (points, closed = false) => ({
  ty: 'sh',
  nm: 'Path',
  d: 1,
  ks: value({ c: closed, v: points, i: points.map(() => [0, 0]), o: points.map(() => [0, 0]) }),
})

const CAP = { butt: 1, round: 2, square: 3 }
const JOIN = { miter: 1, round: 2, bevel: 3 }

export const stroke = (token, width, { cap = 'round', join = 'round', opacity = value(100) } = {}) => ({
  ty: 'st',
  nm: `Stroke ${token}`,
  c: slotColor(token),
  o: opacity,
  w: typeof width === 'number' ? value(width) : width,
  lc: CAP[cap],
  lj: JOIN[join],
  ml: 4,
  bm: 0,
})

export const fill = (token, opacity = value(100)) => ({ ty: 'fl', nm: `Fill ${token}`, c: slotColor(token), o: opacity, r: 1, bm: 0 })

export const trim = ({ s = value(0), e = value(100), o = value(0) } = {}) => ({ ty: 'tm', nm: 'Trim', s, e, o, m: 1 })

export const transform = ({ p = value([0, 0]), a = value([0, 0]), s = value([100, 100]), r = value(0), o = value(100) } = {}) => ({
  ty: 'tr',
  nm: 'Transform',
  p,
  a,
  s,
  r,
  o,
  sk: value(0),
  sa: value(0),
})

export const group = (nm, items, tr = {}) => ({ ty: 'gr', nm, it: [...items, transform(tr)] })

export function shapeLayer(nm, shapes, { p = value([0, 0, 0]), a = value([0, 0, 0]), s = value([100, 100, 100]), r = value(0), o = value(100), ip = 0, op } = {}) {
  return { ddd: 0, ind: 0, ty: 4, nm, sr: 1, ks: { o, r, p, a, s }, ao: 0, shapes, ip, op, st: 0, bm: 0 }
}

/** Collects every `sid` in the tree into the root `slots` table. */
export function composition({ nm, w, h, op, layers, markers = [] }) {
  const slots = {}
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (node && typeof node === 'object') {
      if (typeof node.sid === 'string') slots[node.sid] = { p: { a: 0, k: node.k } }
      Object.values(node).forEach(visit)
    }
  }
  layers.forEach((l, i) => {
    l.ind = i + 1
    l.op ??= op
  })
  visit(layers)
  return { v: '5.12.0', fr: FPS, ip: 0, op, w, h, nm, ddd: 0, assets: [], layers, markers, slots }
}
