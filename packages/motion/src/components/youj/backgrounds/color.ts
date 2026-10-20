/* Color math for canvas/WebGL backgrounds. Token colors arrive as whatever the
 * browser serializes for a computed `color` (rgb, oklch, oklab or
 * color(srgb …)); everything is normalized to sRGB 0–1 and, for blending,
 * to OKLab so gradients between hues stay luminous instead of going muddy. */

/** sRGB, each channel 0–1. */
export type Rgb = [number, number, number]
/** OKLab: L 0–1, a/b roughly ±0.4. */
export type Oklab = [number, number, number]

const NUMBER = /-?[\d.]+(?:e-?\d+)?%?/gi

function numbers(input: string): number[] {
  return (input.match(NUMBER) ?? []).map((n) => (n.endsWith('%') ? parseFloat(n) / 100 : parseFloat(n)))
}

/** Parses a computed CSS color string. Returns null for anything it doesn't recognize. */
export function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase()
  if (/^rgba?\(/.test(s)) {
    const [r, g, b] = numbers(s)
    if (r === undefined || g === undefined || b === undefined) return null
    return [r / 255, g / 255, b / 255]
  }
  if (/^color\(srgb\s/.test(s)) {
    const [r, g, b] = numbers(s.slice(10))
    if (r === undefined || g === undefined || b === undefined) return null
    return [r, g, b]
  }
  if (/^oklch\(/.test(s)) {
    const [l, c, h] = numbers(s.replace('none', '0'))
    if (l === undefined || c === undefined || h === undefined) return null
    const rad = (h * Math.PI) / 180
    return oklabToRgb([l, c * Math.cos(rad), c * Math.sin(rad)])
  }
  if (/^oklab\(/.test(s)) {
    const [l, a, b] = numbers(s)
    if (l === undefined || a === undefined || b === undefined) return null
    return oklabToRgb([l, a, b])
  }
  return null
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export function rgbToOklab([r, g, b]: Rgb): Oklab {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear([L, a, b]: Oklab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (c: Rgb) => c.every((x) => x >= -1e-4 && x <= 1 + 1e-4)

/** OKLab to sRGB. Out-of-gamut colors keep lightness and hue and lose chroma until they fit. */
export function oklabToRgb(lab: Oklab): Rgb {
  let lin = oklabToLinear(lab)
  if (!inGamut(lin)) {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 16; i++) {
      const k = (lo + hi) / 2
      if (inGamut(oklabToLinear([lab[0], lab[1] * k, lab[2] * k]))) lo = k
      else hi = k
    }
    lin = oklabToLinear([lab[0], lab[1] * lo, lab[2] * lo])
  }
  return [toGamma(clamp01(lin[0])), toGamma(clamp01(lin[1])), toGamma(clamp01(lin[2]))]
}

/** Rotates hue in OKLCh, optionally nudging lightness and scaling chroma. */
export function shiftColor(rgb: Rgb, hueDeg: number, dL = 0, chroma = 1): Rgb {
  const [L, a, b] = rgbToOklab(rgb)
  const c = Math.hypot(a, b) * chroma
  const h = Math.atan2(b, a) + (hueDeg * Math.PI) / 180
  return oklabToRgb([clamp01(L + dL), c * Math.cos(h), c * Math.sin(h)])
}

/** Perceived lightness (OKLab L), 0–1. */
export const lightness = (rgb: Rgb) => rgbToOklab(rgb)[0]

/** Packs colors as consecutive OKLab triples for a `uniform vec3 name[n]`. */
export function packOklab(colors: readonly Rgb[], count = colors.length): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) out.set(rgbToOklab(colors[i % colors.length] ?? [0, 0, 0]), i * 3)
  return out
}

/** Serializes a resolved color for Canvas 2D fillStyle/strokeStyle. */
export function cssColor([r, g, b]: Rgb): string {
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})` // youj-allow: serializes a runtime-resolved token color for Canvas 2D
}

/** An analogous family around one accent: the accent itself, then neighbors at
 *  the given hue offsets (degrees). Keeps "one accent" while giving gradients depth. */
export function accentFamily(accent: Rgb, offsets: readonly [hue: number, dL: number, chroma: number][]): Rgb[] {
  return [accent, ...offsets.map(([h, dL, c]) => shiftColor(accent, h, dL, c))]
}
