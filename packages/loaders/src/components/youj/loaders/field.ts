/* The engine every loader draws with: points in 3D, a perspective camera,
 * and a depth-sorted buffer of marks (square particles, dots, hairlines,
 * stroked paths with dashes, and filled planes) drawn by one of two pens.
 * The canvas pen paints the running loader; the recording pen keeps one
 * still frame as marks, which kit.tsx renders as SVG for the server's HTML
 * and for reduced motion, so a loader is never blank before its script
 * runs. One shared ticker drives every running loader on the page. */

/**
 * The extra tones, for the parts, layers or states a loader colors: numbered,
 * not named, because what each means is the loader's (a terminal's check, a
 * plotter's machine), and the numbers line up with the `colors` prop (`c1` is
 * `colors[0]`). By default each is a theme role the loader's spec picks (the
 * chart series, a status ink); no `colors` puts each back in the ink or the
 * accent it stands in for.
 */
export type ExtraTone = 'c1' | 'c2' | 'c3' | 'c4'
/** A tone on its own. */
export type BaseTone = 'ink' | 'accent' | ExtraTone
/** Part of the way from one tone to another (`blend`): a color pulse, a hue travelling through a structure, a tint by depth. */
export type Blend = `${BaseTone}>${BaseTone}@${number}`
export type Tone = BaseTone | Blend
export const EXTRA_TONES: readonly ExtraTone[] = ['c1', 'c2', 'c3', 'c4']

/** How finely a blend is stepped: fine enough that a pulse never steps visibly. */
export const BLEND_STEPS = 32
const BASE: readonly BaseTone[] = ['ink', 'accent', ...EXTRA_TONES]
const BASE_INDEX: Record<BaseTone, number> = { ink: 0, accent: 1, c1: 2, c2: 3, c3: 4, c4: 5 }
const blends: Tone[][] = []
const parts = new Map<string, readonly [a: BaseTone, b: BaseTone, k: number]>()

/**
 * `k` (0–1) of the way from tone `a` to tone `b`, mixed in Oklab (as CSS's
 * color-mix does by default: even steps that keep the color's hue), in
 * BLEND_STEPS steps; at either end it's that tone itself. Each blend is made
 * once and kept, so a scene can call this every frame.
 */
export function blend(a: BaseTone, b: BaseTone, k: number): Tone {
  const step = Math.round(clamp(k) * BLEND_STEPS)
  if (step === 0 || a === b) return a
  if (step === BLEND_STEPS) return b
  const row = (blends[BASE_INDEX[a] * BASE.length + BASE_INDEX[b]] ??= [])
  let tone = row[step]
  if (!tone) {
    tone = row[step] = `${a}>${b}@${step / BLEND_STEPS}`
    parts.set(tone, [a, b, step / BLEND_STEPS])
  }
  return tone
}

/** A blend's two tones and how far it is from the first to the second; undefined for a tone on its own. */
export const blendParts = (tone: Tone) => parts.get(tone)

/** The tone as it's drawn where `alias` puts extra tones back in the ink or the accent (no `colors`): a blend of two that land on the same tone is that tone. */
export function resolveTone(tone: Tone, alias?: Partial<Record<ExtraTone, 'ink' | 'accent'>>): Tone {
  if (!alias) return tone
  const base = alias[tone as ExtraTone]
  if (base) return base
  const pair = parts.get(tone)
  if (!pair) return tone
  const a = alias[pair[0] as ExtraTone] ?? pair[0]
  const b = alias[pair[1] as ExtraTone] ?? pair[1]
  return a === b ? a : blend(a, b, pair[2])
}

/** How a lit face of a (resolved) tone takes the light: the ink's way, or a color's (the accent's: held, stronger where lit). A blend, as the tone it's nearer. */
export function litAs(tone: Tone): 'ink' | 'accent' {
  const pair = parts.get(tone)
  const base = pair ? pair[pair[2] < 0.5 ? 0 : 1] : tone
  return base === 'ink' ? 'ink' : 'accent'
}

export interface Stroke {
  /** In units. A hairline is `1 / view.px`: one CSS pixel. */
  width: number
  alpha: number
  tone?: Tone
  closed?: boolean
  /** Dash and gap lengths in units; with `offset`, how far along the pattern starts (positive draws it on). */
  dash?: readonly number[]
  offset?: number
  cap?: 'butt' | 'round' | 'square'
  join?: 'miter' | 'round' | 'bevel'
}

export interface Pen {
  /** A square particle centered on (x, y), `side` units across: the brand's particle. */
  square(x: number, y: number, side: number, alpha: number, tone?: Tone): void
  /** A round dot centered on (x, y). */
  dot(x: number, y: number, r: number, alpha: number, tone?: Tone): void
  /** A straight hairline. */
  line(x1: number, y1: number, x2: number, y2: number, width: number, alpha: number, tone?: Tone): void
  /** A stroked polyline through flat [x0, y0, x1, y1, …]. */
  path(xy: readonly number[], stroke: Stroke): void
  /**
   * A filled polygon through flat [x0, y0, …]. `solid` paints it over
   * whatever is beneath instead of mixing with it, so a near face hides a far
   * one: its ink at `alpha` laid on the paper (`--yj-anim-paper`, the surface
   * by default; set it to the background the loader sits on), as one color.
   */
  poly(xy: readonly number[], alpha: number, tone?: Tone, solid?: boolean): void
  /**
   * A solid face of a lit solid: `light` (0–1, from `lambert`) is how lit it
   * is, and the pen turns that into ink for the scheme (a lit face is light
   * in both: more of a light ink in dark, less of a dark ink in light). An
   * accent face stays the accent, a little stronger where it's lit.
   */
  face(xy: readonly number[], light: number, tone?: Tone): void
}

/** How much ink a lit face takes, 0–1, for its light and the scheme (`dark` 1 in dark, 0 in light). */
export const faceInk = (light: number, dark: number, tone: 'ink' | 'accent' = 'ink') =>
  tone === 'accent' ? 0.5 + 0.45 * light : dark * (0.1 + 0.8 * light) + (1 - dark) * (0.72 - 0.66 * light)

export type Ease = (t: number) => number
export type EaseToken = 'standard' | 'enter' | 'exit' | 'emphasized'

export interface View {
  /** The drawing's width and height in units: 100 tall, as wide as its aspect. */
  w: number
  h: number
  /** CSS px per unit, for keeping marks a legible size on screen: a hairline is `1 / px`. */
  px: number
  /** The drawing's height in CSS px: scenes pick their level of detail from it. */
  size: number
  /** The theme's easing curves, as functions. */
  ease: Record<EaseToken, Ease>
}

export interface Scene {
  /** Beats per loop: a beat is the deliberate duration token, so the theme's tempo and the time scale reach it. */
  beats: number
  /** Where in the loop (0–1) the still frame sits: the frame before the script runs, and the one reduced motion keeps. */
  still: number
  /** Draws the frame at loop progress `t` (0–1). The frame at 1 must be the frame at 0: the loop has no seam. */
  draw(pen: Pen, t: number, view: View): void
}

/* ── Easing and timing ────────────────────────────────────────────────── */

/** A cubic-bezier easing function from the token's control points (Newton's method, then bisection). */
export function bezier([x1, y1, x2, y2]: readonly [number, number, number, number]): Ease {
  const ax = 3 * x1 - 3 * x2 + 1
  const bx = 3 * x2 - 6 * x1
  const cx = 3 * x1
  const ay = 3 * y1 - 3 * y2 + 1
  const by = 3 * y2 - 6 * y1
  const cy = 3 * y1
  const x = (s: number) => ((ax * s + bx) * s + cx) * s
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let s = t
    for (let i = 0; i < 6; i++) {
      const d = dx(s)
      if (Math.abs(d) < 1e-6) break
      const next = s - (x(s) - t) / d
      if (next < 0 || next > 1) break
      s = next
    }
    if (Math.abs(x(s) - t) > 1e-4) {
      let lo = 0
      let hi = 1
      for (let i = 0; i < 24; i++) {
        s = (lo + hi) / 2
        if (x(s) < t) lo = s
        else hi = s
      }
    }
    return ((ay * s + by) * s + cy) * s
  }
}

/** Progress through the window [a, b], 0 before it and 1 after. */
export const span = (t: number, a: number, b: number) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v)
/** 0 at the edges of the loop, 1 in the middle: for something that rises and falls once a loop. */
export const hump = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t)
export const TAU = Math.PI * 2

/** A seeded random number generator (mulberry32): the same `seed` gives the same sequence, so a scene stays a pure function of `t`. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let r = Math.imul(a ^ (a >>> 15), 1 | a)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Shapes ───────────────────────────────────────────────────────────── */

/** The length of a polyline through flat [x0, y0, x1, y1, …], closed back to its start if `closed`. */
export function polylineLength(xy: readonly number[], closed = false): number {
  let total = 0
  for (let i = 2; i < xy.length; i += 2) total += Math.hypot(xy[i]! - xy[i - 2]!, xy[i + 1]! - xy[i - 1]!)
  if (closed && xy.length >= 4) total += Math.hypot(xy[0]! - xy[xy.length - 2]!, xy[1]! - xy[xy.length - 1]!)
  return total
}

/**
 * A rounded rectangle as a closed outline of [x, y] points, clockwise from
 * its top edge, each corner a quarter circle of radius `r` in `steps` pieces.
 */
export function roundedRect(x: number, y: number, w: number, h: number, r: number, steps = 4): [number, number][] {
  const rr = Math.min(r, w / 2, h / 2)
  const corners: [number, number, number][] = [
    [x + w - rr, y + rr, -Math.PI / 2],
    [x + w - rr, y + h - rr, 0],
    [x + rr, y + h - rr, Math.PI / 2],
    [x + rr, y + rr, Math.PI],
  ]
  const out: [number, number][] = []
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = start + (Math.PI / 2) * (i / steps)
      out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
    }
  }
  return out
}

/* ── Camera and light ─────────────────────────────────────────────────── */

export interface Projected {
  x: number
  y: number
  /** Depth toward the viewer: larger is nearer. */
  z: number
  /** Perspective scale at that depth: 1 at the origin's depth. */
  k: number
}

export const point = (): Projected => ({ x: 0, y: 0, z: 0, k: 1 })

export interface CameraOptions {
  /** Turn about the vertical axis, radians. */
  yaw?: number
  /** Tilt about the horizontal axis, radians; negative looks down on the scene. */
  pitch?: number
  /** Turn about the line of sight, radians. */
  roll?: number
  /** Eye distance from the origin, in units: smaller is a stronger perspective. */
  distance?: number
  /** Where the origin lands on screen. */
  cx: number
  cy: number
}

export type Project = (x: number, y: number, z: number, out: Projected) => Projected

/** A perspective camera: world units in (x right, y up, z toward the viewer), screen units out. */
export function camera({ yaw = 0, pitch = 0, roll = 0, distance = 300, cx, cy }: CameraOptions): Project {
  const cyw = Math.cos(yaw)
  const syw = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const cr = Math.cos(roll)
  const sr = Math.sin(roll)
  return (x, y, z, out) => {
    const x1 = x * cyw + z * syw
    const z1 = -x * syw + z * cyw
    const y2 = y * cp + z1 * sp
    const z2 = -y * sp + z1 * cp
    const x3 = x1 * cr - y2 * sr
    const y3 = x1 * sr + y2 * cr
    const k = distance / (distance - z2)
    out.x = cx + x3 * k
    out.y = cy - y3 * k
    out.z = z2
    out.k = k
    return out
  }
}

/**
 * The camera's turn alone, for directions: a face's normal in view space
 * (x right, y up, z toward the viewer), ready for `lambert`. Pass the yaw,
 * pitch and roll the camera was made with.
 */
export function orient({ yaw = 0, pitch = 0, roll = 0 }: Pick<CameraOptions, 'yaw' | 'pitch' | 'roll'>) {
  const cyw = Math.cos(yaw)
  const syw = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const cr = Math.cos(roll)
  const sr = Math.sin(roll)
  return (x: number, y: number, z: number): [number, number, number] => {
    const x1 = x * cyw + z * syw
    const z1 = -x * syw + z * cyw
    const y2 = y * cp + z1 * sp
    const z2 = -y * sp + z1 * cp
    return [x1 * cr - y2 * sr, x1 * sr + y2 * cr, z2]
  }
}

/** Projects a polyline of world points into flat screen [x0, y0, …], with its mean depth (for the Depth buffer). */
export function projectPath(points: readonly (readonly [number, number, number])[], project: Project, out: number[] = []): { xy: number[]; z: number } {
  const p = { x: 0, y: 0, z: 0, k: 1 }
  out.length = 0
  let z = 0
  for (const [x, y, zz] of points) {
    project(x, y, zz, p)
    out.push(p.x, p.y)
    z += p.z
  }
  return { xy: out, z: points.length ? z / points.length : 0 }
}

/**
 * Flat lighting for a facet: its brightness (0–1) from its normal, the light
 * from above, a little left and in front. `ambient` is the share a facet
 * turned away still gets. Normalizes the normal for you.
 */
export function lambert(nx: number, ny: number, nz: number, ambient = 0.28): number {
  const len = Math.hypot(nx, ny, nz) || 1
  const d = (nx * -0.38 + ny * 0.78 + nz * 0.5) / (len * 1.0014)
  return ambient + (1 - ambient) * clamp(d)
}

/**
 * Twice the signed screen area of the triangle a, b, c: negative when they
 * run counter-clockwise as seen on screen. List a face's corners
 * counter-clockwise as seen from outside its solid, and the face is toward
 * the viewer when this is negative (back faces can be skipped).
 */
export function facing(a: Projected, b: Projected, c: Projected): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/* ── The depth buffer ─────────────────────────────────────────────────── */

type Item =
  | { kind: 'square'; z: number; x: number; y: number; s: number; a: number; tone: Tone }
  | { kind: 'dot'; z: number; x: number; y: number; s: number; a: number; tone: Tone }
  | { kind: 'line'; z: number; v: [number, number, number, number]; w: number; a: number; tone: Tone }
  | { kind: 'path'; z: number; xy: number[]; stroke: Stroke }
  | { kind: 'poly'; z: number; xy: number[]; a: number; tone: Tone; solid: boolean }
  | { kind: 'face'; z: number; xy: number[]; light: number; tone: Tone }

/**
 * Collects a frame's marks with their depth, then draws them far to near
 * (the painter's order), so nearer marks cover farther ones. Marks at the
 * same depth keep the order they were added in.
 */
export class Depth {
  private items: Item[] = []

  /** A square particle at a projected point, its side scaled by the perspective. */
  square(p: Projected, side: number, alpha: number, tone: Tone = 'ink') {
    if (alpha > 0.004 && side > 0) this.items.push({ kind: 'square', z: p.z, x: p.x, y: p.y, s: side * p.k, a: Math.min(alpha, 1), tone })
  }

  /** A round dot at a projected point, its radius scaled by the perspective. */
  dot(p: Projected, r: number, alpha: number, tone: Tone = 'ink') {
    if (alpha > 0.004 && r > 0) this.items.push({ kind: 'dot', z: p.z, x: p.x, y: p.y, s: r * p.k, a: Math.min(alpha, 1), tone })
  }

  /** A hairline between two projected points, at their middle depth. */
  line(a: Projected, b: Projected, width: number, alpha: number, tone: Tone = 'ink') {
    if (alpha > 0.004) this.items.push({ kind: 'line', z: (a.z + b.z) / 2, v: [a.x, a.y, b.x, b.y], w: width, a: Math.min(alpha, 1), tone })
  }

  /** A stroked path through screen points, at depth `z`. The points are copied, so an array can be reused. */
  path(xy: readonly number[], z: number, stroke: Stroke) {
    if (stroke.alpha > 0.004) this.items.push({ kind: 'path', z, xy: xy.slice(), stroke })
  }

  /** A filled polygon through screen points, at depth `z` (usually its center's). The points are copied. */
  poly(xy: readonly number[], z: number, alpha: number, tone: Tone = 'ink', solid = false) {
    if (alpha > 0.004 || solid) this.items.push({ kind: 'poly', z, xy: xy.slice(), a: Math.min(alpha, 1), tone, solid })
  }

  /** A solid, lit face of a solid through screen points, at depth `z`: `light` from `lambert`. The points are copied. */
  face(xy: readonly number[], z: number, light: number, tone: Tone = 'ink') {
    this.items.push({ kind: 'face', z, xy: xy.slice(), light: clamp(light), tone })
  }

  flush(pen: Pen) {
    const items = this.items
    // A stable sort: equal depths keep their order.
    const order = items.map((_, i) => i).sort((a, b) => items[a]!.z - items[b]!.z || a - b)
    for (const i of order) {
      const m = items[i]!
      if (m.kind === 'square') pen.square(m.x, m.y, m.s, m.a, m.tone)
      else if (m.kind === 'dot') pen.dot(m.x, m.y, m.s, m.a, m.tone)
      else if (m.kind === 'line') pen.line(m.v[0], m.v[1], m.v[2], m.v[3], m.w, m.a, m.tone)
      else if (m.kind === 'path') pen.path(m.xy, m.stroke)
      else if (m.kind === 'face') pen.face(m.xy, m.light, m.tone)
      else pen.poly(m.xy, m.a, m.tone, m.solid)
    }
    this.items = []
  }
}

/* ── Pens ─────────────────────────────────────────────────────────────── */

const r2 = (v: number) => Math.round(v * 100) / 100

function trace(ctx: CanvasRenderingContext2D, xy: readonly number[], closed?: boolean) {
  ctx.beginPath()
  ctx.moveTo(xy[0]!, xy[1]!)
  for (let i = 2; i < xy.length; i += 2) ctx.lineTo(xy[i]!, xy[i + 1]!)
  if (closed) ctx.closePath()
}

/** The colors a live frame paints with, read from the page: each tone and the paper as CSS, and the scheme. */
export interface Palette {
  readonly css: Readonly<Record<BaseTone | 'paper', string>>
  /** The scheme, for lit faces: 1 dark, 0 light. */
  readonly dark: number
  /** A tone's color as CSS, a blend mixed from its two. */
  paint(tone: Tone): string
  /** How a lit face of the tone takes the light: as the ink does, or as a color does (the accent's way: the color held, stronger where lit). */
  lit(tone: Tone): 'ink' | 'accent'
  /** How much of the tone a lit face takes for its light (0–1): `faceInk` for how the tone takes the light, a blend's eased between its two. */
  face(tone: Tone, light: number): number
  /** A solid's one fill: `share` (0–1) of the tone laid on the paper, premixed into a single color. */
  solid(tone: Tone, share: number): string
}

/** 8-bit sRGB to Oklab (toLab), and back, clamped to sRGB (fromLab). */
const toLinear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c: number) => Math.round(255 * clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
function toLab([r, g, b]: Rgba): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function fromLab([L, A, B]: readonly number[]): [number, number, number] {
  const l = (L! + 0.3963377774 * A! + 0.2158037573 * B!) ** 3
  const m = (L! - 0.1055613458 * A! - 0.0638541728 * B!) ** 3
  const s = (L! - 0.0894841775 * A! - 1.291485548 * B!) ** 3
  return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)]
}

type Rgba = readonly [r: number, g: number, b: number, a: number]
let reader: CanvasRenderingContext2D | null | undefined

/** Any CSS color the browser knows, as 8-bit sRGB and alpha, read back from a one-pixel canvas. */
function readColor(css: string): Rgba {
  if (reader === undefined) {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    reader = c.getContext('2d', { willReadFrequently: true })
  }
  if (!reader) return [0, 0, 0, 1]
  reader.clearRect(0, 0, 1, 1)
  reader.fillStyle = 'transparent'
  reader.fillStyle = css
  reader.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 255] = reader.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}

/**
 * The palette for these colors. A solid's color is the tone laid over the
 * paper at its share (source-over, so a see-through paper stays see-through),
 * worked out once per 1/255 step and kept: painted as one fill, a solid's
 * antialiased edge blends once, so strips that share an edge don't ripple.
 * A blend is mixed once and kept. Resolved on first use, a tone at a time,
 * so it's safe to make while rendering on the server. `alias` puts extra
 * tones back in the ink or the accent (no `colors`): then they're those
 * tones exactly, their mixes and faces too.
 */
export function palette(
  colors: Record<'ink' | 'accent' | 'paper', string> & Partial<Record<ExtraTone, string>>,
  dark: number,
  alias?: Partial<Record<ExtraTone, 'ink' | 'accent'>>,
): Palette {
  // An extra tone the page didn't give is the ink.
  const css = { ...colors } as Record<BaseTone | 'paper', string>
  for (const tone of EXTRA_TONES) css[tone] ??= colors.ink
  const rgb: Partial<Record<string, Rgba>> = {}
  const painted = new Map<Tone, string>()
  const mixed = new Map<Tone, string[]>()
  const resolve = (tone: Tone) => resolveTone(tone, alias)
  const rgbOf = (tone: Tone): Rgba => {
    const hit = rgb[tone]
    if (hit) return hit
    const pair = parts.get(tone)
    if (!pair) return (rgb[tone] = readColor(css[tone as BaseTone]))
    const [a, b, k] = [rgbOf(pair[0]), rgbOf(pair[1]), pair[2]]
    const [la, lb] = [toLab(a), toLab(b)]
    return (rgb[tone] = [...fromLab(la.map((v, i) => v + (lb[i]! - v) * k)), a[3] + (b[3] - a[3]) * k] as unknown as Rgba)
  }
  const paint = (tone: Tone): string => {
    const t = resolve(tone)
    if (!parts.has(t)) return css[t as BaseTone]
    let hit = painted.get(t)
    if (!hit) {
      const [r, g, b, a] = rgbOf(t)
      painted.set(t, (hit = `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`)) // youj-allow: mixed from the theme's probed colors
    }
    return hit
  }
  return {
    css,
    dark,
    paint,
    lit: (tone) => litAs(resolve(tone)),
    face(tone, light) {
      const t = resolve(tone)
      const pair = parts.get(t)
      if (!pair) return faceInk(light, dark, litAs(t))
      return mix(faceInk(light, dark, litAs(pair[0])), faceInk(light, dark, litAs(pair[1])), pair[2])
    },
    solid(tone, share) {
      const t = resolve(tone)
      const step = Math.round(clamp(share, 0, 1) * 255)
      let cache = mixed.get(t)
      if (!cache) mixed.set(t, (cache = []))
      const hit = cache[step]
      if (hit) return hit
      const ink = rgbOf(t)
      const paper = (rgb.paper ??= readColor(css.paper))
      const a = (ink[3] * step) / 255
      const out = a + paper[3] * (1 - a)
      const channel = (i: 0 | 1 | 2) => (out ? Math.round((ink[i] * a + paper[i] * paper[3] * (1 - a)) / out) : 0)
      return (cache[step] = `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${Math.round(out * 1000) / 1000})`) // youj-allow: mixed from the theme's probed colors
    },
  }
}

/**
 * Draws into a 2D canvas whose transform maps units to device pixels. A solid
 * shape or a lit face is one fill of its premixed color (`Palette.solid`): it
 * hides what's behind it without letting the stage show through, edges where
 * faces meet neither lighten nor ripple, and it matches the SVG still, which
 * mixes the same two colors the same way.
 */
export function canvasPen(ctx: CanvasRenderingContext2D, colors: Palette): Pen {
  const fill = (xy: readonly number[], style: string, alpha: number) => {
    if (xy.length < 6) return
    trace(ctx, xy, true)
    ctx.globalAlpha = alpha
    ctx.fillStyle = style
    ctx.fill()
  }
  return {
    square(x, y, side, alpha, tone = 'ink') {
      ctx.globalAlpha = alpha
      ctx.fillStyle = colors.paint(tone)
      ctx.fillRect(x - side / 2, y - side / 2, side, side)
    },
    dot(x, y, r, alpha, tone = 'ink') {
      ctx.globalAlpha = alpha
      ctx.fillStyle = colors.paint(tone)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
    },
    line(x1, y1, x2, y2, width, alpha, tone = 'ink') {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = colors.paint(tone)
      ctx.lineWidth = width
      ctx.lineCap = 'butt'
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    },
    path(xy, s) {
      if (xy.length < 4) return
      ctx.globalAlpha = s.alpha
      ctx.strokeStyle = colors.paint(s.tone ?? 'ink')
      ctx.lineWidth = s.width
      ctx.lineCap = s.cap ?? 'butt'
      ctx.lineJoin = s.join ?? 'miter'
      ctx.setLineDash(s.dash ? [...s.dash] : [])
      ctx.lineDashOffset = s.offset ?? 0
      trace(ctx, xy, s.closed)
      ctx.stroke()
    },
    poly(xy, alpha, tone = 'ink', solid = false) {
      if (solid) fill(xy, colors.solid(tone, alpha), 1)
      else fill(xy, colors.paint(tone), alpha)
    },
    face(xy, light, tone = 'ink') {
      fill(xy, colors.solid(tone, colors.face(tone, light)), 1)
    },
  }
}

export type Mark =
  | { kind: 'square'; v: [number, number, number]; alpha: number; tone: Tone }
  | { kind: 'dot'; v: [number, number, number]; alpha: number; tone: Tone }
  | { kind: 'line'; v: [number, number, number, number, number]; alpha: number; tone: Tone }
  | { kind: 'path'; d: string; stroke: Stroke }
  | { kind: 'poly'; d: string; alpha: number; tone: Tone; solid: boolean }
  | { kind: 'face'; d: string; light: number; tone: Tone }

const pathData = (xy: readonly number[], closed?: boolean) => {
  let d = `M${r2(xy[0]!)} ${r2(xy[1]!)}`
  for (let i = 2; i < xy.length; i += 2) d += `L${r2(xy[i]!)} ${r2(xy[i + 1]!)}`
  return closed ? `${d}Z` : d
}

/** Records marks, for drawing a still frame as SVG (and for tests). */
export function recordingPen(marks: Mark[]): Pen {
  return {
    square(x, y, side, alpha, tone = 'ink') {
      marks.push({ kind: 'square', v: [r2(x - side / 2), r2(y - side / 2), r2(side)], alpha: r2(alpha), tone })
    },
    dot(x, y, r, alpha, tone = 'ink') {
      marks.push({ kind: 'dot', v: [r2(x), r2(y), r2(r)], alpha: r2(alpha), tone })
    },
    line(x1, y1, x2, y2, width, alpha, tone = 'ink') {
      marks.push({ kind: 'line', v: [r2(x1), r2(y1), r2(x2), r2(y2), r2(width)], alpha: r2(alpha), tone })
    },
    path(xy, stroke) {
      if (xy.length >= 4) marks.push({ kind: 'path', d: pathData(xy, stroke.closed), stroke: { ...stroke, alpha: r2(stroke.alpha) } })
    },
    poly(xy, alpha, tone = 'ink', solid = false) {
      if (xy.length >= 6) marks.push({ kind: 'poly', d: pathData(xy, true), alpha: r2(alpha), tone, solid })
    },
    face(xy, light, tone = 'ink') {
      if (xy.length >= 6) marks.push({ kind: 'face', d: pathData(xy, true), light: r2(light), tone })
    },
  }
}

/* ── Ticker ───────────────────────────────────────────────────────────── */

type Tick = (dt: number) => void
const ticks = new Set<Tick>()
let raf = 0
let last = 0
let reported = false

declare const process: { env: { NODE_ENV?: string } }
/** One scene throwing stops that loader only: its tick is dropped, and the first failure is logged in development. */
function run(tick: Tick, dt: number) {
  try {
    tick(dt)
  } catch (error) {
    ticks.delete(tick)
    if (process.env.NODE_ENV !== 'production' && !reported) {
      reported = true
      console.error('A loader stopped because its scene threw; the other loaders keep running.', error)
    }
  }
}

function loop(now: number) {
  // A long gap (a stalled tab, a debugger) advances by one frame's worth, not a jump. The frame's timestamp can
  // precede `last` (read in script after the frame began), and a negative step would put a phase below 0, where a
  // scene's indexing throws and the throw stops the loop for every loader.
  const dt = Math.max(0, Math.min(now - last, 50))
  last = now
  ticks.forEach((tick) => run(tick, dt))
  raf = ticks.size ? requestAnimationFrame(loop) : 0
}

/** Runs `tick` every frame with the milliseconds since the last, on the one loop every loader shares. */
export function onTick(tick: Tick): () => void {
  ticks.add(tick)
  if (!raf) {
    last = performance.now()
    raf = requestAnimationFrame(loop)
  }
  return () => {
    ticks.delete(tick)
    if (!ticks.size && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
}
