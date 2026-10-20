/* Color for the terrain's canvas. The theme's tokens are formulas, so only
 * the browser knows a color: each one is resolved in the canvas's own
 * cascade through a hidden probe (never getPropertyValue), all in one style
 * pass, and read back as OKLab, where the ramps are mixed. The canvas then
 * takes them in OKLab where it can (colors outside sRGB survive), else as
 * hex. */

export type Lab = [l: number, a: number, b: number, alpha: number]

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function fromSrgb(r: number, g: number, b: number, alpha: number): Lab {
  const [lr, lg, lb] = [toLinear(r / 255), toLinear(g / 255), toLinear(b / 255)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s, alpha]
}

function toHex([L, a, b, alpha]: Lab) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
  const byte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${rgb.map((v) => byte(toGamma(Math.min(1, Math.max(0, v))))).join('')}${alpha < 1 ? byte(alpha) : ''}`
}

const NUMBER = String.raw`(-?[\d.]+(?:e-?\d+)?)`
const OKLAB = new RegExp(String.raw`^oklab\(\s*${NUMBER}(%?)\s+${NUMBER}\s+${NUMBER}(?:\s*\/\s*${NUMBER}(%?))?\s*\)$`)

/** A computed color into OKLab: browsers write an OKLab mix in OKLab; anything else goes through a pixel. */
function parse(value: string, pixel: CanvasRenderingContext2D | null): Lab {
  const m = OKLAB.exec(value.trim())
  if (m) return [Number(m[1]) / (m[2] ? 100 : 1), Number(m[3]), Number(m[4]), m[5] === undefined ? 1 : Number(m[5]) / (m[6] ? 100 : 1)]
  if (!pixel) return [0.6, 0, 0, 1]
  pixel.clearRect(0, 0, 1, 1)
  pixel.fillStyle = value
  pixel.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 255] = pixel.getImageData(0, 0, 1, 1).data
  return fromSrgb(r, g, b, a / 255)
}

/** Resolves CSS colors in `host`'s cascade, all in one style pass: a hidden probe per color, read, then removed. */
export function resolveColors(host: Element, sources: Record<string, string>): Record<string, Lab> {
  const keys = Object.keys(sources)
  const box = document.createElement('span')
  box.style.display = 'none'
  for (const key of keys) {
    const probe = document.createElement('span')
    probe.style.color = `color-mix(in oklab, ${sources[key]} 100%, transparent)`
    box.append(probe)
  }
  host.append(box)
  const computed = keys.map((_, i) => getComputedStyle(box.children[i]!).color)
  box.remove()
  const pixel = computed.some((c) => !OKLAB.test(c.trim())) ? document.createElement('canvas').getContext('2d', { willReadFrequently: true }) : null
  return Object.fromEntries(keys.map((key, i) => [key, parse(computed[i]!, pixel)]))
}

export const mix = (a: Lab, b: Lab, t: number): Lab => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]

/** How the canvas takes a color: in OKLab if it reads it, else hex. */
export function colorWriter(ctx: CanvasRenderingContext2D | null): (lab: Lab) => string {
  if (ctx) {
    ctx.fillStyle = 'transparent'
    const before = ctx.fillStyle
    ctx.fillStyle = 'oklab(0.5 0.1 0.1)' // youj-allow: a probe of the canvas's color parser, not a color
    const reads = ctx.fillStyle !== before
    ctx.fillStyle = before
    if (reads) return ([l, a, b, alpha]) => `oklab(${l.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)} / ${alpha.toFixed(3)})` // youj-allow: theme colors resolved through probes, written for the canvas
  }
  return toHex
}
