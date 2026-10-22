import type { CSSProperties } from 'react'
import type { MotionPersonality } from '../tokens'
import type { YoujLook } from '../look'

/* The theme contract: the handful of inputs a theme defines. Everything else
 * (the neutral ramp, accent and status colors for both modes, the ui bridge,
 * focus ring, elevation tints, radius and control heights) is derived from
 * them in CSS (youj.css, ui.css), with derive.ts as the JS mirror. A
 * color can also be given per mode, `{ light, dark }`, when a derived
 * variant isn't the color you'd pick for that mode: it's then used as given.
 *
 * Beyond color, shape and type, a theme can set its character: how heavy and
 * how dark its lines are (stroke), how it shows depth (shadow) and shades its
 * surfaces, the voice of its headings and labels, and the colors of its
 * charts. All optional; unset, they are Basalt's (see DEFAULTS).
 *
 * In CSS the contract is a set of custom properties on :root or on any
 * element carrying a `data-yj-theme` attribute, plus `data-yj-motion` for the
 * motion personality. In JS it's a ThemeInput passed to YoujProvider or
 * ThemeScope, which writes the same properties. */

export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
/** The theme's control size: how tall controls draw. Not the provider's `density`, which is layout room. */
export type ControlSize = 'compact' | 'default' | 'comfortable'
/** `soft`: blurred, hue-tinted elevation. `hard`: solid offset shadows in ink, and buttons press into theirs. `none`: flat, borders only. */
export type ShadowStyle = 'soft' | 'hard' | 'none'
export type LabelCase = 'none' | 'upper'
export type LabelFont = 'sans' | 'mono'
/** `accent`: primary actions are filled with the accent. `ink`: with the text color, lettered in the page color, which leaves the accent to state, selection and data. */
export type ActionFill = 'accent' | 'ink'
/** `pill`: every control (buttons, fields, tab and toggle tracks, badges) gets fully round ends. `rounded`: the control radius instead, in proportion to each control's height. A square theme stays square either way. */
export type ControlShape = 'pill' | 'rounded'
/** `outlined`: a field is its fill on a 3:1 control edge. `soft`: a quiet filled band with no edge (focus and invalid still draw one). Every field (inputs, selects, textareas, the pickers) takes it; nothing sets it per field. */
export type FieldStyle = 'outlined' | 'soft'
/** Light mode's page. `gray`: a soft gray page under white cards, menus and fields, as apps are laid out. `white`: a white page with cards and code a soft gray step down from it, as documents are. Menus, dialogs and fields stay white either way. */
export type NeutralPage = 'gray' | 'white'

/** `match`: bars and islands (chrome) take the page's mode. `dark` / `light`: chrome is held to that mode whatever the page's, so a light page can have a dark sidebar and header. */
export type ChromeTone = 'match' | 'dark' | 'light'
/** `chrome`: bars attached to the frame (headers, sidebars, tab bars) take the chrome's mode, like the islands. `content`: they take the page's, so only floating chrome (islands, toolbars, docks, panels) is held to the chrome's mode: a light page keeps a light header and sidebar under dark islands. `top`: the top bar (an app header) takes the chrome's mode and the other bars (sidebars, tab bars) the page's: a dark header over a light sidebar. */
export type BarTone = 'chrome' | 'content' | 'top'
/** `content`: menus, dialogs and other overlays take the page's mode. `chrome`: they take the chrome's, so a dark chrome opens dark menus. `ink`: they take the page's mode, and the row under the pointer or the keyboard is filled with ink (the text colour) and lettered in the paper colour, a dark mark in a light menu. */
export type OverlayTone = 'content' | 'chrome' | 'ink'

/** Five colors for chart series 1 to 5, in order. */
export type ChartPalette = readonly [string, string, string, string, string]

/** One value for each mode. */
export interface PerMode<T> {
  light: T
  dark: T
}

/**
 * A theme color. One CSS color, whose light and dark variants are derived
 * (darkened for light surfaces, lifted for dark ones, until they pass AA); or
 * `{ light, dark }`, a color tuned by hand for each mode and used exactly as
 * given, because a light green in the dark wants a deeper green, not a darker
 * copy, on white. checkTheme holds both sides to AA all the same.
 */
export type ThemeColor = string | PerMode<string>

/** A chart palette: five colors derived for each mode, or `{ light, dark }` with five tuned by hand for each, used as given. */
export type ThemeChart = ChartPalette | PerMode<ChartPalette>

/** Whether a theme color or palette is a `{ light, dark }` pair. */
export function isPerMode<T>(value: T | PerMode<T> | null | undefined): value is PerMode<T> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'light' in value && 'dark' in value
}

export interface SurfacesInput {
  /** How far a card shades toward the raised step at its foot (lighter in dark, a touch deeper in light), with a sheen on ink-filled primary buttons, 0–1. 0 is flat. Default 0. */
  gradient?: number
}

export interface StrokeInput {
  /** Border width in px, 0.5–4. Every border, divider and separator draws at it; the focus ring is 1px heavier (2px at least). Default 1. */
  width?: number
  /** How far lines lean from the neutral line color toward the text color, 0–1. 0 is a quiet hairline, 1 draws them in ink. Default 0. */
  ink?: number
  /** Icon weight, 0.5–2: every icon's own stroke width times this. Default 1. */
  icons?: number
}

export interface HeadingsInput {
  /** The weight titles take (card, dialog and page titles set in `font-semibold`), 100–900. Default 600. */
  weight?: number
  /** Their letter spacing in em (titles set in `tracking-tight`). Default -0.025. */
  tracking?: number
}

export interface LabelsInput {
  /** `upper` sets labels (badges, column heads, field labels, group headings, tabs, keys) in capitals. Default 'none'. */
  case?: LabelCase
  /** `mono` sets them in the mono face. Default 'sans'. */
  font?: LabelFont
  /** Letter spacing in em. Default: 0.06 for capitals in sans, 0.02 in mono, else the text's own. */
  tracking?: number
}

export interface NeutralInput {
  /** Which way the grays lean: an OKLCH hue in degrees. Graphite: 270 (cool blue-gray). */
  hue: number
  /** How far they lean: the chroma of text and lines, 0–0.04. 0 is pure gray. Graphite: 0.012. */
  chroma: number
  /** How much of that tint washes over the page and surfaces, 0–1. 0 keeps them near-white (Graphite); 1 is tinted paper. Default 0. */
  wash?: number
  /** Dark mode: how far cards and raised surfaces stand above the page, 0–1. 0 keeps them close to it (Graphite); 1 makes them lit slabs, with lines and fg-subtle raised to keep their contrast. Light mode is unchanged. Default 0. */
  lift?: number
  /** Light mode: a soft `gray` page under white cards (an app), or a `white` page with cards and code a soft gray step down from it (a document). Dark mode is unchanged. Default 'gray'. */
  page?: NeutralPage
}

export interface ToneInput {
  /** The mode chrome (sidebar, headers, toolbars, islands, capsules) is drawn in. Default 'match'. */
  chrome?: ChromeTone
  /** Which bars attached to the frame follow the chrome's mode: all of them, none (`content`), or only the top bar (`top`); floating chrome always follows it. Default 'chrome'. */
  bars?: BarTone
  /** The mode overlays (menus, popovers, dialogs, sheets, toasts) are drawn in. Default 'content'. */
  overlays?: OverlayTone
}

export interface ThemeInput {
  /**
   * A slug, written to `data-yj-theme` and matching a preset stylesheet, e.g.
   * 'basalt'. Giving a theme an id makes it complete: fields it leaves out
   * take the defaults (Basalt's, the same a page with no theme wears). Without
   * one it's an override of the surrounding theme.
   */
  id?: string
  /** Display name. */
  name?: string
  /** One line on the theme's personality. */
  description?: string
  /** The palette this theme's colours came from (composeTheme): written to `data-yj-palette`. */
  palette?: string
  /** The style its form came from (composeTheme): written to `data-yj-style`. */
  style?: string
  /** The look its style pairs with. YoujProvider and ThemeScope write it as `data-yj-look` unless given a `look` of their own. */
  look?: YoujLook
  neutral?: NeutralInput
  /**
   * Any CSS color: its light and dark variants are derived so text in it
   * passes AA on every surface. Or `{ light, dark }`, one tuned by hand for
   * each mode and used as given (checkTheme still holds each to AA).
   * Default: Basalt's amber.
   */
  accent?: ThemeColor
  /** A CSS color or a `{ light, dark }` pair, like `accent`. Default: Basalt's. */
  success?: ThemeColor
  warning?: ThemeColor
  danger?: ThemeColor
  /** A fifth ink, for informational states (alerts, toasts, badges), like `accent`. Default: the accent. */
  info?: ThemeColor
  /** Corner scale. `md` is 6px, `lg` 8px and `xl` 10px on the 32px control; `full` makes controls pills. Default 'xl'. */
  radius?: RadiusScale
  /** Control heights: compact −4px, comfortable +4px from the 32px default. Not the provider's `density` (layout room). Default 'default'. */
  controlSize?: ControlSize
  /** CSS font-family lists. `display` is for titles; unset, they stay in `sans`. */
  fonts?: { sans?: string; mono?: string; display?: string }
  /** Timing: precise (default), calm (longer, softer, no overshoot) or lively (shorter, a touch of bounce). Not YoujProvider's `motion`, which switches animation on or off. */
  motionPersonality?: MotionPersonality
  /** Line weight, line color and icon weight. Default: a 1px neutral hairline, icons as drawn. */
  stroke?: StrokeInput
  /** How depth is drawn. Default 'soft'. */
  shadow?: ShadowStyle
  /** What fills a primary action (the default Button): the accent, or ink. Checkboxes, switches, sliders and other "on" states keep the accent either way. Default 'accent'. */
  actions?: ActionFill
  /** The shape of every control, in both looks (buttons and toggles, fields, tab and toggle tracks, badges and chips): pills, or `rounded` at the theme's control radius, scaled with each control's height. One family can be split off in CSS with `--yj-shape-button`, `-field`, `-choice` or `-chip` (1 pills, 0 rounded). Default 'rounded'. */
  controls?: ControlShape
  /** How every field is drawn: soft (a filled band with no edge: a label and the fill identify the field, and its boundary stays below WCAG 1.4.11's 3:1 until focus or an invalid value draws an edge) or outlined (the fill on a 3:1 edge, for fields that must stand out on their own). Default 'soft'. */
  fields?: FieldStyle
  /** How surfaces are shaded. Default: flat. */
  surfaces?: SurfacesInput
  /**
   * Five colors for data, chart series 1 to 5 (`--chart-1`…`--chart-5`). Any
   * CSS colors, each derived per mode like the accent (darkened in light,
   * lifted in dark) until it reads at 3:1 on every surface, the WCAG minimum
   * for marks. Dark mode lets them keep more chroma than text colors, so
   * neon series stay neon. Or `{ light, dark }`, five tuned by hand for each
   * mode and used as given (checkTheme still holds each to 3:1). Default: a
   * palette drawn from the accent, the accent then four hues around the wheel
   * from it, each at a lightness of its own and at 3:1 (derive.ts AUTO_CHART).
   */
  chart?: ThemeChart
  /**
   * Which mode chrome and overlays are drawn in. `{ chrome: 'dark' }` is a
   * two-tone theme: in light mode the page, cards and fields stay light while
   * the sidebar, headers and toolbars (and the buttons, inputs and tabs inside
   * them) are drawn as their dark selves. Default: both follow the page.
   */
  tone?: ToneInput
  /** Title weight and tracking. Default: semibold, tight. */
  headings?: HeadingsInput
  /** The voice of small labels. Default: as set, sentence case. */
  labels?: LabelsInput
  /**
   * Accept pairs that miss WCAG AA (text 4.5:1, control boundaries 3:1).
   * Off by default: checkTheme reports them as errors, the provider logs
   * them with console.error in development, and the MCP server, Create and
   * `youj create` refuse to export such a theme. Set it only when you
   * have checked the failing pairs aren't drawn in your app; they are then
   * warnings.
   */
  allowLowContrast?: boolean
}

/** A theme after defineTheme: validated shape, frozen. */
export type Theme = Readonly<ThemeInput>

export const RADIUS: Record<RadiusScale, string> = {
  none: '0rem',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.625rem',
  full: '1rem',
}

export const CONTROL_SIZE: Record<ControlSize, number> = { compact: -1, default: 0, comfortable: 1 }

/** Each shadow style as the two factors ui.css scales its elevation layers by. */
export const SHADOW: Record<ShadowStyle, { soft: number; hard: number }> = {
  soft: { soft: 1, hard: 0 },
  hard: { soft: 0, hard: 1 },
  none: { soft: 0, hard: 0 },
}

/** Each action fill as ui.css's --yj-action-ink: how far a primary action's fill moves from the accent to the text color. */
export const ACTIONS: Record<ActionFill, number> = { accent: 0, ink: 1 }

/** Each control shape as ui.css's --yj-pill: 1 draws pills, 0 the control radius. */
export const CONTROLS: Record<ControlShape, number> = { pill: 1, rounded: 0 }

/** Each field style as ui.css's --yj-field-soft: 1 draws soft fields, 0 outlined ones. */
export const FIELDS: Record<FieldStyle, number> = { outlined: 0, soft: 1 }

/** Each light page as youj.css's --yj-neutral-page: 1 swaps the page and card planes in light mode. */
export const PAGE: Record<NeutralPage, number> = { gray: 0, white: 1 }

export const CHROME_TONES = ['match', 'dark', 'light'] as const satisfies readonly ChromeTone[]
export const BAR_TONES = ['chrome', 'content', 'top'] as const satisfies readonly BarTone[]
export const OVERLAY_TONES = ['content', 'chrome', 'ink'] as const satisfies readonly OverlayTone[]

/**
 * Each tone as youj.css's switches: whether chrome is held to a mode (`fixed`)
 * and which (`dark`), whether the side bars and the top bar follow it
 * (`bars.side`, `bars.top`), and whether overlays
 * follow it (`chrome`) or fill their highlighted row with ink (`ink`).
 */
export const TONE: {
  chrome: Record<ChromeTone, { fixed: number; dark: number }>
  bars: Record<BarTone, { side: number; top: number }>
  overlays: Record<OverlayTone, { chrome: number; ink: number }>
} = {
  chrome: { match: { fixed: 0, dark: 0 }, dark: { fixed: 1, dark: 1 }, light: { fixed: 1, dark: 0 } },
  bars: { chrome: { side: 1, top: 1 }, content: { side: 0, top: 0 }, top: { side: 0, top: 1 } },
  overlays: { content: { chrome: 0, ink: 0 }, chrome: { chrome: 1, ink: 0 }, ink: { chrome: 0, ink: 1 } },
}

/** Capitals need air: the tracking a label takes when the theme doesn't give one, by face. */
export const LABEL_TRACKING: Record<LabelFont, number> = { sans: 0.06, mono: 0.02 }

export const MOTION_PERSONALITIES = ['precise', 'calm', 'lively'] as const satisfies readonly MotionPersonality[]

/**
 * The contract's defaults, the fields a complete theme (one with an `id`)
 * leaves unset: Basalt's, the same values youj.css puts on :root and a page
 * with no theme wears. So `defineTheme({ id })` is Basalt, and
 * `defineTheme({ id, accent })` and `defineTheme({ accent })` agree on
 * everything but colour: an override takes the surrounding theme's values,
 * which on a bare page are these.
 *
 * Colour: an unset accent or status ink is written as `initial`, and youj.css
 * then draws Basalt's tuned pair with only the light ceiling applied (so it
 * stays AA on a neutral of the theme's own); derive.ts INK_DEFAULTS mirrors
 * that. The chart is Basalt's too (below) while the theme sets no colour of
 * its own; once it sets an accent or a neutral and no palette, its charts are
 * drawn from its accent, since Basalt's neon beside a brand colour, or on a
 * neutral it wasn't tuned for, is rarely what was meant. (contract.test.ts
 * holds `defineTheme({ id })` equal to the Basalt preset.)
 */
export const DEFAULTS = {
  neutral: { hue: 285, chroma: 0.008, wash: 0, lift: 1, page: 'gray' },
  chart: {
    light: ['oklch(0.54 0.22 266)', 'oklch(0.62 0.19 12)', 'oklch(0.46 0.19 302)', 'oklch(0.62 0.135 68)', 'oklch(0.58 0.095 200)'],
    dark: ['oklch(0.9 0.2 129)', 'oklch(0.67 0.21 354)', 'oklch(0.61 0.22 293)', 'oklch(0.8 0.165 73)', 'oklch(0.8 0.13 210)'],
  },
  radius: 'xl',
  controlSize: 'default',
  fonts: {
    sans: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
    mono: "'JetBrains Mono Variable', ui-monospace, monospace",
  },
  motionPersonality: 'precise',
  stroke: { width: 1, ink: 0, icons: 1 },
  shadow: 'soft',
  actions: 'accent',
  controls: 'rounded',
  fields: 'soft',
  surfaces: { gradient: 0 },
  headings: { weight: 600, tracking: -0.025 },
  labels: { case: 'none', font: 'sans' },
  tone: { chrome: 'match', bars: 'chrome', overlays: 'content' },
} as const satisfies ThemeInput

/** How many series a chart palette colors. */
export const CHART_SERIES = 5

/** The fields that are groups of settings: an override merges them key by key. */
const GROUPS = ['fonts', 'stroke', 'surfaces', 'headings', 'labels', 'tone'] as const

/** The accent, status and info colors: each a CSS color or a `{ light, dark }` pair. */
export const THEME_COLORS = ['accent', 'success', 'warning', 'danger', 'info'] as const

const freezePalette = (palette: ChartPalette) => Object.freeze([...palette]) as unknown as ChartPalette

/**
 * Declares a theme. With an `id` it's complete: what you leave out is the
 * default (Basalt's, see DEFAULTS). Without one it's an override: what you leave out
 * comes from the surrounding theme. Spread a preset to extend it:
 * `defineTheme({ ...basalt, accent: '#1f6feb' })`.
 */
export function defineTheme<const T extends ThemeInput>(input: T): Readonly<T> {
  const theme: ThemeInput = { ...input }
  if (input.neutral) theme.neutral = Object.freeze({ ...input.neutral, wash: input.neutral.wash ?? 0 })
  for (const key of GROUPS) if (input[key]) Object.assign(theme, { [key]: Object.freeze({ ...input[key] }) })
  for (const key of THEME_COLORS) {
    const value = input[key]
    if (isPerMode(value)) theme[key] = Object.freeze({ light: value.light, dark: value.dark })
  }
  const chart = input.chart
  if (chart) theme.chart = isPerMode(chart) ? Object.freeze({ light: freezePalette(chart.light), dark: freezePalette(chart.dark) }) : freezePalette(chart)
  return Object.freeze(theme) as Readonly<T>
}

/** `inner` inside `outer`: a complete inner theme replaces it; an override applies field by field (fonts, stroke, surfaces, headings, labels and tone key by key). */
export function mergeThemes(outer: ThemeInput | null | undefined, inner: ThemeInput | null | undefined): ThemeInput | null {
  if (!outer) return inner ?? null
  if (!inner) return outer
  if (isCompleteTheme(inner)) return inner
  const merged: ThemeInput = { ...outer, ...inner }
  for (const key of GROUPS) if (outer[key] || inner[key]) Object.assign(merged, { [key]: { ...outer[key], ...inner[key] } })
  return merged
}

/** A theme with every contract field filled in. The colors stay optional: an unset accent or status ink is Basalt's tuned pair (derive.ts INK_DEFAULTS, youj.css's fallbacks), `info` is the accent, and a theme with its own accent and no chart palette draws one from it. */
export interface ResolvedTheme extends ThemeInput {
  neutral: Required<NeutralInput>
  radius: RadiusScale
  controlSize: ControlSize
  fonts: { sans: string; mono: string; display?: string }
  motionPersonality: MotionPersonality
  stroke: Required<StrokeInput>
  shadow: ShadowStyle
  actions: ActionFill
  controls: ControlShape
  fields: FieldStyle
  surfaces: Required<SurfacesInput>
  headings: Required<HeadingsInput>
  labels: { case: LabelCase; font: LabelFont; tracking?: number }
  tone: Required<ToneInput>
}

/**
 * The label voice over Basalt's (sentence case in the text face). A theme
 * that sets a case or a face without a tracking gets one fitted to those
 * (labelVars).
 */
function fitLabels(labels: LabelsInput | undefined): ResolvedTheme['labels'] {
  const { tracking, ...rest } = { ...DEFAULTS.labels, ...labels }
  const fitted = (labels?.case || labels?.font) && labels.tracking === undefined
  return fitted || tracking === undefined ? rest : { ...rest, tracking }
}

/** Every contract field filled in: the defaults (Basalt's) under `theme`. */
export function resolveTheme(theme: ThemeInput | null | undefined): ResolvedTheme {
  const t = theme ?? {}
  return {
    ...t,
    neutral: { ...DEFAULTS.neutral, ...t.neutral },
    chart: t.chart ?? (t.accent === undefined && t.neutral === undefined ? DEFAULTS.chart : undefined),
    radius: t.radius ?? DEFAULTS.radius,
    controlSize: t.controlSize ?? DEFAULTS.controlSize,
    fonts: { ...DEFAULTS.fonts, ...t.fonts },
    motionPersonality: t.motionPersonality ?? DEFAULTS.motionPersonality,
    stroke: { ...DEFAULTS.stroke, ...t.stroke },
    shadow: t.shadow ?? DEFAULTS.shadow,
    actions: t.actions ?? DEFAULTS.actions,
    controls: t.controls ?? DEFAULTS.controls,
    fields: t.fields ?? DEFAULTS.fields,
    surfaces: { ...DEFAULTS.surfaces, ...t.surfaces },
    headings: { ...DEFAULTS.headings, ...t.headings },
    labels: fitLabels(t.labels),
    tone: { ...DEFAULTS.tone, ...t.tone },
  }
}

/**
 * A theme with an `id` (every preset, and any theme you name) is complete:
 * whatever it leaves out takes the default, never the surrounding theme's
 * value. A theme without one is an override that changes only what it sets,
 * e.g. `{ accent: '#ff5a1f' }` for one section.
 */
export function isCompleteTheme(theme: ThemeInput): boolean {
  return Boolean(theme.id)
}

type ThemeVars = Record<`--yj-${string}`, string>

/**
 * A color's three variables: `--yj-<name>` for one to derive from, and
 * `--yj-<name>-light` / `-dark` for a pair used as given. Each form resets the
 * other's, so an outer scope's color never shows through.
 */
function colorVars(name: `--yj-${string}`, value: string | PerMode<string> | undefined): ThemeVars {
  if (value === undefined) return { [name]: 'initial', [`${name}-light`]: 'initial', [`${name}-dark`]: 'initial' }
  if (isPerMode(value)) return { [name]: 'initial', [`${name}-light`]: value.light, [`${name}-dark`]: value.dark }
  return { [name]: value, [`${name}-light`]: 'initial', [`${name}-dark`]: 'initial' }
}

/**
 * The contract custom properties. An override writes only the fields it sets.
 * A complete theme writes every field, and resets unset accent, status and
 * chart colors, display face and label voice to `initial`, so nothing leaks
 * in from an outer scope. A color writes `--yj-accent` (derived per mode); a
 * `{ light, dark }` pair writes `--yj-accent-light` and `--yj-accent-dark`
 * (used as given); either resets the other form.
 */
export function themeVars(input: ThemeInput): ThemeVars {
  const theme = input
  const complete = isCompleteTheme(theme)
  const t: ThemeInput = complete ? resolveTheme(theme) : theme
  const vars: ThemeVars = {}
  if (t.neutral) {
    vars['--yj-neutral-hue'] = String(t.neutral.hue)
    vars['--yj-neutral-chroma'] = String(t.neutral.chroma)
    vars['--yj-neutral-wash'] = String(t.neutral.wash ?? 0)
    vars['--yj-neutral-lift'] = String(t.neutral.lift ?? 0)
    vars['--yj-neutral-page'] = String(PAGE[t.neutral.page ?? 'gray'])
  }
  for (const key of THEME_COLORS) {
    const value = t[key]
    if (value !== undefined || complete) Object.assign(vars, colorVars(`--yj-${key}`, value))
  }
  const chart = t.chart
  for (let i = 0; i < CHART_SERIES; i++) {
    const series = chart === undefined ? undefined : isPerMode(chart) ? { light: chart.light[i]!, dark: chart.dark[i]! } : chart[i]!
    if (chart !== undefined || complete) Object.assign(vars, colorVars(`--yj-chart-${i + 1}`, series))
  }
  if (t.radius) vars['--yj-radius'] = RADIUS[t.radius]
  if (t.controlSize) vars['--yj-density'] = String(CONTROL_SIZE[t.controlSize])
  if (t.fonts?.sans) vars['--yj-font-sans'] = t.fonts.sans
  if (t.fonts?.mono) vars['--yj-font-mono'] = t.fonts.mono
  if (t.fonts?.display) vars['--yj-font-display'] = t.fonts.display
  else if (complete) vars['--yj-font-display'] = 'initial'
  const { stroke, headings, labels } = t
  if (stroke?.width !== undefined) vars['--yj-stroke-width'] = `${stroke.width}px`
  if (stroke?.ink !== undefined) vars['--yj-stroke-ink'] = String(stroke.ink)
  if (stroke?.icons !== undefined) vars['--yj-icon-weight'] = String(stroke.icons)
  if (t.shadow) {
    vars['--yj-shadow-soft'] = String(SHADOW[t.shadow].soft)
    vars['--yj-shadow-hard'] = String(SHADOW[t.shadow].hard)
  }
  if (t.actions) vars['--yj-action-ink'] = String(ACTIONS[t.actions])
  if (t.controls) vars['--yj-pill'] = String(CONTROLS[t.controls])
  if (t.fields) vars['--yj-field-soft'] = String(FIELDS[t.fields])
  if (t.surfaces?.gradient !== undefined) vars['--yj-surface-gradient'] = String(t.surfaces.gradient)
  if (t.tone?.chrome) {
    vars['--yj-tone-chrome-fixed'] = String(TONE.chrome[t.tone.chrome].fixed)
    vars['--yj-tone-chrome-dark'] = String(TONE.chrome[t.tone.chrome].dark)
  }
  if (t.tone?.bars) {
    vars['--yj-tone-bars-chrome'] = String(TONE.bars[t.tone.bars].side)
    vars['--yj-tone-header-chrome'] = String(TONE.bars[t.tone.bars].top)
  }
  if (t.tone?.overlays) {
    vars['--yj-tone-overlay-chrome'] = String(TONE.overlays[t.tone.overlays].chrome)
    vars['--yj-tone-overlay-ink'] = String(TONE.overlays[t.tone.overlays].ink)
  }
  if (headings?.weight !== undefined) vars['--yj-heading-weight'] = String(headings.weight)
  if (headings?.tracking !== undefined) vars['--yj-heading-tracking'] = `${headings.tracking}em`
  if (labels) Object.assign(vars, labelVars(labels, complete, t.fonts?.mono ?? DEFAULTS.fonts.mono))
  return vars
}

/* Labels are unset by default: the hooks in ui.css then change nothing, so a
 * label keeps whatever case, face and spacing it inherits. */
function labelVars(labels: LabelsInput, complete: boolean, mono: string): ThemeVars {
  const vars: ThemeVars = {}
  const upper = labels.case === 'upper'
  const tracking = labels.tracking ?? (upper ? LABEL_TRACKING[labels.font ?? 'sans'] : undefined)
  if (labels.case || complete) vars['--yj-label-case'] = upper ? 'uppercase' : 'initial'
  if (labels.font || complete) vars['--yj-label-font'] = labels.font === 'mono' ? mono : 'initial'
  if (labels.case || labels.tracking !== undefined || complete) vars['--yj-label-tracking'] = tracking === undefined ? 'initial' : `${tracking}em`
  return vars
}

export interface ThemeProps {
  'data-yj-theme': string
  'data-yj-palette'?: string
  'data-yj-style'?: string
  'data-yj-motion'?: MotionPersonality
  style: CSSProperties
}

/**
 * The attributes that apply `theme` to an element and everything inside it:
 * `data-yj-theme` marks the element as a scope (so the derived tokens are
 * recomputed there), `data-yj-motion` sets the motion personality, and `style`
 * carries the contract. Spread it on <html> in a root layout to theme the
 * whole document on the server, with no flash.
 */
export function themeProps(input: ThemeInput): ThemeProps {
  const theme = input
  return {
    'data-yj-theme': theme.id ?? '',
    ...(theme.palette ? { 'data-yj-palette': theme.palette } : {}),
    ...(theme.style ? { 'data-yj-style': theme.style } : {}),
    ...(theme.motionPersonality ? { 'data-yj-motion': theme.motionPersonality } : {}),
    style: themeVars(theme) as CSSProperties,
  }
}

/** The theme as a stylesheet rule: the contract variables for `selector`. */
export function themeCss(input: ThemeInput, selector = ':root'): string {
  if (/[{}]/.test(selector)) throw new Error(`themeCss: the selector "${selector}" can't contain braces.`)
  const theme = input
  const lines = Object.entries(themeVars(theme)).map(([name, value]) => `  ${name}: ${value};`)
  const comment = (text: string) => text.replaceAll('*/', '* /')
  const title = theme.name ? `/* ${comment(theme.name)}${theme.description ? `: ${comment(theme.description)}` : ''} */\n` : ''
  const motion = theme.motionPersonality
    ? `\n/* Motion personality: set data-yj-motion="${theme.motionPersonality}" on the same element (CSS can't choose timing curves from a variable). */`
    : ''
  return `${title}${selector} {\n${lines.join('\n')}\n}${motion}\n`
}
