import { formatOklch, linearToOklch, mixOklab, oklchToLinear, parseColor, type LinearRgb, type Oklch } from './color'
import { ACTIONS, isPerMode, PAGE, resolveTheme, TONE, type ThemeColor, type ThemeInput } from './contract'

/* The JS mirror of the derivation in youj.css and ui.css. The same tables
 * and formulas, so it produces the colors the browser computes. It's there
 * for checkTheme, for canvas code without a DOM, and for docs and exports.
 * src/lib/youj/theme/derive.test.ts holds the two in step. A color given
 * per mode (`{ light, dark }`) skips the derivation: each side is used as
 * given, in CSS and here. */

export type Mode = 'light' | 'dark'

export const NEUTRAL_STEPS = ['canvas', 'surface', 'raised', 'line', 'line-strong', 'fg', 'fg-muted', 'fg-subtle'] as const
export type NeutralStep = (typeof NEUTRAL_STEPS)[number]

export const INKS = ['accent', 'success', 'warning', 'danger'] as const
export type Ink = (typeof INKS)[number]

/** Every derived color: the youj palette plus `input`, the ui bridge's field border. */
export type PaletteToken = NeutralStep | Ink | 'accent-contrast' | 'input'
export const PALETTE_TOKENS = [...NEUTRAL_STEPS, 'accent', 'accent-contrast', 'success', 'warning', 'danger', 'input'] as const satisfies readonly PaletteToken[]

interface StepSpec {
  /** Lightness. */
  l: number
  /** Share of the neutral chroma. */
  c: number
  /** Share of the neutral chroma under full wash. */
  w: number
  /** Whether wash dims it (light mode lowers the page and everything drawn on it, so tint stays in gamut). */
  dim: boolean
}

/**
 * The neutral ramp, per mode. Graphite (hue 270, chroma 0.012) reproduces the
 * hand-tuned palette exactly; Basalt (hue 285, chroma 0.008, lift 1) is the default. Light mode lays an app out: a soft gray page
 * under white cards, menus and fields, raised wells a step below the page,
 * hairline lines; a theme with a white page (neutral.page) swaps the page and
 * card planes (derivePalette). fg-subtle and the field border (`input`, a mix
 * of line-strong and fg-subtle) are placed to clear 4.5:1 and 3:1 on every
 * surface for any hue, chroma up to 0.04 and any wash.
 */
export const STEPS: Record<Mode, Record<NeutralStep, StepSpec>> = {
  light: {
    canvas: { l: 0.965, c: 1 / 8, w: 1, dim: true },
    surface: { l: 1, c: 0, w: 0.6, dim: true },
    raised: { l: 0.95, c: 1 / 4, w: 1, dim: true },
    line: { l: 0.895, c: 1 / 3, w: 1, dim: true },
    'line-strong': { l: 0.74, c: 7 / 12, w: 1, dim: true },
    fg: { l: 0.2, c: 1, w: 1, dim: false },
    'fg-muted': { l: 0.44, c: 1, w: 1, dim: false },
    'fg-subtle': { l: 0.5, c: 5 / 6, w: 1, dim: true },
  },
  dark: {
    canvas: { l: 0.155, c: 5 / 12, w: 1, dim: false },
    surface: { l: 0.185, c: 1 / 2, w: 1, dim: false },
    raised: { l: 0.225, c: 7 / 12, w: 1, dim: false },
    line: { l: 0.25, c: 2 / 3, w: 1, dim: false },
    'line-strong': { l: 0.31, c: 5 / 6, w: 1, dim: false },
    fg: { l: 0.965, c: 1 / 4, w: 1, dim: false },
    'fg-muted': { l: 0.73, c: 5 / 6, w: 1, dim: false },
    'fg-subtle': { l: 0.625, c: 5 / 6, w: 1, dim: false },
  },
}

/** How far a full wash lowers the light page. */
export const WASH_DIM: Record<Mode, number> = { light: 0.02, dark: 0 }

/**
 * How far a full lift (neutral.lift = 1) raises each step's lightness. Dark
 * mode only: the page a little, cards and raised surfaces clear of it, lines
 * enough to stay visible on them, and fg-subtle with them so it keeps 4.5:1
 * on raised (and the field border 3:1). Light surfaces are already white.
 */
export const LIFT: Record<Mode, Record<NeutralStep, number>> = {
  light: { canvas: 0, surface: 0, raised: 0, line: 0, 'line-strong': 0, fg: 0, 'fg-muted': 0, 'fg-subtle': 0 },
  dark: { canvas: 0.015, surface: 0.045, raised: 0.04, line: 0.035, 'line-strong': 0.03, fg: 0, 'fg-muted': 0, 'fg-subtle': 0.035 },
}

/** The field border's share of line-strong; the rest is fg-subtle. */
export const INPUT_LINE_SHARE = 0.3

/** Basalt's accent and status pairs (the contract's defaults), used when a theme's own can't be read. */
export const INK_DEFAULTS: Record<Mode, Record<Ink, Oklch>> = {
  light: { accent: [0.54, 0.25, 268], success: [0.504, 0.114, 158], warning: [0.527, 0.124, 58], danger: [0.542, 0.197, 25] },
  dark: { accent: [0.8, 0.165, 73], success: [0.85, 0.165, 160], warning: [0.74, 0.17, 50], danger: [0.665, 0.175, 18] },
}

/** Dark mode lifts a theme's colors to at least this lightness and caps their chroma, so they glow without vibrating. */
export const DARK_INK = { floor: 0.665, maxChroma: 0.175 }

/**
 * Chart colors are marks, not text: they need 3:1 on every surface (WCAG
 * 1.4.11), not 4.5:1. So dark mode lifts them to a lower floor, one that
 * still clears 3:1 on the lightest dark surface (raised, fully lifted) for
 * any hue at the chroma cap, and lets them keep more chroma than the inks,
 * so a neon series stays neon. Mirrors --yj-chart-*-d.
 */
export const DARK_CHART = { floor: 0.6, maxChroma: 0.25 }

/** The contrast each kind of color needs on every surface: text 4.5:1, chart marks 3:1. */
export const MIN_CONTRAST = { text: 4.5, mark: 3 } as const

/**
 * The chart palette a theme gets when it sets none: the accent, then four
 * hues around the wheel from it, 72° apart and each 144° from the series
 * beside it. Each is a seed of that hue scaled in linear light to a
 * luminance of its own, so neighbors differ in lightness too, which is
 * what color-blind readers tell them apart by: in light mode a share of
 * the 3:1 ceiling, in dark mode a luminance above the 3:1 floor. A seed that
 * leaves sRGB there is drawn toward the gray of that luminance until it
 * fits, so the contrast holds exactly. Mirrors --yj-chart-*-auto.
 */
export const AUTO_CHART = {
  /** Series 2 to 5: the hue offset from the accent, in degrees. */
  hues: [144, 288, 72, 216],
  /** The seed's OKLCH lightness, and its chroma per mode: how saturated the series come out. */
  seed: { l: 0.7, c: { light: 0.21, dark: 0.15 } },
  /** Series 2 to 5: luminance, in light mode as a share of the 3:1 ceiling. */
  y: { light: [1, 0.26, 0.74, 0.3], dark: [0.56, 0.2, 0.46, 0.28] },
  /**
   * Some hues want a lightness of their own: a yellow set deep turns olive or
   * brown, and in the dark a blue set light turns pale. The nearer a series
   * is to the yellow hue (or, in dark mode, the blue), the further its
   * luminance is drawn toward `to`: the ceiling itself in light mode, 0.5 in
   * dark for a yellow and 0.22 for a blue. `power` keeps the pull to hues
   * near them. A series' neighbors sit 144° away, across the blue-yellow
   * axis that color-blind readers keep, so the pull never makes neighbors
   * harder for them to tell apart.
   */
  pull: { yellow: { hue: 85, to: { light: 1, dark: 0.5 } }, blue: { hue: 275, to: { dark: 0.22 } }, power: 3 },
} as const

/**
 * Light mode's ceiling on a color's luminance: it clears `ratio` (4.5:1 for
 * text, 3:1 for chart marks) on the darkest light surface (raised, dimmed by
 * wash, its chroma lowering luminance by up to 0.8 × chroma). Mirrors
 * --yj-ink-y and --yj-chart-y.
 */
export function inkCeiling(chroma: number, wash: number, ratio: number = MIN_CONTRAST.text): number {
  const raised = STEPS.light.raised
  const l = raised.l - WASH_DIM.light * wash
  const c = raised.c + (1 - raised.c) * wash
  return (l ** 3 - 0.8 * chroma * c + 0.05) / ratio - 0.0502
}

/**
 * Darkens in linear light until the luminance is at most `ceiling`; hue and
 * saturation are kept. Negative (out-of-gamut) channels count as 0, as they
 * paint, so wide-gamut inputs such as P3 colors are held to the ceiling too;
 * channels above 1 count in full, which can only err on the dark side.
 */
function inkOnLight([r, g, b]: LinearRgb, ceiling: number): Oklch {
  const y = 0.2126 * Math.max(0, r) + 0.7152 * Math.max(0, g) + 0.0722 * Math.max(0, b)
  const k = Math.min(1, ceiling / Math.max(y, 0.000001))
  return linearToOklch([r * k, g * k, b * k])
}

/** Lifts to the dark floor and caps the chroma, narrowing it further if the lift would leave the gamut. */
function inkOnDark([l, c, h]: Oklch, { floor, maxChroma } = DARK_INK): Oklch {
  const L = Math.max(l, floor)
  return [L, Math.min(c, maxChroma, (c * (1 - L)) / Math.max(1 - l, 0.001)), h]
}

export type Palette = Record<PaletteToken, Oklch>

/** Parses a theme color, or null when it's missing or unreadable (CSS falls back to the default for both). */
function readInk(value: string | undefined): LinearRgb | null {
  return value ? parseColor(value) : null
}

/** A hand-tuned color for this mode, as given, or null to derive (a single color, or none, or an unreadable one). */
function givenFor(value: ThemeColor | undefined, mode: Mode): Oklch | null {
  const own = isPerMode(value) ? parseColor(value[mode]) : null
  return own ? linearToOklch(own) : null
}

/** The colors `theme` resolves to in one mode, as OKLCH numbers. */
export function derivePalette(theme: ThemeInput | null | undefined, mode: Mode): Palette {
  const t = resolveTheme(theme)
  const { hue, chroma, wash, lift, page } = t.neutral
  const out = {} as Palette
  for (const step of NEUTRAL_STEPS) {
    const s = STEPS[mode][step]
    const l = s.l + LIFT[mode][step] * lift - (s.dim ? WASH_DIM[mode] * wash : 0)
    out[step] = [l, chroma * (s.c + (s.w - s.c) * wash), hue]
  }
  // A white page (light mode only) swaps the page and card planes: the page takes the white, cards and code the soft gray.
  if (mode === 'light' && PAGE[page] === 1) [out.canvas, out.surface] = [out.surface, out.canvas]
  out.input = mixOklab(out['line-strong'], out['fg-subtle'], INPUT_LINE_SHARE)
  // Ink draws lines toward the text color: line along its hue, the field border in oklab (ui.css --input).
  const ink = t.stroke.ink
  if (ink > 0) {
    const [l, c] = out.line
    out.line = [l + (out.fg[0] - l) * ink, c + (out.fg[1] - c) * ink, hue]
    out.input = mixOklab(out.input, out.fg, 1 - ink)
  }

  const ceiling = inkCeiling(chroma, wash)
  for (const ink of INKS) {
    const value = t[ink]
    const given = givenFor(value, mode)
    const own = typeof value === 'string' ? readInk(value) : null
    if (given) out[ink] = given
    else if (mode === 'light') out[ink] = inkOnLight(own ?? oklchToLinear(INK_DEFAULTS.light[ink]), ceiling)
    else out[ink] = own ? inkOnDark(linearToOklch(own)) : INK_DEFAULTS.dark[ink]
  }
  out['accent-contrast'] = mode === 'light' ? [0.995, 0, hue] : [0.16, 0.02, hue]
  return out
}

/** One series of the palette drawn from the accent (AUTO_CHART), for series 2 to 5 (`i` 0 to 3). */
function autoSeries(accent: Oklch, i: number, mode: Mode, ceiling: number): Oklch {
  const hue = accent[2] + AUTO_CHART.hues[i]!
  const { yellow, blue, power } = AUTO_CHART.pull
  const near = (centre: number) => Math.max(0, Math.cos(((hue - centre) * Math.PI) / 180)) ** power
  // CSS carries the two pulls as one number, the seed's alpha (0.5 + half the yellow's − half the blue's), and reads them back.
  const alpha = 0.5 + 0.5 * near(yellow.hue) - 0.5 * near(blue.hue)
  const [toYellow, toBlue] = [Math.max(0, 2 * alpha - 1), Math.max(0, 1 - 2 * alpha)]
  const level = AUTO_CHART.y[mode][i]!
  const y =
    mode === 'light'
      ? ceiling * (level + (yellow.to.light - level) * toYellow)
      : level + (yellow.to.dark - level) * toYellow + (blue.to.dark - level) * toBlue
  const [r, g, b] = oklchToLinear([AUTO_CHART.seed.l, AUTO_CHART.seed.c[mode], hue])
  const k = y / Math.max(0.2126 * r + 0.7152 * g + 0.0722 * b, 0.000001)
  const scaled: LinearRgb = [r * k, g * k, b * k]
  // Toward the gray of the same luminance, as far as sRGB needs: t = 1 when it already fits.
  const t = Math.min(1, y / Math.max(y - Math.min(...scaled), 0.000001), (1 - y) / Math.max(Math.max(...scaled) - y, 0.000001))
  return linearToOklch(scaled.map((c) => y + (c - y) * t) as LinearRgb)
}

/**
 * The chart palette `theme` draws in one mode. A palette it sets: each color
 * darkened in light or lifted in dark until it reads at 3:1 on every surface,
 * or, for a palette given per mode, that mode's five as given; null for a
 * color CSS can't read. No palette: the one drawn from its accent
 * (AUTO_CHART), where the browser can derive it (older browsers keep ui.css's
 * one-hue ramp).
 */
export function deriveChart(theme: ThemeInput | null | undefined, mode: Mode): (Oklch | null)[] {
  const t = resolveTheme(theme)
  if (!t.chart) {
    const accent = derivePalette(theme, mode).accent
    const ceiling = inkCeiling(t.neutral.chroma, t.neutral.wash, MIN_CONTRAST.mark)
    return [accent, ...AUTO_CHART.hues.map((_, i) => autoSeries(accent, i, mode, ceiling))]
  }
  if (isPerMode(t.chart))
    return t.chart[mode].map((value) => {
      const own = readInk(value)
      return own ? linearToOklch(own) : null
    })
  const ceiling = inkCeiling(t.neutral.chroma, t.neutral.wash, MIN_CONTRAST.mark)
  return t.chart.map((value) => {
    const own = readInk(value)
    if (!own) return null
    return mode === 'light' ? inkOnLight(own, ceiling) : inkOnDark(linearToOklch(own), DARK_CHART)
  })
}

/** Both modes as CSS strings (`oklch(…)`), keyed like the `--color-*` tokens (`input` is ui's `--input`). */
export function deriveTheme(theme: ThemeInput | null | undefined): Record<Mode, Record<PaletteToken, string>> {
  const format = (p: Palette) => Object.fromEntries(PALETTE_TOKENS.map((k) => [k, formatOklch(p[k])])) as Record<PaletteToken, string>
  return { light: format(derivePalette(theme, 'light')), dark: format(derivePalette(theme, 'dark')) }
}

/* ── Roles ────────────────────────────────────────────────────────────────
 * What a thing is, not what it looks like (youj.css section 3c): every color
 * a component paints is one of these. deriveRoles mirrors that block, formula
 * for formula, so checkRoles can hold each pair a role implies to AA, and
 * canvas code can paint with a role without a DOM. */

/** The five inks: the accent, the status colors and `info`, which is the accent unless a theme sets one. */
export const ROLE_INKS = [...INKS, 'info'] as const
export type RoleInk = (typeof ROLE_INKS)[number]

/** Every role, as the name of its `--color-<role>` token and its Tailwind color (`bg-well`, `text-fg-muted`). */
export const ROLES = [
  // Surfaces
  'canvas',
  'surface',
  'overlay',
  'well',
  'field',
  'key',
  'control',
  'chrome',
  'chrome-float',
  'inverse',
  'scrim',
  // Lines
  'line-subtle',
  'line',
  'line-strong',
  'line-control',
  // Text and marks
  'fg',
  'fg-muted',
  'fg-subtle',
  'on-accent',
  'on-action',
  // Actions, states, focus
  'accent',
  'action',
  'danger',
  'hover',
  'selected',
  'cursor',
  'on-cursor',
  'on-cursor-muted',
  'band',
  'focus',
  // Status
  'success',
  'warning',
  'info',
  'accent-text',
  'accent-subtle',
  'accent-line',
  'success-text',
  'success-subtle',
  'success-line',
  'warning-text',
  'warning-subtle',
  'warning-line',
  'danger-text',
  'danger-subtle',
  'danger-line',
  'info-text',
  'info-subtle',
  'info-line',
  // Data and shadow
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-quiet',
  'shadow',
] as const
export type Role = (typeof ROLES)[number]

/** A role's paint: an OKLCH color and its alpha (the tints, the scrim and the line tints are translucent). */
export interface RolePaint {
  color: Oklch
  alpha: number
}
export type Roles = Record<Role, RolePaint>

/** The tone scopes (`data-yj-tone`): the top bar, the other bars attached to the frame, chrome that floats, overlays and the page's inverse. */
export const TONES = ['header', 'chrome', 'float', 'overlay', 'inverse'] as const
export type Tone = (typeof TONES)[number]

/**
 * The mode a tone scope draws in on a page in `mode`, as youj.css's
 * `--yj-float-m`, `--yj-header-m`, `--yj-chrome-m`, `--yj-overlay-m` and
 * `--yj-inverse-m`: floating chrome is the page's unless the theme holds it
 * to one mode; the top bar, the other bars and overlays each follow the
 * page's or the floating chrome's; the inverse is the
 * page's opposite. No tone is the page's own.
 */
export function toneMode(theme: ThemeInput | null | undefined, tone: Tone | undefined, mode: Mode): Mode {
  if (!tone) return mode
  const page = mode === 'dark' ? 1 : 0
  const { chrome: setting, bars, overlays } = resolveTheme(theme).tone
  const { fixed, dark } = TONE.chrome[setting]
  const float = page * (1 - fixed) + dark * fixed
  const { side, top } = TONE.bars[bars]
  const chrome = page * (1 - side) + float * side
  const header = page * (1 - top) + float * top
  const follow = TONE.overlays[overlays].chrome
  const overlay = page * (1 - follow) + float * follow
  const isDark = tone === 'header' ? header : tone === 'chrome' ? chrome : tone === 'float' ? float : tone === 'overlay' ? overlay : 1 - page
  return isDark === 1 ? 'dark' : 'light'
}

/** The `info` ink: derived like the others from the theme's single color, used as given for a pair, else the accent. */
function deriveInfo(theme: ThemeInput | null | undefined, mode: Mode, accent: Oklch): Oklch {
  const t = resolveTheme(theme)
  const given = givenFor(t.info, mode)
  if (given) return given
  const own = typeof t.info === 'string' ? readInk(t.info) : null
  if (!own) return accent
  return mode === 'light' ? inkOnLight(own, inkCeiling(t.neutral.chroma, t.neutral.wash)) : inkOnDark(linearToOklch(own))
}

/**
 * The roles `theme` resolves to in one mode, optionally inside a tone scope
 * (then in the mode that tone has on a page in `mode`). Mirrors youj.css
 * section 3c, where each formula is set so every text role reads at 4.5:1 on
 * every surface (in dark the key is the raised step, a control a 7% step of
 * ink off the card).
 * `inverse` is the surface of the mode you ask for: ask for it inside the
 * `inverse` tone, where that is the page's opposite.
 */
export function deriveRoles(theme: ThemeInput | null | undefined, mode: Mode, tone?: Tone): Roles {
  const t = resolveTheme(theme)
  const m = toneMode(theme, tone, mode)
  const p = derivePalette(theme, m)
  const dark = m === 'dark' ? 1 : 0
  const solid = (color: Oklch): RolePaint => ({ color, alpha: 1 })
  const tint = (color: Oklch, alpha: number): RolePaint => ({ color, alpha })
  const mix = mixOklab
  const wellFill = mix(p.canvas, p.surface, 0.55)
  // Light mode's white plane (the page itself on a white-page theme); overlays, fields and secondary buttons stay white on it.
  const paper = mix(p.canvas, p.surface, PAGE[t.neutral.page])
  const actionInk = ACTIONS[t.actions]
  const info = deriveInfo(theme, m, p.accent)
  const inks: Record<RoleInk, Oklch> = { accent: p.accent, success: p.success, warning: p.warning, danger: p.danger, info }
  const chart = deriveChart(theme, m)
  const overlay = mix(paper, p.raised, 1 - dark)
  // An ink overlay's highlighted row: ink lettered in paper (youj.css --yj-cursor-ink).
  const ink = tone === 'overlay' ? TONE.overlays[t.tone.overlays].ink : 0
  const shadow: Oklch = [0.2 - 0.2 * dark, ((t.neutral.chroma * 5) / 3) * (1 - dark), t.neutral.hue]

  const roles = {
    canvas: solid(p.canvas),
    surface: solid(p.surface),
    overlay: solid(overlay),
    well: solid(mix(p.raised, wellFill, 1 - dark)),
    field: solid(mix(paper, wellFill, 1 - dark)),
    key: solid(overlay),
    control: solid(mix(paper, mix(p.fg, p.surface, 0.07), 1 - dark)),
    chrome: solid(p.canvas),
    'chrome-float': solid(overlay),
    inverse: solid(p.surface),
    scrim: tint(shadow, 0.24 + 0.38 * dark),
    'line-subtle': tint(p.line, 0.55),
    line: solid(p.line),
    'line-strong': solid(p['line-strong']),
    'line-control': solid(p.input),
    fg: solid(p.fg),
    'fg-muted': solid(p['fg-muted']),
    'fg-subtle': solid(p['fg-subtle']),
    'on-accent': solid(p['accent-contrast']),
    'on-action': solid(mix(p['accent-contrast'], p.canvas, 1 - actionInk)),
    accent: solid(p.accent),
    action: solid(mix(p.accent, p.fg, 1 - actionInk)),
    danger: solid(p.danger),
    hover: tint(p.fg, 0.06),
    selected: tint(p.fg, 0.09),
    cursor: ink ? solid(p.fg) : tint(p.fg, 0.06),
    'on-cursor': solid(ink ? paper : p.fg),
    'on-cursor-muted': solid(ink ? mix(paper, p.fg, 0.72) : p['fg-muted']),
    band: tint(p.fg, 0.05),
    focus: solid(p.accent),
    success: solid(p.success),
    warning: solid(p.warning),
    info: solid(info),
    'chart-1': solid(chart[0] ?? p.accent),
    'chart-2': solid(chart[1] ?? mix(p.accent, p.canvas, 0.72)),
    'chart-3': solid(chart[2] ?? mix(p.accent, p.canvas, 0.46)),
    'chart-4': solid(chart[3] ?? p['fg-muted']),
    'chart-5': solid(chart[4] ?? p['fg-subtle']),
    'chart-quiet': solid(mix(p.fg, p.surface, 0.48)),
    shadow: solid(shadow),
  } as Partial<Roles>
  for (const ink of ROLE_INKS) {
    roles[`${ink}-text`] = solid(mix(inks[ink], p.fg, 0.8))
    roles[`${ink}-subtle`] = tint(inks[ink], 0.1 + 0.04 * dark)
    roles[`${ink}-line`] = tint(inks[ink], 0.35)
  }
  return roles as Roles
}

/** A role's paint as CSS: `oklch(…)`, with `/ alpha` where it is translucent. */
export function formatPaint({ color, alpha }: RolePaint): string {
  const opaque = formatOklch(color)
  return alpha === 1 ? opaque : `${opaque.slice(0, -1)} / ${Number(alpha.toFixed(4))})`
}
