import { contrast, inGamut, linearToOklab, mixOklab, oklchToLinear, over, parseColor, type LinearRgb, type Oklch } from './color'
import { ACTIONS, BAR_TONES, CHART_SERIES, CHROME_TONES, CONTROLS, CONTROL_SIZE, FIELDS, isPerMode, MOTION_PERSONALITIES, OVERLAY_TONES, PAGE, RADIUS, SHADOW, THEME_COLORS, type ThemeInput, type ToneInput } from './contract'
import { deriveChart, derivePalette, deriveRoles, MIN_CONTRAST, PALETTE_TOKENS, ROLE_INKS, toneMode, type Mode, type Palette, type PaletteToken, type Role, type RolePaint, type Tone } from './derive'

/* Guardrails. checkTheme derives both modes and holds every pair the library
 * draws to WCAG 2 AA: text 4.5:1, control boundaries (field borders, focus
 * ring) and the chart colors 3:1. A pair that misses is an error, like
 * an input it can't use, unless the theme sets `allowLowContrast`. The
 * derivation guarantees the neutral pairs (fg-subtle ≥ 4.5:1 and field
 * borders ≥ 3:1 for any valid neutral) and lifts or darkens accent, status
 * and chart colors until they pass, so for derived colors issues mostly
 * mean an input is out of range or unreadable; the contrast errors are the
 * backstop should a derivation ever regress. Colors given per mode
 * (`{ light, dark }`) are used as given, so there the contrast checks are the
 * guardrail itself: each side is held to the same pairs. */

export interface ThemeIssue {
  /**
   * `error`: the theme can't be applied as written, or a pair misses WCAG AA.
   * `warning`: it applies but fails a softer check (out of sRGB gamut, or a
   * contrast failure the theme accepts with `allowLowContrast`).
   */
  level: 'error' | 'warning'
  code: 'invalid' | 'range' | 'contrast' | 'distinct' | 'gamut'
  mode?: Mode
  /** The token (or input field) at fault. */
  token: string
  /** For contrast issues: what it was measured against. */
  against?: string
  ratio?: number
  min?: number
  message: string
}

const SURFACES = ['canvas', 'surface', 'raised'] as const

/** Text colors, each on every surface. */
const TEXT = ['fg', 'fg-muted', 'fg-subtle', 'accent', 'success', 'warning', 'danger'] as const satisfies readonly PaletteToken[]

/** An ink as soft-badge text: 80% of it with 20% fg, on its own 10% tint (ui.css --color-*-ink). */
const TINTED = ['accent', 'success', 'warning', 'danger'] as const

export const NEUTRAL_LIMITS = { chroma: [0, 0.04], wash: [0, 1], lift: [0, 1] } as const

/** The surface gradient's range: 0 is flat, 1 the most a card lightens toward its foot. */
export const SURFACE_LIMITS = { gradient: [0, 1] } as const

/** The ranges the character fields are drawn well in: below 0.5px a line vanishes, past 4px it's a frame. */
export const CHARACTER_LIMITS = {
  strokeWidth: [0.5, 4],
  ink: [0, 1],
  icons: [0.5, 2],
  weight: [100, 900],
  tracking: [-0.1, 0.3],
} as const

/** A font stack goes into a stylesheet and an inline style: nothing that could end the declaration or the rule, and quotes and brackets that close. */
function isSafeFont(value: string) {
  if (/[;{}<>]/.test(value)) return false
  const stack: string[] = []
  let quote = ''
  for (const ch of value) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') stack.push(ch === '(' ? ')' : ']')
    else if (ch === ')' || ch === ']') {
      if (stack.pop() !== ch) return false
    }
  }
  return !quote && stack.length === 0
}

function validate(theme: ThemeInput): ThemeIssue[] {
  const issues: ThemeIssue[] = []
  const invalid = (token: string, message: string) => issues.push({ level: 'error', code: 'invalid', token, message })
  const n = theme.neutral
  if (n) {
    if (!Number.isFinite(n.hue)) invalid('neutral.hue', 'neutral.hue must be a number of degrees.')
    const [cmin, cmax] = NEUTRAL_LIMITS.chroma
    if (!Number.isFinite(n.chroma) || n.chroma < cmin || n.chroma > cmax)
      issues.push({ level: 'error', code: 'range', token: 'neutral.chroma', message: `neutral.chroma must be between ${cmin} and ${cmax}; contrast is only guaranteed in that range.` })
    const wash = n.wash ?? 0
    if (!Number.isFinite(wash) || wash < 0 || wash > 1)
      issues.push({ level: 'error', code: 'range', token: 'neutral.wash', message: 'neutral.wash must be between 0 and 1.' })
    const lift = n.lift ?? 0
    if (!Number.isFinite(lift) || lift < 0 || lift > 1)
      issues.push({ level: 'error', code: 'range', token: 'neutral.lift', message: 'neutral.lift must be between 0 and 1.' })
    if (n.page !== undefined && !(n.page in PAGE)) invalid('neutral.page', `neutral.page must be one of ${Object.keys(PAGE).join(', ')}.`)
  }
  const readable = (token: string, label: string, value: unknown) => {
    if (typeof value !== 'string' || !parseColor(value))
      invalid(token, `${label} "${String(value)}" isn't a color youj can read (use hex, rgb(), hsl(), oklch(), oklab() or color()).`)
  }
  // A color, or a { light, dark } pair: each side is read like a color of its own.
  for (const key of THEME_COLORS) {
    const value: unknown = theme[key]
    if (value === undefined) continue
    if (isPerMode(value)) for (const mode of ['light', 'dark'] as const) readable(`${key}.${mode}`, `${key}.${mode}`, value[mode])
    else if (typeof value === 'string') readable(key, key, value)
    else invalid(key, `${key} must be a CSS color, or { light, dark } with one for each mode.`)
  }
  const palette = (token: string, value: unknown) => {
    if (!Array.isArray(value) || value.length !== CHART_SERIES) invalid(token, `${token} must list ${CHART_SERIES} colors, one for each series.`)
    else value.forEach((colour, i) => readable(`${token}.${i + 1}`, `${token} color ${i + 1}`, colour))
  }
  const chart: unknown = theme.chart
  if (chart !== undefined) {
    if (isPerMode(chart)) for (const mode of ['light', 'dark'] as const) palette(`chart.${mode}`, chart[mode])
    else palette('chart', chart)
  }
  if (theme.radius !== undefined && !(theme.radius in RADIUS)) invalid('radius', `radius must be one of ${Object.keys(RADIUS).join(', ')}.`)
  if (theme.controlSize !== undefined && !(theme.controlSize in CONTROL_SIZE)) invalid('controlSize', `controlSize must be one of ${Object.keys(CONTROL_SIZE).join(', ')}.`)
  if (theme.motionPersonality !== undefined && !(MOTION_PERSONALITIES as readonly string[]).includes(theme.motionPersonality))
    invalid('motionPersonality', `motionPersonality must be one of ${MOTION_PERSONALITIES.join(', ')}.`)
  for (const key of ['sans', 'mono', 'display'] as const) {
    const value = theme.fonts?.[key]
    if (value !== undefined && !value.trim()) invalid(`fonts.${key}`, `fonts.${key} is empty.`)
    else if (value !== undefined && !isSafeFont(value)) invalid(`fonts.${key}`, `fonts.${key} must be a font-family list: no ; { } < >, and balanced quotes and brackets.`)
  }
  const range = (token: string, value: number | undefined, [min, max]: readonly [number, number], unit = '') => {
    if (value !== undefined && (!Number.isFinite(value) || value < min || value > max))
      issues.push({ level: 'error', code: 'range', token, message: `${token} must be between ${min}${unit} and ${max}${unit}.` })
  }
  range('stroke.width', theme.stroke?.width, CHARACTER_LIMITS.strokeWidth, 'px')
  range('stroke.ink', theme.stroke?.ink, CHARACTER_LIMITS.ink)
  range('stroke.icons', theme.stroke?.icons, CHARACTER_LIMITS.icons)
  range('headings.weight', theme.headings?.weight, CHARACTER_LIMITS.weight)
  range('headings.tracking', theme.headings?.tracking, CHARACTER_LIMITS.tracking, 'em')
  range('labels.tracking', theme.labels?.tracking, CHARACTER_LIMITS.tracking, 'em')
  range('surfaces.gradient', theme.surfaces?.gradient, SURFACE_LIMITS.gradient)
  if (theme.shadow !== undefined && !(theme.shadow in SHADOW)) invalid('shadow', `shadow must be one of ${Object.keys(SHADOW).join(', ')}.`)
  // An ink action is text color lettered in the page color: the fg-on-canvas pair checked below, so it needs no pair of its own.
  if (theme.actions !== undefined && !(theme.actions in ACTIONS)) invalid('actions', `actions must be one of ${Object.keys(ACTIONS).join(', ')}.`)
  if (theme.controls !== undefined && !(theme.controls in CONTROLS)) invalid('controls', `controls must be one of ${Object.keys(CONTROLS).join(', ')}.`)
  if (theme.fields !== undefined && !(theme.fields in FIELDS)) invalid('fields', `fields must be one of ${Object.keys(FIELDS).join(', ')}.`)
  if (theme.tone?.chrome !== undefined && !CHROME_TONES.includes(theme.tone.chrome)) invalid('tone.chrome', `tone.chrome must be one of ${CHROME_TONES.join(', ')}.`)
  if (theme.tone?.bars !== undefined && !BAR_TONES.includes(theme.tone.bars)) invalid('tone.bars', `tone.bars must be one of ${BAR_TONES.join(', ')}.`)
  if (theme.tone?.overlays !== undefined && !OVERLAY_TONES.includes(theme.tone.overlays)) invalid('tone.overlays', `tone.overlays must be one of ${OVERLAY_TONES.join(', ')}.`)
  if (theme.labels?.case !== undefined && !['none', 'upper'].includes(theme.labels.case)) invalid('labels.case', 'labels.case must be none or upper.')
  if (theme.labels?.font !== undefined && !['sans', 'mono'].includes(theme.labels.font)) invalid('labels.font', 'labels.font must be sans or mono.')
  return issues
}

function checkMode(palette: Palette, chart: (Oklch | null)[], mode: Mode, allowLowContrast: boolean): ThemeIssue[] {
  const issues: ThemeIssue[] = []
  const rgb = (t: PaletteToken) => oklchToLinear(palette[t])
  const need = (token: string, against: string, fg: LinearRgb, bg: LinearRgb, min: number) => {
    const ratio = contrast(fg, bg)
    if (ratio + 1e-9 < min)
      issues.push({
        level: allowLowContrast ? 'warning' : 'error',
        code: 'contrast',
        mode,
        token,
        against,
        ratio: Number(ratio.toFixed(2)),
        min,
        message: `${mode}: ${token} on ${against} is ${ratio.toFixed(2)}:1, below ${min}:1.`,
      })
  }
  for (const surface of SURFACES) {
    for (const text of TEXT) need(text, surface, rgb(text), rgb(surface), 4.5)
    need('input', surface, rgb('input'), rgb(surface), 3)
    for (const ink of TINTED) {
      const tint = over(rgb(ink), 0.1, rgb(surface))
      const inkText = oklchToLinear(mixOklab(palette[ink], palette.fg, 0.8))
      need(`${ink}-ink`, `${ink} 10% on ${surface}`, inkText, tint, 4.5)
    }
  }
  need('accent-contrast', 'accent', rgb('accent-contrast'), rgb('accent'), 4.5)
  need('accent-contrast', 'danger', rgb('accent-contrast'), rgb('danger'), 4.5)
  // Chart colors are marks: 3:1 on every surface they're drawn on, the theme's own or those drawn from its accent.
  const series = chart.flatMap((c, i) => (c ? [[`chart-${i + 1}`, oklchToLinear(c)] as const] : []))
  for (const [token, value] of series) for (const surface of SURFACES) need(token, surface, value, rgb(surface), MIN_CONTRAST.mark)
  for (const token of PALETTE_TOKENS) {
    if (!inGamut(rgb(token), 0.002))
      issues.push({ level: 'warning', code: 'gamut', mode, token, message: `${mode}: ${token} is outside sRGB and will be clipped; lower the chroma or wash.` })
  }
  for (const [token, value] of series) {
    if (!inGamut(value, 0.002)) issues.push({ level: 'warning', code: 'gamut', mode, token, message: `${mode}: ${token} is outside sRGB and will be clipped; lower its chroma.` })
  }
  return issues
}

/* The role matrix: every text-on-surface pair a role implies, held to the
 * same bars (text 4.5:1, marks and boundaries 3:1), for each tone a theme can
 * draw chrome and overlays in. A role whose formula cannot hold its pairs for
 * every legal input is a bug in the formula, not something a component works
 * around. checkTheme runs it, so it gates what Create, the MCP server and the
 * CLI export, two-tone themes included. */

/** The tones a theme can wear, each as the `tone` it sets: the matrix is run under every one. */
export const TONE_VARIANTS = [
  { name: 'match', tone: { chrome: 'match', overlays: 'content' } },
  { name: 'chrome dark', tone: { chrome: 'dark', overlays: 'content' } },
  { name: 'chrome light', tone: { chrome: 'light', overlays: 'content' } },
  { name: 'chrome dark, overlays chrome', tone: { chrome: 'dark', overlays: 'chrome' } },
  { name: 'chrome dark, bars top, overlays chrome', tone: { chrome: 'dark', bars: 'top', overlays: 'chrome' } },
  { name: 'chrome dark, bars content, overlays chrome', tone: { chrome: 'dark', bars: 'content', overlays: 'chrome' } },
  { name: 'chrome dark, bars content, overlays ink', tone: { chrome: 'dark', bars: 'content', overlays: 'ink' } },
  { name: 'chrome light, bars content, overlays ink', tone: { chrome: 'light', bars: 'content', overlays: 'ink' } },
] as const satisfies readonly { name: string; tone: ToneInput }[]

const TEXT_ROLES = ['fg', 'fg-muted', 'fg-subtle'] as const satisfies readonly Role[]

/**
 * The surfaces that carry text, each with the tone scope it lives in (none:
 * the page's own). Every one carries all three text roles: a label on a key or
 * a control is as likely muted (a count, a hint) as a card's.
 */
const TEXT_SURFACES: readonly (readonly [Role, Tone | undefined])[] = [
  ['canvas', undefined],
  ['surface', undefined],
  ['overlay', 'overlay'],
  ['well', undefined],
  ['field', undefined],
  ['key', undefined],
  ['control', undefined],
  ['chrome', 'chrome'],
  ['chrome', 'header'],
  ['chrome-float', 'chrome'],
  ['chrome-float', 'float'],
  ['inverse', 'inverse'],
]

/**
 * How much ink a card's deepest section (the fourth) mixes into the card: four
 * steps of Bezel's --bz-section-step (bezel.css; ui-tokens.test.ts holds the
 * two together). The lightest ground text sits on inside a card in dark.
 */
export const CARD_SECTION_INK: Record<'light' | 'dark', number> = { light: 0, dark: 4 * 0.018 }

/** A role flattened onto a backdrop. */
const flatten = ({ color, alpha }: RolePaint, backdrop: LinearRgb) => over(oklchToLinear(color), alpha, backdrop)

/** A color's OKLab lightness, for the perceptual floors. */
const lightness = (rgb: LinearRgb) => linearToOklab(rgb)[0]

/** How far apart (OKLab lightness) two fills that must read as different have to be. */
export const MIN_DISTINCT = 0.01

/**
 * The role contrast matrix for a theme: in each mode and under each tone,
 * fg, fg-muted and fg-subtle on every surface (4.5:1) and fg and fg-muted on a selected row, on the card and on its deepest section (4.5:1); each ink's text on its
 * own tint over the page and the card (4.5:1); on-accent on every ink and
 * on-action on action, and on-cursor and on-cursor-muted on a menu's highlighted row
 * (4.5:1); line-control against the fields and planes it
 * borders and focus against every surface (3:1); and the fills that must read
 * apart from each other (hover from the card, selected from hover, cursor from the overlay, well from
 * the card, chrome-float from the page). The theme's own `tone` is replaced by
 * each of TONE_VARIANTS in turn. Errors, or warnings under `allowLowContrast`.
 */
export function checkRoles(theme: ThemeInput): ThemeIssue[] {
  const allow = theme.allowLowContrast === true
  const issues: ThemeIssue[] = []
  for (const variant of TONE_VARIANTS) {
    for (const mode of ['light', 'dark'] as const) {
      const themed = { ...theme, tone: variant.tone }
      const scopes = new Map<Tone | undefined, ReturnType<typeof deriveRoles>>()
      const at = (tone: Tone | undefined) => {
        if (!scopes.has(tone)) scopes.set(tone, deriveRoles(themed, mode, tone))
        return scopes.get(tone)!
      }
      const label = `${mode}, tone ${variant.name}`
      const need = (token: string, against: string, fg: LinearRgb, bg: LinearRgb, min: number) => {
        const ratio = contrast(fg, bg)
        if (ratio + 1e-9 < min)
          issues.push({
            level: allow ? 'warning' : 'error',
            code: 'contrast',
            mode,
            token,
            against,
            ratio: Number(ratio.toFixed(2)),
            min,
            message: `${label}: ${token} on ${against} is ${ratio.toFixed(2)}:1, below ${min}:1.`,
          })
      }
      const distinct = (token: string, against: string, a: LinearRgb, b: LinearRgb) => {
        const delta = Math.abs(lightness(a) - lightness(b))
        if (delta + 1e-9 < MIN_DISTINCT)
          issues.push({
            level: allow ? 'warning' : 'error',
            code: 'distinct',
            mode,
            token,
            against,
            ratio: Number(delta.toFixed(4)),
            min: MIN_DISTINCT,
            message: `${label}: ${token} is not distinct from ${against} (ΔL ${delta.toFixed(4)}, below ${MIN_DISTINCT}).`,
          })
      }
      // Text on every surface, in the tone scope the surface is drawn in.
      for (const [surface, tone] of TEXT_SURFACES) {
        const roles = at(tone)
        const fill = oklchToLinear(roles[surface].color)
        for (const text of TEXT_ROLES) need(text, surface, oklchToLinear(roles[text].color), fill, 4.5)
      }
      // A menu's highlighted row and its hints, as drawn on the overlay.
      const menu = at('overlay')
      const highlight = flatten(menu.cursor, oklchToLinear(menu.overlay.color))
      for (const text of ['on-cursor', 'on-cursor-muted'] as const) need(text, 'cursor', oklchToLinear(menu[text].color), highlight, 4.5)
      distinct('cursor', 'overlay', highlight, oklchToLinear(menu.overlay.color))
      const page = at(undefined)
      const [canvas, surface] = [oklchToLinear(page.canvas.color), oklchToLinear(page.surface.color)]
      // A card's deepest section is the lightest ground in a card in dark, and a selected row sits on it: text holds there too. fg-subtle is for hints and stays off a selected row.
      const section = oklchToLinear(mixOklab(page.fg.color, page.surface.color, CARD_SECTION_INK[mode]))
      for (const text of TEXT_ROLES) need(text, 'card section 4', oklchToLinear(page[text].color), section, 4.5)
      for (const [against, ground] of [['surface', surface], ['card section 4', section]] as const)
        for (const text of ['fg', 'fg-muted'] as const) need(text, `selected on ${against}`, oklchToLinear(page[text].color), flatten(page.selected, ground), 4.5)
      for (const ink of ROLE_INKS) {
        const text = oklchToLinear(page[`${ink}-text`].color)
        for (const [name, plane] of [['surface', surface], ['canvas', canvas]] as const)
          need(`${ink}-text`, `${ink}-subtle on ${name}`, text, flatten(page[`${ink}-subtle`], plane), 4.5)
        need('on-accent', ink, oklchToLinear(page['on-accent'].color), oklchToLinear(page[ink].color), 4.5)
      }
      need('on-action', 'action', oklchToLinear(page['on-action'].color), oklchToLinear(page.action.color), 4.5)
      const control = oklchToLinear(page['line-control'].color)
      for (const against of ['canvas', 'surface', 'field', 'well'] as const) need('line-control', against, control, oklchToLinear(page[against].color), 3)
      // The focus ring, on every surface, in the tone scope the surface is drawn in.
      for (const [against, tone] of TEXT_SURFACES) {
        const roles = at(tone)
        need('focus', against, oklchToLinear(roles.focus.color), oklchToLinear(roles[against].color), 3)
      }
      for (const n of [1, 2, 3, 4, 5] as const) need(`chart-${n}`, 'surface', oklchToLinear(page[`chart-${n}`].color), surface, MIN_CONTRAST.mark)
      // Fills that must read apart from each other, as drawn on the card.
      const hover = flatten(page.hover, surface)
      distinct('hover', 'surface', hover, surface)
      distinct('selected', 'hover', flatten(page.selected, surface), hover)
      distinct('well', 'surface', oklchToLinear(page.well.color), surface)
      // On a white page (light) the page and the white plane are one color: a floating bar is told from it by its shadow and line, not its fill.
      const float = at('float')
      const whitePage = theme.neutral?.page === 'white' && toneMode(themed, 'float', mode) === 'light'
      if (!whitePage) distinct('chrome-float', 'canvas', oklchToLinear(float['chrome-float'].color), oklchToLinear(float.canvas.color))
    }
  }
  return issues
}

/**
 * Every problem with a theme: unreadable or out-of-range inputs, and any pair
 * the library draws, palette or role, that misses WCAG AA in light or dark mode (errors, or
 * warnings when the theme sets `allowLowContrast`). An empty list means the
 * theme passes.
 */
export function checkTheme(input: ThemeInput): ThemeIssue[] {
  const theme = input
  const issues = validate(theme)
  if (issues.some((i) => i.level === 'error')) return issues
  const allow = theme.allowLowContrast === true
  return [...(['light', 'dark'] as const).flatMap((mode) => checkMode(derivePalette(theme, mode), deriveChart(theme, mode), mode, allow)), ...checkRoles(theme)]
}

/** The issues that block a theme: unusable inputs and, unless it sets `allowLowContrast`, AA contrast failures. */
export function themeErrors(theme: ThemeInput): ThemeIssue[] {
  return checkTheme(theme).filter((i) => i.level === 'error')
}

const warned = new Set<string>()

// Read NODE_ENV through globalThis so apps without @types/node still typecheck
// a registry copy of this file.
const isDev = () => {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env !== undefined && env.NODE_ENV !== 'production'
}

/**
 * Logs a theme's AA failures and unusable inputs, once per distinct theme, in
 * development only. YoujProvider and ThemeScope call it. Errors (unusable
 * inputs, AA failures) go to console.error; contrast failures the theme
 * accepts with `allowLowContrast` to console.warn. Gamut notes are left to
 * checkTheme, so a live editor sweeping the chroma stays quiet.
 */
export function warnTheme(theme: ThemeInput) {
  if (!isDev()) return
  const key = JSON.stringify(theme)
  if (warned.has(key)) return
  warned.add(key)
  const issues = checkTheme(theme).filter((i) => i.level === 'error' || i.code === 'contrast')
  if (!issues.length) return
  const label = theme.name ?? theme.id ?? 'custom theme'
  const list = (items: ThemeIssue[]) => items.map((i) => `  - ${i.message}`).join('\n')
  const errors = issues.filter((i) => i.level === 'error')
  const accepted = issues.filter((i) => i.level === 'warning')
  if (errors.length) {
    const aa = errors.some((i) => i.code === 'contrast') ? '\nFix the colors, or set allowLowContrast: true on the theme to accept the contrast failures.' : ''
    console.error(`[youj] ${label} has ${errors.length} theme error(s):\n${list(errors)}${aa}`)
  }
  if (accepted.length) console.warn(`[youj] ${label} misses WCAG AA in ${accepted.length} pair(s), accepted with allowLowContrast:\n${list(accepted)}`)
}
