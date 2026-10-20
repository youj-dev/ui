import { DEFAULT_LOOK, type YoujLook } from '../look'
import { defineTheme, mergeThemes, resolveTheme, themeVars, type ThemeInput } from './contract'

/* A theme is two layers that pair freely. A palette is colour only: the
 * neutral, the accent, the status inks and the chart. A style is form only:
 * corners, control size, type, lines, depth, the voice of titles and labels,
 * what fills an action, surface shading, timing, and the look (classic or
 * bezel) it's built in. composeTheme puts one of each together; a preset is
 * a named pair. Tone (two-tone chrome) belongs to neither: it stays on the
 * theme. */

/** The fields a palette sets. */
export const PALETTE_FIELDS = ['neutral', 'accent', 'success', 'warning', 'danger', 'info', 'chart', 'allowLowContrast'] as const
/** The fields a style sets. */
export const STYLE_FIELDS = ['radius', 'controlSize', 'fonts', 'motionPersonality', 'stroke', 'shadow', 'actions', 'controls', 'fields', 'surfaces', 'headings', 'labels', 'look'] as const

type PaletteField = (typeof PALETTE_FIELDS)[number]
type StyleField = (typeof STYLE_FIELDS)[number]

export interface Named {
  /** A slug, written to `data-yj-palette` or `data-yj-style`. */
  id: string
  name: string
  description?: string
}

export type PaletteInput = Named & Pick<ThemeInput, PaletteField>
export type StyleInput = Named & Omit<Pick<ThemeInput, StyleField>, 'look'> & { look: YoujLook }

/** A palette after definePalette: frozen. */
export type ThemePalette = Readonly<PaletteInput>
/** A style after defineStyle: frozen. */
export type ThemeStyle = Readonly<StyleInput>

function pick<K extends keyof ThemeInput>(theme: ThemeInput, keys: readonly K[]): Pick<ThemeInput, K> {
  const out = {} as Pick<ThemeInput, K>
  for (const key of keys) if (theme[key] !== undefined) out[key] = theme[key]
  return out
}

type ComposeMeta = Partial<Pick<ThemeInput, 'id' | 'name' | 'description' | 'tone'>>

/** A composed theme's type: both halves' fields as declared, the ids of each, and the meta's id when it gives one. */
export type Composed<P extends PaletteInput, S extends StyleInput, M extends ComposeMeta> = Readonly<
  Omit<P, keyof Named> &
    Omit<S, keyof Named> & {
      id: M extends { id: infer I extends string } ? I : string
      name: string
      description?: string
      palette: P['id']
      style: S['id']
      tone?: ThemeInput['tone']
    }
>

/** Declares a palette: colour only. Its whites and grays stay neutral unless `neutral.wash` says otherwise. */
export function definePalette<const T extends PaletteInput>(input: T): Readonly<T> {
  return Object.freeze({ ...defineTheme(input) }) as Readonly<T>
}

/** Declares a style: form only, and the look it's built in. */
export function defineStyle<const T extends StyleInput>(input: T): Readonly<T> {
  return Object.freeze({ ...defineTheme(input) }) as Readonly<T>
}

/**
 * A palette and a style as one complete theme. Its id is `meta.id`, else
 * `<palette>-<style>`; it carries both ids (`palette`, `style`) and the
 * style's `look`. `meta.tone` keeps a two-tone setting across a swap.
 */
export function composeTheme<const P extends PaletteInput, const S extends StyleInput, const M extends ComposeMeta = {}>(palette: P, style: S, meta: M = {} as M): Composed<P, S, M> {
  return defineTheme({
    id: meta.id ?? `${palette.id}-${style.id}`,
    name: meta.name ?? `${palette.name} ${style.name}`,
    ...(meta.description ? { description: meta.description } : {}),
    ...pick(palette, PALETTE_FIELDS),
    ...pick(style, STYLE_FIELDS),
    ...(meta.tone ? { tone: meta.tone } : {}),
    palette: palette.id,
    style: style.id,
  }) as unknown as Composed<P, S, M>
}

/** Any theme's colours as a palette: what a style swap keeps. Unset colours stay unset (Basalt's pairs). */
export function pickPalette(theme: ThemeInput | null | undefined): PaletteInput {
  const t = theme ?? {}
  const resolved = resolveTheme(t)
  return { ...pick(t, PALETTE_FIELDS), neutral: resolved.neutral, id: t.palette ?? t.id ?? 'custom', name: t.name ?? 'Custom' }
}

/** Any theme's form as a style: what a palette swap keeps. */
export function pickStyle(theme: ThemeInput | null | undefined, look: YoujLook = DEFAULT_LOOK): StyleInput {
  const t = theme ?? {}
  const resolved = resolveTheme(t)
  return { ...pick(resolved, STYLE_FIELDS), look: t.look ?? look, id: t.style ?? t.id ?? 'custom', name: t.name ?? 'Custom' }
}

/**
 * The theme a scope wears when it picks a palette, a style or both over the
 * one around it (`outer`): the missing half comes from `outer`, and so does
 * its tone. Neither picked: `outer` as it is.
 */
export function layerTheme(outer: ThemeInput | null, palette: PaletteInput | undefined, style: StyleInput | undefined, look?: YoujLook): ThemeInput | null {
  if (!palette && !style) return outer
  const tone = outer?.tone
  return composeTheme(palette ?? pickPalette(outer), style ?? pickStyle(outer, look), tone ? { tone } : {})
}

/** A palette's own custom properties (the colour half of themeVars). */
export function paletteVars(palette: PaletteInput): Record<string, string> {
  return Object.fromEntries(Object.entries(themeVars({ ...palette, id: palette.id })).filter(([name]) => isPaletteVar(name)))
}

/** A style's own custom properties (the form half of themeVars, without tone). */
export function styleVars(style: StyleInput): Record<string, string> {
  return Object.fromEntries(Object.entries(themeVars({ ...style, id: style.id })).filter(([name]) => !isPaletteVar(name) && !name.startsWith('--yj-tone-')))
}

const PALETTE_VAR = /^--yj-(neutral|accent|success|warning|danger|info|chart)-?/

export function isPaletteVar(name: string): boolean {
  return PALETTE_VAR.test(name)
}

/** One rule per palette (`data-yj-palette`) or style (`data-yj-style`): what theme/palettes.css and theme/styles.css hold. */
export function layerSheet(kind: 'palette' | 'style', items: readonly (PaletteInput | StyleInput)[]): string {
  return items
    .map((item) => {
      const vars = kind === 'palette' ? paletteVars(item as PaletteInput) : styleVars(item as StyleInput)
      const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`)
      const personality = kind === 'style' ? (item as StyleInput).motionPersonality : undefined
      const motion = personality ? ` Motion: data-yj-motion="${personality}".` : ''
      const look = kind === 'style' ? ` Look: data-yj-look="${(item as StyleInput).look}".` : ''
      return `/* ${item.name}.${look}${motion} */\n[${kind === 'palette' ? 'data-yj-palette' : 'data-yj-style'}='${item.id}'] {\n${lines.join('\n')}\n}\n`
    })
    .join('\n')
}

/** A merge helper for scopes: a theme override over a layered theme. */
export function layeredTheme(outer: ThemeInput | null, theme: ThemeInput | undefined, palette?: PaletteInput, style?: StyleInput, look?: YoujLook): ThemeInput | null {
  return mergeThemes(layerTheme(outer, palette, style, look), theme)
}
