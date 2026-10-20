/* OKLCH -> sRGB and WCAG 2.x contrast, so the Color page can badge the live
 * CSS variables and a test can hold the palette to AA. */

export type Rgb = [number, number, number]

export function parseOklch(value: string): [number, number, number] | null {
  const m = value.trim().match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*[\d.%]+\s*)?\)$/i)
  if (!m) return null
  const l = Number(m[1]) / (m[2] ? 100 : 1)
  return [l, Number(m[3]), Number(m[4])]
}

/** Linear-light sRGB, unclamped (values outside 0..1 are out of gamut). */
export function oklchToLinearSrgb(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const encode = (v: number) => {
  const x = clamp01(v)
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
}

export function inGamut(rgb: Rgb) {
  return rgb.every((v) => v >= -0.0005 && v <= 1.0005)
}

export function toHex(rgb: Rgb) {
  return '#' + rgb.map((v) => Math.round(encode(v) * 255).toString(16).padStart(2, '0')).join('')
}

export function luminance(rgb: Rgb) {
  return 0.2126 * clamp01(rgb[0]) + 0.7152 * clamp01(rgb[1]) + 0.0722 * clamp01(rgb[2])
}

export function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

export function oklchToRgb(value: string): Rgb | null {
  const p = parseOklch(value)
  return p ? oklchToLinearSrgb(...p) : null
}

export type ContrastGrade = 'AAA' | 'AA' | 'AA Large' | 'Fail'

export function grade(ratio: number): ContrastGrade {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}
