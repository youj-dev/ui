import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { themeVars, type ThemeInput } from '@youj/core/lib/youj/theme'
import type { KitNumber, KitTextStyle, KitThemeNumber } from '../kit'
import { BEZEL_CSS, parseShadow, shadowLength, themeTokens, UI_CSS } from './colors'
import { evalCss } from './css-math'

/* Sizes, read from the CSS that defines them: radius and control heights from
 * ui.css's derivation over the theme contract, the type scale from ui.css and
 * Tailwind's theme, spacing from Tailwind's --spacing. */

const require = createRequire(import.meta.url)
export const TAILWIND_THEME_CSS = require.resolve('tailwindcss/theme.css')

/** Every value `--name` is declared with, in source order. */
function declared(css: string, name: string): string[] {
  const out: string[] = []
  const re = new RegExp(`--${name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:\\s*([^;]+);`, 'g')
  for (const m of css.matchAll(re)) out.push(m[1]!.replace(/\s+/g, ' ').trim())
  return out
}

function first(css: string, name: string): string {
  const v = declared(css, name)[0]
  if (v === undefined) throw new Error(`--${name} is not declared`)
  return v
}

/** The derived declaration: the formula over the contract, not @theme's documented default. */
function derived(css: string, name: string): string {
  const v = declared(css, name).find((d) => d.includes('var(--yj-'))
  if (!v) throw new Error(`--${name} has no derived declaration`)
  return v
}

const contract = (theme: ThemeInput) => {
  const vars = themeVars({ ...theme, id: theme.id ?? 'theme' })
  return {
    'yj-radius': vars['--yj-radius']!,
    'yj-pill': vars['--yj-pill']!,
    'yj-density': vars['--yj-density']!,
    // The kit is drawn for a fine pointer: coarse pointers add 8px in code.
    'yj-touch': '0',
  }
}

const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
const CONTROLS = [
  ['xs', 'spacing-control-xs'],
  ['sm', 'spacing-control-sm'],
  ['default', 'spacing-control'],
  ['lg', 'spacing-control-lg'],
] as const

/** Radius, control heights and density: numbers that change with the theme. */
export function themeNumbers(themes: readonly ThemeInput[]): KitThemeNumber[] {
  const css = readFileSync(UI_CSS, 'utf8')
  const per = (expr: string) => Object.fromEntries(themes.map((t) => [t.id!, evalCss(expr, contract(t))]))
  return [
    ...RADII.map((r) => ({
      name: `radius/${r}`,
      css: `--radius-${r}`,
      source: `ui.css: ${derived(css, `radius-${r}`)}`,
      scope: 'radius' as const,
      values: per(derived(css, `radius-${r}`)),
    })),
    {
      name: 'radius/full',
      css: 'rounded-full',
      source: 'Tailwind: rounded-full, for intrinsic pills (badges, switches, avatars)',
      scope: 'radius',
      values: Object.fromEntries(themes.map((t) => [t.id!, 9999])),
    },
    ...CONTROLS.map(([name, prop]) => ({
      name: `control/${name}`,
      css: `--${prop}`,
      source: `ui.css: ${derived(css, prop)} (fine pointer)`,
      scope: 'size' as const,
      values: per(derived(css, prop)),
    })),
    {
      name: 'density',
      css: '--yj-density',
      source: 'theme contract: compact −1, default 0, comfortable +1 (4px per step)',
      scope: 'none',
      values: Object.fromEntries(themes.map((t) => [t.id!, Number(contract(t)['yj-density'])])),
    },
    ...hardShadowOffsets(themes),
    ...bezelNumbers(themes),
  ]
}

/** The control shapes (ui.css's family tokens, which Bezel and Classic both read): the button corner (a pill, square in a square theme, or the control radius where a theme rounds its controls), the key inside a choice track, the badge (chip), the field's radius and a multi-line field's, and a menu row inside its panel. The Figma names keep their bezel/ prefix. */
function bezelNumbers(themes: readonly ThemeInput[]): KitThemeNumber[] {
  const ui = readFileSync(UI_CSS, 'utf8')
  const bezel = readFileSync(BEZEL_CSS, 'utf8')
  // The formulas the family tokens are built from, substituted as written (css-math expands them).
  const live = (name: string) => {
    const v = declared(ui, name).find((d) => d.includes('var('))
    if (!v) throw new Error(`--${name} has no derived declaration`)
    return v
  }
  const FORMULAS = ['ui--k-xs', 'ui--k-sm', 'ui--k', 'ui--k-lg', 'ui--pill-button', 'ui--pill-field', 'ui--pill-choice', 'ui--pill-chip', 'radius-xl', 'radius-2xl', 'radius-control', 'radius-button', 'radius-field', 'radius-field-area', 'radius-choice', 'radius-chip', 'radius-overlay']
  const vars = (t: ThemeInput) => ({ ...Object.fromEntries(FORMULAS.map((n) => [n, live(n)])), ...contract(t), 'ui--choice-inset': '3px' })
  const shapes: KitThemeNumber[] = (
    [
      ['bezel/pill', 'radius-button', 'buttons: a pill, square in a square theme, or the control radius where the theme rounds its controls'],
      ['bezel/badge-radius', 'radius-chip', 'badges and chips: the control corner at their 22px height'],
      ['bezel/field-radius', 'radius-field', 'fields, at the same corner as a control of their height'],
      ['bezel/field-area-radius', 'radius-field-area', 'a field that grows past one line (Textarea, a wrapping TagInput): the field corner capped at 12px'],
    ] as const
  ).map(([name, prop, what]) => {
    const expr = live(prop)
    return { name, css: `--${prop}`, source: `ui.css: ${expr}, ${what}`, scope: 'radius' as const, values: Object.fromEntries(themes.map((t) => [t.id!, evalCss(expr, vars(t))])) }
  })
  // A track's keys and a menu's rows sit inside it, at the concentric radius.
  const key = 'max(0px, calc(var(--radius-choice) - var(--ui--choice-inset)))'
  const row = 'calc(var(--radius-overlay) - 5px)'
  for (const [what, expr] of [['the track key radius', key], ['the menu row radius', row]] as const)
    if (!bezel.includes(`border-radius: ${expr};`)) throw new Error(`bezel.css: ${what} ${expr} not found`)
  return [
    ...shapes,
    { name: 'bezel/key-radius', css: '', source: `bezel.css: ${key}, a track's key 3px inside it`, scope: 'radius', values: Object.fromEntries(themes.map((t) => [t.id!, evalCss(key, vars(t))])) },
    { name: 'bezel/menu-row-radius', css: '', source: `bezel.css: ${row}, a menu row inside its 5px-padded panel`, scope: 'radius', values: Object.fromEntries(themes.map((t) => [t.id!, Math.max(0, evalCss(row, vars(t)))])) },
  ]
}

/** How far each shadow's hard block sits from its box, per theme: 0 in a soft or flat theme. The effect styles bind their offsets to these. */
function hardShadowOffsets(themes: readonly ThemeInput[]): KitThemeNumber[] {
  const byTheme = themeTokens(themes)
  return (['xs', 'sm', 'md', 'lg'] as const).map((size) => {
    const bridge = byTheme.values().next().value!.bridge
    const hard = parseShadow(bridge[`ui-shadow-${size}`]!).find((l) => l.color === 'var(--ui--shadow-ink)')
    if (!hard) throw new Error(`--ui-shadow-${size} has no hard block`)
    return {
      name: `shadow/hard-${size}`,
      css: `--ui-shadow-${size}`,
      source: `ui.css: the hard block's offset, ${hard.x} (stroke width × the shadow style's hard factor)`,
      scope: 'none' as const,
      values: Object.fromEntries(themes.map((t) => [t.id!, shadowLength(hard.x, byTheme.get(t.id!)!, t)])),
    }
  })
}

/** The first family of a CSS font list, as Figma names it ('Inter Variable' → Inter). */
export function familyOf(list: string): string {
  const head = list.split(',')[0]!.trim().replace(/^['"]|['"]$/g, '')
  return head.replace(/ Variable$/, '')
}

export function themeFonts(themes: readonly ThemeInput[]) {
  const fonts = (t: ThemeInput) => themeVars({ ...t, id: t.id ?? 'theme' })
  return (['sans', 'mono'] as const).map((key) => ({
    name: `font/${key}`,
    values: Object.fromEntries(themes.map((t) => [t.id!, familyOf(fonts(t)[`--yj-font-${key}`]!)])),
  }))
}

/** The docs site's type scale, where Youj Display's steps are defined (apps/docs/styles/site.css). */
const SITE_CSS = new URL('../../../../apps/docs/styles/site.css', import.meta.url)

/** The display steps: [Figma style name, --type-* step]. */
const DISPLAY_STEPS = [
  ['xl', 'display-xl'],
  ['l', 'display-l'],
  ['title', 'title'],
  ['heading', 'heading'],
  ['subheading', 'subheading'],
] as const

/** A display step as the site declares it: `400 clamp(min, fluid, max) / 1.1 var(--site-display)` or a fixed rem size. A fluid size is drawn at its max, the size at a desktop width. */
function displayStep(css: string, step: string): { size: number; lineHeight: number } {
  const decl = declared(css, `type-${step}`)[0]
  const m = decl && /^400 (?:clamp\([^,]+,[^,]+,\s*([\d.]+)rem\)|([\d.]+)rem) \/ ([\d.]+) var\(--site-display\)$/.exec(decl)
  if (!m) throw new Error(`site.css: --type-${step} is not "400 <size> / <leading> var(--site-display)": ${decl}`)
  const size = Number(m[1] ?? m[2]) * 16
  return { size, lineHeight: Math.round(size * Number(m[3]) * 100) / 100 }
}

const SPACING_STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32]

const UI_TEXT = ['ui-xs', 'ui-sm', 'ui', 'ui-lg'] as const
const TAILWIND_TEXT = ['base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const

/** Font size and line height, in px, for a text-* utility. */
export function textSize(name: string): { size: number; lineHeight: number } {
  const ui = readFileSync(UI_CSS, 'utf8')
  const tw = readFileSync(TAILWIND_THEME_CSS, 'utf8')
  const css = name.startsWith('ui') ? ui : tw
  const size = evalCss(first(css, `text-${name}`))
  const leading = first(css, `text-${name}--line-height`)
  // Tailwind's line heights are ratios; ui.css's are lengths.
  const lh = evalCss(leading)
  return { size, lineHeight: /rem|px/.test(leading) ? lh : Math.round(size * lh * 100) / 100 }
}

/** Theme-independent numbers: spacing, the type scale, the focus ring, the icon stroke. */
export function scaleNumbers(iconStroke: number): KitNumber[] {
  const ui = readFileSync(UI_CSS, 'utf8')
  const tw = readFileSync(TAILWIND_THEME_CSS, 'utf8')
  const unit = evalCss(first(tw, 'spacing'))
  const out: KitNumber[] = SPACING_STEPS.map((n) => ({
    name: `space/${String(n).replace('.', '-')}`,
    css: `calc(var(--spacing) * ${n})`,
    source: `Tailwind: p-${n}, gap-${n}, m-${n}… (${n} × ${unit}px)`,
    scope: 'gap',
    value: n * unit,
  }))
  for (const name of [...UI_TEXT, ...TAILWIND_TEXT]) {
    const { size, lineHeight } = textSize(name)
    out.push({ name: `text/${name}`, css: `--text-${name}`, source: `text-${name}`, scope: 'font-size', value: size })
    out.push({ name: `leading/${name}`, css: `--text-${name}--line-height`, source: `text-${name} line height`, scope: 'line-height', value: lineHeight })
  }
  const site = readFileSync(SITE_CSS, 'utf8')
  for (const [label, step] of DISPLAY_STEPS) {
    const { size, lineHeight } = displayStep(site, step)
    out.push({ name: `text/display-${label}`, css: '', source: `site.css: type-${step}, Youj Display`, scope: 'font-size', value: size })
    out.push({ name: `leading/display-${label}`, css: '', source: `site.css: type-${step} line height`, scope: 'line-height', value: lineHeight })
  }
  for (const [name, prop] of [
    ['focus/width', 'ui--focus-width'],
    ['focus/offset', 'ui--focus-offset'],
    ['focus/halo', 'ui--focus-halo'],
  ] as const) {
    out.push({ name, css: `--${prop}`, source: `ui.css: focus-ring and focus-field`, scope: 'stroke', value: evalCss(first(ui, prop)) })
  }
  out.push({ name: 'stroke/icon', css: 'strokeWidth', source: 'Youj icons: stroke width in the 24-unit box (default 1.5)', scope: 'stroke', value: iconStroke })
  return out
}

const tracking = (tw: string, name: string) => Math.round(evalCss(first(tw, `tracking-${name}`).replace('em', '')) * 1000) / 10

/** The text styles: the UI scale the components use, display sizes for headings, body copy and mono. */
export function textStyles(): KitTextStyle[] {
  const tw = readFileSync(TAILWIND_THEME_CSS, 'utf8')
  const tight = tracking(tw, 'tight')
  const wide = tracking(tw, 'wide')
  const styles: KitTextStyle[] = []
  const add = (name: string, text: string, family: KitTextStyle['family'], weight: KitTextStyle['weight'], classes: string, extra: Partial<KitTextStyle> = {}) => {
    const { size, lineHeight } = textSize(text)
    styles.push({ name, token: text, family, weight, size, lineHeight, tracking: 0, upper: false, classes, ...extra })
  }
  const WEIGHTS = { Regular: 400, Medium: 500, Semibold: 600 } as const
  const UI: [string, string, (keyof typeof WEIGHTS)[]][] = [
    ['xs', 'ui-xs', ['Regular', 'Medium']],
    ['sm', 'ui-sm', ['Regular', 'Medium', 'Semibold']],
    ['base', 'ui', ['Regular', 'Medium', 'Semibold']],
    ['lg', 'ui-lg', ['Regular', 'Medium', 'Semibold']],
  ]
  for (const [label, text, weights] of UI) {
    for (const w of weights) add(`UI/${label}/${w}`, text, 'sans', WEIGHTS[w], `text-${text}${w === 'Regular' ? '' : ` font-${w.toLowerCase()}`}`)
  }
  add('UI/xs/Caps', 'ui-xs', 'sans', 500, 'text-ui-xs font-medium uppercase tracking-wide', { upper: true, tracking: wide })
  add('Body/base', 'base', 'sans', 400, 'text-base')
  add('Body/lg', 'lg', 'sans', 400, 'text-lg')
  for (const size of ['lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const) {
    add(`Heading/${size}`, size, 'sans', 600, `text-${size} font-semibold tracking-tight`, { tracking: tight })
  }
  // Youj Display, the site's brand face (apps/docs/styles/site.css): one weight, a hair of open tracking, no bolder or slanted cut.
  const site = readFileSync(SITE_CSS, 'utf8')
  const displayTracking = Math.round(evalCss(first(site, 'type-display-tracking').replace('em', '')) * 1000) / 10
  for (const [label, step] of DISPLAY_STEPS) {
    const { size, lineHeight } = displayStep(site, step)
    styles.push({ name: `Display/${label}`, token: `display-${label}`, family: 'display', weight: 400, size, lineHeight, tracking: displayTracking, upper: false, classes: `site.css: type-${step}` })
  }
  add('Mono/xs', 'ui-xs', 'mono', 400, 'font-mono text-ui-xs')
  add('Mono/sm', 'ui-sm', 'mono', 400, 'font-mono text-ui-sm')
  add('Mono/base', 'ui', 'mono', 400, 'font-mono text-ui')
  add('Mono/base/Medium', 'ui', 'mono', 500, 'font-mono text-ui font-medium')
  // Bezel's two voices (bezel.css): the mono capital eyebrow over figures, fields and sections, and the card head's title.
  const bezel = readFileSync(BEZEL_CSS, 'utf8')
  const em = (re: RegExp) => {
    const m = re.exec(bezel)
    if (!m) throw new Error(`bezel.css: ${re} not found`)
    return Math.round(Number(m[1]) * 1000) / 10
  }
  add('Bezel/Eyebrow', 'ui-xs', 'mono', 500, 'bezel.css: [data-slot=eyebrow], font-mono text-ui-xs font-medium uppercase', { upper: true, tracking: em(/--bz-eyebrow-tracking:\s*([\d.]+)em/) })
  add('Bezel/Title', 'lg', 'sans', 500, 'bezel.css: card and dialog titles, 1.125rem / 1.75rem at the heading weight', {
    tracking: em(/\[data-slot='card-header'\] > \[data-slot='card-title'\]& \{[^}]*letter-spacing:\s*(-?[\d.]+)em/),
  })
  return styles
}
