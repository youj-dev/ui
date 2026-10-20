import { readFileSync } from 'node:fs'
import { deriveRoles, resolveTheme, ROLES, SHADOW, type Role, type ThemeInput } from '@youj/core/lib/youj/theme'
import { oklabToLinear, oklchToLinear, type LinearRgb } from '@youj/core/lib/youj/theme/color'
import { describeValue, forMode, parseRoles, parseTokens, resolvePaint, type Tokens } from '@youj/react/docs/token-math'
import type { ColorValue, KitColor, KitEffect, Mode, Rgba } from '../kit'
import { evalCss, substitute } from './css-math'

/* Colours, read from the real sources: every role from youj.css's role block
 * (values from derive.ts, the JS mirror of youj.css), resolved per theme and
 * mode by the ui package's token math. A role that youj.css maps straight
 * onto another (--color-focus: var(--color-accent)) becomes an alias, so
 * Figma shows the same graph as the code; mixes get their own value per
 * theme. Bezel's private helpers follow, from bezel.css. */

export const YOUJ_CSS = new URL('../../../core/src/styles/youj.css', import.meta.url)
export const UI_CSS = new URL('../../../ui/src/styles/ui.css', import.meta.url)
export const BEZEL_CSS = new URL('../../../ui/src/styles/bezel.css', import.meta.url)

const MODES: Mode[] = ['light', 'dark']

const round = (v: number) => Math.round(v * 10000) / 10000
const encode = (v: number) => {
  const x = Math.min(1, Math.max(0, v))
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
}

export function linearToRgba([r, g, b]: LinearRgb, a = 1): Rgba {
  return { r: round(encode(r)), g: round(encode(g)), b: round(encode(b)), a: round(a) }
}

export function rgbaToHex({ r, g, b, a }: Rgba): string {
  const hex = [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
  return `#${hex}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}`
}

function roleOf(name: string): KitColor['role'] {
  if (/^(fg|on-)/.test(name) || name.endsWith('-text')) return 'text'
  if (/^line(-|$)/.test(name) || name === 'focus' || name.endsWith('-line')) return 'line'
  if (/^(canvas|surface|raised|overlay|well|field|key|control|chrome|chrome-float|inverse|secondary|band|hover|selected|cursor)(-hover)?$/.test(name)) return 'surface'
  return 'fill'
}

const paint = (tokens: Tokens, mode: Mode, expr: string): Rgba => {
  const p = resolvePaint(tokens, mode, expr)
  return linearToRgba(oklabToLinear(p.lab), p.alpha)
}

/**
 * Everything a theme needs: its parsed tokens, once. The roles come from
 * youj.css; what ui.css still declares for itself (the shadow steps, the key
 * edge) rides along in the same bridge.
 */
export function themeTokens(themes: readonly ThemeInput[]) {
  const youj = readFileSync(YOUJ_CSS, 'utf8')
  const ui = readFileSync(UI_CSS, 'utf8')
  // Physical light and shade, which shadows and edges mix toward and away from.
  const light = Object.fromEntries(['yj-light', 'yj-shade'].map((name) => [name, new RegExp(`--${name}: ([^;]+);`).exec(youj)![1]!]))
  return new Map(
    themes.map((t) => {
      const roles = parseRoles(youj, t)
      const rest = parseTokens(ui, t)
      return [t.id!, { ...roles, bridge: { ...rest.bridge, ...light, ...roles.bridge } }] as const
    }),
  )
}

/** The Color collection: every role in the order youj.css declares them, then the few colours that are not roles yet. */
export function kitColors(themes: readonly ThemeInput[]): KitColor[] {
  const byTheme = themeTokens(themes)
  const first = byTheme.values().next().value!
  const ids = themes.map((t) => t.id!)
  const perTheme = (fn: (tokens: Tokens, theme: ThemeInput) => Rgba): ColorValue => ({
    values: Object.fromEntries(themes.map((t) => [t.id!, fn(byTheme.get(t.id!)!, t)])),
  })

  const roles = (theme: ThemeInput, mode: Mode) => deriveRoles(theme, mode)
  const rolePaint = (role: Role, mode: Mode): ColorValue =>
    perTheme((_, t) => {
      const { color, alpha } = roles(t, mode)[role]
      return linearToRgba(oklchToLinear(color), alpha)
    })

  const out: KitColor[] = ROLES.map((role) => {
    // A role youj.css writes as another role (--color-focus: var(--color-accent)) is that role's alias.
    const declared = first.bridge[`color-${role}`]
    const target = declared && /^var\(--color-([\w-]+)\)$/.exec(declared)?.[1]
    const aliased = target && (ROLES as readonly string[]).includes(target) ? ({ alias: `role/${target}` } as ColorValue) : null
    return {
      name: `role/${role}`,
      css: `--color-${role}`,
      source: declared ? `youj.css: ${describeValue(declared)}` : 'youj.css: derived from the theme contract',
      role: roleOf(role),
      light: aliased ?? rolePaint(role, 'light'),
      dark: aliased ?? rolePaint(role, 'dark'),
    }
  })

  // The selected key's edge in Classic's tracks: the field border in light (3:1 against the track), the filled control's edge in dark.
  const keyEdge = MODES.map((mode) => describeValue(forMode(first.bridge['ui--key-edge']!, mode)))
  out.push({
    name: 'ui/key-edge',
    css: '--ui--key-edge',
    source: `ui.css: ${keyEdge[0]} (light), ${keyEdge[1]} (dark)`,
    role: 'line',
    light: perTheme((tokens) => paint(tokens, 'light', 'var(--ui--key-edge)')),
    dark: perTheme((tokens) => paint(tokens, 'dark', 'var(--ui--key-edge)')),
  })

  out.push(...bezelColors(themes, byTheme))

  const effects = effectColors(themes, byTheme)
  for (const c of out) for (const mode of MODES) check(c, mode, ids)
  return [...out, ...effects.colors]
}

/* ── Bezel ────────────────────────────────────────────────────────────────
 * The bezel style's own colours, read from bezel.css: its helpers (the well,
 * the secondary pill's hover and ring, the track's key, the footer band) from the block that
 * declares them, and the mixes its recipes write inline, each checked to
 * still be in the file. Resolved per theme and mode like ui.css's mixes. */

const squash = (css: string) => css.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')')

/** The helpers that stay private: well, field, key, control and line-control are public roles now. */
export const BEZEL_HELPERS = ['well-hover', 'field-hover', 'secondary-hover', 'secondary-ring', 'key-ring', 'band', 'popover', 'dialog', 'capsule'] as const

/** Mixes written inline in bezel.css's recipes: [kit name, what it paints, the expression as the file has it]. */
export const BEZEL_MIXES: [string, string, string][] = [
  ['bezel/edge', 'the off switch’s inner edge and the key cap’s foot', 'color-mix(in oklab, var(--color-fg) 8%, transparent)'],
  ['bezel/knob-on', 'the switch knob, on', 'color-mix(in oklab, var(--color-surface) calc(100% - 100% * var(--yj-dark)), var(--color-fg))'],
  ['bezel/meter', 'the progress fill (neutral ink)', 'color-mix(in oklab, var(--color-fg) 82%, var(--color-surface))'],
  ['bezel/rail-edge', 'the slider rail’s inner edge', 'color-mix(in oklab, var(--color-fg) 6%, transparent)'],
  ['bezel/knob-ring', 'the slider knob’s outer ring', 'color-mix(in oklab, var(--color-fg) 22%, transparent)'],
]

/** The card's sections step lighter downward: section n mixes n steps of fg into the card. */
export const BEZEL_SECTION = 'color-mix(in oklab, var(--color-fg) calc(var(--bz-section-step) * var(--bz-section, 0)), var(--color-surface))'
export const BEZEL_SECTIONS = 4

/** A helper's value as bezel.css declares it. */
function bezelDeclared(name: string): string {
  const m = new RegExp(`--${name}: ([^;]+);`).exec(squash(readFileSync(BEZEL_CSS, 'utf8')))
  if (!m) throw new Error(`bezel.css: --${name} not found`)
  return m[1]!.trim()
}

function bezelColors(themes: readonly ThemeInput[], byTheme: Map<string, Tokens>): KitColor[] {
  const css = squash(readFileSync(BEZEL_CSS, 'utf8'))
  const declared = bezelDeclared
  const has = (expr: string) => {
    if (!css.includes(expr)) throw new Error(`bezel.css no longer has ${expr}; redraw the bezel colour that reads it`)
    return expr
  }
  // A helper can read another (exported or not), so every helper bezel.css declares resolves beside ui.css's bridge, by its first declaration.
  const helpers: Record<string, string> = {}
  for (const [, name, value] of css.matchAll(/--(bz-[\w-]+): ([^;]+);/g)) helpers[name!] ??= value!.trim()
  const withHelpers = (tokens: Tokens): Tokens => ({ ...tokens, bridge: { ...tokens.bridge, ...helpers } })
  const make = (name: string, css: string, source: string, expr: (theme: ThemeInput) => string): KitColor => {
    const value = (mode: Mode): ColorValue => ({ values: Object.fromEntries(themes.map((t) => [t.id!, paint(withHelpers(byTheme.get(t.id!)!), mode, expr(t))])) })
    return { name, css, source: `bezel.css: ${source}`, role: roleOf(name.slice('bezel/'.length)), light: value('light'), dark: value('dark') }
  }
  const out: KitColor[] = BEZEL_HELPERS.map((h) => make(`bezel/${h}`, `--bz-${h}`, `--bz-${h}`, () => declared(`bz-${h}`)))
  const step = declared('bz-section-step')
  has(BEZEL_SECTION)
  for (let n = 1; n <= BEZEL_SECTIONS; n++)
    out.push(make(`bezel/section-${n}`, '', `a card's section ${n} below the head, ${n} × --bz-section-step of fg into the card`, () => BEZEL_SECTION.replace('var(--bz-section-step)', step).replace('var(--bz-section, 0)', String(n))))
  const inks: Record<string, string> = { 'bezel/badge-success': 'success-text', 'bezel/badge-warning': 'warning-text', 'bezel/badge-danger': 'danger-text' }
  for (const [name, what, expr] of BEZEL_MIXES) {
    has(expr)
    out.push(make(name, '', what, () => (inks[name] ? expr.replace('currentColor', `var(--color-${inks[name]})`) : expr)))
  }
  return out
}

function check(c: KitColor, mode: Mode, ids: string[]) {
  const v = c[mode]
  if ('values' in v && ids.some((id) => !v.values[id])) throw new Error(`${c.name}: missing a theme in ${mode}`)
}

/* ── Effects ──────────────────────────────────────────────────────────────
 * The elevation shadows and the field focus halo. Each layer's colour gets
 * its own variable, so an effect style follows the theme and the mode. */

interface ShadowLayerSpec {
  inset: boolean
  x: string
  y: string
  blur: string
  spread: string
  color: string
}

/** Splits a box-shadow list on top-level commas. */
function layersOf(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')') depth--
    else if (value[i] === ',' && depth === 0) {
      out.push(value.slice(from, i).trim())
      from = i + 1
    }
  }
  out.push(value.slice(from).trim())
  return out
}

/** Splits on top-level spaces (a calc() stays whole). */
function wordsOf(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of value.trim()) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ' ' && depth === 0) {
      if (current) out.push(current)
      current = ''
    } else current += ch
  }
  if (current) out.push(current)
  return out
}

/** A box-shadow list as layers: four lengths (numbers or calc()s over the contract) and a colour. */
export function parseShadow(value: string): ShadowLayerSpec[] {
  return layersOf(value).map((layer) => {
    const words = wordsOf(layer)
    const inset = words[0] === 'inset'
    const [x, y, blur, spread, ...color] = inset ? words.slice(1) : words
    if (!x || !y || !blur || !spread || !color.length) throw new Error(`cannot read shadow layer "${layer}"`)
    return { inset, x, y, blur, spread, color: color.join(' ') }
  })
}

/** A shadow length for `theme`: its calc() evaluated over the contract and the bridge's --ui--shadow-step. */
export function shadowLength(expr: string, tokens: Tokens, theme: ThemeInput): number {
  const { stroke } = resolveTheme(theme)
  const vars = { ...contractVars(theme, 'light'), 'yj-stroke-width': `${stroke.width}px`, 'ui--shadow-step': tokens.bridge['ui--shadow-step']! }
  return evalCss(expr, vars)
}

/** oklch() whose channels are calc()s over the contract, e.g. --ui-shadow-color. */
function evalOklch(expr: string, vars: Record<string, string>): { lch: [number, number, number]; alpha: number } {
  const body = /^oklch\((.*)\)$/.exec(substitute(expr, vars).trim())?.[1]
  if (!body) throw new Error(`not an oklch(): ${expr}`)
  // Channels are separated by top-level spaces, alpha by a top-level slash.
  const parts: string[] = []
  let alpha: string | undefined
  let depth = 0
  let current = ''
  for (const ch of body) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth === 0 && (ch === ' ' || ch === '/')) {
      if (current) (alpha === '' ? (alpha = current) : parts.push(current))
      if (ch === '/') alpha = ''
      current = ''
    } else current += ch
  }
  if (current) (alpha === '' ? (alpha = current) : parts.push(current))
  if (parts.length !== 3) throw new Error(`oklch() needs three channels: ${expr}`)
  const [l, c, h] = parts.map((p) => evalCss(p)) as [number, number, number]
  return { lch: [l, c, h], alpha: alpha ? evalCss(alpha) : 1 }
}

function contractVars(theme: ThemeInput, mode: Mode): Record<string, string> {
  const { neutral } = resolveTheme(theme)
  const { soft, hard } = SHADOW[resolveTheme(theme).shadow]
  return {
    'yj-dark': mode === 'dark' ? '1' : '0',
    'yj-neutral-hue': String(neutral.hue),
    'yj-neutral-chroma': String(neutral.chroma),
    'yj-shadow-soft': String(soft),
    'yj-shadow-hard': String(hard),
  }
}

/** A colour as OKLCH and alpha: an oklch(), a var() of one, or a colour-mix of either with transparent. */
function layerOklch(expr: string, bridge: Record<string, string>, vars: Record<string, string>): { lch: [number, number, number]; alpha: number } {
  const ref = /^var\(--([\w-]+)\)$/.exec(expr)?.[1]
  if (ref) return layerOklch(bridge[ref]!, bridge, vars)
  if (expr.startsWith('oklch(')) return evalOklch(expr, vars)
  const mix = /^color-mix\(in oklab, (var\(--[\w-]+\)) (.+), transparent\)$/.exec(expr)
  if (!mix) throw new Error(`cannot read shadow colour ${expr}`)
  const base = layerOklch(mix[1]!, bridge, vars)
  const share = evalCss(mix[2]!.replace(/%/g, ''), vars) / 100
  return { lch: base.lch, alpha: base.alpha * share }
}

/** A shadow layer's colour: --color-shadow (or the edge highlight) mixed with transparent; the hard block's ink from the palette. */
function layerColor(tokens: Tokens, theme: ThemeInput, mode: Mode, expr: string): Rgba {
  if (expr === 'var(--ui--shadow-ink)') return paint(tokens, mode, expr)
  const { lch, alpha } = layerOklch(expr, tokens.bridge, contractVars(theme, mode))
  return linearToRgba(oklchToLinear(lch), alpha)
}

const SHADOWS = ['xs', 'sm', 'md', 'lg'] as const

function effectColors(themes: readonly ThemeInput[], byTheme: Map<string, Tokens>) {
  const first = byTheme.values().next().value!
  const colors: KitColor[] = []
  const effects: KitEffect[] = []
  const add = (name: string, source: string, fn: (tokens: Tokens, theme: ThemeInput, mode: Mode) => Rgba) => {
    if (colors.some((c) => c.name === name)) return
    const value = (mode: Mode): ColorValue => ({
      values: Object.fromEntries(themes.map((t) => [t.id!, fn(byTheme.get(t.id!)!, t, mode)])),
    })
    colors.push({ name, css: '', source, role: 'effect', light: value('light'), dark: value('dark') })
  }

  const firstTheme = themes[0]!
  for (const size of SHADOWS) {
    const css = `--ui-shadow-${size}`
    const specs = parseShadow(first.bridge[`ui-shadow-${size}`]!)
    const soft = specs.filter((s) => s.color !== 'var(--ui--edge-highlight)' && s.color !== 'var(--ui--shadow-ink)')
    let drop = 0
    const layers = specs.map((spec) => {
      const edge = spec.color === 'var(--ui--edge-highlight)'
      // The hard block: a solid offset in ink, as far as the theme's stroke and shadow style put it (0 in a soft theme).
      const hard = spec.color === 'var(--ui--shadow-ink)'
      const name = edge ? 'effect/edge-highlight' : hard ? 'effect/shadow-ink' : `effect/shadow-${size}${soft.length > 1 ? `-${++drop}` : ''}`
      const source = edge ? 'the inner top highlight (a lit edge on grey chips in light, a faint one in dark)' : hard ? 'the hard block’s ink (hard-shadow themes)' : 'shadow colour at this layer’s alpha'
      add(name, `ui.css: ${hard ? '--ui--shadow-ink' : css}, ${source}`, (tokens, theme, mode) => layerColor(tokens, theme, mode, spec.color))
      const px = (expr: string) => shadowLength(expr, first, firstTheme)
      return {
        inset: spec.inset,
        x: px(spec.x),
        y: px(spec.y),
        blur: px(spec.blur),
        spread: px(spec.spread),
        color: name,
        ...(hard ? { offset: `shadow/hard-${size}` } : {}),
      }
    })
    effects.push({
      name: `Shadow/${size}`,
      css,
      description: `shadow-${size}: ${soft.length} soft layer${soft.length > 1 ? 's' : ''} tinted with the theme's neutral hue, and a hard block for hard-shadow themes`,
      layers,
    })
  }

  // The xs shadow's soft layer on its own (--ui--shadow-xs-soft), under Bezel's raised pills and keys.
  const [soft] = parseShadow(first.bridge['ui--shadow-xs-soft']!)
  add('effect/shadow-xs-soft', 'ui.css: --ui--shadow-xs-soft, shadow colour at this layer’s alpha', (tokens, theme, mode) => layerColor(tokens, theme, mode, soft!.color))
  const px = (expr: string) => shadowLength(expr, first, firstTheme)
  const xsSoft = { inset: false, x: px(soft!.x), y: px(soft!.y), blur: px(soft!.blur), spread: px(soft!.spread), color: 'effect/shadow-xs-soft' }
  // The key's lit top edge (bezel.css --bz-key-edge): faint white, lost on the white key in light, the dark mode's edge in dark.
  add('effect/key-edge', 'bezel.css: --bz-key-edge, the selected key’s lit top edge', (tokens, theme, mode) => {
    const { lch, alpha } = layerOklch(bezelDeclared('bz-key-edge'), tokens.bridge, contractVars(theme, mode))
    return linearToRgba(oklchToLinear(lch), alpha)
  })

  // The field focus halo, from ui.css's focus-field utility: the ring colour at 22%.
  for (const [name, ring] of [
    ['effect/focus-halo', 'color-focus'],
    ['effect/focus-halo-invalid', 'color-danger'],
  ] as const) {
    add(name, `ui.css: focus-field, color-mix(in oklab, var(--${ring}) 22%, transparent)`, (tokens, _, mode) =>
      paint(tokens, mode, `color-mix(in oklab, var(--${ring}) 22%, transparent)`),
    )
  }
  return { colors, effects, xsSoft }
}

/** The effect styles: elevation plus the two focus treatments (ui.css's focus-ring and focus-field). */
export function kitEffects(themes: readonly ThemeInput[]): KitEffect[] {
  const byTheme = themeTokens(themes)
  const { effects, xsSoft } = effectColors(themes, byTheme)
  const css = readFileSync(UI_CSS, 'utf8')
  const px = (name: string) => evalCss(new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1] ?? '0')
  const width = px('ui--focus-width')
  const offset = px('ui--focus-offset')
  const halo = px('ui--focus-halo')
  const edge = { inset: true, x: 0, y: 1, blur: 0, spread: 0, color: 'effect/edge-highlight' }
  return [
    ...effects,
    {
      name: 'Focus/ring',
      css: 'focus-ring',
      description: `Discrete controls: a ${width}px ring outline offset ${offset}px. Drawn as a page-coloured gap under the ring, since Figma has no outline offset.`,
      layers: [
        { inset: false, x: 0, y: 0, blur: 0, spread: offset, color: 'role/canvas' },
        { inset: false, x: 0, y: 0, blur: 0, spread: offset + width, color: 'role/focus' },
      ],
    },
    {
      name: 'Focus/field',
      css: 'focus-field',
      description: `Text fields: the border turns ring inside a soft ${halo}px halo.`,
      layers: [{ inset: false, x: 0, y: 0, blur: 0, spread: halo, color: 'effect/focus-halo' }],
    },
    {
      name: 'Focus/field invalid',
      css: 'focus-field',
      description: `An invalid text field in focus: a destructive border and a ${halo}px destructive halo.`,
      layers: [{ inset: false, x: 0, y: 0, blur: 0, spread: halo, color: 'effect/focus-halo-invalid' }],
    },
    // Bezel's lifts (bezel.css): shadow-xs-soft, the xs shadow's soft layer, and a lit top edge.
    {
      name: 'Bezel/lift',
      css: 'box-shadow: var(--ui--shadow-xs-soft), inset 0 1px 0 0 var(--ui--edge-highlight)',
      description: 'Bezel: a lifted pill (the secondary button): the xs shadow’s soft layer and a lit top edge, no hard block.',
      layers: [xsSoft, edge],
    },
    {
      name: 'Bezel/key',
      css: 'box-shadow: 0 0 0 1px var(--bz-key-ring), var(--ui--shadow-xs-soft), inset 0 1px 0 0 var(--bz-key-edge)',
      description: 'Bezel: the selected key in a track (tabs, segmented and toggle groups), white in light and a lit step in dark: a ring at the field border’s strength in light (3:1 against the track), the soft lift and a faint lit top edge.',
      layers: [{ inset: false, x: 0, y: 0, blur: 0, spread: 1, color: 'bezel/key-ring' }, xsSoft, { ...edge, color: 'effect/key-edge' }],
    },
  ]
}
