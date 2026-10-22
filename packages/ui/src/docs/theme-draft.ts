import { defineTheme, isPerMode, type ControlSize, type MotionPersonality, type PerMode, type RadiusScale, type Theme, type ThemeChart, type ThemeColor, type ThemeInput } from '@youj/core'
import { youjPalette, cleanStyle, composeTheme, DEFAULTS, palettes, pickPalette, pickStyle, styles, type PaletteInput, type StyleInput } from '@youj/core/lib/youj/theme'

/* A theme as the builder edits it: every contract field filled in, so each
 * control shows a value, and back to a complete theme on every change. The
 * builder's controls, previews and export share it; Create and the site keep
 * the theme itself (a `Theme`), never this. */

export const STATUS = ['success', 'warning', 'danger'] as const
export type Status = (typeof STATUS)[number]

/** A theme's character: how its lines, depth, actions, controls, fields, surfaces, titles and labels look, and which mode its chrome and overlays are drawn in. Unset fields are the defaults. */
export type Character = Pick<ThemeInput, 'stroke' | 'shadow' | 'actions' | 'controls' | 'fields' | 'surfaces' | 'headings' | 'labels' | 'tone'>

export interface Draft {
  name: string
  hue: number
  chroma: number
  wash: number
  /** Dark mode's surface lift, 0–1. */
  lift: number
  /** A color, or a preset's pair tuned per mode (kept as a pair until one side is edited). */
  accent: ThemeColor
  status: Record<Status, ThemeColor | null>
  /** The info ink, or null to leave it to the accent. */
  info: ThemeColor | null
  /** Five series colors (or five per mode, from a preset), or null to draw them from the accent. */
  chart: string[] | PerMode<string[]> | null
  radius: RadiusScale
  controlSize: ControlSize
  /** CSS font stacks, as the theme holds them; `display` unset keeps titles in `sans`. */
  fonts: { sans: string; mono: string; display?: string }
  motionPersonality: MotionPersonality
  character: Character
}

export function draftFrom(input: ThemeInput, name = 'My theme'): Draft {
  const theme = input
  const { stroke, shadow, actions, controls, fields, surfaces, headings, labels, tone } = theme
  return {
    name,
    hue: theme.neutral?.hue ?? DEFAULTS.neutral.hue,
    chroma: theme.neutral?.chroma ?? DEFAULTS.neutral.chroma,
    wash: theme.neutral?.wash ?? DEFAULTS.neutral.wash,
    lift: theme.neutral?.lift ?? DEFAULTS.neutral.lift,
    accent: theme.accent ?? 'oklch(0.54 0.25 268)',
    status: { success: theme.success ?? null, warning: theme.warning ?? null, danger: theme.danger ?? null },
    info: theme.info ?? null,
    chart: theme.chart ? (isPerMode(theme.chart) ? { light: [...theme.chart.light], dark: [...theme.chart.dark] } : [...theme.chart]) : null,
    radius: theme.radius ?? DEFAULTS.radius,
    controlSize: theme.controlSize ?? DEFAULTS.controlSize,
    fonts: {
      sans: theme.fonts?.sans ?? DEFAULTS.fonts.sans,
      mono: theme.fonts?.mono ?? DEFAULTS.fonts.mono,
      ...(theme.fonts?.display ? { display: theme.fonts.display } : {}),
    },
    motionPersonality: theme.motionPersonality ?? DEFAULTS.motionPersonality,
    character: { stroke, shadow, actions, controls, fields, surfaces, headings, labels, tone },
  }
}

export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'custom'

export function themeFrom(d: Draft): Theme {
  return defineTheme({
    id: slug(d.name),
    name: d.name.trim() || 'Custom',
    // The lift only when it's set, so a theme that has none says what it always said.
    neutral: { hue: d.hue, chroma: d.chroma, wash: d.wash, ...(d.lift ? { lift: d.lift } : {}) },
    accent: d.accent,
    ...(d.status.success ? { success: d.status.success } : {}),
    ...(d.status.warning ? { warning: d.status.warning } : {}),
    ...(d.status.danger ? { danger: d.status.danger } : {}),
    ...(d.info ? { info: d.info } : {}),
    ...(d.chart ? { chart: d.chart as unknown as ThemeChart } : {}),
    radius: d.radius,
    controlSize: d.controlSize,
    fonts: d.fonts,
    motionPersonality: d.motionPersonality,
    ...Object.fromEntries(Object.entries(d.character).filter(([, v]) => v !== undefined)),
  })
}

const withDefaults = (c: Character) => ({
  stroke: { ...DEFAULTS.stroke, ...c.stroke },
  shadow: c.shadow ?? DEFAULTS.shadow,
  actions: c.actions ?? DEFAULTS.actions,
  controls: c.controls ?? DEFAULTS.controls,
  fields: c.fields ?? DEFAULTS.fields,
  surfaces: { ...DEFAULTS.surfaces, ...c.surfaces },
  headings: { ...DEFAULTS.headings, ...c.headings },
  labels: { ...DEFAULTS.labels, ...c.labels },
  tone: { ...DEFAULTS.tone, ...c.tone },
})

const PALETTE_KEYS = ['hue', 'chroma', 'wash', 'lift', 'accent', 'success', 'warning', 'danger', 'info', 'chart']
const STYLE_KEYS = ['radius', 'controlSize', 'fonts', 'motionPersonality', 'stroke', 'shadow', 'actions', 'controls', 'fields', 'surfaces', 'headings', 'labels']

function fieldsOf(d: Draft): Record<string, unknown> {
  const { name: _, character, status, ...rest } = d
  return { ...rest, ...status, ...withDefaults(character) }
}

function nearest<T extends { id: string }>(draft: Draft, candidates: readonly T[], toDraft: (c: T) => Draft, keys: string[]): { pick: T; edited: boolean } {
  const mine = fieldsOf(draft)
  const differs = (c: T) => {
    const theirs = fieldsOf(toDraft(c))
    return keys.filter((k) => JSON.stringify(mine[k]) !== JSON.stringify(theirs[k])).length
  }
  const ranked = candidates.map((c) => [c, differs(c)] as const).sort((a, b) => a[1] - b[1])
  return { pick: ranked[0]![0], edited: ranked[0]![1] > 0 }
}

/** The palette a draft wears, or started from: the colours it differs from in the fewest settings. */
export const closestPalette = (draft: Draft) => nearest(draft, palettes, (p) => draftFrom(composeTheme(p, cleanStyle)), PALETTE_KEYS)

/** The style a draft wears, or started from: the form it differs from in the fewest settings. */
export const closestStyle = (draft: Draft) => nearest(draft, styles, (s) => draftFrom(composeTheme(youjPalette, s)), STYLE_KEYS)

/** The draft in another palette: its form (and tone) kept. */
export function withPalette(draft: Draft, palette: PaletteInput): Draft {
  const theme = themeFrom(draft)
  return draftFrom(composeTheme(palette, pickStyle(theme), theme.tone ? { tone: theme.tone } : {}), draft.name)
}

/** The draft in another style: its colours (and tone) kept. */
export function withStyle(draft: Draft, style: StyleInput): Draft {
  const theme = themeFrom(draft)
  return draftFrom(composeTheme(pickPalette(theme), style, theme.tone ? { tone: theme.tone } : {}), draft.name)
}
