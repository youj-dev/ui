import { basalt, deriveRoles, deriveTheme, formatPaint, graphite, internalPresetById, resolveTheme, type Mode, type ResolvedTheme, type ThemeColor, type ThemeInput } from '@youj/core/lib/youj/theme'
import { setDevTheme } from './dev-theme-signal'
import { themeVars, type BarTone, type ChromeTone, type NeutralPage, type OverlayTone, type RadiusScale, type ToneInput } from '@youj/core/lib/youj/theme/contract'
import { SITE_LIGHT } from '@/lib/site-light'
import type { StagePattern } from '@/components/site/stage'

/* The developer colour panel's model: a gallery of whole looks (presets), the
 * owner's edits on top of the one picked, and the two things done with the
 * result: write it to <html> (the site's scope), and print it as a
 * defineTheme snippet to hand back. The panel's controls are the FIELDS list,
 * one entry per input, so an input the contract grows is one more entry here. */

/* ── Presets ──────────────────────────────────────────────────────────── */

/** The paper site preset: a warm, lightly washed neutral, near Linen, that the stages can wear instead of the gray app page. */
export const PAPER = { hue: 85, chroma: 0.01, wash: 0.7 } as const

/** The site's own theme in a mode: Basalt in dark, SITE_LIGHT in light. */
const site = (mode: Mode): ThemeInput => (mode === 'dark' ? basalt : SITE_LIGHT)

export interface DevPreset {
  id: string
  name: string
  /** One line for the gallery card. */
  note: string
  /** The look in a mode. Complete (it has an id), so applying it resets whatever an edit left behind. */
  theme: (mode: Mode) => ThemeInput
  /** The mode it is meant for: picking it switches the site there. Two-tone looks only show in one. */
  mode?: Mode
}

const preset = (id: Parameters<typeof internalPresetById>[0], note: string): DevPreset => {
  const theme = internalPresetById(id)
  return { id: theme.id, name: theme.name!, note, theme: () => theme }
}

/**
 * A two-tone look: `base` with its chrome (and maybe its overlays) held to a
 * mode. Only inputs change; the roles inside the chrome derive again, so its
 * buttons, fields, menus and tips are their dark (or light) selves.
 */
const twoTone = (id: string, name: string, note: string, base: ThemeInput, mode: Mode, chrome: ChromeTone, overlays: OverlayTone = 'content'): DevPreset => ({
  id,
  name,
  note,
  mode,
  theme: () => ({ ...base, id, name, description: undefined, tone: { chrome, overlays } }),
})

/**
 * A two-tone take on the site's own look, in either mode: the site's theme
 * (Basalt in dark, SITE_LIGHT in light) wearing `tone`. Meant for light, where
 * a dark chrome is the second tone; in dark it shows what the same tone does
 * there.
 */
const siteTone = (id: string, name: string, note: string, tone: ToneInput): DevPreset => ({
  id,
  name,
  note,
  mode: 'light',
  theme: (mode) => ({ ...site(mode), id, name, description: undefined, tone }),
})

/** The id of the site's own look, the panel's starting point. */
export const SITE_PRESET_ID = 'site'

/** The gallery: the site, the shipped presets, the internal ones, the paper look, and two-tone variants. */
export const DEV_PRESETS: DevPreset[] = [
  { id: SITE_PRESET_ID, name: 'Site', note: 'The site as it ships', theme: site },
  preset('basalt', 'Shipped · dark default'),
  preset('graphite', 'Shipped · light default'),
  preset('terminal', 'Shipped'),
  preset('brutal', 'Shipped'),
  preset('meadow', 'Shipped · backdrop'),
  preset('sandstone', 'Shipped · backdrop'),
  preset('cinnabar', 'Shipped · backdrop'),
  preset('umber', 'Shipped · backdrop'),
  preset('seaglass', 'Shipped · backdrop'),
  preset('heather', 'Shipped · backdrop'),
  {
    id: 'paper',
    name: 'Paper',
    note: 'The site on the cream stage',
    theme: (mode) => ({ ...site(mode), id: 'paper', name: 'Paper', description: undefined, neutral: { ...site(mode).neutral!, ...PAPER } }),
  },
  // Two-tone v2. Afloat Bar, the owner's pick: a dark top bar over a light sidebar, and everything that floats dark.
  siteTone('site-afloat-bar', 'Site Afloat Bar', 'Two-tone · dark top bar and all that floats', { chrome: 'dark', bars: 'top', overlays: 'chrome' }),
  // The options it came from: the bars stay light, the floating chrome goes dark, and the menus show it three ways.
  siteTone('site-islands', 'Site Islands', 'Two-tone · dark islands', { chrome: 'dark', bars: 'content', overlays: 'content' }),
  siteTone('site-ink', 'Site Ink', 'Two-tone · dark islands, ink rows', { chrome: 'dark', bars: 'content', overlays: 'ink' }),
  siteTone('site-afloat', 'Site Afloat', 'Two-tone · all that floats is dark', { chrome: 'dark', bars: 'content', overlays: 'chrome' }),
  twoTone('site-studio', 'Site Studio', 'Two-tone · dark chrome', SITE_LIGHT, 'light', 'dark'),
  twoTone('graphite-studio', 'Graphite Studio', 'Two-tone · dark chrome', graphite, 'light', 'dark'),
  twoTone('basalt-daylight', 'Basalt Daylight', 'Two-tone · light chrome', basalt, 'dark', 'light'),
]

export const devPreset = (id: string): DevPreset => DEV_PRESETS.find((p) => p.id === id) ?? DEV_PRESETS[0]!

/** A preset's gallery swatch: its page, card, top bar, side bar, floating chrome and accent, as the roles derive them in `mode` (each chrome in its own tone). */
export function presetSwatch(p: DevPreset, mode: Mode) {
  const theme = p.theme(mode)
  const page = deriveRoles(theme, mode)
  const header = deriveRoles(theme, mode, 'header')
  const chrome = deriveRoles(theme, mode, 'chrome')
  const float = deriveRoles(theme, mode, 'float')
  return {
    page: formatPaint(page.canvas),
    card: formatPaint(page.surface),
    line: formatPaint(page.line),
    chrome: formatPaint(chrome.chrome),
    bar: formatPaint(header.chrome),
    barFg: formatPaint(header['fg-muted']),
    float: formatPaint(float['chrome-float']),
    floatLine: formatPaint(float.line),
    accent: formatPaint(page.accent),
  }
}

/** The edits on a preset: only what the owner changed. */
export type Overrides = Omit<ThemeInput, 'neutral' | 'tone'> & { neutral?: Partial<NonNullable<ThemeInput['neutral']>>; tone?: ThemeInput['tone'] }

/** `patch` on top of `overrides`: the neutral and the tone merge key by key, the rest replaces. */
export function patchOverrides(overrides: Overrides, patch: Overrides): Overrides {
  return {
    ...overrides,
    ...patch,
    ...(patch.neutral && { neutral: { ...overrides.neutral, ...patch.neutral } }),
    ...(patch.tone && { tone: { ...overrides.tone, ...patch.tone } }),
  }
}

/** The theme the page wears: the preset with the edits on top. */
export function devTheme(presetId: string, mode: Mode, overrides: Overrides): ThemeInput {
  const theme = devPreset(presetId).theme(mode)
  return { ...theme, ...overrides, neutral: { ...theme.neutral!, ...overrides.neutral }, tone: { ...theme.tone, ...overrides.tone } }
}

/* ── The controls ─────────────────────────────────────────────────────── */

interface FieldBase {
  id: string
  label: string
  group: string
}

export type Field =
  | (FieldBase & {
      kind: 'slider'
      min: number
      max: number
      step: number
      digits: number
      read: (t: ResolvedTheme) => number
      write: (value: number) => Overrides
    })
  | (FieldBase & {
      kind: 'color'
      /** The color the theme has (or, for one it leaves to the kit, the one the kit derives) in a mode. */
      read: (t: ResolvedTheme, mode: Mode) => ThemeColor
      write: (value: ThemeColor) => Overrides
    })
  | (FieldBase & {
      kind: 'choice'
      options: { value: string; label: string }[]
      read: (t: ResolvedTheme) => string
      write: (value: string) => Overrides
    })

const neutralSlider = (key: 'hue' | 'chroma' | 'wash' | 'lift', label: string, min: number, max: number, step: number, digits: number): Field => ({
  id: `neutral.${key}`,
  label,
  group: 'Neutral',
  kind: 'slider',
  min,
  max,
  step,
  digits,
  read: (t) => t.neutral[key],
  write: (value) => ({ neutral: { [key]: value } }),
})

const statusColor = (key: 'success' | 'warning' | 'danger', label: string): Field => ({
  id: key,
  label,
  group: 'Colors',
  kind: 'color',
  read: (t, mode) => t[key] ?? deriveTheme({ ...t, success: undefined, warning: undefined, danger: undefined })[mode][key],
  write: (value) => ({ [key]: value }),
})

export const FIELDS: Field[] = [
  neutralSlider('hue', 'Hue', 0, 360, 1, 0),
  neutralSlider('chroma', 'Chroma', 0, 0.04, 0.001, 3),
  neutralSlider('wash', 'Wash', 0, 1, 0.05, 2),
  neutralSlider('lift', 'Lift', 0, 1, 0.05, 2),
  {
    id: 'neutral.page',
    label: 'Page',
    group: 'Neutral',
    kind: 'choice',
    options: [
      { value: 'gray', label: 'Gray' },
      { value: 'white', label: 'White' },
    ],
    read: (t) => t.neutral.page,
    write: (value) => ({ neutral: { page: value as NeutralPage } }),
  },
  { id: 'accent', label: 'Accent', group: 'Colors', kind: 'color', read: (t, mode) => t.accent ?? deriveTheme(t)[mode].accent, write: (value) => ({ accent: value }) },
  statusColor('success', 'Success'),
  statusColor('warning', 'Warning'),
  statusColor('danger', 'Danger'),
  { id: 'info', label: 'Info', group: 'Colors', kind: 'color', read: (t, mode) => t.info ?? t.accent ?? deriveTheme(t)[mode].accent, write: (value) => ({ info: value }) },
  {
    id: 'tone.chrome',
    label: 'Chrome',
    group: 'Tone',
    kind: 'choice',
    options: [
      { value: 'match', label: 'Match' },
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
    ],
    read: (t) => t.tone.chrome,
    write: (value) => ({ tone: { chrome: value as ChromeTone } }),
  },
  {
    id: 'tone.overlays',
    label: 'Overlays',
    group: 'Tone',
    kind: 'choice',
    options: [
      { value: 'content', label: 'Content' },
      { value: 'chrome', label: 'Chrome' },
      { value: 'ink', label: 'Ink' },
    ],
    read: (t) => t.tone.overlays,
    write: (value) => ({ tone: { overlays: value as OverlayTone } }),
  },
  {
    id: 'tone.bars',
    label: 'Bars',
    group: 'Tone',
    kind: 'choice',
    options: [
      { value: 'chrome', label: 'Chrome' },
      { value: 'content', label: 'Content' },
      { value: 'top', label: 'Top' },
    ],
    read: (t) => t.tone.bars,
    write: (value) => ({ tone: { bars: value as BarTone } }),
  },
  {
    id: 'radius',
    label: 'Radius',
    group: 'Shape',
    kind: 'choice',
    options: (['none', 'sm', 'md', 'lg', 'full'] as const).map((value) => ({ value, label: value })),
    read: (t) => t.radius,
    write: (value) => ({ radius: value as RadiusScale }),
  },
]

/* ── Stage ────────────────────────────────────────────────────────────── */

export type StageLook = 'gray' | 'paper'

/** Puts every stage that wears the site's theme on `look` (styles/site.css, .site-stage), the page around them as it is. Returns what takes it off. */
export function applyStage(root: HTMLElement, look: StageLook): () => void {
  if (look === 'gray') return () => {}
  root.setAttribute('data-site-stage', look)
  return () => root.removeAttribute('data-site-stage')
}

/** Puts every stage that names no pattern of its own on `pattern` (styles/site.css, data-stage-pattern on <html>). Returns what puts the site's back. */
export function applyStagePattern(root: HTMLElement, pattern: StagePattern): () => void {
  const site = root.getAttribute('data-stage-pattern')
  root.setAttribute('data-stage-pattern', pattern)
  return () => (site ? root.setAttribute('data-stage-pattern', site) : root.removeAttribute('data-stage-pattern'))
}

/* ── <html> ───────────────────────────────────────────────────────────── */

/** Writes `theme` to the element as the site's scope (inline custom properties beat the site's stylesheet). Returns what takes it off. */
export function applyDevTheme(root: HTMLElement, theme: ThemeInput): () => void {
  const vars: Record<string, string> = themeVars({ ...theme, motionPersonality: undefined })
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
  // The docs examples keep a theme scope of their own: they take the look from here (lib/dev-theme-signal).
  setDevTheme(theme)
  return () => {
    for (const name of Object.keys(vars)) root.style.removeProperty(name)
    setDevTheme(null)
  }
}

/* ── The snippet ──────────────────────────────────────────────────────── */

const literal = (value: unknown, indent: string): string => {
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  if (typeof value !== 'object' || value === null) return String(value)
  const inner = `${indent}  `
  const entries = Object.entries(value).filter(([, v]) => v !== undefined)
  return `{\n${entries.map(([k, v]) => `${inner}${k}: ${literal(v, inner)},`).join('\n')}\n${indent}}`
}

/**
 * The current look as source, whole: every input the contract has, tone
 * included, so it pastes into a theme file as it stands rather than as edits
 * on something the reader has to find.
 */
export function devSnippet(presetId: string, mode: Mode, overrides: Overrides): string {
  const p = devPreset(presetId)
  const { description: _, ...fields } = resolveTheme(devTheme(presetId, mode, overrides))
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${literal(v, '  ')},`)
  const edited = Object.keys(overrides).length > 0 ? ', edited' : ''
  return [`// ${p.name}, ${mode} mode${edited}`, `defineTheme({`, ...lines, `})`, ''].join('\n')
}
