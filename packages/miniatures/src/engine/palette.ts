/* The miniatures' shared palette: one family of materials, lit two ways.
 * Light mode is a drafted product drawing on warm paper; dark mode is a
 * night studio: the same materials on a warm charcoal stage, relit by a key
 * light from the top left (tops ×0.86, fronts ×0.68, sides ×0.46 in linear
 * light), with lights keeping their night brightness. Each figure carries its
 * own copy of these values in its stylesheet (so it can tune one); this table
 * is the reference new figures start from, and `relight` derives a dark value
 * from a light one, as the lab brief does. */

export type MaterialRole = 'top' | 'front' | 'side'

/** Light and dark values of the shared tokens (CSS custom properties on the host). */
export const palette = {
  top: ['#fafaf8', '#eaeae8'],
  body: ['#e0e0dc', '#bdbdba'],
  side: ['#c7c7c3', '#8c8c8b'],
  base: ['#b6b6b3', '#999997'],
  'base-top': ['#cbcbc7', '#bebeba'],
  'base-side': ['#a4a4a1', '#737372'],
  recess: ['#9d9d99', '#6e6e6c'],
  glass: ['#ededeb', '#c8c8c6'],
  off: ['#b9b9b5', '#9b9b99'],
  chrome: ['#d9dad8', '#b7b7b6'],
  'chrome-top': ['#f4f4f2', '#e4e4e2'],
  'chrome-side': ['#bdbebc', '#858585'],
  metal: ['#d6d6d2', '#b4b4b2'],
  'metal-top': ['#efefec', '#e0e0dd'],
  'metal-side': ['#b4b4b1', '#7e7e7d'],
  wood: ['#9a6a42', '#815836'],
  'wood-top': ['#b9875a', '#ad7e54'],
  'wood-side': ['#7b5232', '#553720'],
  brass: ['#cfa95d', '#ae8e4d'],
  'brass-top': ['#e8c985', '#d9bc7c'],
  'brass-side': ['#ab8743', '#785e2d'],
  rubber: ['#2e2e2d', '#252524'],
  'rubber-top': ['#474745', '#424240'],
  'rubber-side': ['#282827', '#191919'],
  paper: ['#fbfbf7', '#d4d4d1'],
  screen: ['#1c1d1e', '#161717'],
  line: ['#626260', '#444443'],
  accent: ['#3b5bfd', '#617cff'],
  shadow: ['#262626', '#000'],
} as const satisfies Record<string, readonly [light: string, dark: string]>

/** The stage a miniature is drawn for, and the caption around it: page, ink, muted ink, rules and the accent. */
export const stage = {
  light: { bg: '#f4f3ef', ink: '#323232', muted: '#6e6e6e', rule: '#d6d6d2', accent: '#3b5bfd' },
  dark: { bg: '#1a1917', ink: '#e8e8e8', muted: '#929292', rule: '#32312e', accent: '#617cff' },
} as const

const LIGHT = { top: 0.86, front: 0.68, side: 0.46 } as const
const UNTINT = { top: 0, front: 0.25, side: 0.5 } as const

/**
 * A material's dark (night studio) value from its light one: relit in linear
 * sRGB by the face's role, near-neutrals losing some tint on fronts and sides
 * so cream never turns khaki. Lights (LEDs, lamps, screens) don't go through
 * this: they keep their brightness at night.
 */
export function relight(hex: string, role: MaterialRole): string {
  const k = LIGHT[role]
  const c = (hex.slice(1).match(/../g) ?? []).map((h) => parseInt(h, 16) / 255)
  const l = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) * k)
  const y = 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!
  const d = Math.max(...c) - Math.min(...c) < 0.08 ? UNTINT[role] : 0
  return (
    '#' +
    l
      .map((v) => v + (y - v) * d)
      .map((v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)).toString(16).padStart(2, '0'))
      .join('')
  )
}
