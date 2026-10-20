import { defineTheme, isPerMode, type Theme, type ThemeInput } from '@youj/core/lib/youj/theme/contract'
import { parseColor } from '@youj/core/lib/youj/theme/color'
import { DEFAULT_PRESET, presetById, themes } from '@youj/core/lib/youj/theme/themes'
import { fontById, fontOf } from './fonts'

/* A theme in a URL, readably: the preset it's closest to, then each field
 * that differs from it (`?preset=terminal&accent=%23e5484d&radius=lg`), and its
 * name. A typeface from the catalog travels as its key (`sans=geist`), any
 * other as its CSS stack. Create keeps its theme here, and the CLI reads the
 * same link.
 *
 * Extension point: a new contract field is one row in FIELDS, with its path
 * in ThemeInput and how to read it (and write it, when the URL spells it
 * differently from the theme). Fields not listed here don't travel in the URL. */

type Path = readonly [string] | readonly [string, string]

interface Field {
  param: string
  /** The parameter this field was called before a rename: old links keep working, new ones write `param`. */
  legacy?: string
  path: Path
  read: (raw: string) => unknown
  write?: (value: unknown) => string
}

const number = (min: number, max: number) => (raw: string) => {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null
}
const oneOf = (values: readonly string[]) => (raw: string) => (values.includes(raw) ? raw : null)
const one = (raw: string) => (raw.length <= 64 && parseColor(raw) ? raw : null)
// Lists put `|` between colors (a character no CSS color holds). A color
// tuned per mode is two, light then dark; a chart palette five, or ten per
// mode (light's five, then dark's).
const list = (raw: string) => raw.split('|').map((c) => c.trim())
const color = (raw: string) => {
  const colors = list(raw)
  if (colors.length === 1) return one(colors[0]!)
  return colors.length === 2 && colors.every((c) => one(c) !== null) ? { light: colors[0], dark: colors[1] } : null
}
const palette = (raw: string) => {
  const colors = list(raw)
  if (!colors.every((c) => one(c) !== null)) return null
  if (colors.length === 5) return colors
  return colors.length === 10 ? { light: colors.slice(0, 5), dark: colors.slice(5) } : null
}
/** A color or palette as the URL spells it: a pair light first, then dark. */
const colors = (value: unknown) => (isPerMode(value) ? [value.light, value.dark] : [value]).flat().join('|')
// A catalog key, or a CSS font-family list: names, quotes, commas and spaces only.
const font = (raw: string) => fontById(raw)?.stack ?? (raw.length <= 160 && /^[\w\s'",.-]+$/.test(raw) ? raw : null)
const fontKey = (stack: unknown) => fontOf(String(stack))?.id ?? String(stack)

export const FIELDS: readonly Field[] = [
  { param: 'hue', path: ['neutral', 'hue'], read: number(0, 360) },
  { param: 'chroma', path: ['neutral', 'chroma'], read: number(0, 0.04) },
  { param: 'wash', path: ['neutral', 'wash'], read: number(0, 1) },
  { param: 'lift', path: ['neutral', 'lift'], read: number(0, 1) },
  { param: 'accent', path: ['accent'], read: color, write: colors },
  { param: 'success', path: ['success'], read: color, write: colors },
  { param: 'warning', path: ['warning'], read: color, write: colors },
  { param: 'danger', path: ['danger'], read: color, write: colors },
  { param: 'info', path: ['info'], read: color, write: colors },
  { param: 'chart', path: ['chart'], read: palette, write: colors },
  { param: 'radius', path: ['radius'], read: oneOf(['none', 'sm', 'md', 'lg', 'full']) },
  { param: 'controlSize', legacy: 'density', path: ['controlSize'], read: oneOf(['compact', 'default', 'comfortable']) },
  { param: 'sans', path: ['fonts', 'sans'], read: font, write: fontKey },
  { param: 'mono', path: ['fonts', 'mono'], read: font, write: fontKey },
  { param: 'display', path: ['fonts', 'display'], read: font, write: fontKey },
  { param: 'motionPersonality', legacy: 'motion', path: ['motionPersonality'], read: oneOf(['precise', 'calm', 'lively']) },
  // The character: lines, depth, titles and labels.
  { param: 'stroke', path: ['stroke', 'width'], read: number(0.5, 4) },
  { param: 'ink', path: ['stroke', 'ink'], read: number(0, 1) },
  { param: 'icons', path: ['stroke', 'icons'], read: number(0.5, 2) },
  { param: 'shadow', path: ['shadow'], read: oneOf(['soft', 'hard', 'none']) },
  { param: 'actions', path: ['actions'], read: oneOf(['accent', 'ink']) },
  { param: 'controls', path: ['controls'], read: oneOf(['pill', 'rounded']) },
  { param: 'chrome', path: ['tone', 'chrome'], read: oneOf(['match', 'dark', 'light']) },
  { param: 'bars', path: ['tone', 'bars'], read: oneOf(['chrome', 'content', 'top']) },
  { param: 'overlays', path: ['tone', 'overlays'], read: oneOf(['content', 'chrome', 'ink']) },
  { param: 'gradient', path: ['surfaces', 'gradient'], read: number(0, 1) },
  { param: 'titleWeight', path: ['headings', 'weight'], read: number(100, 900) },
  { param: 'titleTracking', path: ['headings', 'tracking'], read: number(-0.1, 0.1) },
  { param: 'labelCase', path: ['labels', 'case'], read: oneOf(['none', 'upper']) },
  { param: 'labelFont', path: ['labels', 'font'], read: oneOf(['sans', 'mono']) },
  { param: 'labelTracking', path: ['labels', 'tracking'], read: number(0, 0.2) },
]

/** What a new theme is called until it's renamed. */
export const DEFAULT_THEME_NAME = 'My theme'

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'custom'
  )
}

function get(theme: ThemeInput, path: Path): unknown {
  const [a, b] = path
  const top = (theme as Record<string, unknown>)[a]
  return b === undefined ? top : (top as Record<string, unknown> | undefined)?.[b]
}

/** Sets a field, or removes it when `value` is undefined. */
function set(theme: Record<string, unknown>, path: Path, value: unknown) {
  const [a, b] = path
  if (b === undefined) {
    if (value === undefined) delete theme[a]
    else theme[a] = value
    return
  }
  const inner: Record<string, unknown> = { ...(theme[a] as Record<string, unknown> | undefined) }
  if (value === undefined) delete inner[b]
  else inner[b] = value
  theme[a] = inner
}

/** A preset's contract with a theme's name: what "start from" gives. */
function named(base: ThemeInput, name: string): Record<string, unknown> {
  const { description: _, ...contract } = base
  return { ...contract, id: slug(name), name }
}

/** The theme a URL describes: its preset (Basalt by default), its changes, its name. Unknown or malformed values are ignored. */
export function readTheme(params: URLSearchParams): Theme {
  const name = params.get('name')?.trim().slice(0, 40) || DEFAULT_THEME_NAME
  const preset = params.get('preset')
  const theme = named(presetById(themes.some((t) => t.id === preset) ? preset : DEFAULT_PRESET), name)
  for (const field of FIELDS) {
    const raw = params.get(field.param) ?? (field.legacy ? params.get(field.legacy) : null)
    if (raw === null) continue
    // Empty means unset: the preset had it, this theme leaves it to the default.
    const value = raw === '' ? undefined : field.read(raw)
    if (value !== null) set(theme, field.path, value)
  }
  return defineTheme(theme as ThemeInput)
}

// A palette is a list and a color can be a pair: the same colors are the same value.
const same = (a: unknown, b: unknown) => a === b || (typeof a === 'object' && typeof b === 'object' && JSON.stringify(a) === JSON.stringify(b))
const differs = (theme: ThemeInput, base: ThemeInput) => FIELDS.filter((f) => !same(get(theme, f.path), get(base, f.path)))

/** The theme as URL parameters: the closest preset (the default on a tie), then only what differs from it. */
export function writeTheme(theme: ThemeInput, params = new URLSearchParams()): URLSearchParams {
  for (const key of ['preset', 'name', ...FIELDS.flatMap((f) => [f.param, ...(f.legacy ? [f.legacy] : [])])]) params.delete(key)
  const rank = (t: ThemeInput) => differs(theme, t).length * 2 + (t.id === DEFAULT_PRESET ? 0 : 1)
  const base = [...themes].sort((a, b) => rank(a) - rank(b))[0]!
  if (base.id !== DEFAULT_PRESET) params.set('preset', base.id)
  if (theme.name && theme.name !== DEFAULT_THEME_NAME) params.set('name', theme.name)
  for (const field of differs(theme, base)) {
    const value = get(theme, field.path)
    params.set(field.param, value === undefined ? '' : field.write ? field.write(value) : String(value))
  }
  return params
}
