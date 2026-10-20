/* Color math for the theme system: parse the CSS colors people write
 * (hex, rgb(), hsl(), oklch(), oklab(), color()), convert between linear
 * sRGB, OKLab and OKLCH, and measure WCAG 2 contrast the way a browser paints
 * it (channels clipped to sRGB, translucency composited in gamma space).
 * Self-contained, so the theme module copies on its own. */

/** Linear-light sRGB, unclamped: values outside 0–1 are out of gamut. */
export type LinearRgb = [number, number, number]
export type Oklab = [number, number, number]
/** L 0–1, chroma, hue in degrees. */
export type Oklch = [number, number, number]

const toLinear = (v: number) => (Math.abs(v) <= 0.04045 ? v / 12.92 : Math.sign(v) * ((Math.abs(v) + 0.055) / 1.055) ** 2.4)
const toGamma = (v: number) => (Math.abs(v) <= 0.0031308 ? 12.92 * v : Math.sign(v) * (1.055 * Math.abs(v) ** (1 / 2.4) - 0.055))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function linearToOklab([r, g, b]: LinearRgb): Oklab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToLinear([L, a, b]: Oklab): LinearRgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function oklabToOklch([L, a, b]: Oklab): Oklch {
  const c = Math.hypot(a, b)
  // Achromatic colors have no hue; CSS reads `none` as 0.
  const h = c < 1e-7 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  return [L, c, h]
}

export function oklchToOklab([L, c, h]: Oklch): Oklab {
  const rad = (h * Math.PI) / 180
  return [L, c * Math.cos(rad), c * Math.sin(rad)]
}

export const oklchToLinear = (lch: Oklch) => oklabToLinear(oklchToOklab(lch))
export const linearToOklch = (rgb: LinearRgb) => oklabToOklch(linearToOklab(rgb))

// display-p3 (linear) → linear sRGB, through XYZ D65.
const P3_TO_SRGB = [
  [1.2249401763, -0.2249401763, 0],
  [-0.0420569547, 1.0420569547, 0],
  [-0.0196375546, -0.0786360456, 1.0982736002],
] as const

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|deg|rad|turn|grad)?|none/gi

function channels(body: string): string[] {
  // Drop an alpha component: `/ 0.5` or a fourth comma-separated value.
  const [main] = body.split('/')
  return (main!.match(NUMBER) ?? []).slice(0, 3)
}

function num(token: string, percentScale = 1): number {
  if (token === 'none') return 0
  if (token.endsWith('%')) return (parseFloat(token) / 100) * percentScale
  return parseFloat(token)
}

function angle(token: string): number {
  if (token === 'none') return 0
  const v = parseFloat(token)
  if (token.endsWith('rad')) return (v * 180) / Math.PI
  if (token.endsWith('turn')) return v * 360
  if (token.endsWith('grad')) return v * 0.9
  return v
}

function hslToSrgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

/** Parses a CSS color into linear sRGB. Returns null for anything it doesn't know. */
export function parseColor(input: string): LinearRgb | null {
  const s = input.trim().toLowerCase()
  const hex = s.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((ch) => ch + ch).join('')
    if (h.length !== 6 && h.length !== 8) return null
    return [0, 2, 4].map((i) => toLinear(parseInt(h.slice(i, i + 2), 16) / 255)) as LinearRgb
  }
  const fn = s.match(/^([a-z-]+)\((.*)\)$/)
  if (!fn) return null
  const [, name, body] = fn as unknown as [string, string, string]
  if (name === 'color') {
    const [space, ...rest] = body.trim().split(/\s+/)
    const c = channels(rest.join(' ')).map((t) => num(t))
    if (c.length !== 3) return null
    if (space === 'srgb') return c.map(toLinear) as LinearRgb
    if (space === 'srgb-linear') return c as LinearRgb
    if (space === 'display-p3') {
      const lin = c.map(toLinear)
      return P3_TO_SRGB.map((row) => row[0] * lin[0]! + row[1] * lin[1]! + row[2] * lin[2]!) as LinearRgb
    }
    return null
  }
  const c = channels(body)
  if (c.length !== 3) return null
  switch (name) {
    case 'rgb':
    case 'rgba':
      return c.map((t) => toLinear(num(t, 255) / 255)) as LinearRgb
    case 'hsl':
    case 'hsla':
      // Saturation and lightness are percentages, with or without the % sign.
      return hslToSrgb(angle(c[0]!), parseFloat(c[1]!) / 100, parseFloat(c[2]!) / 100).map(toLinear) as LinearRgb
    case 'oklch':
      return oklchToLinear([num(c[0]!), num(c[1]!, 0.4), angle(c[2]!)])
    case 'oklab':
      return oklabToLinear([num(c[0]!), num(c[1]!, 0.4), num(c[2]!, 0.4)])
    default:
      return null
  }
}

export function inGamut([r, g, b]: LinearRgb, tolerance = 0.0005) {
  return [r, g, b].every((v) => v >= -tolerance && v <= 1 + tolerance)
}

/** Relative luminance as painted: channels clipped to the sRGB gamut first. */
export function luminance([r, g, b]: LinearRgb) {
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b)
}

export function contrast(a: LinearRgb, b: LinearRgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** `paint` at `alpha` over an opaque `backdrop`, composited in gamma-encoded sRGB like a browser. */
export function over(paint: LinearRgb, alpha: number, backdrop: LinearRgb): LinearRgb {
  return paint.map((v, i) => toLinear(toGamma(clamp01(v)) * alpha + toGamma(clamp01(backdrop[i]!)) * (1 - alpha))) as LinearRgb
}

/** OKLab interpolation, as `color-mix(in oklab, a p, b)`. */
export function mixOklab(a: Oklch, b: Oklch, p: number): Oklch {
  const x = oklchToOklab(a)
  const y = oklchToOklab(b)
  return oklabToOklch(x.map((v, i) => v * p + y[i]! * (1 - p)) as Oklab)
}

const round = (v: number, digits: number) => {
  const r = Number(v.toFixed(digits))
  return Object.is(r, -0) ? 0 : r
}

/** `oklch(0.54 0.25 268)`: four decimals for lightness and chroma, two for hue. */
export function formatOklch([l, c, h]: Oklch): string {
  const cc = round(c, 4)
  return `oklch(${round(l, 4)} ${cc} ${cc === 0 ? 0 : round(h, 2)})`
}

/** `#3554fc`, clipped to sRGB. */
export function toHex(rgb: LinearRgb): string {
  return '#' + rgb.map((v) => Math.round(clamp01(toGamma(v)) * 255).toString(16).padStart(2, '0')).join('')
}
