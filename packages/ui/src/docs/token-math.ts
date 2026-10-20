import { contrast, oklchToLinear, type LinearRgb } from '@youj/core/lib/youj/theme/color'
import { deriveChart, derivePalette, deriveRoles, graphite, PALETTE_TOKENS, themeVars, type ThemeInput } from '@youj/core/lib/youj/theme'

/* Resolves the ui token bridge (ui.css) against a theme's derived youj
 * palette, so the contrast test and the Tokens page do the same arithmetic on
 * the same values, for any preset. The palette comes from derive.ts, the JS
 * mirror of youj.css, with the chart palette the theme draws: its own, or
 * the one drawn from its accent, as a browser that can derive computes it.
 * Handles what the bridge uses: var() chains, oklch(), and
 * color-mix(in oklab, …) against a color or transparent, with percentages
 * that may select by mode through var(--yj-dark) or scale by a number from
 * the theme contract (the stroke ink, the shadow factors). */

export type Theme = 'light' | 'dark'
type Lab = [number, number, number]
export type Paint = { lab: Lab; alpha: number }

export const PAGES = ['canvas', 'surface', 'raised'] as const

function declarations(block: string) {
  const out: Record<string, string> = {}
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[name!] = value!.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim()
  return out
}

function blockAfter(css: string, marker: string) {
  const start = css.indexOf('{', css.indexOf(marker)) + 1
  let depth = 1
  let i = start
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  return css.slice(start, i - 1)
}

const BRIDGE_BLOCK = ':root,\n  [data-theme],\n  [data-yj-theme],\n  [data-yj-tone] {'

/**
 * `css` is ui.css, optionally followed by youj.css: ui.css's helper block is
 * the bridge, and when youj.css's roles block (section 3c) is there too its
 * roles resolve beside it, against the derived palette of `theme`. `info`,
 * derived beside the other inks in section 3, comes from deriveRoles.
 */
export function parseTokens(css: string, theme: ThemeInput = graphite) {
  if (!css.includes(BRIDGE_BLOCK)) throw new Error('ui.css: bridge block not found')
  const palette = (mode: Theme) => {
    const p = derivePalette(theme, mode)
    // youj.css's --yj-chart-N-color: the theme's own palette, or the one drawn from its accent.
    const chart = deriveChart(theme, mode).flatMap((c, i) => (c ? [[`yj-chart-${i + 1}-color`, c] as const] : []))
    // The raised step has no role; youj.css keeps it as the private --yj-raised under overlay, well and key.
    return Object.fromEntries([...PALETTE_TOKENS.map((t) => [`color-${t}`, p[t]] as const), ['yj-raised', p.raised] as const, ...chart]) as Record<string, [number, number, number]>
  }
  // The contract's plain numbers (a complete theme writes every one), for percentages that read them.
  const vars = themeVars({ ...theme, id: theme.id ?? 'theme' })
  // The highlight's ink switch is 0 on the page (youj.css :root); an ink overlay turns it on in its own scope.
  const contract = Object.fromEntries([['--yj-cursor-ink', '0'], ...Object.entries(vars).filter(([, v]) => /^-?[\d.]+$/.test(v))])
  const tokens = {
    palette: { light: palette('light'), dark: palette('dark') },
    bridge: declarations(blockAfter(css, BRIDGE_BLOCK)),
    themeInline: declarations(blockAfter(css, '@theme inline {')),
    contract,
  }
  if (css.includes('--yj-paper:')) {
    for (const mode of ['light', 'dark'] as const) tokens.palette[mode]['color-info'] = deriveRoles(theme, mode).info.color
    Object.assign(tokens.bridge, declarations(blockAround(css, '--yj-paper:')))
  }
  return tokens
}

export type Tokens = ReturnType<typeof parseTokens>

/** The block that holds `marker` (the innermost one), without its braces. */
function blockAround(css: string, marker: string) {
  const at = css.indexOf(marker)
  if (at < 0) throw new Error(`youj.css: ${marker} not found`)
  return blockAfter(css.slice(css.lastIndexOf('{', at) - 1), '{')
}

/** The roles alone, from youj.css: parseTokens wants a bridge block to read, so a stub stands in for ui.css. */
export const parseRoles = (youjCss: string, theme: ThemeInput = graphite): Tokens => parseTokens(`${BRIDGE_BLOCK}\n}\n${youjCss}`, theme)

const lchToLab = ([l, c, h]: [number, number, number]): Lab => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)]
const labToRgb = ([l, a, b]: Lab): LinearRgb => oklchToLinear([l, Math.hypot(a, b), (Math.atan2(b, a) * 180) / Math.PI])

/** Splits a function's arguments on top-level commas. */
function args(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '(') depth++
    else if (body[i] === ')') depth--
    else if (body[i] === ',' && depth === 0) {
      out.push(body.slice(from, i).trim())
      from = i + 1
    }
  }
  out.push(body.slice(from).trim())
  return out
}

/** Evaluates + - * / and parentheses over plain numbers. */
function arithmetic(src: string): number {
  const tokens = src.match(/\d*\.?\d+|[-+*/()]/g) ?? []
  let i = 0
  const primary = (): number => {
    const t = tokens[i++]
    if (t === '(') {
      const v = sum()
      i++
      return v
    }
    if (t === '-') return -primary()
    return Number(t)
  }
  const product = (): number => {
    let v = primary()
    while (tokens[i] === '*' || tokens[i] === '/') v = tokens[i++] === '*' ? v * primary() : v / primary()
    return v
  }
  const sum = (): number => {
    let v = product()
    while (tokens[i] === '+' || tokens[i] === '-') v = tokens[i++] === '+' ? v + product() : v - product()
    return v
  }
  return sum()
}

/** Evaluates a percentage or calc() of percentages, with var(--yj-dark) as 0 (light) or 1 (dark) and contract numbers (var(--yj-stroke-ink)…) from the theme. */
function percent(expr: string, theme: Theme, contract: Record<string, string> = {}): number {
  const src = expr
    .replace(/var\(--yj-dark\)/g, theme === 'dark' ? '1' : '0')
    .replace(/var\((--yj-[\w-]+)\)/g, (m, name: string) => contract[name] ?? m)
    .replace(/calc/g, '')
    .replace(/%/g, '')
  if (!/^[\d\s.+\-*/()]+$/.test(src)) throw new Error(`cannot evaluate ${expr}`)
  return arithmetic(src) / 100
}

/** A color argument: `<colour> <percentage>?`, the percentage a trailing N% or calc(…). */
function splitStop(arg: string): [colour: string, pct: string | null] {
  // The last top-level word is the stop when it is a percentage or a calc(); a nested color-mix's own trailing calc() is not.
  let depth = 0
  let space = -1
  for (let i = 0; i < arg.length; i++) {
    if (arg[i] === '(') depth++
    else if (arg[i] === ')') depth--
    else if (arg[i] === ' ' && depth === 0) space = i
  }
  if (space < 0) return [arg, null]
  const stop = arg.slice(space + 1)
  return /^(calc\(.*\)|[\d.]+%)$/.test(stop) ? [arg.slice(0, space).trim(), stop] : [arg, null]
}

export function resolvePaint(tokens: Tokens, theme: Theme, value: string): Paint {
  const v = value.trim()
  const ref = v.match(/^var\(--([\w-]+)(?:, (.+))?\)$/)
  if (ref) {
    const [, name, fallback] = ref as unknown as [string, string, string | undefined]
    const lch = tokens.palette[theme][name]
    if (lch) return { lab: lchToLab(lch), alpha: 1 }
    if (tokens.themeInline[name]) return resolvePaint(tokens, theme, tokens.themeInline[name]!)
    if (tokens.bridge[name]) return resolvePaint(tokens, theme, tokens.bridge[name]!)
    if (fallback) return resolvePaint(tokens, theme, fallback)
    throw new Error(`unresolved ${v} (${theme})`)
  }
  const mix = v.match(/^color-mix\((.*)\)$/)
  if (mix) {
    const [space, first, second] = args(mix[1]!)
    if (space !== 'in oklab' || !first || !second) throw new Error(`cannot resolve ${v}`)
    const [colourA, pctA] = splitStop(first)
    const p = pctA ? percent(pctA, theme, tokens.contract) : 0.5
    const a = resolvePaint(tokens, theme, colourA)
    if (second === 'transparent') return { lab: a.lab, alpha: a.alpha * p }
    const b = resolvePaint(tokens, theme, splitStop(second)[0])
    if (p === 1) return a
    if (p === 0) return b
    return { lab: a.lab.map((x, i) => x * p + b.lab[i]! * (1 - p)) as Lab, alpha: a.alpha * p + b.alpha * (1 - p) }
  }
  throw new Error(`cannot resolve ${v}`)
}

/* Browsers composite translucent colors in gamma-encoded sRGB. */
const encode = (v: number) => {
  const x = Math.min(1, Math.max(0, v))
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
}
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
function over(paint: Paint, backdrop: LinearRgb): LinearRgb {
  const rgb = labToRgb(paint.lab)
  return rgb.map((v, i) => decode(encode(v) * paint.alpha + encode(backdrop[i]!) * (1 - paint.alpha))) as LinearRgb
}

/** Contrast of `text` on `fill`, with translucent layers composited over the given page surface. */
export function ratio(tokens: Tokens, theme: Theme, text: string, fill: string, page: (typeof PAGES)[number]) {
  const backdrop = labToRgb(resolvePaint(tokens, theme, `var(--color-${page})`).lab)
  const bg = over(resolvePaint(tokens, theme, fill), backdrop)
  const fg = over(resolvePaint(tokens, theme, text), bg)
  return contrast(fg, bg)
}

/** The lowest ratio across every page surface: the number a pair has to clear. */
export function worstRatio(tokens: Tokens, theme: Theme, text: string, fill: string) {
  return Math.min(...PAGES.map((page) => ratio(tokens, theme, text, fill, page)))
}

/** The branch of a mode-selecting color-mix that applies in `theme`, else the value itself. */
export function forMode(value: string, theme: Theme): string {
  const v = value.trim()
  const mix = v.match(/^color-mix\((.*)\)$/)
  if (!mix) return v
  const [, first, second] = args(mix[1]!)
  if (!first || !second) return v
  const [colourA, pctA] = splitStop(first)
  if (!pctA?.includes('var(--yj-dark)')) return v
  const p = percent(pctA, theme)
  return p === 1 ? colourA : p === 0 ? splitStop(second)[0] : v
}

/** `var(--color-fg)` → `fg`, `color-mix(in oklab, var(--color-fg) 6%, transparent)` → `fg 6%`. */
export function describeValue(value: string): string {
  const v = value.trim()
  const ref = v.match(/^var\(--(?:color-)?([\w-]+)\)$/)
  if (ref) return ref[1]!
  const chart = v.match(/^var\(--yj-(chart-\d)-color, (.+)\)$/)
  if (chart) return `the theme's ${chart[1]}, or one drawn from its accent (older browsers: ${describeValue(chart[2]!)})`
  const inked = v.match(/^color-mix\(in oklab, (.+) calc\(100% - 100% \* var\(--yj-stroke-ink\)\), var\(--color-fg\)\)$/)
  if (inked) return `${describeValue(inked[1]!)}, toward fg by the stroke ink`
  const action = v.match(/^color-mix\(in oklab, (.+) calc\(100% - 100% \* var\(--yj-action-ink\)\), (.+)\)$/)
  if (action) return `${describeValue(action[1]!)}, or ${describeValue(action[2]!)} when actions are ink`
  const mix = v.match(/^color-mix\(in oklab, (.+?) (\d+)%, (.+)\)$/)
  if (mix) return mix[3] === 'transparent' ? `${describeValue(mix[1]!)} ${mix[2]}%` : `${describeValue(mix[1]!)} ${mix[2]}% + ${describeValue(mix[3]!)}`
  return v
}

/** Text-on-fill pairs the bridge introduces; each must clear 4.5:1 on every page surface. */
export const TEXT_PAIRS: [text: string, fill: string][] = [
  ['var(--color-fg)', 'var(--color-canvas)'],
  ['var(--color-fg)', 'var(--color-surface)'],
  ['var(--color-fg)', 'var(--color-overlay)'],
  ['var(--color-on-accent)', 'var(--color-accent)'],
  ['var(--color-on-action)', 'var(--color-action)'],
  ['var(--color-fg)', 'var(--color-hover)'],
  ['var(--color-fg-muted)', 'var(--color-band)'],
  ['var(--color-fg-muted)', 'var(--color-canvas)'],
  ['var(--color-fg-muted)', 'var(--color-surface)'],
  ['var(--color-fg-muted)', 'var(--color-overlay)'],
  ['var(--color-fg-subtle)', 'var(--color-canvas)'],
  ['var(--color-fg-subtle)', 'var(--color-surface)'],
  ['var(--color-fg-subtle)', 'var(--color-overlay)'],
  ['var(--color-fg)', 'var(--color-hover)'],
  ['var(--color-on-accent)', 'var(--color-danger)'],
  ['var(--color-danger)', 'var(--color-canvas)'],
  ['var(--color-danger)', 'var(--color-surface)'],
  ['var(--color-danger)', 'var(--color-overlay)'],
  ['var(--color-fg)', 'var(--color-chrome)'],
  ['var(--color-on-accent)', 'var(--color-accent)'],
  ['var(--color-fg)', 'var(--color-hover)'],
  ['var(--color-accent-text)', 'color-mix(in oklab, var(--color-accent) 10%, transparent)'],
  ['var(--color-success-text)', 'color-mix(in oklab, var(--color-success) 10%, transparent)'],
  ['var(--color-warning-text)', 'color-mix(in oklab, var(--color-warning) 10%, transparent)'],
  ['var(--color-danger-text)', 'color-mix(in oklab, var(--color-danger) 10%, transparent)'],
]

/** Control boundaries and state marks the components draw; each must clear 3:1 (WCAG 1.4.11). */
export const BOUNDARY_PAIRS: [what: string, mark: string, against: string][] = [
  ['focus ring', 'var(--color-focus)', 'var(--color-canvas)'],
  ['focus ring on a card', 'var(--color-focus)', 'var(--color-surface)'],
  ['focus ring in a popover', 'var(--color-focus)', 'var(--color-overlay)'],
  ['field border', 'var(--color-line-control)', 'var(--color-canvas)'],
  ['field border on a card', 'var(--color-line-control)', 'var(--color-surface)'],
  ['field border in a popover', 'var(--color-line-control)', 'var(--color-overlay)'],
  ['checkbox / radio / switch-track boundary', 'var(--color-fg-subtle)', 'var(--color-canvas)'],
  ['checkbox / radio / switch-track boundary on a card', 'var(--color-fg-subtle)', 'var(--color-surface)'],
  ['switch thumb on the off track', 'var(--color-key)', 'var(--color-fg-subtle)'],
  ['switch thumb on the on track', 'var(--color-key)', 'var(--color-accent)'],
  ['on state (primary) against the page', 'var(--color-accent)', 'var(--color-canvas)'],
  ['scrollbar thumb, pointer on the region', 'var(--ui-scrollbar-thumb-hover)', 'var(--color-canvas)'],
  ['scrollbar thumb on a card, pointer on the region', 'var(--ui-scrollbar-thumb-hover)', 'var(--color-surface)'],
  ['scrollbar thumb in a popover, pointer on the region', 'var(--ui-scrollbar-thumb-hover)', 'var(--color-overlay)'],
]
